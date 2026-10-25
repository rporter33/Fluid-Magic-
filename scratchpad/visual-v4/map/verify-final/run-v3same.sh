cd "$(dirname "$0")"
for a in "q 1440 900 1 1500" "switch 1440 900 1 1500" "q 1440 780 1 1500" "switch 1440 780 1 1500" "q 1280 720 1 1500" "q 1920 1080 1 1500" "q 1440 900 0 2500"; do node v3same.cjs $a 2>&1 | tail -2; done
