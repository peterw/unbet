import { defineSchema, defineTable } from 'convex/server';
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      tokenIdentifier: v.string(),
      onboarded: v.boolean(),
      // Anti-gambling specific fields
      lastRelapseDate: v.optional(v.string()),
      recoveryStartDate: v.optional(v.string()),
      accountabilityPartner: v.optional(v.string()),
      blockedSites: v.optional(v.array(v.string())),
      // Monthly challenge tracking
      currentMonthlyChallenge: v.optional(v.object({
        month: v.string(), // e.g., "2025-01"
        joinedAt: v.string(), // ISO date string
        completed: v.boolean(),
      })),
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
