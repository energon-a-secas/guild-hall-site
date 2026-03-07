import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("quests").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    rank: v.string(),
    stars: v.number(),
    category: v.string(),
    repository: v.optional(v.string()),
    reward: v.optional(v.string()),
    postedBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("quests", {
      ...args,
      status: "posted",
      acceptedBy: [],
      completedBy: [],
      createdAt: Date.now(),
    });
  },
});

export const accept = mutation({
  args: { questId: v.id("quests"), username: v.string() },
  handler: async (ctx, { questId, username }) => {
    const quest = await ctx.db.get(questId);
    if (!quest) return { ok: false, error: "Quest not found" };
    if (quest.acceptedBy.includes(username))
      return { ok: false, error: "Already accepted" };

    const acceptedBy = [...quest.acceptedBy, username];
    const status = quest.status === "posted" ? "active" : quest.status;
    await ctx.db.patch(questId, { acceptedBy, status });
    return { ok: true };
  },
});

export const complete = mutation({
  args: { questId: v.id("quests"), username: v.string() },
  handler: async (ctx, { questId, username }) => {
    const quest = await ctx.db.get(questId);
    if (!quest) return { ok: false, error: "Quest not found" };
    if (!quest.acceptedBy.includes(username))
      return { ok: false, error: "Accept the quest first" };
    if (quest.completedBy.includes(username))
      return { ok: false, error: "Already completed" };

    const completedBy = [...quest.completedBy, username];
    const allDone =
      completedBy.length >= quest.acceptedBy.length &&
      quest.acceptedBy.length > 0;
    const status = allDone ? "completed" : quest.status;
    await ctx.db.patch(questId, { completedBy, status });

    const hunter = await ctx.db
      .query("hunters")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    if (hunter) {
      await ctx.db.patch(hunter._id, {
        huntsCompleted: hunter.huntsCompleted + 1,
      });
    }

    return { ok: true };
  },
});
