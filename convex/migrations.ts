import { mutation } from "./_generated/server";

export const cleanupProteinFields = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    for (const user of users) {
      const updates: any = {
        name: user.name,
        tokenIdentifier: user.tokenIdentifier,
        onboarded: user.onboarded,
      };
      
      // Add new fields if they exist
      if ((user as any).lastRelapseDate) updates.lastRelapseDate = (user as any).lastRelapseDate;
      if ((user as any).recoveryStartDate) updates.recoveryStartDate = (user as any).recoveryStartDate;
      if ((user as any).accountabilityPartner) updates.accountabilityPartner = (user as any).accountabilityPartner;
      if ((user as any).blockedSites) updates.blockedSites = (user as any).blockedSites;
      
      // Replace the entire document to remove old fields
      await ctx.db.replace(user._id, updates);
    }
    
    return { migrated: users.length };
  },
});