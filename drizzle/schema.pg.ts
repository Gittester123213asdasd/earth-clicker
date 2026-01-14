import { pgTable, serial, text, timestamp, integer, bigint, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: roleEnum("role").default("user").notNull(),
  country: text("country"),
  totalClicks: bigint("totalClicks", { mode: "number" }).default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const globalCounter = pgTable("globalCounter", {
  id: integer("id").primaryKey().default(1),
  totalClicks: bigint("totalClicks", { mode: "number" }).default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const countryStats = pgTable("countryStats", {
  id: serial("id").primaryKey(),
  countryCode: text("countryCode").notNull().unique(),
  countryName: text("countryName").notNull(),
  totalClicks: bigint("totalClicks", { mode: "number" }).default(0).notNull(),
  userCount: integer("userCount").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const userSessions = pgTable("userSessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  sessionId: text("sessionId").notNull().unique(),
  lastClickAt: timestamp("lastClickAt"),
  clickCount: integer("clickCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
