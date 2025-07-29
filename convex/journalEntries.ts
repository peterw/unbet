import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new journal entry
export const create = mutation({
  args: {
    content: v.string(),
    category: v.union(
      v.literal("Thoughts"),
      v.literal("Feelings"),
      v.literal("Gratitude"),
      v.literal("Progress")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Create the journal entry
    const entryId = await ctx.db.insert("journalEntries", {
      userId: user._id,
      content: args.content,
      category: args.category,
      createdAt: new Date().toISOString(),
    });

    return entryId;
  },
});

// Get all journal entries for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return [];
    }

    const entries = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return entries;
  },
});

// Get a single journal entry
export const get = query({
  args: { id: v.id("journalEntries") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const entry = await ctx.db.get(args.id);
    if (!entry) {
      return null;
    }

    // Verify the entry belongs to the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || entry.userId !== user._id) {
      return null;
    }

    return entry;
  },
});

// Update a journal entry
export const update = mutation({
  args: {
    id: v.id("journalEntries"),
    content: v.string(),
    category: v.union(
      v.literal("Thoughts"),
      v.literal("Feelings"),
      v.literal("Gratitude"),
      v.literal("Progress")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const entry = await ctx.db.get(args.id);
    if (!entry) {
      throw new Error("Entry not found");
    }

    // Verify the entry belongs to the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || entry.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      content: args.content,
      category: args.category,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Delete a journal entry
export const remove = mutation({
  args: { id: v.id("journalEntries") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const entry = await ctx.db.get(args.id);
    if (!entry) {
      throw new Error("Entry not found");
    }

    // Verify the entry belongs to the current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || entry.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});