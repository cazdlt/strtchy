import { z } from "zod";
import { equipmentParser, imageFileSchema } from "../helpers/parsers";

export const movementTypeSchema = z.enum([
  "timed",
  "reps",
  "weighted",
  "resistance_band",
]);

export const movementSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z
    .string()
    .max(500, "Description too long")
    .optional()
    .nullable(),
  type: movementTypeSchema,
  defaultValue: z.coerce.number().int().positive("Value must be positive"),
  defaultUnit: z.enum(["lbs", "kg", "bodyweight"]).optional().nullable(),
  timePerRep: z.coerce.number().int().min(1).optional().nullable(),
  isBilateral: z.boolean().default(false),
  switchSidesDuration: z.coerce.number().int().min(0).default(5),
  equipment: z
    .union([
      z.string().transform(equipmentParser),
      z.array(z.string().transform((s) => s.trim()).pipe(z.string().min(1))),
    ])
    .optional(),
  illustration: imageFileSchema.optional().nullable(),
});

export const movementUpdateSchema = movementSchema.partial();

export type MovementInput = z.infer<typeof movementSchema>;
export type MovementUpdateInput = z.infer<typeof movementUpdateSchema>;
