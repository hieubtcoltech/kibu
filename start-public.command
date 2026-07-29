#!/bin/bash
# =========================================================
#  Bấm đúp file này để mở SÂN CHƠI GAME ra internet.
#  Nó bật server + tạo địa chỉ public https cho các con dùng.
#  Muốn dừng: nhấn Ctrl + C trong cửa sổ này.
# =========================================================

cd "$(dirname "$0")" || exit 1

PORT="${1:-8080}"
LOG="$(mktemp -t playground-tunnel)"
SERVER_PID=""

cleanup() {
  echo ""
  echo "🧹 Đang dọn dẹp..."
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null
  rm -f "$LOG"
  echo "👋 Đã tắt. Địa chỉ public không còn dùng được nữa."
  exit 0
}
trap cleanup INT TERM

clear
echo "🎮  SÂN CHƠI GAME CHO BÉ — chia sẻ ra internet"
echo "────────────────────────────────────────────────────────"

# --- Kiểm tra công cụ ---
if ! command -v node >/dev/null 2>&1; then
  echo "✖ Chưa cài Node.js. Tải tại https://nodejs.org"
  read -r -p "Nhấn Enter để đóng..."
  exit 1
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "✖ Chưa cài cloudflared. Chạy lệnh sau rồi mở lại file này:"
  echo ""
  echo "      brew install cloudflared"
  echo ""
  read -r -p "Nhấn Enter để đóng..."
  exit 1
fi

# --- 1. Bật server tĩnh ---
echo "⚙️  Đang bật máy chủ ở cổng $PORT..."
node server.js "$PORT" > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2

if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "✖ Máy chủ không bật được. Có thể cổng $PORT đang bận."
  echo "  Thử lại với cổng khác:  ./start-public.command 8090"
  read -r -p "Nhấn Enter để đóng..."
  exit 1
fi
echo "✅ Máy chủ đã chạy (trong nhà: http://localhost:$PORT)"

# --- 2. Mở đường hầm ra internet ---
echo "🌍 Đang xin địa chỉ public từ Cloudflare (khoảng 10 giây)..."
cloudflared tunnel --url "http://localhost:$PORT" --no-autoupdate > "$LOG" 2>&1 &
TUNNEL_PID=$!

PUBLIC_URL=""
for _ in $(seq 1 40); do
  PUBLIC_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1)
  [ -n "$PUBLIC_URL" ] && break
  kill -0 "$TUNNEL_PID" 2>/dev/null || break
  sleep 1
done

if [ -z "$PUBLIC_URL" ]; then
  echo "✖ Không lấy được địa chỉ public. Kiểm tra lại kết nối mạng."
  echo "  Chi tiết lỗi:"
  tail -5 "$LOG"
  kill "$SERVER_PID" 2>/dev/null
  read -r -p "Nhấn Enter để đóng..."
  exit 1
fi

# --- 3. Khoe địa chỉ ---
echo "$PUBLIC_URL" > .public-url.txt

clear
echo ""
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║   ✨  ĐỊA CHỈ CHO CÁC CON  ✨                        ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo ""
echo "     🌍  $PUBLIC_URL"
echo ""
echo "     🎓  Vào thẳng bài tiếng Anh:"
echo "         $PUBLIC_URL/english"
echo ""
echo "  ────────────────────────────────────────────────────────"
echo "     🏠  Ở nhà (nhanh hơn):  http://localhost:$PORT"
echo "     📋  Địa chỉ đã lưu vào file .public-url.txt"
echo ""
echo "     ⚠️  Giữ nguyên cửa sổ này. Đóng cửa sổ = tắt địa chỉ."
echo "     ⏹  Nhấn Ctrl + C để dừng."
echo ""

# Copy địa chỉ vào clipboard cho tiện gửi Zalo/tin nhắn
if command -v pbcopy >/dev/null 2>&1; then
  printf '%s' "$PUBLIC_URL" | pbcopy
  echo "     📎  Đã copy địa chỉ vào clipboard — dán thẳng vào Zalo được luôn!"
  echo ""
fi

wait "$TUNNEL_PID"
cleanup
