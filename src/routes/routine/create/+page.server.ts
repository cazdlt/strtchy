import { redirect, fail } from "@sveltejs/kit";
import { db } from "$lib/db";
import { movements } from "$lib/db/schema";
import { desc } from "drizzle-orm";
import { createRoutine } from "$lib/db/helpers/routines";
import {
  routineSchema,
  routineMovementConfigSchema,
} from "$lib/validation/schemas/routine";
import type { PageServerLoad, Actions } from "./$types";
import type { RoutineMovementConfig } from "$lib/validation/schemas/routine";

// Transform flat frontend structure to nested backend structure
function transformMovementsData(rawData: unknown[]): RoutineMovementConfig[] {
  if (!Array.isArray(rawData)) {
    throw new Error("Movements data must be an array");
  }

  return rawData.map((m: any, index: number) => ({
    movementId: m.movementId,
    order: index,
    target: {
      type: m.targetType,
      value: m.targetValue,
      unit: m.targetUnit,
      customTag: m.customTag,
    },
    sets: m.sets ?? 1,
    isBilateral: m.isBilateral ?? false,
    switchSidesDuration: m.switchSidesDuration ?? 5,
    weight: m.weight,
    weightUnit: m.weightUnit,
    notes: m.notes,
  }));
}

// Validate individual movement fields
function validateMovementFields(movements: RoutineMovementConfig[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (let i = 0; i < movements.length; i++) {
    const m = movements[i];

    if (!m.movementId) {
      errors.push(`Movement #${i + 1}: Missing movement ID`);
    }

    if (!m.target || typeof m.target !== "object") {
      errors.push(`Movement #${i + 1}: Missing target configuration`);
    } else {
      if (
        m.target.value === undefined ||
        m.target.value === null ||
        m.target.value <= 0
      ) {
        errors.push(`Movement #${i + 1}: Target value must be greater than 0`);
      }
      if (!m.target.type || !["time", "reps"].includes(m.target.type)) {
        errors.push(`Movement #${i + 1}: Target type must be "time" or "reps"`);
      }
    }

    if (m.sets === undefined || m.sets === null || m.sets < 1) {
      errors.push(`Movement #${i + 1}: Sets must be at least 1`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export const load: PageServerLoad = async ({ locals }) => {
  const allMovements = await db
    .select()
    .from(movements)
    .orderBy(desc(movements.createdAt));

  return {
    movements: allMovements,
    user: locals.user,
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();

    // Parse movements_data early
    let rawMovementsData: unknown = null;
    const movementsDataString = formData.get("movements_data");

    try {
      if (movementsDataString && typeof movementsDataString === "string") {
        rawMovementsData = JSON.parse(movementsDataString);
      }
    } catch (e) {
      console.error("[Routine Create] Failed to parse movements_data JSON:", e);
      return fail(400, {
        error: "Invalid movements data format. Please try again.",
        submittedData: {
          name: formData.get("name"),
          description: formData.get("description"),
          restBetweenMovements: formData.get("rest_between_movements"),
          restBetweenSets: formData.get("rest_between_sets"),
          autoAdvance: formData.get("auto_advance") === "true",
          audioEnabled: formData.get("audio_enabled") === "true",
          keepAwake: formData.get("keep_awake") === "true",
          movementsData: movementsDataString,
        },
      });
    }

    // Collect submitted data for error returns
    const submittedData = {
      name: formData.get("name"),
      description: formData.get("description"),
      restBetweenMovements: formData.get("rest_between_movements"),
      restBetweenSets: formData.get("rest_between_sets"),
      autoAdvance: formData.get("auto_advance") === "true",
      audioEnabled: formData.get("audio_enabled") === "true",
      keepAwake: formData.get("keep_awake") === "true",
      movementsData: movementsDataString,
    };

    // Transform movements data to the expected structure
    let transformedMovementsData: RoutineMovementConfig[];
    try {
      transformedMovementsData = transformMovementsData(
        rawMovementsData as unknown[],
      );
    } catch (e) {
      console.error("[Routine Create] Failed to transform movements data:", e);
      return fail(400, {
        error:
          "Invalid movements data structure. Please check your selections.",
        submittedData,
      });
    }

    // Validate individual movement fields
    const movementValidation = validateMovementFields(transformedMovementsData);
    if (!movementValidation.valid) {
      console.error(
        "[Routine Create] Movement validation failed:",
        movementValidation.errors,
      );
      return fail(400, {
        error: movementValidation.errors.join(". "),
        submittedData,
      });
    }

    // Prepare data for schema validation
    const dataToValidate = {
      name: submittedData.name,
      description: submittedData.description,
      restBetweenMovements: submittedData.restBetweenMovements,
      restBetweenSets: submittedData.restBetweenSets,
      autoAdvance: submittedData.autoAdvance,
      audioEnabled: submittedData.audioEnabled,
      keepAwake: submittedData.keepAwake,
      movementsData: JSON.stringify(transformedMovementsData),
    };

    const parsed = routineSchema.safeParse(dataToValidate);

    if (!parsed.success) {
      // Log validation errors for debugging
      console.error(
        "[Routine Create] Schema validation failed:",
        parsed.error.issues,
      );

      // Map Zod errors to old error format for UI compatibility
      const errorIssues = parsed.error.issues;

      // Check for missing required fields
      const missingFields: string[] = [];
      if (errorIssues.find((issue) => issue.path.includes("name"))) {
        missingFields.push("routine name");
      }
      if (
        errorIssues.find((issue) => issue.path.includes("restBetweenMovements"))
      ) {
        missingFields.push("rest between movements");
      }
      if (errorIssues.find((issue) => issue.path.includes("restBetweenSets"))) {
        missingFields.push("rest between sets");
      }
      if (errorIssues.find((issue) => issue.path.includes("movementsData"))) {
        missingFields.push("movements");
      }

      if (missingFields.length > 0) {
        return fail(400, { missing: true, missingFields, submittedData });
      }

      // Check for invalid values (rest periods must be >= 0)
      const restError = errorIssues.find(
        (issue) =>
          issue.path.includes("restBetweenMovements") ||
          issue.path.includes("restBetweenSets"),
      );
      if (restError) {
        return fail(400, { invalid_values: true, submittedData });
      }

      // Check for no movements
      const movementsError = errorIssues.find(
        (issue) =>
          issue.path.includes("movementsData") &&
          issue.message.includes("one movement"),
      );
      if (movementsError) {
        return fail(400, { no_movements: true, submittedData });
      }

      // Generic validation error with first error message
      const firstError = errorIssues[0];
      return fail(400, {
        error:
          firstError?.message || "Validation failed. Please check your input.",
        submittedData,
      });
    }

    try {
      const routineId = await createRoutine(parsed.data, locals.user?.id);
      throw redirect(303, `/routine/${routineId}`);
    } catch (error) {
      if (error && typeof error === "object" && "status" in error) {
        throw error;
      }

      if (error instanceof Error) {
        console.error("[Routine Create] Database error:", error);
        if (error.message.includes("already exists")) {
          const match = error.message.match(/"([^"]+)"/);
          const existingName = match ? match[1] : "";
          return fail(409, {
            duplicate_name: true,
            existing_name: existingName,
            submittedData,
          });
        }
        return fail(400, { error: error.message, submittedData });
      }

      console.error("[Routine Create] Unexpected error:", error);
      return fail(500, {
        error: "Failed to create routine. Please try again.",
        submittedData,
      });
    }
  },
};
