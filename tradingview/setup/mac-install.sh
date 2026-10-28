#!/bin/bash
# Installeert de BFX Macro Overlay-automatisering op macOS.
#   ./setup/mac-install.sh                    werkdagen, standaard na de BIAS-verversing (05:13 NL)
#   ./setup/mac-install.sh --time 11:30       eigen tijd (lokale tijd van deze Mac)
#   ./setup/mac-install.sh --weekly           zondag 18:15
# Standaardtijd: 05:45 Nederlandse tijd omgerekend naar de tijdzone van deze Mac (bv. 11:45 in Thailand).
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

WEEKLY=0; TIME=""
while [ $# -gt 0 ]; do
  case "$1" in
    --weekly) WEEKLY=1 ;;
    --time) TIME="${2:-}"; shift ;;
  esac
  shift
done

if [ -z "$TIME" ]; then
  # 05:45 Amsterdam-tijd (na de BIAS-verversing van 05:13) in de lokale tijd van deze Mac
  TIME="$(python3 -c 'from datetime import datetime,timedelta;from zoneinfo import ZoneInfo as Z;n=datetime.now(Z("Europe/Amsterdam"));t=n.replace(hour=5,minute=45,second=0,microsecond=0);print(t.astimezone().strftime("%H:%M"))' 2>/dev/null || true)"
  if [ -z "$TIME" ]; then
    TIME="06:00"
    echo "⚠️ Kon de tijdzone niet omrekenen (python3 ontbreekt). Ingepland op 06:00 lokale tijd; gebruik --time HH:MM als dat vóór 05:13 NL valt."
  fi
fi
HOUR=$((10#${TIME%%:*})); MIN=$((10#${TIME##*:}))

if [ "$WEEKLY" = 1 ]; then
  SCHEDULE='<dict><key>Weekday</key><integer>0</integer><key>Hour</key><integer>18</integer><key>Minute</key><integer>15</integer></dict>'
  WHEN="zondag 18:15"
else
  # ma–vr lokaal. Klopt voor tijdzones gelijk aan of oostelijk van NL (bv. Thailand): 05:45 NL valt dan op dezelfde dag.
  SCHEDULE=""
  for d in 1 2 3 4 5; do
    SCHEDULE="$SCHEDULE<dict><key>Weekday</key><integer>$d</integer><key>Hour</key><integer>$HOUR</integer><key>Minute</key><integer>$MIN</integer></dict>"
  done
  WHEN="werkdagen $(printf '%02d:%02d' $HOUR $MIN) (lokale tijd)"
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
