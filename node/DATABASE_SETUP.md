# SQLite Database Setup for V2V System

## 📁 What Was Created

### 1. Database Schema (`node/db/schema.sql`)
SQL schema defining two tables:
- **`verified_alerts`** - Stores alerts that reached VERIFIED status
- **`audit_log`** - Event logging for system activity

### 2. Database Module (`node/src/db/`)
- **`db.h`** - Header with function declarations
- **`db.c`** - SQLite implementation with these functions:
  - `db_init()` - Initialize database connection
  - `db_insert_verified_alert()` - Save verified alert
  - `db_log_event()` - Log system events
  - `db_query_verified_alerts()` - Query recent alerts
  - `db_get_stats()` - Get database statistics
  - `db_close()` - Close connection

### 3. Integration Example (`node/src/core/`)
- **`alerts_integration_example.c`** - Shows how to call database from alerts system
- **`alerts_integration.h`** - Integration interface

### 4. Updated Makefile
Now includes `db/db.c` and links against `-lsqlite3`

## 🚀 How to Use

### Initialize Database in Your Code

```c
#include "db/db.h"

int main() {
    // Initialize database
    if (db_init("v2v_alerts.db") != 0) {
        return 1;
    }
    
    // ... your code ...
    
    db_close();
}
```

### When Alert Becomes VERIFIED

```c
#include "core/alerts_integration.h"

void promote_alert_if_threshold(Alert *alert) {
    if (alert->confirmations >= 2) {
        strcpy(alert->status, "VERIFIED");
        
        // Persist to database
        persist_verified_alert(alert);
    }
}
```

### Log Events

```c
// Log when alert is verified
db_log_event("alert_verified", NULL, 
             "Alert verified with 3 confirmations");

// Log when alert expires
db_log_event("alert_expired", NULL, 
             "Alert TTL exceeded");
```

## 🔧 Compilation

```bash
cd node/src
make
```

**Requirements:**
- SQLite3 library (`libsqlite3-dev` on Linux, or include `sqlite3.h` on Windows)
- Update `LDFLAGS` in Makefile if SQLite is in a different location

## 📊 Example Database Queries

```sql
-- Get all verified alerts in the last hour
SELECT * FROM verified_alerts 
WHERE verified_at > (strftime('%s', 'now', '-1 hour'))
ORDER BY verified_at DESC;

-- Count alerts by hazard type
SELECT hazard_type, COUNT(*) as count 
FROM verified_alerts 
GROUP BY hazard_type;

-- Get recent audit events
SELECT * FROM audit_log 
WHERE event_type = 'alert_verified' 
ORDER BY timestamp DESC 
LIMIT 10;
```

## 🔗 Integration Points

1. **Alert Promotion**: Call `persist_verified_alert()` when alert reaches VERIFIED
2. **Alert Expiry**: Call `log_alert_expired()` when alert TTL expires
3. **System Start**: Call `init_alerts_database()` at startup
4. **System Shutdown**: Call `cleanup_alerts_database()` on exit

See `node/src/core/alerts_integration_example.c` for complete example.

## ✅ Summary

- ✅ Schema created in `node/db/schema.sql`
- ✅ Database wrapper `db.c` and `db.h`
- ✅ Makefile updated to compile with SQLite
- ✅ Integration example provided
- ✅ Ready to use in alerts.c

The database will be created at `node/src/v2v_alerts.db` when first accessed.

