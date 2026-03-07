import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const register = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, { username, password }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    if (existing) return { ok: false, error: "Hunter name already taken" };

    const passwordHash = btoa(password);
    const role = username.toLowerCase() === "guildmaster" ? "guildmaster" : "hunter";
    const userId = await ctx.db.insert("users", { username, passwordHash, role });

    await ctx.db.insert("hunters", {
      userId,
      username,
      title: "Greenhorn",
      badges: [],
      huntsCompleted: 0,
      joinedAt: Date.now(),
    });

    return { ok: true, username, role };
  },
});

export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, { username, password }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    if (!user) return { ok: false, error: "Hunter not found" };
    if (user.passwordHash !== btoa(password))
      return { ok: false, error: "Wrong password" };
    return { ok: true, username: user.username, role: user.role || "hunter" };
  },
});
