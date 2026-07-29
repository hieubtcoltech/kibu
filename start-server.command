#!/bin/bash
# Bấm đúp vào file này để bật máy chủ game (macOS).
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "✖ Chưa cài Node.js. Hãy tải tại https://nodejs.org rồi mở lại file này."
  read -r -p "Nhấn Enter để đóng..."
  exit 1
fi

clear
node server.js
