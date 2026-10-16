import { z } from "zod";
import { db } from "$lib/db";
import {
  movements,
  routines,
  routineMovements,
  practiceData,
  practiceLogs,
} from "$lib/db/schema";
import { desc, eq, asc } from "drizzle-orm";
import {
  createMovement,
  updateMovement,
  deleteMovement,
} from "$lib/db/helpers/movements";
import {
  createRoutine,
  updateRoutine,
  deleteRoutine,
} from "$lib/db/helpers/routines";
import {
  listPractices,
  getPracticeById,
  createPractice,
  updatePractice,
  deletePractice,
  getPracticeStats,
} from "$lib/db/helpers/practices";
import {
  calculateRoutineDuration,
  formatDuration,
} from "$lib/utils/formatting";
import { routineMovementConfigSchema } from "$lib/validation/schemas/routine";
import { practiceDataEntrySchema } from "$lib/validation/schemas/practice";

export interface McpAuthContext {
  user: { id: string; email?: string; name?: string | null } | null;
}

interface McpToolDefinition<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  schema: TSchema;
  requiresAuth?: boolean;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
  };
  handler: (
    args: z.output<TSchema>,
    ctx: McpAuthContext,
  ) => Promise<unknown>;
}

function toCleanJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const raw = z.toJSONSchema(schema, {
    unrepresentable: "any",
  }) as Record<string, unknown>;
  const { $schema, ...rest } = raw;
  return {
    type: "object",
    ...rest,
  };
}

function requireMcpUser(ctx: McpAuthContext) {
  if (!ctx.user) {
    throw new Error(
      "Authentication required. Provide a valid Strtchy API key via 'Authorization: Bearer strtchy_...' header or '?apiKey=strtchy_...' URL parameter.",
    );
  }
  return ctx.user;
}

const tools: McpToolDefinition<any>[] = [
  // ==================== MOVEMENTS ====================
  {
    name: "list_movements",
    description:
      "List and search stretching/recovery movements in Strtchy. Always call this before creating a routine or movement to reuse existing movement IDs (e.g. 'mv_hamstring-stretch').",
    requiresAuth: false,
    annotations: { readOnlyHint: true },
    schema: z.object({
      search: z
        .string()
        .optional()
        .describe(
          "Optional search query matching movement name, description, or equipment",
        ),
      type: z
        .enum(["timed", "reps", "weighted", "resistance_band"])
        .optional()
        .describe("Filter by movement type"),
      isBilateral: z
        .boolean()
        .optional()
        .describe("Filter by bilateral (left/right side) status"),
      isCustom: z
        .boolean()
        .optional()
        .describe("Filter by custom vs built-in movements"),
    }),
    handler: async (args) => {
      let all = await db
        .select()
        .from(movements)
        .orderBy(asc(movements.name));

      if (args.type) {
        all = all.filter((m) => m.type === args.type);
      }
      if (args.isBilateral !== undefined) {
        all = all.filter((m) => m.isBilateral === args.isBilateral);
      }
      if (args.isCustom !== undefined) {
        all = all.filter((m) => m.isCustom === args.isCustom);
      }
      if (args.search) {
        const q = args.search.toLowerCase();
        all = all.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            (m.description && m.description.toLowerCase().includes(q)) ||
            (Array.isArray(m.equipment) &&
              m.equipment.some((e) => e.toLowerCase().includes(q))),
        );
      }

      return {
        count: all.length,
        movements: all,
      };
    },
  },
  {
    name: "get_movement",
    description:
      "Get full details of a single movement by ID, along with its most recent practice history sets.",
    requiresAuth: false,
    annotations: { readOnlyHint: true },
    schema: z.object({
      id: z.string().min(1).describe("Movement ID (e.g., 'mv_cat-cow')"),
    }),
    handler: async (args) => {
      const movement = await db.query.movements.findFirst({
        where: eq(movements.id, args.id),
      });
      if (!movement) {
        throw new Error(`Movement '${args.id}' not found`);
      }

      const recentSets = await db
        .select({
          practiceLogId: practiceData.practiceLogId,
          setNumber: practiceData.setNumber,
          side: practiceData.side,
          value: practiceData.value,
          targetType: practiceData.targetType,
          weight: practiceData.weight,
          weightUnit: practiceData.weightUnit,
          rating: practiceData.rating,
          status: practiceData.status,
          completedAt: practiceData.completedAt,
        })
        .from(practiceData)
        .where(eq(practiceData.movementId, args.id))
        .orderBy(desc(practiceData.completedAt))
        .limit(10);

      return {
        movement,
        recentPracticeSets: recentSets,
      };
    },
  },
  {
    name: "create_movement",
    description:
      "Create a new custom exercise/stretching movement. Check list_movements first to avoid duplicates.",
    requiresAuth: true,
    annotations: { readOnlyHint: false, destructiveHint: false },
    schema: z.object({
      name: z.string().min(1).max(100).describe("Movement name"),
      description: z
        .string()
        .max(500)
        .optional()
        .nullable()
        .describe("Instructions or cues for performing the movement"),
      type: z
        .enum(["timed", "reps", "weighted", "resistance_band"])
        .describe("Exercise type: 'timed' (seconds) or 'reps'/'weighted'/'resistance_band' (repetitions)"),
      defaultValue: z
        .number()
        .int()
        .positive()
        .describe("Default target duration in seconds (for timed) or default reps"),
      defaultUnit: z
        .enum(["lbs", "kg", "bodyweight"])
        .optional()
        .nullable()
        .describe("Weight unit if type is 'weighted' or 'resistance_band'"),
      timePerRep: z
        .number()
        .int()
        .min(1)
        .optional()
        .nullable()
        .describe("Estimated seconds per rep for rep-based auto-advance (e.g. 3)"),
      isBilateral: z
        .boolean()
        .default(false)
        .describe("True if performed separately on left and right sides"),
      switchSidesDuration: z
        .number()
        .int()
        .min(0)
        .default(5)
        .describe("Seconds given to switch sides for bilateral movements"),
      equipment: z
        .array(z.string())
        .optional()
        .describe("List of required equipment (e.g. ['Foam Roller', 'Yoga Mat'])"),
    }),
    handler: async (args, ctx) => {
      const user = requireMcpUser(ctx);
      const movementId = await createMovement(args, user.id);
      const movement = await db.query.movements.findFirst({
        where: eq(movements.id, movementId),
      });
      return { movement };
    },
  },
  {
    name: "update_movement",
    description: "Update an existing movement by ID.",
    requiresAuth: true,
    annotations: { readOnlyHint: false, idempotentHint: true },
    schema: z.object({
      id: z.string().min(1).describe("Movement ID to update"),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional().nullable(),
      type: z
        .enum(["timed", "reps", "weighted", "resistance_band"])
        .optional(),
      defaultValue: z.number().int().positive().optional(),
      defaultUnit: z.enum(["lbs", "kg", "bodyweight"]).optional().nullable(),
      timePerRep: z.number().int().min(1).optional().nullable(),
      isBilateral: z.boolean().optional(),
      switchSidesDuration: z.number().int().min(0).optional(),
      equipment: z.array(z.string()).optional(),
    }),
    handler: async (args, ctx) => {
      const user = requireMcpUser(ctx);
      const { id, ...updateData } = args;
      await updateMovement(id, updateData, user.id);
      const movement = await db.query.movements.findFirst({
        where: eq(movements.id, id),
      });
      return { movement };
    },
  },
  {
    name: "delete_movement",
    description:
      "Delete a movement by ID. Fails if the movement is currently used in a routine.",
    requiresAuth: true,
    annotations: { readOnlyHint: false, destructiveHint: true },
    schema: z.object({
      id: z.string().min(1).describe("Movement ID to delete"),
    }),
    handler: async (args, ctx) => {
      const user = requireMcpUser(ctx);
      await deleteMovement(args.id, user.id);
      return { deleted: true, id: args.id };
    },
  },

  // ==================== ROUTINES ====================
  {
    name: "list_routines",
    description:
      "List all stretching/recovery routines with movement counts, estimated duration, and movement previews.",
    requiresAuth: false,
    annotations: { readOnlyHint: true },
    schema: z.object({
      search: z
        .string()
        .optional()
        .describe("Optional search query for routine name or description"),
    }),
    handler: async (args) => {
      const allRoutines = await db.query.routines.findMany({
        orderBy: desc(routines.createdAt),
        with: {
          movements: {
            with: { movement: true },
            orderBy: asc(routineMovements.order),
          },
        },
      });

      const filtered = args.search
        ? allRoutines.filter((r) => {
            const q = args.search!.toLowerCase();
            return (
              r.name.toLowerCase().includes(q) ||
              (r.description && r.description.toLowerCase().includes(q))
            );
          })
        : allRoutines;

      const enriched = filtered.map((r) => {
        const estimatedSeconds = calculateRoutineDuration(
          r.movements.map((rm) => ({
            target: rm.target,
            sets: rm.sets,
            isBilateral: rm.isBilateral,
            switchSidesDuration: rm.switchSidesDuration,
            timePerRep: rm.movement.timePerRep,
          })),
          r.restBetweenMovements,
          r.restBetweenSets,
        );

        const equipmentSet = new Set<string>();
        for (const rm of r.movements) {
          if (Array.isArray(rm.movement.equipment)) {
            for (const eqItem of rm.movement.equipment) {
              equipmentSet.add(eqItem);
            }
          }
        }

        return {
          id: r.id,
          name: r.name,
          description: r.description,
          restBetweenMovements: r.restBetweenMovements,
          restBetweenSets: r.restBetweenSets,
          autoAdvance: r.autoAdvance,
          isCustom: r.isCustom,
          createdAt: r.createdAt,
          movementsCount: r.movements.length,
          estimatedDurationSeconds: estimatedSeconds,
          estimatedDurationFormatted: formatDuration(estimatedSeconds),
          equipment: Array.from(equipmentSet),
          movementNames: r.movements.map((rm) => rm.movement.name),
        };
      });

      return {
        count: enriched.length,
        routines: enriched,
      };
    },
  },
  {
    name: "get_routine",
    description:
      "Get full details of a routine by ID, including all ordered movements, sets, targets, rest settings, and estimated duration.",
    requiresAuth: false,
    annotations: { readOnlyHint: true },
    schema: z.object({
      id: z.string().min(1).describe("Routine ID (e.g., 'rt_morning-mobility')"),
    }),
    handler: async (args) => {
      const routine = await db.query.routines.findFirst({
        where: eq(routines.id, args.id),
        with: {
          movements: {
            with: { movement: true },
            orderBy: asc(routineMovements.order),
          },
        },
      });

      if (!routine) {
        throw new Error(`Routine '${args.id}' not found`);
      }

      const estimatedDurationSeconds = calculateRoutineDuration(
        routine.movements.map((rm) => ({
          target: rm.target,
          sets: rm.sets,
          isBilateral: rm.isBilateral,
          switchSidesDuration: rm.switchSidesDuration,
          timePerRep: rm.movement.timePerRep,
        })),
        routine.restBetweenMovements,
        routine.restBetweenSets,
      );

      return {
        routine: {
          ...routine,
          estimatedDurationSeconds,
          estimatedDurationFormatted: formatDuration(estimatedDurationSeconds),
        },
      };
    },
  },
  {
    name: "create_routine",
    description:
      "Create a new stretching/recovery routine with an ordered list of movements. Use list_movements first to find valid movementId values.",
    requiresAuth: true,
    annotations: { readOnlyHint: false, destructiveHint: false },
    schema: z.object({
      name: z.string().min(1).max(100).describe("Routine name"),
      description: z
        .string()
        .max(500)
        .optional()
        .nullable()
        .describe("Description of the routine and its focus/goal"),
      restBetweenMovements: z
        .number()
        .int()
        .min(0)
        .default(30)
        .describe("Rest duration in seconds between movements (default 30)"),
      restBetweenSets: z
        .number()
        .int()
        .min(0)
        .default(15)
        .describe("Rest duration in seconds between sets (default 15)"),
      autoAdvance: z.boolean().default(true),
      audioEnabled: z.boolean().default(true),
      keepAwake: z.boolean().default(true),
      movementsData: z
        .array(routineMovementConfigSchema)
        .min(1)
        .describe("Ordered list of movements in the routine"),
    }),
    handler: async (args, ctx) => {
      const user = requireMcpUser(ctx);
      const normalizedMovements = args.movementsData.map(
        (m: z.infer<typeof routineMovementConfigSchema>, idx: number) => ({
          ...m,
          order: m.order ?? idx,
        }),
      );

      const routineId = await createRoutine(
        {
          ...args,
          movementsData: normalizedMovements,
        },
        user.id,
      );

      const routine = await db.query.routines.findFirst({
        where: eq(routines.id, routineId),
        with: {
          movements: {
            with: { movement: true },
            orderBy: asc(routineMovements.order),
          },
        },
      });

      return { routine };
    },
  },
  {
    name: "update_routine",
    description:
      "Update an existing routine's settings and/or replace its movements list. If movementsData is omitted, existing movements in the routine are preserved.",
    requiresAuth: true,
    annotations: { readOnlyHint: false, idempotentHint: true },
    schema: z.object({
      id: z.string().min(1).describe("Routine ID to update"),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional().nullable(),
      restBetweenMovements: z.number().int().min(0).optional(),
      restBetweenSets: z.number().int().min(0).optional(),
      autoAdvance: z.boolean().optional(),
      audioEnabled: z.boolean().optional(),
      keepAwake: z.boolean().optional(),
      movementsData: z
        .array(routineMovementConfigSchema)
        .min(1)
        .optional()
        .describe(
          "If provided, replaces the routine's movements with this ordered list",
        ),
    }),
    handler: async (args, ctx) => {
      const user = requireMcpUser(ctx);
      const { id, movementsData, ...updateFields } = args;
      const normalizedMovements = movementsData
        ? movementsData.map(
            (m: z.infer<typeof routineMovementConfigSchema>, idx: number) => ({
              ...m,
              order: m.order ?? idx,
            }),
          )
        : undefined;

      await updateRoutine(id, updateFields, normalizedMovements, user.id);

      const updated = await db.query.routines.findFirst({
        where: eq(routines.id, id),
        with: {
          movements: {
            with: { movement: true },
            orderBy: asc(routineMovements.order),
          },
        },
      });

      return { routine: updated };
    },
  },
  {
    name: "delete_routine",
    description: "Delete a routine by ID.",
    requiresAuth: true,
    annotations: { readOnlyHint: false, destructiveHint: true },
    schema: z.object({
      id: z.string().min(1).describe("Routine ID to delete"),
    }),
    handler: async (args, ctx) => {
      const user = requireMcpUser(ctx);
      await deleteRoutine(args.id, user.id);
      return { deleted: true, id: args.id };
    },
  },

  // ==================== PRACTICES & STATS ====================
  {
    name: "list_practices",
    description:
      "List practice session history (completed or in-progress stretching sessions) with pagination and optional filters.",
    requiresAuth: false,
    annotations: { readOnlyHint: true },
    schema: z.object({
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .describe("Max number of practices to return (default 20)"),
      offset: z.number().int().min(0).default(0),
      routineId: z
        .string()
        .optional()
        .describe("Filter practices for a specific routine ID"),
      completedOnly: z
        .boolean()
        .default(false)
        .describe("If true, only return completed practices"),
      fromDate: z
        .string()
        .optional()
        .describe("ISO date string lower bound (e.g. '2026-10-01')"),
      toDate: z
        .string()
        .optional()
        .describe("ISO date string upper bound"),
    }),
    handler: async (args) => {
      return await listPractices({
        limit: args.limit,
        offset: args.offset,
        routineId: args.routineId,
        completedOnly: args.completedOnly,
        fromDate: args.fromDate ? new Date(args.fromDate) : undefined,
        toDate: args.toDate ? new Date(args.toDate) : undefined,
      });
    },
  },
  {
    name: "get_practice",
    description:
      "Get full details of a specific practice session by ID, including set-by-set performance data.",
    requiresAuth: false,
    annotations: { readOnlyHint: true },
    schema: z.object({
      id: z.string().min(1).describe("Practice log ID"),
    }),
    handler: async (args) => {
      const practice = await getPracticeById(args.id);
      if (!practice) {
        throw new Error(`Practice '${args.id}' not found`);
      }
      return { practice };
    },
  },
  {
    name: "log_practice",
    description:
      "Log a completed stretching/recovery practice session for a routine. By default, automatically populates all completed sets from the routine's movement configuration if practiceData is omitted.",
    requiresAuth: true,
    annotations: { readOnlyHint: false, destructiveHint: false },
    schema: z.object({
      routineId: z.string().min(1).describe("ID of the routine practiced"),
      startedAt: z
        .string()
        .optional()
        .describe("Optional ISO timestamp when the practice started"),
      completedAt: z
        .string()
        .optional()
        .nullable()
        .describe("Optional ISO timestamp when completed (defaults to now)"),
      duration: z
        .number()
        .int()
        .min(0)
        .optional()
        .nullable()
        .describe(
          "Duration in seconds (if omitted, estimated from routine or timestamps)",
        ),
      notes: z
        .string()
        .max(2000)
        .optional()
        .nullable()
        .describe("Session notes or feedback"),
      rating: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .nullable()
        .describe("Overall rating from 1 to 5"),
      autoPopulateFromRoutine: z
        .boolean()
        .default(true)
        .describe(
          "Automatically generate completed practice_data rows from the routine's movements when practiceData is omitted",
        ),
      practiceData: z
        .array(practiceDataEntrySchema)
        .optional()
        .describe("Optional custom per-set data override"),
    }),
    handler: async (args, ctx) => {
      const user = requireMcpUser(ctx);
      const practiceId = await createPractice(
        {
          routineId: args.routineId,
          startedAt: args.startedAt ? new Date(args.startedAt) : undefined,
          completedAt:
            args.completedAt === null
              ? null
              : args.completedAt
                ? new Date(args.completedAt)
                : undefined,
          duration: args.duration,
          notes: args.notes,
          rating: args.rating,
          autoPopulateFromRoutine: args.autoPopulateFromRoutine,
          practiceData: args.practiceData,
        },
        user.id,
      );
      const practice = await getPracticeById(practiceId);
      return { practice };
    },
  },
  {
    name: "update_practice",
    description:
      "Update an existing practice log's notes, duration, timestamps, or set data.",
    requiresAuth: true,
    annotations: { readOnlyHint: false, idempotentHint: true },
    schema: z.object({
      id: z.string().min(1).describe("Practice log ID to update"),
      startedAt: z.string().optional(),
      completedAt: z.string().optional().nullable(),
      duration: z.number().int().min(0).optional().nullable(),
      notes: z.string().max(2000).optional().nullable(),
      practiceData: z.array(practiceDataEntrySchema).optional(),
    }),
    handler: async (args, ctx) => {
      requireMcpUser(ctx);
      await updatePractice(args.id, {
        startedAt: args.startedAt ? new Date(args.startedAt) : undefined,
        completedAt:
          args.completedAt === null
            ? null
            : args.completedAt
              ? new Date(args.completedAt)
              : undefined,
        duration: args.duration,
        notes: args.notes,
        practiceData: args.practiceData,
      });
      const practice = await getPracticeById(args.id);
      return { practice };
    },
  },
  {
    name: "delete_practice",
    description: "Delete a practice log and its associated set data by ID.",
    requiresAuth: true,
    annotations: { readOnlyHint: false, destructiveHint: true },
    schema: z.object({
      id: z.string().min(1).describe("Practice log ID to delete"),
    }),
    handler: async (args, ctx) => {
      requireMcpUser(ctx);
      await deletePractice(args.id);
      return { deleted: true, id: args.id };
    },
  },
  {
    name: "get_practice_stats",
    description:
      "Get aggregated stretching and recovery statistics: total practices, total time stretched, days since last practice, top routines, and most practiced movements.",
    requiresAuth: false,
    annotations: { readOnlyHint: true },
    schema: z.object({
      days: z
        .number()
        .int()
        .min(1)
        .max(3650)
        .default(30)
        .describe("Number of days for the recent period breakdown (default 30)"),
    }),
    handler: async (args) => {
      return await getPracticeStats(args.days);
    },
  },
];

export const SERVER_INFO = {
  name: "strtchy-mcp",
  version: "1.0.0",
};

export const SERVER_INSTRUCTIONS = `Strtchy is a stretching, mobility, and recovery tracking app.
Key concepts:
- Movements: Individual exercises (types: 'timed', 'reps', 'weighted', 'resistance_band'). IDs look like 'mv_hamstring-stretch'.
- Routines: Ordered collections of movements with target duration/reps, sets, bilateral settings, and rest intervals. IDs look like 'rt_morning-mobility'.
- Practices: Logged sessions of performing a routine, with set-by-set practiceData.
Best practices:
1. Always call 'list_movements' before 'create_routine' or 'create_movement' so you reuse existing movement IDs rather than creating duplicates.
2. Match target.type to movement.type: 'timed' movements use target.type = 'time' (in seconds), while 'reps', 'weighted', and 'resistance_band' movements use target.type = 'reps'.`;

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, any>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export async function handleJsonRpcMessage(
  msg: JsonRpcRequest,
  ctx: McpAuthContext,
): Promise<JsonRpcResponse | null> {
  // Notifications do not have an `id` and expect no response object
  if (msg.id === undefined) {
    return null;
  }

  const id = msg.id;

  try {
    switch (msg.method) {
      case "initialize": {
        const clientVersion = msg.params?.protocolVersion;
        const supportedVersions = ["2025-03-26", "2024-11-05"];
        const protocolVersion = supportedVersions.includes(clientVersion)
          ? clientVersion
          : "2025-03-26";

        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion,
            capabilities: {
              tools: { listChanged: false },
              resources: { listChanged: false },
              prompts: { listChanged: false },
            },
            serverInfo: SERVER_INFO,
            instructions: SERVER_INSTRUCTIONS,
          },
        };
      }

      case "ping": {
        return {
          jsonrpc: "2.0",
          id,
          result: {},
        };
      }

      case "tools/list": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            tools: tools.map((t) => ({
              name: t.name,
              description: t.description,
              inputSchema: toCleanJsonSchema(t.schema),
              ...(t.annotations ? { annotations: t.annotations } : {}),
            })),
          },
        };
      }

      case "tools/call": {
        const toolName = msg.params?.name;
        const rawArgs = msg.params?.arguments ?? {};

        const tool = tools.find((t) => t.name === toolName);
        if (!tool) {
          return {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32602,
              message: `Unknown tool: ${toolName}`,
            },
          };
        }

        const parsed = tool.schema.safeParse(rawArgs);
        if (!parsed.success) {
          return {
            jsonrpc: "2.0",
            id,
            result: {
              isError: true,
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      error: "Validation failed",
                      issues: parsed.error.issues,
                    },
                    null,
                    2,
                  ),
                },
              ],
            },
          };
        }

        try {
          const output = await tool.handler(parsed.data, ctx);
          return {
            jsonrpc: "2.0",
            id,
            result: {
              isError: false,
              content: [
                {
                  type: "text",
                  text: JSON.stringify(output, null, 2),
                },
              ],
            },
          };
        } catch (toolErr) {
          const message =
            toolErr instanceof Error ? toolErr.message : String(toolErr);
          return {
            jsonrpc: "2.0",
            id,
            result: {
              isError: true,
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ error: message }, null, 2),
                },
              ],
            },
          };
        }
      }

      case "resources/list": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            resources: [
              {
                uri: "strtchy://catalog/movements",
                name: "Strtchy Movements Catalog",
                description: "Complete list of all available stretching and mobility movements",
                mimeType: "application/json",
              },
              {
                uri: "strtchy://catalog/routines",
                name: "Strtchy Routines Catalog",
                description: "Complete list of all routines and their movement configurations",
                mimeType: "application/json",
              },
              {
                uri: "strtchy://stats/summary",
                name: "Strtchy Practice Stats Summary",
                description: "30-day and all-time stretching statistics",
                mimeType: "application/json",
              },
            ],
          },
        };
      }

      case "resources/read": {
        const uri = msg.params?.uri;
        if (uri === "strtchy://catalog/movements") {
          const allMovements = await db
            .select()
            .from(movements)
            .orderBy(asc(movements.name));
          return {
            jsonrpc: "2.0",
            id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(allMovements, null, 2),
                },
              ],
            },
          };
        }
        if (uri === "strtchy://catalog/routines") {
          const allRoutines = await db.query.routines.findMany({
            with: {
              movements: {
                with: { movement: true },
                orderBy: asc(routineMovements.order),
              },
            },
          });
          return {
            jsonrpc: "2.0",
            id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(allRoutines, null, 2),
                },
              ],
            },
          };
        }
        if (uri === "strtchy://stats/summary") {
          const stats = await getPracticeStats(30);
          return {
            jsonrpc: "2.0",
            id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: "application/json",
                  text: JSON.stringify(stats, null, 2),
                },
              ],
            },
          };
        }

        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32602,
            message: `Unknown resource URI: ${uri}`,
          },
        };
      }

      case "prompts/list": {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            prompts: [
              {
                name: "design-recovery-routine",
                description:
                  "Design a personalized stretching routine in Strtchy based on recent workouts or target body areas",
                arguments: [
                  {
                    name: "focus",
                    description:
                      "Target body area or workout type (e.g., 'post-run lower body', 'upper back & shoulders')",
                    required: true,
                  },
                  {
                    name: "durationMinutes",
                    description: "Target duration in minutes (e.g. '15')",
                    required: false,
                  },
                ],
              },
            ],
          },
        };
      }

      case "prompts/get": {
        const name = msg.params?.name;
        if (name === "design-recovery-routine") {
          const focus = msg.params?.arguments?.focus || "full body recovery";
          const durationMinutes =
            msg.params?.arguments?.durationMinutes || "15";
          return {
            jsonrpc: "2.0",
            id,
            result: {
              description: `Design a ${durationMinutes}-minute recovery routine focused on ${focus}`,
              messages: [
                {
                  role: "user",
                  content: {
                    type: "text",
                    text: `Please design and create a ${durationMinutes}-minute stretching/recovery routine in Strtchy focused on: ${focus}.
1. First call 'list_movements' and 'get_practice_stats' to see existing movements and my recent stretching history.
2. Select appropriate movements (creating new ones only if an essential stretch is missing).
3. Create the routine using 'create_routine' with appropriate sets, durations/reps, and bilateral flags.`,
                  },
                },
              ],
            },
          };
        }
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32602,
            message: `Unknown prompt: ${name}`,
          },
        };
      }

      default:
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: `Method not found: ${msg.method}`,
          },
        };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32603,
        message,
      },
    };
  }
}
