#!/bin/bash
# Haalt de geplande BFX Macro Overlay-taak weg (bestanden en login blijven staan).
LABEL="nl.bfx.tradingview-overlay"
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
rm -f "$HOME/Library/LaunchAgents/$LABEL.plist"
echo "Geplande taak verwijderd."
