#!/usr/bin/env bash
set -euo pipefail

BASE="http://127.0.0.1:8000"

# Create/apply local migrations before testing
python manage.py makemigrations accounts comments --noinput || true
python manage.py migrate --noinput

# Start dev server in background and clean it up at the end
python manage.py runserver 127.0.0.1:8000 &  # bind explicitly
SERVER_PID=$!
cleanup() { kill $SERVER_PID 2>/dev/null || true; }
trap cleanup EXIT

# Wait a moment for server to come up
sleep 2

echo "Testing routes..."
routes=(
  "/"
  "/games/pop-the-lock/"
  "/games/fly-swatter/"
  "/games/tutorial/pop-the-lock/"
  "/games/tutorial/fly-swatter/"
  "/games/leaderboard/pop-the-lock/"
  "/games/leaderboard/fly-swatter/"
  "/auth/request-magic/"
  "/auth/login/"
)
for r in "${routes[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$r" || true)
  printf "%-36s -> %s\n" "$r" "$code"
done

echo
echo "Note: POSTing a comment requires login, so it's not part of this smoke test."
