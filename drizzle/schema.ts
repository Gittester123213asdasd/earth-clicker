import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  country: varchar("country", { length: 2 }), // ISO 3166-1 alpha-2 country code
  totalClicks: bigint("totalClicks", { mode: "number" }).default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Global click counter - stores the total clicks across all users
 */
export const globalCounter = mysqlTable("globalCounter", {
  id: int("id").primaryKey().default(1),
  totalClicks: bigint("totalClicks", { mode: "number" }).default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GlobalCounter = typeof globalCounter.$inferSelect;

/**
 * Country statistics - aggregated clicks per country
 */
export const countryStats = mysqlTable("countryStats", {
  id: int("id").autoincrement().primaryKey(),
  countryCode: varchar("countryCode", { length: 2 }).notNull().unique(),
  countryName: varchar("countryName", { length: 100 }).notNull(),
  totalClicks: bigint("totalClicks", { mode: "number" }).default(0).notNull(),
  userCount: int("userCount").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CountryStats = typeof countryStats.$inferSelect;

/**
 * User sessions for tracking online users and rate limiting
 */
export const userSessions = mysqlTable("userSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  lastClickAt: timestamp("lastClickAt"),
  clickCount: int("clickCount").default(0).notNull(), // clicks in current window
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type UserSession = typeof userSessions.$inferSelect;