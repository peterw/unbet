// Script to open the onboarding screens and check visual accuracy
// Run this in the browser console after navigating to the app

const onboardingScreens = [
  { id: 1, type: 'welcome', ref: 'onboarding_1.PNG' },
  { id: 2, type: 'stats', ref: 'onboarding_2.PNG' },
  { id: 3, type: 'community', ref: 'onboarding_3.PNG' },
  { id: 4, type: 'healing', ref: 'onboarding_4.PNG' },
  { id: 5, type: 'life', ref: 'onboarding_5.PNG' },
  { id: 6, type: 'transform', ref: 'onboarding_6.PNG' },
  { id: 7, type: 'session_duration', ref: 'onboarding_7.PNG' },
  { id: 8, type: 'motivation_1', ref: 'onboarding_8.PNG' },
  { id: 9, type: 'motivation_2', ref: 'onboarding_9.PNG' },
  { id: 10, type: 'age_range', ref: 'onboarding_10.PNG' },
  { id: 11, type: 'start_age', ref: 'onboarding_11.PNG' },
  { id: 12, type: 'sexually_active_age', ref: 'onboarding_12.PNG' },
  { id: 13, type: 'porn_increase', ref: 'onboarding_13.PNG' },
  { id: 14, type: 'explicit_content', ref: 'onboarding_14.PNG' },
  { id: 15, type: 'blockers', ref: 'onboarding_15.PNG' },
  { id: 16, type: 'track', ref: 'onboarding_16.PNG' },
  { id: 17, type: 'religious', ref: 'onboarding_17.PNG' },
  { id: 18, type: 'last_relapse', ref: 'onboarding_18.PNG' },
  { id: 19, type: 'wakeup', ref: 'onboarding_19.PNG' },
  { id: 20, type: 'bedtime', ref: 'onboarding_20.PNG' },
  { id: 21, type: 'science', ref: 'onboarding_21.PNG' },
  { id: 22, type: 'days', ref: 'onboarding_22.PNG' },
  { id: 23, type: 'symptoms', ref: 'onboarding_23.PNG' },
  { id: 24, type: 'plan', ref: 'onboarding_24.PNG' },
  { id: 25, type: 'graph', ref: 'onboarding_25.PNG' },
  { id: 26, type: 'commitment', ref: 'onboarding_26.PNG' },
  { id: 27, type: 'notification', ref: 'onboarding_27.PNG' }
];

console.log(`
ONBOARDING VISUAL ACCURACY TEST
===============================

Testing the onboarding-2 screens against reference screenshots.
Navigate to http://localhost:8082/onboarding-2 to begin.

Total screens to test: ${onboardingScreens.length}
`);

console.log('To test each screen:');
console.log('1. Use the Continue/Next button to navigate through screens');
console.log('2. Compare each screen with the reference image');
console.log('3. Note any visual differences');