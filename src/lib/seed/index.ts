import { nanoid } from "nanoid";
import { db } from "../db";
import * as schema from "../db/schema";
import type { movements, routines, routineMovements } from "../db/schema";
import { readdirSync } from "fs";
import { join } from "path";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
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
    for (const m of seedData.movements) {
      const movement: typeof movements.$inferInsert = {
        id: nanoid(),
        name: m.name,
        description: m.description,
        type: m.type as "timed" | "reps" | "weighted" | "resistance",
        illustrationPath: svgMap[m.illustrationKey as keyof typeof svgMap],
        isCustom: false,
        weightUnit: m.weightUnit as "lbs" | "kg" | "bodyweight" | undefined,
        isBilateral: m.isBilateral ?? false,
        switchSidesDuration: m.switchSidesDuration ?? 5,
        metadata: { defaultTarget: m.defaultTarget as { type: "time" | "reps"; value: number; unit?: string } },
        createdAt: new Date(),
      };
      await db.insert(schema.movements).values(movement).onConflictDoNothing();
      movementIdMap.set(m.name, movement.id);
    }
    console.log(`✓ Seeded ${seedData.movements.length} movements`);

    const routineIdMap = new Map<string, string>();
    for (const r of seedData.routines) {
      const routine: typeof routines.$inferInsert = {
        id: nanoid(),
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
      routineIdMap.set(r.name, routine.id);
    }
    console.log(`✓ Seeded ${seedData.routines.length} routines`);

    for (const rm of seedData.routineMovements) {
      const movementId = movementIdMap.get(rm.movementName);
      const routineId = routineIdMap.get(rm.routineName);
      if (movementId && routineId) {
        const movement = seedData.movements.find((m) => m.name === rm.movementName);
        const routineMovement: typeof routineMovements.$inferInsert = {
          id: nanoid(),
          routineId,
          movementId,
          order: rm.order,
          target: rm.target as { type: "time" | "reps"; value: number; unit?: string },
          sets: rm.sets,
          isBilateral: rm.isBilateral ?? movement?.isBilateral ?? false,
          switchSidesDuration: rm.switchSidesDuration ?? movement?.switchSidesDuration ?? 5,
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
