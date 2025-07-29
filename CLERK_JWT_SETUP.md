# Clerk JWT Template Setup for Convex

## Error Fix: "No JWT template exists with name: convex"

This error occurs when Clerk cannot find a JWT template named "convex" that's required for authentication with your Convex backend.

## Steps to Fix:

### 1. Go to Clerk Dashboard
- Visit https://dashboard.clerk.com
- Select your application

### 2. Navigate to JWT Templates
- In the left sidebar, go to "JWT Templates"
- Click "New template"

### 3. Create the Convex JWT Template
Configure the template with these exact settings:

- **Name**: `convex` (must be exactly this)
- **Lifetime**: 60 seconds
- **Claims**: 
  ```json
  {
    "aud": "convex"
  }
  ```

### 4. Save the Template
Click "Save" to create the JWT template.

### 5. Update Environment Variables (if needed)
Make sure your `.env` file has:
```
CLERK_DOMAIN=your-clerk-domain.clerk.accounts.dev
```

### 6. Test the Fix
1. Restart your development server
2. Try signing up/in again
3. The error should be resolved

## Additional Notes
- The JWT template name MUST be exactly "convex" to match your auth.config.ts
- The template allows Clerk to generate tokens that Convex can validate
- This is a one-time setup per Clerk application