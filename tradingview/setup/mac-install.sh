#!/bin/bash
# Installeert de BFX Macro Overlay-automatisering op macOS.
#   ./setup/mac-install.sh            werkdagen 06:00 (na de BIAS-verversing van 05:13)
#   ./setup/mac-install.sh --weekly   zondag 18:15
# Draait het script niet omdat de Mac sliep, dan voert launchd het uit zodra de Mac wakker wordt.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="nl.bfx.tradingview-overlay"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

cd "$DIR"

NODE="$(command -v node || true)"
if [ -z "$NODE" ]; then
  echo "Node.js ontbreekt. Installeer via https://nodejs.org (LTS) en draai dit script opnieuw."
  exit 1
fi
echo "Node: $NODE ($("$NODE" --version))"

echo "→ Packages installeren"
npm install --no-fund --no-audit
npx playwright install chromium

if [ ! -f .env ]; then
  cp .env.example .env
  echo "→ .env aangemaakt. Vul BIAS_SUPABASE_KEY (en optioneel SUPABASE_URL/KEY, TELEGRAM_*) in: open -e \"$DIR/.env\""
fi

if [ "${1:-}" = "--weekly" ]; then
  SCHEDULE='<dict><key>Weekday</key><integer>0</integer><key>Hour</key><integer>18</integer><key>Minute</key><integer>15</integer></dict>'
  WHEN="zondag 18:15"
else
  SCHEDULE=""
  for d in 1 2 3 4 5; do
    SCHEDULE="$SCHEDULE<dict><key>Weekday</key><integer>$d</integer><key>Hour</key><integer>6</integer><key>Minute</key><integer>0</integer></dict>"
  done
  WHEN="werkdagen 06:00"
fi

mkdir -p "$DIR/logs" "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>$NODE</string><string>$DIR/bfx-tv.mjs</string><string>run</string></array>
  <key>WorkingDirectory</key><string>$DIR</string>
  <key>StartCalendarInterval</key><array>$SCHEDULE</array>
  <key>StandardOutPath</key><string>$DIR/logs/run.log</string>
  <key>StandardErrorPath</key><string>$DIR/logs/run.log</string>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>$(dirname "$NODE"):/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string></dict>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo
echo "✅ Ingepland: $WHEN  (logboek: $DIR/logs/run.log)"
echo
echo "Nog doen (eenmalig):"
echo "  1. Vul .env in:                 open -e \"$DIR/.env\""
echo "  2. Log in bij TradingView:      node bfx-tv.mjs login"
echo "     → open daarin een chart → Pine Editor → maak het script 'BFX Macro Overlay' (zie README)"
echo "  3. Test nu één keer:            node bfx-tv.mjs run"
echo
echo "Uitzetten: ./setup/mac-uninstall.sh"
