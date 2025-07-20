Protein Tracker App Implementation Guide
1. Application Overview
The Protein Tracker is a cross-platform mobile application built with React Native and Expo, leveraging TypeScript for type safety. The app allows users to:

Capture photos of their meals using the device camera.
Use AI-powered analysis to estimate the protein content of meals from photos.
Manually log protein intake.
View a bar chart of daily protein intake over time.
Authenticate and manage users with Clerk.
Store and retrieve data using Convex for backend, database, and API routes.

3. Core Functionalities and Implementation Guide
3.1 Authentication with Clerk
Files: AuthScreen.tsx, ClerkService.ts
Implement ClerkService.ts:

Initialize Clerk in your app.
Implement methods for user authentication (sign-up, sign-in, sign-out).
Use Clerk's React Native SDK to handle authentication flows.
Implement AuthScreen.tsx:

Create a screen that utilizes Clerk's pre-built components for authentication.
Handle authentication states and navigate to the main app upon successful login.
3.2 Home Screen Navigation
Files: HomeScreen.tsx, AppNavigator.tsx
Implement HomeScreen.tsx:

Display options for:
Taking a photo of a meal.
Manually entering protein intake.
Viewing protein intake history.
Use buttons or icons for navigation to respective screens.
Implement AppNavigator.tsx:

Use Expo Router to manage navigation.
Set up a stack or tab navigator to handle screen transitions.
3.3 Capturing Meal Photos
Files: CameraScreen.tsx, CameraComponent.tsx
Implement CameraComponent.tsx:

Use Expo's Camera module (expo-camera) to access the device camera.
Handle camera permissions and display a camera preview.
Include a capture button to take photos.
Implement CameraScreen.tsx:

Integrate CameraComponent.
Handle the captured image and navigate to the image review screen.
3.4 Image Review and Bounding Box Selection
Files: ImageReviewScreen.tsx, BoundingBoxOverlay.tsx, ImageUtils.ts
Implement ImageReviewScreen.tsx:

Display the captured image.
Allow users to adjust a bounding box over the meal using draggable corner points.
Include confirmation and cancel buttons.
Implement BoundingBoxOverlay.tsx:

Create an overlay component with draggable corner points (e.g., 16px dots).
Handle user interactions to adjust the bounding box.
Implement ImageUtils.ts:

Crop the image based on the bounding box coordinates.
Optimize the image for API submission (resize, compress).
3.5 AI-Powered Protein Estimation
Files: ProteinEstimationScreen.tsx, OpenAIService.ts
Implement OpenAIService.ts:

Use Axios or Fetch API to send HTTP requests to OpenAI.
Implement a method to send the cropped image to GPT-4.
Ensure you use the GPT-4 model as specified.
Implement ProteinEstimationScreen.tsx:

Display a loading indicator while waiting for the AI response.
Show the estimated protein amount.
Allow users to confirm or adjust the protein amount before saving.
3.6 Manual Protein Entry
Files: ManualEntryScreen.tsx, ProteinEntryForm.tsx
Implement ProteinEntryForm.tsx:

Create a form component with fields for protein amount and date.
Include validation for input fields.
Implement ManualEntryScreen.tsx:

Use ProteinEntryForm to allow users to manually log protein intake.
Handle form submission and save data to the backend.
3.7 Viewing Protein Intake History
Files: HistoryScreen.tsx, ProteinChart.tsx, ChartUtils.ts
Implement ProteinChart.tsx:

Use a charting library like react-native-chart-kit to display a bar chart.
Show protein intake over time.
Implement ChartUtils.ts:

Process data for chart rendering.
Format dates and protein amounts appropriately.
Implement HistoryScreen.tsx:

Display the protein chart.
Provide options to view detailed logs or edit entries.
3.8 Backend Integration with Convex
Files: ConvexService.ts, Convex Functions (addProteinEntry.ts, getProteinEntries.ts, deleteProteinEntry.ts), schema.ts
Implement ConvexService.ts:

Initialize Convex client.
Implement methods to call Convex functions.
Define schema.ts:

Set up the database schema for protein entries.
Include fields like userId, date, proteinAmount, and entryMethod.
Implement Convex Functions:

addProteinEntry.ts: Function to add a new protein entry.
getProteinEntries.ts: Function to retrieve user's protein entries.
deleteProteinEntry.ts: Function to delete a protein entry.
3.9 Global State Management
Files: ProteinContext.tsx
Implement ProteinContext.tsx:
Use React Context API to manage global state.
Provide state for protein entries, user info, and settings.
Wrap the app with ProteinContext.Provider in App.tsx.
4. Additional Implementation Notes
TypeScript:

Use TypeScript throughout the app for type safety.
Define interfaces for props, states, and data models.
Expo Router:

Utilize Expo Router for seamless navigation.
Organize screens in the app/ directory according to Expo Router conventions.
MVVM Architecture:

Separate business logic from UI components.
Use services for API calls and data manipulation.
Asynchronous Operations:

Use async/await for handling asynchronous code.
Manage loading states and handle exceptions.
Error Handling:

Provide user feedback for errors (e.g., toast notifications).
Implement try-catch blocks for API calls.
Data Persistence:

Ensure data is synced between the frontend and Convex backend.
Handle offline scenarios gracefully.
User Experience:

Follow design guidelines for React Native apps.
Ensure the UI is responsive and accessible.
Memory Management:

Optimize image sizes to prevent memory leaks.
Use useEffect cleanup functions where necessary.
Thread Management:

Ensure all UI updates occur on the main thread.
Use background threads for intensive tasks like image processing.
5. OpenAI API Integration
When integrating with the OpenAI API, follow these guidelines:

API Requests:

Always set the model parameter to "gpt-4" in your API requests.
Use the chat completions endpoint: https://api.openai.com/v1/chat/completions.
Image Handling:

Encode images to base64 before sending.
Include the encoded image in the user message content.
Prompt Structure:

Provide clear instructions in the prompt to guide the AI.
Example API Request in OpenAIService.ts:

typescript
Copy code
import axios from 'axios';

export const estimateProteinContent = async (base64Image: string): Promise<number> => {
  const apiKey = process.env.OPENAI_API_KEY;

  const messages = [
    {
      role: 'user',
      content: `Estimate the total protein content (in grams) of the meal shown in this image. Only provide a numerical value.

      Image data: data:image/jpeg;base64,${base64Image}
      `,
    },
  ];

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const content = response.data.choices[0].message.content;
  const proteinAmount = parseFloat(content);
  return proteinAmount;
};
API Key Management:
Store the API key securely using environment variables.
Do not commit API keys to version control.
6. Key Considerations
Performance:

Optimize images before sending to reduce payload size.
Use React Native's Image component's caching mechanisms.
Error Handling:

Handle network errors and API rate limits.
Provide fallback options if the AI estimation fails.
Accessibility:

Ensure all interactive elements are accessible via screen readers.
Use appropriate accessibility labels.
Testing:

Write unit tests for components and services.
Use testing libraries like Jest and React Native Testing Library.
Privacy:

Be transparent about data collection and usage.
Provide a privacy policy within the app.
Scalability:

Design the app to accommodate future features (e.g., tracking other nutrients).
Use modular code to make maintenance easier.
Security:

Secure user data both in transit and at rest.
Use HTTPS for all network requests.
User Feedback:

Provide feedback during long operations (e.g., loading indicators).
Confirm actions like data deletion.
Localization:

Consider supporting multiple languages.
Use localization libraries if necessary.
Compliance:

Ensure compliance with relevant regulations (e.g., GDPR).
7. Expo and React Native Specific Notes
Expo Modules:

Use Expo's built-in modules when possible for easier maintenance.
Keep the Expo SDK up to date.
Cross-Platform Compatibility:

Test the app on both iOS and Android devices.
Handle platform-specific differences in permissions and UI.
Push Notifications:

Consider adding reminders for users to log their protein intake.
Use Expo's Notifications module.
8. Summary
By following this implementation guide, developers can build a robust and user-friendly Protein Tracker app. The app combines AI-powered protein estimation with manual logging to help users monitor their daily protein intake effectively. Utilizing React Native with Expo, Convex for the backend, and Clerk for authentication ensures a modern and scalable tech stack.