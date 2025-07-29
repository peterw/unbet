#!/bin/bash

# Create output file
OUTPUT_FILE="gemini_onboarding_comparison.txt"
echo "=== Gemini AI Onboarding Analysis ===" > "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Directory containing the reference screenshots
CORE_DIR="core_app_onboarding"

echo "Analyzing all 27 onboarding screenshots..."

# Analyze each screenshot
for i in {1..27}; do
    echo "Processing page $i..."
    echo "" >> "$OUTPUT_FILE"
    echo "=== PAGE $i ANALYSIS ===" >> "$OUTPUT_FILE"
    
    # Use gemini CLI with image support
    cat "$CORE_DIR/onboarding_$i.PNG" | gemini -p "Analyze this onboarding screenshot for an anti-porn app called 'Seed'. 

Context: This is page $i of 27 in the onboarding flow. The app tagline is 'Unleash your Potential. Leave Porn Behind.'

Please provide:
1. **Screen Description**: What exactly is shown on this screen?
2. **Visual Design Analysis**: 
   - Color scheme effectiveness
   - Typography and readability
   - Layout and spacing
   - Visual hierarchy
3. **Copy/Messaging Evaluation**:
   - Is the message clear and compelling?
   - Does it resonate with the target audience?
   - Tone appropriateness
4. **UX Assessment**:
   - Is the next action clear?
   - Any potential friction points?
   - Loading time considerations
5. **Specific Improvements**:
   - What should be changed?
   - How to implement in React Native?
   - Priority level (High/Medium/Low)

Compare this to best practices in onboarding flows and provide actionable recommendations." >> "$OUTPUT_FILE" 2>&1
    
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    
    # Small delay between requests
    sleep 1
done

# Create a comprehensive summary
echo "" >> "$OUTPUT_FILE"
echo "=== COMPREHENSIVE SUMMARY ===" >> "$OUTPUT_FILE"

gemini -p "Based on analyzing 27 onboarding screens for the 'Seed' anti-porn app, create a detailed implementation plan:

1. **Critical Issues to Fix** (Must fix before launch):
   - List the top 5-7 most important changes
   - Focus on conversion-killing issues

2. **Quick Wins** (Easy improvements with high impact):
   - List 5-7 changes that can be done quickly
   - Focus on copy, colors, or simple layout fixes

3. **Design System Recommendations**:
   - Optimal color palette
   - Typography guidelines
   - Spacing and layout principles
   - Component standardization

4. **User Flow Optimization**:
   - Which screens to combine or split
   - Optimal order of questions
   - Where to add progress indicators

5. **Engagement Boosters**:
   - Where to add social proof
   - Motivational elements placement
   - Community features introduction

6. **Technical Implementation Guide**:
   - React Native specific code examples
   - Animation recommendations
   - Performance optimizations

Please be extremely specific and actionable." >> "$OUTPUT_FILE" 2>&1

echo "Analysis complete! Results saved to $OUTPUT_FILE"