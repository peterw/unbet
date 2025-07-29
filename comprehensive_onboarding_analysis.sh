#!/bin/bash

# Create output file
OUTPUT_FILE="comprehensive_onboarding_comparison.txt"
echo "=== Comprehensive Onboarding Comparison Report ===" > "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Directory containing the reference screenshots
CORE_DIR="core_app_onboarding"

# First, let's map our current onboarding steps to the reference screenshots
echo "=== Current App Onboarding Flow Mapping ===" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Based on app/onboarding.tsx analysis:" >> "$OUTPUT_FILE"
echo "1. Welcome Screen (intro)" >> "$OUTPUT_FILE"
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

# Compare each onboarding screenshot with specific context
for i in {1..27}; do
    echo "Analyzing onboarding page $i..."
    echo "" >> "$OUTPUT_FILE"
    echo "=== Page $i Analysis ===" >> "$OUTPUT_FILE"
    
    # Provide context-aware prompts based on the page number
    case $i in
        1)
            CONTEXT="This appears to be the welcome/intro screen."
            ;;
        2|3|4|5|6|7)
            CONTEXT="This appears to be a user input/selection screen."
            ;;
        8|9|10|11|12|13|14|15|16|17|18|19|20)
            CONTEXT="This appears to be part of the main onboarding flow."
            ;;
        21|22|23|24|25|26|27)
            CONTEXT="This appears to be near the end of the onboarding flow."
            ;;
        *)
            CONTEXT="This is part of the onboarding flow."
            ;;
    esac
    
    # Use Gemini to analyze the screenshot with context
    gemini prompt "Analyze this onboarding screenshot. $CONTEXT 

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

Be specific and actionable. Consider this is an anti-porn/gambling app called 'Seed' with the tagline 'Unleash your Potential. Leave Porn Behind.'" -i "$CORE_DIR/onboarding_$i.PNG" >> "$OUTPUT_FILE" 2>&1
    
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    
    # Add a small delay to avoid rate limiting
    sleep 2
done

# Add summary section
echo "" >> "$OUTPUT_FILE"
echo "=== IMPLEMENTATION SUMMARY ===" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Use Gemini to create a summary
gemini prompt "Based on the analysis of 27 onboarding screens for an anti-porn app called 'Seed', create a prioritized implementation plan with:

1. **Critical Changes** (implement immediately):
   - List the most important UI/UX improvements
   - Focus on conversion killers

2. **High Priority Changes** (implement this week):
   - Important improvements for user engagement
   - Quick wins that significantly improve experience

3. **Medium Priority Changes** (implement within 2 weeks):
   - Nice-to-have improvements
   - Polish and refinements

4. **Design System Recommendations**:
   - Color palette suggestions
   - Typography guidelines
   - Component standardization

5. **Copy/Messaging Guidelines**:
   - Tone of voice recommendations
   - Key messaging points to emphasize

Please be specific and actionable for a React Native app implementation." >> "$OUTPUT_FILE" 2>&1

echo "Comprehensive analysis complete! Results saved to $OUTPUT_FILE"