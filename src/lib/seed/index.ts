import { db } from "../db";
import * as schema from "../db/schema";
import type { movements, routines, routineMovements } from "../db/schema";
import { readdirSync } from "fs";
import { join } from "path";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { generateMovementId, generateRoutineId, generateRoutineMovementId } from "../utils/id";
import seedData from "./data.json";

const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production",
  database: drizzleAdapter(db, {
    schema,
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
      },
    },
  },
});

const assetsPath = join(process.cwd(), "static/assets/movements");
const files = readdirSync(assetsPath).filter((f) =>
  /\.(svg|jpg|jpeg|png|webp)$/i.test(f),
);

const svgMap: Record<string, string> = {};
for (const file of files) {
  const fileName = file.split(".")[0];
  const camelCase = fileName.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  svgMap[camelCase] = `/assets/movements/${file}`;
}

interface SeedMovement {
  name: string;
  description: string;
  type: string;
  illustrationKey: string;
  equipment?: string[];
  defaultTarget?: { type: string; value: number; unit?: string };
  isBilateral?: boolean;
  switchSidesDuration?: number;
  weightUnit?: string;
  timePerRep?: number;
}

interface SeedRoutine {
  name: string;
  description: string;
  restBetweenMovements: number;
  restBetweenSets: number;
  autoAdvance: boolean;
  audioEnabled: boolean;
  keepAwake: boolean;
}

interface SeedRoutineMovement {
  routineName: string;
  movementName: string;
  order: number;
  target: { type: string; value: number; unit?: string };
  sets: number;
  isBilateral?: boolean;
  switchSidesDuration?: number;
  restBetweenSets?: number;
  notes?: string;
  weight?: number;
  weightUnit?: string;
}

export async function seedDatabase() {
  try {
    console.log("Starting database seed...");

    const testEmail = "test@example.com";
    const testPassword = "test1234";
    const existingUser = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.email, testEmail),
    });
    if (!existingUser) {
      await auth.api.signUpEmail({
        body: {
          email: testEmail,
          password: testPassword,
          name: "Test User",
          username: "testuser",
        },
      });
      console.log("✓ Created test user (test@example.com / test1234)");
    } else {
      console.log("✓ Test user already exists");
    }

    const movementIdMap = new Map<string, string>();
    for (const m of seedData.movements as SeedMovement[]) {
      const id = generateMovementId(m.name);
      const movement: typeof movements.$inferInsert = {
        id,
        name: m.name,
        description: m.description,
        type: m.type as "timed" | "reps" | "weighted" | "resistance_band",
        illustrationPath: svgMap[m.illustrationKey as keyof typeof svgMap] || null,
        isCustom: false,
        weightUnit: m.weightUnit as "lbs" | "kg" | "bodyweight" | undefined,
        isBilateral: m.isBilateral ?? false,
        switchSidesDuration: m.switchSidesDuration ?? 5,
        timePerRep: m.timePerRep ?? (m.type !== 'timed' ? 3 : null),
        equipment: m.equipment ?? null,
        metadata: { defaultTarget: m.defaultTarget as { type: "time" | "reps"; value: number; unit?: string } },
        createdAt: new Date(),
      };
      await db.insert(schema.movements).values(movement).onConflictDoNothing();
      movementIdMap.set(m.name, id);
    }
    console.log(`✓ Seeded ${seedData.movements.length} movements`);

    const routineIdMap = new Map<string, string>();
    for (const r of seedData.routines as SeedRoutine[]) {
      const id = generateRoutineId(r.name);
      const routine: typeof routines.$inferInsert = {
        id,
        name: r.name,
        description: r.description,
        restBetweenMovements: r.restBetweenMovements,
        restBetweenSets: r.restBetweenSets,
        autoAdvance: r.autoAdvance,
        audioEnabled: r.audioEnabled,
        keepAwake: r.keepAwake,
        isCustom: false,
        createdAt: new Date(),
      };
      await db.insert(schema.routines).values(routine).onConflictDoNothing();
      routineIdMap.set(r.name, id);
    }
    console.log(`✓ Seeded ${seedData.routines.length} routines`);

    for (const rm of seedData.routineMovements as SeedRoutineMovement[]) {
      const movementId = movementIdMap.get(rm.movementName);
      const routineId = routineIdMap.get(rm.routineName);
      if (movementId && routineId) {
        const movement = seedData.movements.find((m: any) => m.name === rm.movementName);
        const routine = seedData.routines.find((r: any) => r.name === rm.routineName);
        const id = generateRoutineMovementId(
          routine?.name || 'unknown',
          movement?.name || 'unknown',
          rm.order
        );
        const routineMovement: typeof routineMovements.$inferInsert = {
          id,
          routineId,
          movementId,
          order: rm.order,
          target: rm.target as { type: "time" | "reps"; value: number; unit?: string },
          sets: rm.sets,
          isBilateral: rm.isBilateral ?? (movement as SeedMovement)?.isBilateral ?? false,
          switchSidesDuration: rm.switchSidesDuration ?? (movement as SeedMovement)?.switchSidesDuration ?? 5,
          notes: rm.notes,
          weight: rm.weight,
          weightUnit: rm.weightUnit as "lbs" | "kg" | "bodyweight" | undefined,
        };
        await db
          .insert(schema.routineMovements)
          .values(routineMovement)
          .onConflictDoNothing();
      }
    }
    console.log("✓ Seeded routine movements");

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
