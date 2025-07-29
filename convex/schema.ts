import { defineSchema, defineTable } from 'convex/server';
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
      name: v.optional(v.string()),
      tokenIdentifier: v.string(),
      onboarded: v.boolean(),
      // Anti-gambling specific fields
      lastRelapseDate: v.optional(v.string()),
      recoveryStartDate: v.optional(v.string()),
      accountabilityPartner: v.optional(v.string()),
      blockedSites: v.optional(v.array(v.string())),
    }).index('by_token', ['tokenIdentifier']),

    journalEntries: defineTable({
      userId: v.id('users'),
      content: v.string(),
      category: v.union(
        v.literal("Thoughts"),
        v.literal("Feelings"),
        v.literal("Gratitude"),
        v.literal("Progress")
      ),
      createdAt: v.string(),
      updatedAt: v.optional(v.string()),
    }).index('by_user', ['userId']),
});
