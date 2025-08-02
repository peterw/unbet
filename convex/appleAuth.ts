import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Verify Apple identity token and create/update user
 * 
 * Security considerations:
 * - Token verification happens server-side using Apple's public keys
 * - Validates issuer and token age
 * - Checks that token subject matches the provided user ID
 * 
 * TODO for production:
 * - Add audience validation with your app's bundle ID
 * - Implement nonce validation for replay attack prevention
 * - Consider rate limiting to prevent abuse
 */
export const signInWithApple: any = action({
  args: {
    identityToken: v.string(),
    user: v.string(), // Apple user ID
    email: v.optional(v.string()),
    fullName: v.optional(v.object({
      givenName: v.optional(v.string()),
      familyName: v.optional(v.string()),
    })),
    nonce: v.optional(v.string()), // For replay attack prevention
  },
  handler: async (ctx, args) => {
    // Verify the Apple token
    const JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

    try {
      const { payload } = await jwtVerify(args.identityToken, JWKS, {
        issuer: "https://appleid.apple.com",
        maxTokenAge: "1h",
        // TODO: Add audience validation with your app's bundle ID
        // audience: "com.peterwang.unbet",
      });

      // Validate that the token subject matches the provided user ID
      if (payload.sub !== args.user) {
        throw new Error("User ID mismatch");
      }

      // Extract user information
      const appleUserId = payload.sub as string;
      const email = args.email || (payload as any).email;
      // Construct full name from components
      let name: string | undefined;
      if (args.fullName) {
        const parts = [
          args.fullName.givenName,
          args.fullName.familyName
        ].filter(Boolean);
        name = parts.length > 0 ? parts.join(' ') : undefined;
      }

      // Create or update user in database
      const userId = await ctx.runMutation(api.appleAuth.createOrUpdateUser, {
        appleUserId,
        email,
        name,
      });

      return { userId, success: true };
    } catch (error) {
      console.error("Apple token verification failed:", error);
      throw new Error(`Invalid Apple identity token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

export const createOrUpdateUser = mutation({
  args: {
    appleUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create a token identifier for the user
    const tokenIdentifier = `apple|${args.appleUserId}`;

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();

    if (existingUser) {
      // Update existing user with latest info
      if (args.email || args.name) {
        await ctx.db.patch(existingUser._id, {
          ...(args.email && { email: args.email }),
          ...(args.name && { name: args.name }),
        });
      }
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      tokenIdentifier,
      email: args.email,
      name: args.name,
      onboarded: false,
    });

    return userId;
  },
});