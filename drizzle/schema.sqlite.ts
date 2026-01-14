import { integer, text, sqliteTable } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  country: text("country"),
  totalClicks: integer("totalClicks").default(0).notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastSignedIn: text("lastSignedIn").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const globalCounter = sqliteTable("globalCounter", {
  id: integer("id").primaryKey().default(1),
  totalClicks: integer("totalClicks").default(0).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const countryStats = sqliteTable("countryStats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  countryCode: text("countryCode").notNull().unique(),
  countryName: text("countryName").notNull(),
  totalClicks: integer("totalClicks").default(0).notNull(),
  userCount: integer("userCount").default(0).notNull(),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userSessions = sqliteTable("userSessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  sessionId: text("sessionId").notNull().unique(),
  lastClickAt: text("lastClickAt"),
  clickCount: integer("clickCount").default(0).notNull(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
  expiresAt: text("expiresAt").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
