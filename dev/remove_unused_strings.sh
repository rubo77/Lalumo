#!/bin/bash

# Script to identify unused strings in the Roboyard codebase
# Usage: bash remove_unused_strings.sh [--list-all] [--verbose]

# Path to the English strings.xml
EN_STRINGS_FILE="/var/www/Roboyard/app/src/main/res/values/strings.xml"
SOURCE_DIR="/var/www/Roboyard"

# Parse command line arguments
LIST_ALL=false
VERBOSE=false

for arg in "$@"; do
  case $arg in
    --list-all)
      LIST_ALL=true
      ;;
    --verbose)
      VERBOSE=true
      ;;
  esac
done

echo "Analyzing strings usage in Roboyard codebase..."
echo ""

# Create temp directory for results
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

# Extract all string names from strings.xml
echo "Extracting string names from $EN_STRINGS_FILE..."
grep -o 'name="[^"]*"' "$EN_STRINGS_FILE" | sed 's/name="//;s/"$//' | sort > "$TMP_DIR/all_strings.txt"
TOTAL_STRINGS=$(wc -l < "$TMP_DIR/all_strings.txt")
echo "Found $TOTAL_STRINGS strings in strings.xml"

# Get list of all Java and XML files (excluding values/strings.xml files)
find "$SOURCE_DIR" -name "*.java" -o -name "*.xml" | grep -v "/values.*/strings\.xml" > "$TMP_DIR/source_files.txt"
TOTAL_FILES=$(wc -l < "$TMP_DIR/source_files.txt")
echo "Searching through $TOTAL_FILES source files..."

# Initialize counters
USED_COUNT=0
UNUSED_COUNT=0

echo "Checking each string for usage..."
echo ""

# Create output files
USED_STRINGS_FILE="$TMP_DIR/used_strings.txt"
UNUSED_STRINGS_FILE="$TMP_DIR/unused_strings.txt"

> "$UNUSED_STRINGS_FILE" # Empty unused strings file
> "$USED_STRINGS_FILE"   # Empty used strings file

# Progress bar variables
PROGRESS_WIDTH=50
COUNT=0

while read -r string; do
  # Update progress
  COUNT=$((COUNT + 1))
  PERCENT=$((COUNT * 100 / TOTAL_STRINGS))
  FILLED_WIDTH=$((PERCENT * PROGRESS_WIDTH / 100))
  EMPTY_WIDTH=$((PROGRESS_WIDTH - FILLED_WIDTH))
  
  # Print progress bar if not in verbose mode
  if [ "$VERBOSE" = false ]; then
    BAR=$(printf "[%-${FILLED_WIDTH}s%-${EMPTY_WIDTH}s] %d%%" "$(printf '#%.0s' $(seq 1 $FILLED_WIDTH))" "$(printf ' %.0s' $(seq 1 $EMPTY_WIDTH))" "$PERCENT")
    printf "\r%s" "$BAR"
  fi
  
  # Actual search - check if string is referenced anywhere
  FOUND=false
  
  # Special case for some strings that are referenced by convention, not by explicit R.string.x
  # These include app_name, etc.
  if [[ "$string" == "app_name" || "$string" == "app_version" ]]; then
    echo "$string" >> "$USED_STRINGS_FILE"
    USED_COUNT=$((USED_COUNT + 1))
    continue
  fi
  
  # Check for usage patterns: R.string.$string, @string/$string, getString($string)
  if grep -q "R\.string\.${string}\|@string/${string}\|getString(.*${string}" --include="*.java" --include="*.xml" -r "$SOURCE_DIR"; then
    FOUND=true
    echo "$string" >> "$USED_STRINGS_FILE"
    USED_COUNT=$((USED_COUNT + 1))
    
    if [ "$VERBOSE" = true ]; then
      echo "[USED] $string"
    fi
  else
    echo "$string" >> "$UNUSED_STRINGS_FILE"
    UNUSED_COUNT=$((UNUSED_COUNT + 1))
    
    if [ "$VERBOSE" = true ]; then
      echo "[UNUSED] $string"
    fi
  fi
done < "$TMP_DIR/all_strings.txt"

# Clear the progress line
echo ""

# Summary
echo "\nAnalysis complete!"
echo "===================="
echo "Total strings: $TOTAL_STRINGS"
echo "Used strings: $USED_COUNT"
echo "Potentially unused strings: $UNUSED_COUNT"

# Display list of unused strings
echo "\nPotentially unused strings:"
echo "===================="
cat "$UNUSED_STRINGS_FILE"

# Save results to current directory
if [ "$UNUSED_COUNT" -gt 0 ]; then
  cp "$UNUSED_STRINGS_FILE" "./unused_strings.txt"
  echo "\nList of unused strings saved to ./unused_strings.txt"
fi

echo "\nNote: This is a basic analysis. Strings might be used dynamically or in ways this script cannot detect."
echo "Always verify manually before removing any string resources."
