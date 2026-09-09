#!/usr/bin/env bash
# Runs all functional test phases for /api/ai-tryon against a local dev server.
set -u
cd "$(dirname "$0")/../.."

MOCK_LOG=/tmp/mock.log
DEV_LOG=/tmp/dev.log
ALL_OK=1

start_mock() {
  pkill -f mock-ai-provider.mjs 2>/dev/null
  sleep 0.5
  nohup node scripts/test/mock-ai-provider.mjs > "$MOCK_LOG" 2>&1 &
  sleep 1.5
}

run_phase() {
  local phase="$1"; shift
  local env_content="$1"
  echo "$env_content" > .env.local
  pkill -f "next dev" 2>/dev/null; pkill -f "next-server" 2>/dev/null
  sleep 1
  rm -f "$DEV_LOG"
  NODE_OPTIONS=--max-old-space-size=640 nohup npx next dev -p 3000 > "$DEV_LOG" 2>&1 &
  for i in $(seq 1 90); do grep -q "Ready in" "$DEV_LOG" 2>/dev/null && break; sleep 2; done
  sleep 2
  node scripts/test/run-tryon-tests.mjs "$phase" || ALL_OK=0
}

start_mock

run_phase A "AUTH_SESSION_SECRET=test-session-secret
TRYON_ADMIN_PHONES=09120000000"

run_phase B "AUTH_SESSION_SECRET=test-session-secret
TRYON_ADMIN_PHONES=09120000000
POLLINATIONS_API_KEY=test-key
TRYON_API_URL=http://127.0.0.1:9911/edits"

run_phase C "AUTH_SESSION_SECRET=test-session-secret
TRYON_ADMIN_PHONES=09120000000
AIHUBMIX_API_KEY=test-key
AIHUBMIX_TRYON_URL=http://127.0.0.1:9911/native"

run_phase D "AUTH_SESSION_SECRET=test-session-secret
TRYON_ADMIN_PHONES=09120000000
POLLINATIONS_API_KEY=test-key
TRYON_API_URL=http://127.0.0.1:9911/edits
TRYON_MODEL=tongyi-mai/z-image-turbo"

pkill -f "next dev" 2>/dev/null; pkill -f "next-server" 2>/dev/null; pkill -f mock-ai-provider.mjs 2>/dev/null
rm -f .env.local
if [ "$ALL_OK" -eq 0 ]; then echo "❌ برخی تست‌ها شکست خوردند"; exit 1; fi
echo "✅ همهٔ فازها پاس شدند"
