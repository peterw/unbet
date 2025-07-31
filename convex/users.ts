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
      recoveryStartDate: new Date().toISOString(), // Set recovery start date to today
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
    lastRelapseDate: v.optional(v.string()),
    recoveryStartDate: v.optional(v.string()),
    accountabilityPartner: v.optional(v.string()),
    blockedSites: v.optional(v.array(v.string())),
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
      ...(args.lastRelapseDate !== undefined && { lastRelapseDate: args.lastRelapseDate }),
      ...(args.recoveryStartDate !== undefined && { recoveryStartDate: args.recoveryStartDate }),
      ...(args.accountabilityPartner !== undefined && { accountabilityPartner: args.accountabilityPartner }),
      ...(args.blockedSites !== undefined && { blockedSites: args.blockedSites }),
      onboarded: true, // Mark user as onboarded when they update their profile
    });
    return user._id;
  },
});

// Dev only mutation to reset onboarding
export const resetOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
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

    await ctx.db.patch(user._id, { onboarded: false });
    return { success: true };
  },
});
