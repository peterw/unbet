# Protein AI - iOS Calorie & Protein Tracking App

An AI-powered iOS application for tracking protein intake and analyzing food nutrition using computer vision and natural language processing.

## 🏗️ Architecture Overview

### Technology Stack

**Frontend:**
- **React Native** with **Expo** (SDK 52) - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **Expo Router** (v4) - File-based routing system
- **React Native Reanimated** - Smooth animations
- **Gorhom Bottom Sheet** - Modal interactions

**Backend & Data:**
- **Convex** - Real-time backend as a service
- **OpenAI API** (GPT-4o) - AI-powered food analysis
- **Clerk** - Authentication and user management

**Analytics & Monetization:**
- **RevenueCat** - Subscription management
- **Mixpanel** - User analytics
- **Adjust** - Mobile attribution
- **Facebook SDK** - Social integration
- **Superwall** - Paywall optimization

## 📁 Project Structure

```
/app/                   # Main application screens
  /(main)/             # Authenticated screens
    index.tsx          # Home - Daily protein tracking
    camera.tsx         # Food scanning via camera
    describe.tsx       # Text-based food input
    analysis.tsx       # Analytics dashboard
    settings.tsx       # User preferences
    entry/[id].tsx     # Food entry details
  _layout.tsx          # Root layout with providers
  onboarding.tsx       # New user flow

/components/           # Reusable UI components
  /home/              # Home screen components
  /protein/           # Protein tracking components
  /navigation/        # Navigation components

/convex/              # Backend functions
  schema.ts           # Database schema
  protein.ts          # CRUD operations
  analyse.ts          # AI analysis
  users.ts            # User management
  auth.config.ts      # Auth configuration

/providers/           # App-wide context providers
/utils/              # Utility functions
/types/              # TypeScript definitions
/constants/          # App constants
/assets/             # Images, fonts, animations
```

## 🔄 Application Flows

### 1. User Onboarding Flow
- **Intro carousel** → Personal data collection → Protein goal calculation → Subscription options → Account creation
- Collects: Gender, age, height, weight, training frequency/type, fitness goals, diet preferences
- Calculates personalized daily protein target based on user profile

### 2. Food Tracking - Camera Flow
1. Camera permission request
2. Photo capture or gallery selection
3. Image upload to Convex storage
4. AI analysis (GPT-4o) for:
   - Food identification
   - Protein content estimation
   - Calorie calculation
   - Amino acid profile
5. Automatic entry creation

### 3. Food Tracking - Text Flow
1. User describes meal in text
2. AI analysis of description
3. Same nutritional data extraction as camera flow
4. Entry creation with results

### 4. Analytics Dashboard
- Time range selection (7 days, 4 weeks, 1 year)
- Line chart visualization with goal overlay
- Statistics: average, highest, lowest intake
- Progress tracking against daily goals

### 5. Entry Management
- **Manual editing**: Modify ingredients, weights, protein percentages
- **AI fixing**: Natural language corrections (e.g., "Add 50g of chicken")
- **Save foods**: Bookmark frequently eaten items for quick access
- Real-time total recalculation

### 6. Saved Foods System
- Save any analyzed food as template
- Quick add from floating menu
- Organized list management
- One-tap addition to daily intake

## 🗄️ Database Schema

- **users**: User profiles with fitness goals and preferences
- **proteinEntries**: Daily food intake records
- **savedFoods**: User's favorite foods for quick access
- **imageAnalysisJobs**: Async AI processing queue
- **fixJobs**: AI-powered entry corrections

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator or physical device
- Convex account
- OpenAI API key
- Clerk account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/peterw/cal-ios-app.git
cd cal-ios-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```
CONVEX_DEPLOYMENT=your_deployment
CLERK_PUBLISHABLE_KEY=your_key
```

4. Start the development server:
```bash
npx expo start
```

5. Run on iOS:
- Press `i` to open iOS simulator
- Or scan QR code with Expo Go app

## 🐛 Known Critical Bugs

### 1. **Date Timezone Issue** 
- **Location**: Throughout the app (protein.ts, index.tsx)
- **Issue**: Dates stored with 'Z' suffix but displayed without proper timezone handling
- **Impact**: Entries may appear on wrong days for users in different timezones
- **Fix needed**: Consistent timezone handling across storage and display

### 2. **Memory Leak in Camera Component**
- **Location**: `/app/(main)/camera.tsx`
- **Issue**: Camera stream not properly disposed on unmount
- **Impact**: App performance degrades after multiple camera uses
- **Fix needed**: Add cleanup in useEffect return

### 3. **Race Condition in AI Analysis**
- **Location**: `/convex/analyse.ts`
- **Issue**: Multiple simultaneous analysis jobs can overwrite each other
- **Impact**: Wrong food data assigned to entries
- **Fix needed**: Implement proper job queuing and locking

### 4. **Subscription State Sync**
- **Location**: `/providers/RevenueCatProvider.tsx`
- **Issue**: Subscription status not always synced with backend
- **Impact**: Users may lose access despite active subscription
- **Fix needed**: Add retry logic and backend verification

### 5. **Saved Foods Duplication**
- **Location**: `/convex/protein.ts` - `saveFood` function
- **Issue**: No duplicate checking when saving foods
- **Impact**: Same food saved multiple times clutters the list
- **Fix needed**: Check for existing saved foods before creating

### 6. **Missing Error Boundaries**
- **Location**: App-wide
- **Issue**: No error boundaries to catch component crashes
- **Impact**: Entire app crashes on component errors
- **Fix needed**: Add error boundaries at strategic points

### 7. **API Key Exposure Risk**
- **Location**: `/convex/analyse.ts`
- **Issue**: OpenAI API key handling in client-visible code
- **Impact**: Potential security vulnerability
- **Fix needed**: Move to secure server environment variable

### 8. **Infinite Loop in Analytics**
- **Location**: `/app/(main)/analysis.tsx`
- **Issue**: useEffect dependency array missing causing re-renders
- **Impact**: Performance issues and potential crashes
- **Fix needed**: Proper dependency management

## 🔒 Security Considerations

- API keys should be stored securely in environment variables
- User data is encrypted in transit via HTTPS
- Authentication handled by Clerk with OAuth providers
- Implement rate limiting for AI analysis endpoints
- Add input validation for user-generated content

## 📱 Features

- ✅ AI-powered food recognition from photos
- ✅ Natural language food description analysis
- ✅ Personalized protein goal calculation
- ✅ Daily/weekly/yearly analytics
- ✅ Saved foods for quick tracking
- ✅ AI-powered entry corrections
- ✅ Amino acid profile tracking
- ✅ Social sharing capabilities
- ✅ Subscription management
- ✅ Referral system

## 🤝 Contributing

Please read our contributing guidelines before submitting pull requests.

## 📄 License

This project is proprietary software. All rights reserved.