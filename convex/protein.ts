import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const addProteinEntry = mutation({
  args: {
    userId: v.id("users"),
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
  },
  handler: async (ctx, args) => {
    // Recalculate totalProteinEstimate based on ingredients to ensure consistency
    const recalculatedProtein = args.ingredients.reduce(
      (sum, ing) => sum + ((ing.weight * ing.proteinPercentage) / 100), 
      0
    );

    const proteinEntryId = await ctx.db.insert("proteinEntries", {
      userId: args.userId,
      date: args.date,
      name: args.name || undefined,
      totalProteinEstimate: recalculatedProtein, // Use the recalculated value instead
      aminoRecommendation: args.aminoRecommendation || undefined,
      ingredients: args.ingredients,
      totalCalories: args.totalCalories,
      entryMethod: args.entryMethod,
      imageUrl: args.imageUrl || undefined,
    });

    return proteinEntryId;
  },
});

export const getProteinEntry = query({
  args: {
    entryId: v.id("proteinEntries"),
  },
  handler: async (ctx, args) => {
    return ctx.db.get(args.entryId);
  },
});

export const getProteinEntries = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return null;
    }
    
    const entries = await ctx.db
      .query("proteinEntries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id)
         .gte("date", args.startDate)
         .lte("date", args.endDate)
      )
      .order("desc")
      .collect();

    return entries;
  },
});

export const calculateDailyProteinIntake = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return null;
    }

    const startOfDay = args.date + "T00:00:00.000";
    const endOfDay = args.date + "T23:59:59.999";

    const entries = await ctx.db
      .query("proteinEntries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id)
         .gte("date", startOfDay)
         .lte("date", endOfDay)
      )
      .collect();

    const totalProtein = entries.reduce((sum, entry) => sum + entry.totalProteinEstimate, 0);

    return {
      date: args.date,
      totalProtein,
      goal: user.dailyProtein ?? 0,
      entries: entries.length,
    };
  },
});

export const deleteProteinEntry = mutation({
  args: {
    entryId: v.id("proteinEntries"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.entryId);
  },
});

export const updateProteinEntry = mutation({
  args: {
    entryId: v.id("proteinEntries"),
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
  },
  handler: async (ctx, args) => {
    // Recalculate totalProteinEstimate based on ingredients to ensure consistency
    const recalculatedProtein = args.ingredients.reduce(
      (sum, ing) => sum + ((ing.weight * ing.proteinPercentage) / 100), 
      0
    );

    await ctx.db.patch(args.entryId, {
      name: args.name,
      totalProteinEstimate: recalculatedProtein, // Use the recalculated value instead
      ingredients: args.ingredients,
      totalCalories: args.totalCalories,
      aminoRecommendation: args.aminoRecommendation,
    });
  },
});

export const getMultiWeekProteinData = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return null;
    }

    // Calculate start date (4 weeks before) and end date
    const endDate = new Date(args.date);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 28); // 4 weeks = 28 days

    // Format dates without 'Z' suffix
    const startDateStr = startDate.toISOString().split('T')[0] + 'T00:00:00.000';
    const endDateStr = endDate.toISOString().split('T')[0] + 'T23:59:59.999';

    // Fetch all entries for the date range
    const entries = await ctx.db
      .query("proteinEntries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id)
         .gte("date", startDateStr)
         .lte("date", endDateStr)
      )
      .order("desc") // Added this line to sort in descending order
      .collect();

    // Group entries by date and calculate daily totals
    const dailyTotals = entries.reduce((acc, entry) => {
      const date = entry.date.split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          entries: [],
          totalProtein: 0,
        };
      }
      acc[date].entries.push(entry);
      acc[date].totalProtein += entry.totalProteinEstimate;
      return acc;
    }, {} as Record<string, { date: string; entries: any[]; totalProtein: number }>);

    return {
      dailyTotals,
      userGoal: user.dailyProtein ?? 0,
      startDate: startDateStr.split('T')[0],
      endDate: endDateStr.split('T')[0],
    };
  },
});

export const saveFood = mutation({
  args: {
    originalEntryId: v.id("proteinEntries"),
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    
    if (!user) throw new Error("User not found");

    // Recalculate totalProteinEstimate based on ingredients to ensure consistency
    const recalculatedProtein = args.ingredients.reduce(
      (sum, ing) => sum + ((ing.weight * ing.proteinPercentage) / 100), 
      0
    );

    return await ctx.db.insert("savedFoods", {
      userId: user._id,
      ...args,
      totalProteinEstimate: recalculatedProtein, // Override with recalculated value
      createdAt: new Date().toISOString(),
    });
  },
});

export const getSavedFoods = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    
    if (!user) return null;

    const savedFoods = await ctx.db
      .query("savedFoods")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return savedFoods;
  },
});

export const checkSavedStatus = query({
  args: { entryId: v.id("proteinEntries") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    
    if (!user) return false;

    const savedFood = await ctx.db
      .query("savedFoods")
      .withIndex("by_original_entry", (q) => q.eq("originalEntryId", args.entryId))
      .first();

    return savedFood !== null;
  },
});

export const addSavedFoodEntry = mutation({
  args: {
    savedFoodId: v.id("savedFoods"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!user) throw new Error("User not found");

    const savedFood = await ctx.db.get(args.savedFoodId);
    if (!savedFood) throw new Error("Saved food not found");

    // Recalculate totalProteinEstimate based on ingredients to ensure consistency
    const recalculatedProtein = savedFood.ingredients.reduce(
      (sum, ing) => sum + ((ing.weight * ing.proteinPercentage) / 100), 
      0
    );

    return await ctx.db.insert("proteinEntries", {
      userId: user._id,
      date: args.date,
      name: savedFood.name,
      totalProteinEstimate: recalculatedProtein, // Use recalculated value
      ingredients: savedFood.ingredients,
      totalCalories: savedFood.totalCalories,
      aminoRecommendation: savedFood.aminoRecommendation,
      entryMethod: "saved_food",
      imageUrl: savedFood.imageUrl,
    });
  },
});
