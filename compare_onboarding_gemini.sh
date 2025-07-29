#!/bin/bash

# Create output file
OUTPUT_FILE="onboarding_comparison_gemini.txt"
echo "=== Onboarding Comparison Report ===" > "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Directory containing the reference screenshots
CORE_DIR="core_app_onboarding"

# Compare each onboarding screenshot
for i in {1..27}; do
    echo "Analyzing onboarding page $i..."
    echo "" >> "$OUTPUT_FILE"
    echo "=== Page $i ===" >> "$OUTPUT_FILE"
    
    # Use Gemini to analyze the screenshot and provide improvement suggestions
    gemini prompt "Analyze this onboarding screenshot and provide specific suggestions on how to improve it. Focus on: 1) Visual design and clarity, 2) Copy and messaging effectiveness, 3) User experience and flow, 4) Call-to-action effectiveness, 5) Overall engagement. Be specific and actionable." -i "$CORE_DIR/onboarding_$i.PNG" >> "$OUTPUT_FILE" 2>&1
    
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
done

echo "Comparison complete! Results saved to $OUTPUT_FILE"