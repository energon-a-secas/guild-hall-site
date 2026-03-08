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
    karma: v.optional(v.number()),
    toolSuggestions: v.optional(v.array(v.string())),
    monsterIcon: v.optional(v.string()),
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

export const createRequest = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    rank: v.string(),
    stars: v.number(),
    category: v.string(),
    repository: v.optional(v.string()),
    reward: v.optional(v.string()),
    karma: v.optional(v.number()),
    toolSuggestions: v.optional(v.array(v.string())),
    monsterIcon: v.optional(v.string()),
    requestedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const { requestedBy, ...rest } = args;
    return await ctx.db.insert("quests", {
      ...rest,
      postedBy: requestedBy,
      status: "requested",
      acceptedBy: [],
      completedBy: [],
      createdAt: Date.now(),
    });
  },
});

export const approveQuest = mutation({
  args: { questId: v.id("quests"), username: v.string() },
  handler: async (ctx, { questId, username }) => {
    const quest = await ctx.db.get(questId);
    if (!quest) return { ok: false, error: "Quest not found" };
    if (quest.status !== "requested")
      return { ok: false, error: "Quest is not a request" };

    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    if (!user || user.role !== "guildmaster")
      return { ok: false, error: "Only the Guildmaster can approve requests" };

    await ctx.db.patch(questId, { status: "posted" });
    return { ok: true };
  },
});

export const updateToolSuggestions = mutation({
  args: {
    questId: v.id("quests"),
    toolSuggestions: v.array(v.string()),
  },
  handler: async (ctx, { questId, toolSuggestions }) => {
    const quest = await ctx.db.get(questId);
    if (!quest) return { ok: false, error: "Quest not found" };
    await ctx.db.patch(questId, { toolSuggestions });
    return { ok: true };
  },
});

const DEFAULT_MISSIONS = [
  { title: "Linkerd + Calico POC", description: "Proof of concept for Linkerd service mesh with Calico network policy.", rank: "high", stars: 15, karma: 40, status: "active", category: "hunt", toolSuggestions: ["Linkerd docs", "Calico docs", "kind or minikube for local"], monsterIcon: "MHRise-Rathalos_Icon.svg" },
  { title: "Confluence Local Model POC", description: "Local model proof of concept for Confluence.", rank: "high", stars: 10, karma: 10, status: "posted", category: "investigation", toolSuggestions: ["Confluence API", "Local LLM (Ollama, etc.)"], monsterIcon: "MHRise-Mizutsune_Icon.svg" },
  { title: "Gitlabform MR Rules and Permissions", description: "Define and automate MR rules and permissions with Gitlabform.", rank: "low", stars: 3, karma: 5, status: "posted", category: "capture", toolSuggestions: ["Gitlabform", "GitLab API", "GitLab MR settings"], monsterIcon: "MHRise-Great_Izuchi_Icon.svg" },
  { title: "Mock Service (Docker)", description: "Docker-based mock service for testing.", rank: "low", stars: 0, karma: 0, status: "posted", category: "hunt", toolSuggestions: ["Docker", "WireMock", "MockServer", "json-server"], monsterIcon: "MHRise-Arzuros_Icon.svg" },
  { title: "Switch EKS workloads between clusters", description: "Process and tooling to move EKS workloads between clusters.", rank: "master", stars: 0, karma: 0, status: "posted", category: "investigation", toolSuggestions: ["eksctl", "kubectl", "Velero", "AWS docs"], monsterIcon: "MHRise-Teostra_Icon.svg" },
  { title: "Improve the Cluster Upgrade process for teams that have additional regions", description: "Improve upgrade process for multi-region teams.", rank: "master", stars: 0, karma: 0, status: "posted", category: "capture", toolSuggestions: ["EKS upgrade runbooks", "region-specific playbooks"], monsterIcon: "MHRise-Kushala_Daora_Icon.svg" },
  { title: "Improve the pipeline for the EKS Cluster Upgrade without EKSv2", description: "Improve EKS cluster upgrade pipeline (non-EKSv2).", rank: "high", stars: 5, karma: 10, status: "posted", category: "capture", toolSuggestions: ["GitLab CI", "Terraform", "EKS upgrade docs"], monsterIcon: "MHRise-Nargacuga_Icon.svg" },
  { title: "Troubleshooting EKS Cluster similar to the one from the CKA cert.", description: "Troubleshooting exercises for CKA-style EKS clusters.", rank: "high", stars: 0, karma: 0, status: "posted", category: "investigation", toolSuggestions: ["CKA practice", "kubectl debug", "k9s", "Kubernetes docs"], monsterIcon: "MHRise-Barioth_Icon.svg" },
  { title: "Dummy for PagerDuty Drills + Basic Troubleshooting", description: "Dummy or sandbox for PagerDuty drills and basic troubleshooting.", rank: "low", stars: 0, karma: 0, status: "posted", category: "hunt", toolSuggestions: ["PagerDuty API", "Event orchestration", "Runbooks"], monsterIcon: "MHRise-Kulu-Ya-Ku_Icon.svg" },
  { title: "One click pod reboots when changing database connections or other environment flags", description: "One-click pod reboots when env/connection config changes; or enable Parameter Store.", rank: "high", stars: 0, karma: 0, status: "posted", category: "capture", toolSuggestions: ["AWS Parameter Store", "kubectl rollout restart", "ConfigMaps/Secrets"], monsterIcon: "MHRise-Almudron_Icon.svg" },
  { title: "AWS resources diagram per project and architecture", description: "Document AWS resources per project and show architecture/communication in a diagram.", rank: "high", stars: 0, karma: 0, status: "posted", category: "investigation", toolSuggestions: ["AWS Resource Groups", "CloudCraft", "Draw.io", "Hava.io"], monsterIcon: "MHRise-Magnamalo_Icon.svg" },
  { title: "Automate EKS cluster worker node AMI updates from CDENG use1-shared-tenants clusters", description: "Automate worker node AMI updates from CDENG use1-shared-tenants.", rank: "master", stars: 0, karma: 0, status: "posted", category: "hunt", toolSuggestions: ["EKS AMI", "Launch template updates", "GitLab CI or Terraform"], monsterIcon: "MHRise-Crimson_Glow_Valstrax_Icon.svg" },
  { title: "Improve the EKS Pipeline Anchors and Templates", description: "Improve EKS pipeline anchors and templates.", rank: "high", stars: 5, karma: 10, status: "posted", category: "capture", toolSuggestions: ["GitLab CI templates", ".gitlab-ci.yml anchors"], monsterIcon: "MHRise-Tigrex_Icon.svg" },
  { title: "Temporal Resources Inventory and Remover", description: "Inventory Temporal resources and provide a remover utility.", rank: "high", stars: 10, karma: 10, status: "posted", category: "hunt", toolSuggestions: ["Temporal CLI", "Temporal API", "tctl"], monsterIcon: "MHRise-Rajang_Icon.svg" },
  { title: "SE Load Testing Suite", description: "Load testing suite for SE.", rank: "high", stars: 0, karma: 0, status: "posted", category: "hunt", toolSuggestions: ["k6", "Locust", "Artillery", "Gatling"], monsterIcon: "MHRise-Bazelgeuse_Icon.svg" },
  { title: "Jira Story Points tools", description: "Tools or automation around Jira story points.", rank: "low", stars: 0, karma: 0, status: "posted", category: "investigation", toolSuggestions: ["Jira API", "Jira Automation", "ScriptRunner"], monsterIcon: "MHRise-Bishaten_Icon.svg" },
];

export const seedIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("quests").first();
    if (existing) return { ok: false, message: "Quests already exist" };
    const now = Date.now();
    for (const m of DEFAULT_MISSIONS) {
      await ctx.db.insert("quests", {
        title: m.title,
        description: m.description,
        rank: m.rank,
        stars: m.stars,
        category: m.category,
        status: m.status,
        karma: m.karma ?? undefined,
        toolSuggestions: m.toolSuggestions ?? [],
        monsterIcon: m.monsterIcon,
        postedBy: "Guildmaster",
        acceptedBy: [],
        completedBy: [],
        createdAt: now,
      });
    }
    return { ok: true, count: DEFAULT_MISSIONS.length };
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
