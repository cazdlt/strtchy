import { json } from "@sveltejs/kit";
import { sql } from "drizzle-orm";
import { db } from "$lib/db";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  const timestamp = new Date().toISOString();

  try {
    db.get(sql`SELECT 1`);
    return json({
      status: "ok",
      db: "connected",
      timestamp,
    });
  } catch (error) {
    console.error("[health] Database healthcheck failed:", error);
    return json(
      {
        status: "error",
        db: "disconnected",
        timestamp,
      },
      { status: 503 },
    );
  }
};
