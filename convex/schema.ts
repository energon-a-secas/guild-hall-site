import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    role: v.optional(v.string()),
  }).index("by_username", ["username"]),

  quests: defineTable({
    title: v.string(),
    description: v.string(),
    rank: v.string(),
    stars: v.number(),
    category: v.string(),
    status: v.string(),
    repository: v.optional(v.string()),
    reward: v.optional(v.string()),
    karma: v.optional(v.number()),
    toolSuggestions: v.optional(v.array(v.string())),
    monsterIcon: v.optional(v.string()),
    postedBy: v.string(),
    acceptedBy: v.array(v.string()),
    completedBy: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_rank", ["rank"])
    .index("by_status", ["status"]),

  hunters: defineTable({
    userId: v.id("users"),
    username: v.string(),
    title: v.string(),
    github: v.optional(v.string()),
    badges: v.array(v.string()),
    huntsCompleted: v.number(),
    joinedAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_userId", ["userId"]),
});
