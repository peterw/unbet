import { defineSchema, defineTable } from 'convex/server';
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
      name: v.optional(v.string()),
      tokenIdentifier: v.string(),
      onboarded: v.boolean(),
      goals: v.optional(v.string()),
      sex: v.optional(v.string()),
      age: v.optional(v.number()),
      height: v.optional(v.number()),
      weight: v.optional(v.number()),
      diet: v.optional(v.string()),
      dailyProtein: v.optional(v.number()),
      training_frequency: v.optional(v.number()),
      training_type: v.optional(v.array(v.string())),
      referralCode: v.optional(v.string()),
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

    proteinEntries: defineTable({
        userId: v.id('users'),
        date: v.string(),
        name: v.optional(v.string()),
        totalProteinEstimate: v.number(),
        ingredients: v.array(v.object({
          name: v.string(),
          weight: v.number(),
          proteinPercentage: v.number(),
          calories: v.optional(v.number()),
          aminoAcidMissing: v.optional(v.array(v.string())),
        })),
        totalCalories: v.optional(v.number()),
        aminoRecommendation: v.optional(v.string()),
        entryMethod: v.string(),
        imageUrl: v.optional(v.string()),
    }).index('by_user_and_date', ['userId', 'date']),

    savedFoods: defineTable({
        userId: v.id('users'),
        originalEntryId: v.id('proteinEntries'),
        name: v.string(),
        ingredients: v.array(v.object({
            name: v.string(),
            weight: v.number(),
            proteinPercentage: v.number(),
            calories: v.optional(v.number()),
            aminoAcidMissing: v.optional(v.array(v.string())),
        })),
        totalProteinEstimate: v.number(),
        totalCalories: v.optional(v.number()),
        aminoRecommendation: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        createdAt: v.string(),
    }).index('by_user', ['userId'])
      .index('by_original_entry', ['originalEntryId']),

    imageAnalysisJobs: defineTable({
        imageStorageId: v.optional(v.id("_storage")),
        imageUrl: v.optional(v.string()),
        status: v.string(), // 'pending', 'completed', 'error'
        result: v.optional(v.object({
            name: v.optional(v.string()),
            totalProteinEstimate: v.number(),
            totalCalories: v.optional(v.number()),
            ingredients: v.array(v.object({
                name: v.string(),
                weight: v.number(),
                proteinPercentage: v.number(),
                calories: v.optional(v.number()),
                aminoAcidMissing: v.optional(v.array(v.string())),
            })),
            aminoRecommendation: v.optional(v.string()),
            error: v.optional(v.string()),
        })),
        userId: v.id('users'),
        createdAt: v.string(),
    }).index('by_user_and_created_at', ['userId', 'createdAt']),

    fixJobs: defineTable({
        entryId: v.id('proteinEntries'),
        userId: v.id('users'),
        instruction: v.string(),
        status: v.string(), // 'pending', 'completed', 'failed'
        originalEntry: v.object({
            name: v.optional(v.string()),
            totalProteinEstimate: v.number(),
            ingredients: v.array(v.object({
                name: v.string(),
                weight: v.number(),
                proteinPercentage: v.number(),
                calories: v.optional(v.number()),
                aminoAcidMissing: v.optional(v.array(v.string())),
            })),
            totalCalories: v.optional(v.number()),
            aminoRecommendation: v.optional(v.string()),
        }),
        result: v.optional(v.object({
            name: v.optional(v.string()),
            totalProteinEstimate: v.number(),
            ingredients: v.array(v.object({
                name: v.string(),
                weight: v.number(),
                proteinPercentage: v.number(),
                calories: v.optional(v.number()),
                aminoAcidMissing: v.optional(v.array(v.string())),
            })),
            totalCalories: v.optional(v.number()),
            aminoRecommendation: v.optional(v.string()),
        })),
        createdAt: v.string(),
    }).index('by_entry', ['entryId'])
      .index('by_user', ['userId']),
});
