import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(databaseUrl);
export const db = drizzle(client);

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  chatId: text("chat_id").notNull(),
  action: text("action").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  quantity: text("quantity"),
  price: text("price"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
