import { z } from "zod";
import { movementsDataParser } from "../helpers/parsers";

export const routineSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500).optional().nullable(),
  restBetweenMovements: z.coerce.number().int().min(0),
  restBetweenSets: z.coerce.number().int().min(0),
  autoAdvance: z.boolean().default(true),
  audioEnabled: z.boolean().default(true),
  keepAwake: z.boolean().default(true),
  movementsData: z
    .string()
    .transform(movementsDataParser)
    .refine(
      (arr) => Array.isArray(arr) && arr.length > 0,
      "At least one movement required",
    ),
});

export const routineUpdateSchema = routineSchema
  .partial()
  .omit({ movementsData: true });

export const routineMovementConfigSchema = z.object({
  movementId: z.string().min(1),
  order: z.number().int().min(0),
  target: z.object({
    type: z.enum(["time", "reps"]),
    value: z.number().positive(),
    unit: z.string().optional(),
    customTag: z.string().optional(),
  }),
  sets: z.number().int().min(1).default(1),
  isBilateral: z.boolean().default(false),
  switchSidesDuration: z.number().int().min(0).default(5),
  weight: z.number().int().optional().nullable(),
  weightUnit: z.enum(["lbs", "kg", "bodyweight"]).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type RoutineInput = z.infer<typeof routineSchema>;
export type RoutineUpdateInput = z.infer<typeof routineUpdateSchema>;
export type RoutineMovementConfig = z.infer<typeof routineMovementConfigSchema>;
