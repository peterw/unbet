#!/bin/bash

# Create comparison report
echo "ONBOARDING COMPARISON ANALYSIS" > onboarding_comparison_report.txt
echo "Generated on: $(date)" >> onboarding_comparison_report.txt
echo "================================" >> onboarding_comparison_report.txt
echo "" >> onboarding_comparison_report.txt

# Loop through all 27 onboarding screenshots
for i in {1..27}; do
    echo "" >> onboarding_comparison_report.txt
    echo "=== ONBOARDING SCREEN $i ===" >> onboarding_comparison_report.txt
    echo "" >> onboarding_comparison_report.txt
    
    # Analyze the screenshot
    gemini -p "Analyze this onboarding screenshot at core_app_onboarding/onboarding_${i}.PNG and provide:
    1. Screen Purpose: What is the main goal of this screen?
    2. Key UI Elements: List the main components (buttons, text fields, images, etc.)
    3. Text Content: What text/messaging is shown?
    4. Visual Design: Describe colors, layout, and style
    5. User Actions: What can the user do on this screen?
    6. Improvement Suggestions: Based on modern UI/UX principles, what could be improved?
    
    Be specific and actionable in your suggestions." >> onboarding_comparison_report.txt 2>&1
    
    echo "" >> onboarding_comparison_report.txt
    echo "---" >> onboarding_comparison_report.txt
done

echo "" >> onboarding_comparison_report.txt
echo "=== OVERALL RECOMMENDATIONS ===" >> onboarding_comparison_report.txt
echo "" >> onboarding_comparison_report.txt

# Final analysis
gemini -p "Based on analyzing all 27 onboarding screens in core_app_onboarding/, provide:
1. Overall flow assessment
2. Consistency issues across screens
3. Top 5 priority improvements
4. Implementation recommendations for React Native
5. Accessibility considerations

Focus on actionable items that can improve user experience and onboarding completion rates." >> onboarding_comparison_report.txt 2>&1

echo "Comparison complete! Results saved to onboarding_comparison_report.txt"