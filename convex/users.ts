import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.error("No identity found in store mutation");
      throw new Error("Called storeUser without authentication present");
    }
    
    console.log("Store user called with identity:", identity.tokenIdentifier);
    
    // Check if we've already stored this identity before.
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (user !== null) {
      console.log("User already exists:", user._id);
      return user._id;
    }

    // If it's a new identity, create a new `User`.
    const userId = await ctx.db.insert("users", {
      name: identity.name ?? identity.email ?? identity.tokenIdentifier,
      tokenIdentifier: identity.tokenIdentifier,
      onboarded: false,
    });
    
    console.log("Created new user:", userId);
    return userId;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
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
    return user;
  }
});

export const updateCurrentUser = mutation({
  args: {
    sex: v.optional(v.string()),
    age: v.optional(v.number()),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    goals: v.optional(v.string()),
    diet: v.optional(v.string()),
    dailyProtein: v.optional(v.number()),
    training_type: v.optional(v.array(v.string())),
    training_frequency: v.optional(v.number()),
    referralCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called updateUser without authentication present");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      ...(args.sex !== undefined && { sex: args.sex }),
      ...(args.age !== undefined && { age: args.age }),
      ...(args.height !== undefined && { height: args.height }),
      ...(args.weight !== undefined && { weight: args.weight }),
      ...(args.goals !== undefined && { goals: args.goals }),
      ...(args.diet !== undefined && { diet: args.diet }),
      ...(args.dailyProtein !== undefined && { dailyProtein: args.dailyProtein }),
      ...(args.training_type !== undefined && { training_type: args.training_type }),
      ...(args.training_frequency !== undefined && { training_frequency: args.training_frequency }),
      ...(args.referralCode !== undefined && { referralCode: args.referralCode }),
      onboarded: true,
    });
    return user._id;
  },
});
