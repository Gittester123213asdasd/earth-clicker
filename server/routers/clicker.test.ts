import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("clicker router", () => {
  describe("getGlobalCounter", () => {
    it("returns a number", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      });

      const result = await caller.clicker.getGlobalCounter();

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe("submitClick", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      });

      await expect(caller.clicker.submitClick({ country: "US" })).rejects.toThrow();
    });

    it("increments global counter when authenticated", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const beforeGlobal = await caller.clicker.getGlobalCounter();
      const result = await caller.clicker.submitClick({ country: "US" });

      expect(result.success).toBe(true);
      expect(result.globalClicks).toBeGreaterThanOrEqual(beforeGlobal);
      expect(result.userClicks).toBeGreaterThanOrEqual(1);
    });

    it("allows multiple clicks from same user", async () => {
      const ctx = createAuthContext(3);
      const caller = appRouter.createCaller(ctx);

      const result1 = await caller.clicker.submitClick({ country: "US" });
      const result2 = await caller.clicker.submitClick({ country: "US" });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result2.globalClicks).toBeGreaterThanOrEqual(result1.globalClicks);
    });
  });

  describe("getLeaderboard", () => {
    it("returns an array of countries", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      });

      const result = await caller.clicker.getLeaderboard({ limit: 10 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);

      if (result.length > 0) {
        const country = result[0];
        expect(country).toHaveProperty("rank");
        expect(country).toHaveProperty("countryCode");
        expect(country).toHaveProperty("totalClicks");
        expect(country).toHaveProperty("userCount");
      }
    });

    it("respects limit parameter", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      });

      const result5 = await caller.clicker.getLeaderboard({ limit: 5 });
      const result10 = await caller.clicker.getLeaderboard({ limit: 10 });

      expect(result5.length).toBeLessThanOrEqual(5);
      expect(result10.length).toBeLessThanOrEqual(10);
    });
  });

  describe("getUserStats", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      });

      await expect(caller.clicker.getUserStats()).rejects.toThrow();
    });

    it("returns user stats", async () => {
      const ctx = createAuthContext(4);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clicker.getUserStats();

      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("totalClicks");
      expect(result).toHaveProperty("country");
      expect(result).toHaveProperty("name");
      expect(typeof result.totalClicks).toBe("number");
    });
  });

  describe("getCountryStats", () => {
    it("returns country stats", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      });

      const result = await caller.clicker.getCountryStats({ countryCode: "US" });

      expect(result).toHaveProperty("countryCode");
      expect(result).toHaveProperty("totalClicks");
      expect(typeof result.totalClicks).toBe("number");
    });
  });

  describe("getUserCountryRank", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      });

      await expect(caller.clicker.getUserCountryRank()).rejects.toThrow();
    });
  });
});
