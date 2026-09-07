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
    MYSQL_ARGS=(-h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER")
    if [ -n "$DB_PASS" ]; then MYSQL_ARGS+=(-p"$DB_PASS"); fi

    mysql "${MYSQL_ARGS[@]}" < docs/schema.sql
    for migration in migrations/*.sql; do
        [ -f "$migration" ] || continue
        case "$migration" in
            migrations/001_initial.sql) continue ;;
        esac
        echo "Applying $migration ..."
        mysql "${MYSQL_ARGS[@]}" < "$migration"
    done
    echo "✅ Database schema and versioned migrations applied successfully!"
else
    echo "⚠️ MySQL CLI not found. Schema files are ready at docs/schema.sql and migrations/"
fi
