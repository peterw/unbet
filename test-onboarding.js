// Test script for verifying onboarding implementation
// Run this in the Convex dashboard to test

// Test 1: Check schema
console.log("Test 1: Checking user schema...");
const users = await db.query("users").collect();
console.log("Sample user:", users[0]);
console.log("Has onboarded field?", users[0]?.hasOwnProperty('onboarded'));
console.log("Onboarded type:", typeof users[0]?.onboarded);

// Test 2: Test setOnboarded mutation
console.log("\nTest 2: Testing setOnboarded mutation...");
try {
  // Set to false
  await ctx.runMutation(api.users.setOnboarded, { value: false });
  console.log("✓ Set onboarded to false");
  
  // Set to true
  await ctx.runMutation(api.users.setOnboarded, { value: true });
  console.log("✓ Set onboarded to true");
  
  // Verify the change
  const updatedUser = await db.query("users").first();
  console.log("User onboarded status:", updatedUser?.onboarded);
} catch (error) {
  console.error("✗ Error testing mutation:", error);
}

console.log("\nAll tests complete!");