-- V2V SQLite Database Schema
-- This schema stores verified alerts and audit logs for the V2V system

CREATE TABLE IF NOT EXISTS verified_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_key TEXT NOT NULL UNIQUE,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    hazard_type TEXT NOT NULL,
    confidence REAL NOT NULL,
    first_seen INTEGER DEFAULT (strftime('%s', 'now')),  -- auto timestamp
    verified_at INTEGER NOT NULL,           -- Unix timestamp when marked VERIFIED
    confirmations INTEGER NOT NULL,
    confirmers TEXT,                        -- JSON array of ephemeral IDs
    raw_payload TEXT                        -- Original JSON message
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,               -- e.g., 'alert_verified', 'alert_expired', 'system_start'
    timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    payload TEXT,                           -- JSON metadata
    details TEXT                             -- Human-readable description
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_alert_key ON verified_alerts(alert_key);
CREATE INDEX IF NOT EXISTS idx_verified_at ON verified_alerts(verified_at);
CREATE INDEX IF NOT EXISTS idx_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_timestamp ON audit_log(timestamp);

-- Example queries for reference:
-- SELECT * FROM verified_alerts WHERE verified_at > (strftime('%s', 'now', '-1 hour'));
-- SELECT * FROM audit_log WHERE event_type = 'alert_verified' ORDER BY timestamp DESC LIMIT 10;

