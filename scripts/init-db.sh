#!/usr/bin/env bash
# ============================================================================
# MiniRoyal Database Initialization Script
# ============================================================================

set -e

DB_HOST="${MYSQL_HOST:-localhost}"
DB_PORT="${MYSQL_PORT:-3306}"
DB_USER="${MYSQL_USER:-root}"
DB_PASS="${MYSQL_PASSWORD:-}"
DB_NAME="${MYSQL_DATABASE:-miniroyal}"

echo "🚀 Initializing MiniRoyal database schema on $DB_HOST:$DB_PORT..."

if command -v mysql &> /dev/null; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" ${DB_PASS:+-p"$DB_PASS"} < docs/schema.sql
    echo "✅ Database schema applied successfully!"
else
    echo "⚠️ MySQL CLI not found. Schema files are ready at docs/schema.sql and migrations/001_initial.sql"
fi
