import { z } from "zod";

export const practiceDataEntrySchema = z.object({
  movementId: z.string().min(1),
  movementName: z.string().min(1).optional(),
  movementType: z
    .enum(["timed", "reps", "weighted", "resistance_band"])
    .optional(),
  targetType: z.enum(["time", "reps"]).optional(),
  targetValue: z.number().int().positive().optional(),
  order: z.number().int().min(0).optional(),
  setNumber: z.number().int().min(1).default(1),
  side: z.enum(["left", "right"]).optional().nullable(),
  value: z.number().int().min(0),
  weight: z.number().int().optional().nullable(),
  weightUnit: z.enum(["lbs", "kg", "bodyweight"]).optional().nullable(),
  customMeasurement: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  status: z.enum(["completed", "skipped"]).default("completed"),
});

const dateInputSchema = z
  .union([z.string(), z.number(), z.date()])
  .transform((val) => {
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) {
      throw new Error("Invalid date value");
    }
    return d;
  });

export const practiceCreateSchema = z.object({
  routineId: z.string().min(1, "routineId is required"),
  startedAt: dateInputSchema.optional(),
  completedAt: dateInputSchema.optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  autoPopulateFromRoutine: z.boolean().default(true),
  practiceData: z.array(practiceDataEntrySchema).optional(),
});

export const practiceUpdateSchema = z.object({
  startedAt: dateInputSchema.optional(),
  completedAt: dateInputSchema.optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  practiceData: z.array(practiceDataEntrySchema).optional(),
});

export type PracticeDataEntryInput = z.infer<typeof practiceDataEntrySchema>;
export type PracticeCreateInput = z.infer<typeof practiceCreateSchema>;
export type PracticeUpdateInput = z.infer<typeof practiceUpdateSchema>;
