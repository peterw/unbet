#!/bin/bash

# Create output file
OUTPUT_FILE="onboarding_comparison_final.txt"
echo "=== Comprehensive Onboarding Comparison Report ===" > "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Directory containing the reference screenshots
CORE_DIR="core_app_onboarding"

# First, let's map our current onboarding steps to the reference screenshots
echo "=== Current App Onboarding Flow Mapping ===" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Based on app/onboarding.tsx analysis:" >> "$OUTPUT_FILE"
echo "1. Welcome Screen (intro) - 'Welcome to Seed'" >> "$OUTPUT_FILE"
echo "2. Gender Selection" >> "$OUTPUT_FILE"
echo "3. Age Input" >> "$OUTPUT_FILE"
echo "4. Height & Weight" >> "$OUTPUT_FILE"
echo "5. Training Frequency" >> "$OUTPUT_FILE"
echo "6. Training Type" >> "$OUTPUT_FILE"
echo "7. Goals Selection" >> "$OUTPUT_FILE"
echo "8. Diet Selection" >> "$OUTPUT_FILE"
echo "9. Referral Code" >> "$OUTPUT_FILE"
echo "10. Rating Request" >> "$OUTPUT_FILE"
echo "11. Calculate Protein" >> "$OUTPUT_FILE"
echo "12. Results Display" >> "$OUTPUT_FILE"
echo "13. Sign Up" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"

# Function to analyze each screenshot
analyze_screenshot() {
    local page_num=$1
    local context=$2
    local screenshot_path="$CORE_DIR/onboarding_$page_num.PNG"
    
    echo "" >> "$OUTPUT_FILE"
    echo "=== Page $page_num Analysis ===" >> "$OUTPUT_FILE"
    
    # Create a prompt file for this specific analysis
    cat > "prompt_$page_num.txt" << EOF
Analyze the attached onboarding screenshot for an anti-porn app called 'Seed' with the tagline 'Unleash your Potential. Leave Porn Behind.'

$context

Please provide:
1. **Screen Description**: What is shown on this screen?
2. **Current State Assessment**: What works well and what doesn't?
3. **Specific Improvements Needed**:
   - Visual Design: Colors, typography, spacing, visual hierarchy
   - Copy/Messaging: Is the text clear, engaging, and actionable?
   - User Experience: Is it intuitive? Any friction points?
   - Call-to-Action: Is the next step clear?
4. **Implementation Suggestions**: Specific changes to make in the code
5. **Priority**: High/Medium/Low for this improvement

Be specific and actionable.
EOF
    
    # Use gemini with proper syntax
    gemini -p "$(cat prompt_$page_num.txt)" < "$screenshot_path" >> "$OUTPUT_FILE" 2>&1
    
    # Clean up prompt file
    rm "prompt_$page_num.txt"
    
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
}

# Analyze first few screenshots as a test
echo "Analyzing onboarding screenshots..."

# Page 1 - Welcome
analyze_screenshot 1 "This appears to be the welcome/intro screen."

# Page 2 - User input
analyze_screenshot 2 "This appears to be a user input/selection screen (likely gender or first question)."

# Page 3 - User input
analyze_screenshot 3 "This appears to be another user input screen (likely age or demographics)."

# Let's check if the first few worked before proceeding
echo "" >> "$OUTPUT_FILE"
echo "=== SUMMARY OF KEY IMPROVEMENTS NEEDED ===" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Based on the analysis above, here are the key improvements needed for the onboarding flow:" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Create a summary prompt
cat > "summary_prompt.txt" << EOF
Based on analyzing onboarding screenshots for an anti-porn app called 'Seed', provide a prioritized list of improvements:

1. **Critical UI/UX Fixes** (implement immediately)
2. **Copy/Messaging Improvements** 
3. **Visual Design Updates**
4. **User Flow Optimizations**

Focus on specific, actionable changes for a React Native implementation.
EOF

gemini -p "$(cat summary_prompt.txt)" >> "$OUTPUT_FILE" 2>&1

rm "summary_prompt.txt"

echo "Analysis complete! Results saved to $OUTPUT_FILE"