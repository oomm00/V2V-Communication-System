# Database Module

This module provides SQLite persistence for the V2V system, storing verified alerts and audit logs.

## Files

- `db.h` - Header file with function declarations and structures
- `db.c` - Implementation of database operations
- `../core/alerts_integration_example.c` - Example showing how to integrate with alerts system
- `../../db/schema.sql` - SQL schema for tables

## Database Schema

### `verified_alerts` Table
Stores alerts that have been promoted to VERIFIED status (received 2+ confirmations).

- `alert_key` - Unique identifier (rounded lat/lon + hazard_type)
- `latitude`, `longitude` - GPS coordinates
- `hazard_type` - Type of hazard (e.g., "ice_patch", "debris")
- `confidence` - Confidence score (0.0 to 1.0)
- `first_seen` - Unix timestamp of first occurrence
- `verified_at` - Unix timestamp when alert became VERIFIED
- `confirmations` - Number of unique nodes that confirmed
- `confirmers` - JSON array of ephemeral IDs
- `raw_payload` - Original message JSON

### `audit_log` Table
Stores system events for auditing.

- `event_type` - Type of event (e.g., "alert_verified", "alert_expired", "system_start")
- `timestamp` - Unix timestamp
- `payload` - Optional JSON metadata
- `details` - Human-readable description

## Usage

### 1. Initialize Database

```c
#include "db.h"

int main() {
    // Initialize database connection
    if (db_init("v2v_alerts.db") != 0) {
        fprintf(stderr, "Failed to initialize database\n");
        return 1;
    }
    
    // ... rest of your code ...
    
    // Cleanup
    db_close();
    return 0;
}
```

### 2. Insert Verified Alert

```c
VerifiedAlert alert = {
    .alert_key = "road_block@30.3165,78.0322",
    .latitude = 30.3165,
    .longitude = 78.0322,
    .hazard_type = "road_block",
    .confidence = 0.95,
    .first_seen = 1698765432,
    .verified_at = 1698765445,
    .confirmations = 3,
    .confirmers_json = "[\"car1\",\"car2\",\"car3\"]",
    .raw_payload = "{\"type\":\"road_block\",...}"
};

db_insert_verified_alert(&alert);
```

### 3. Log Audit Event

```c
db_log_event("alert_verified", NULL, 
             "Alert 'road_block@30.3165,78.0322' verified with 3 confirmations");
```

### 4. Query Recent Alerts

```c
VerifiedAlert results[10];
time_t since = time(NULL) - 3600;  // Last hour
int count = db_query_verified_alerts(since, results, 10);

for (int i = 0; i < count; i++) {
    printf("Alert: %s\n", results[i].alert_key);
}
```

## Compilation

The Makefile has been updated to include `db.c`:

```bash
cd node/src
make
```

Requirements:
- SQLite3 development library
- On Windows: `mingw-w64` or use the included `sqlite3.h`

## Integration with Alerts System

See `../core/alerts_integration_example.c` for a complete example of how to call the database functions from the alerts system.

The key integration points:
1. **On alert promotion to VERIFIED**: Call `persist_verified_alert()`
2. **On alert expiry**: Call `log_alert_expired()`
3. **On system start**: Call `init_alerts_database()`
4. **On system shutdown**: Call `cleanup_alerts_database()`

## Database Location

By default, the database file is created at `node/src/v2v_alerts.db`.

You can change this by passing a different path to `db_init()`.

## Indexes

The schema creates indexes on:
- `verified_alerts.alert_key` - For lookups
- `verified_alerts.verified_at` - For time-based queries
- `audit_log.event_type` - For filtering by event type
- `audit_log.timestamp` - For chronological queries

