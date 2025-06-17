import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const main = async () => {
  try {
    console.log("Resetting database");

    await sql`TRUNCATE TABLE 
      challenge_progress,
      challenge_options,
      challenges,
      lessons,
      units,
      user_progress,
      courses
      RESTART IDENTITY CASCADE`;

    console.log("Resetting finished");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to reset the database");
  }
};

main();
