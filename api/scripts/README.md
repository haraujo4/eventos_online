# API Scripts

This directory contains utility and migration scripts for the event platform.

## Migrations (`migrations/`)

Historical database migration scripts that have already been executed in production. These are kept for reference only and should NOT be run again.

- **`create_sessions_table.js`**: Creates the `session_logs` table for tracking user connection sessions
- **`migrate_polls.js`**: Adds `stream_id` column to `polls` table for multi-language poll support

## Utilities (`utilities/`)

Diagnostic and debugging scripts.

- **`check_db.js`**: Inspects `event_settings` table structure (useful for debugging schema issues)

## Usage

To run a utility script:
```bash
cd api
node scripts/utilities/check_db.js
```

**Note**: Migration scripts should never be re-run as they modify existing database structure.
