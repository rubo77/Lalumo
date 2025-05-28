#!/bin/bash
# run.sh - script to kill existing servers, build and start new

echo "Stopping any running webpack servers..."
# Kill processes on port 9091 (current webpack port)
fuser -k 9091/tcp 2>/dev/null || echo "No process running on port 9091"

# Also try to kill by process name in case port changed
pkill -f 'webpack.*serve' 2>/dev/null || echo "No webpack process found"

echo "Starting webpack development server..."
# Starte webpack-Server im Hintergrund
cd /var/www/Musici && npm run watch &

# Warte kurz, damit der Server starten kann
sleep 2

echo "
Application should be available at: http://localhost:9091"
echo "If the browser doesn't open automatically, please visit the URL manually."

# Frage nach dem Mobile-Update im Vordergrund
echo "
Do you also want to update the mobile app? (Y/n)"
# -n 1 liest nur ein Zeichen ein, -r verhindert Escape-Interpretation
read -n 1 -r update_mobile
echo ""  # Neue Zeile nach der Eingabe

# Akzeptiere Enter, Y oder y
if [[ "$update_mobile" == "" || "$update_mobile" == "y" || "$update_mobile" == "Y" ]]; then
    echo "Starting mobile app update..."
    ./mobile-build.sh update
else
    echo "Mobile app update skipped."
fi
