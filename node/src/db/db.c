#include "db.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>

// Global database connection
sqlite3 *g_db = NULL;

/**
 * Initialize SQLite database connection
 */
int db_init(const char *db_path) {
    if (g_db != NULL) {
        fprintf(stderr, "[db] Already initialized\n");
        return -1;
    }

    // Open or create database
    int rc = sqlite3_open(db_path, &g_db);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "[db] Cannot open database: %s\n", sqlite3_errmsg(g_db));
        sqlite3_close(g_db);
        g_db = NULL;
        return -1;
    }

    printf("[db] Database opened: %s\n", db_path);

    // Initialize schema
    if (db_init_schema() != 0) {
        fprintf(stderr, "[db] Failed to initialize schema\n");
        sqlite3_close(g_db);
        g_db = NULL;
        return -1;
    }

    printf("[db] Database initialized successfully\n");
    return 0;
}

/**
 * Close database connection
 */
int db_close(void) {
    if (g_db == NULL) {
        return 0;
    }

    sqlite3_close(g_db);
    g_db = NULL;
    printf("[db] Database closed\n");
    return 0;
}

/**
 * Initialize tables from schema
 */
int db_init_schema(void) {
    if (g_db == NULL) {
        fprintf(stderr, "[db] Database not initialized\n");
        return -1;
    }

    const char *schema_sql =
        "CREATE TABLE IF NOT EXISTS verified_alerts ("
        "    id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "    alert_key TEXT NOT NULL UNIQUE,"
        "    latitude REAL NOT NULL,"
        "    longitude REAL NOT NULL,"
        "    hazard_type TEXT NOT NULL,"
        "    confidence REAL NOT NULL,"
        "    first_seen INTEGER NOT NULL,"
        "    verified_at INTEGER NOT NULL,"
        "    confirmations INTEGER NOT NULL,"
        "    confirmers TEXT,"
        "    raw_payload TEXT"
        ");"
        "CREATE TABLE IF NOT EXISTS audit_log ("
        "    id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "    event_type TEXT NOT NULL,"
        "    timestamp INTEGER NOT NULL DEFAULT (strftime('%%s', 'now')),"
        "    payload TEXT,"
        "    details TEXT"
        ");"
        "CREATE INDEX IF NOT EXISTS idx_alert_key ON verified_alerts(alert_key);"
        "CREATE INDEX IF NOT EXISTS idx_verified_at ON verified_alerts(verified_at);"
        "CREATE INDEX IF NOT EXISTS idx_event_type ON audit_log(event_type);"
        "CREATE INDEX IF NOT EXISTS idx_timestamp ON audit_log(timestamp);";

    char *err_msg = NULL;
    int rc = sqlite3_exec(g_db, schema_sql, NULL, NULL, &err_msg);
    
    if (rc != SQLITE_OK) {
        fprintf(stderr, "[db] SQL error: %s\n", err_msg);
        sqlite3_free(err_msg);
        return -1;
    }

    printf("[db] Schema initialized\n");
    return 0;
}

/**
 * Insert a verified alert into the database
 */
int db_insert_verified_alert(const VerifiedAlert *alert) {
    if (g_db == NULL || alert == NULL) {
        fprintf(stderr, "[db] Database not initialized or invalid alert\n");
        return -1;
    }

    const char *sql = 
        "INSERT OR REPLACE INTO verified_alerts "
        "(alert_key, latitude, longitude, hazard_type, confidence, "
        " first_seen, verified_at, confirmations, confirmers, raw_payload) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL);
    
    if (rc != SQLITE_OK) {
        fprintf(stderr, "[db] Failed to prepare statement: %s\n", sqlite3_errmsg(g_db));
        return -1;
    }

    // Bind parameters
    sqlite3_bind_text(stmt, 1, alert->alert_key, -1, SQLITE_STATIC);
    sqlite3_bind_double(stmt, 2, alert->latitude);
    sqlite3_bind_double(stmt, 3, alert->longitude);
    sqlite3_bind_text(stmt, 4, alert->hazard_type, -1, SQLITE_STATIC);
    sqlite3_bind_double(stmt, 5, alert->confidence);
    sqlite3_bind_int64(stmt, 6, alert->first_seen);
    sqlite3_bind_int64(stmt, 7, alert->verified_at);
    sqlite3_bind_int(stmt, 8, alert->confirmations);
    sqlite3_bind_text(stmt, 9, alert->confirmers_json, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 10, alert->raw_payload, -1, SQLITE_STATIC);

    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        fprintf(stderr, "[db] Failed to insert alert: %s\n", sqlite3_errmsg(g_db));
        return -1;
    }

    printf("[db] Inserted verified alert: %s\n", alert->alert_key);
    return 0;
}

/**
 * Log an audit event to the database
 */
int db_log_event(const char *event_type, const char *payload, const char *details) {
    if (g_db == NULL || event_type == NULL) {
        fprintf(stderr, "[db] Database not initialized or invalid event\n");
        return -1;
    }

    const char *sql = 
        "INSERT INTO audit_log (event_type, timestamp, payload, details) "
        "VALUES (?, strftime('%%s', 'now'), ?, ?);";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL);
    
    if (rc != SQLITE_OK) {
        fprintf(stderr, "[db] Failed to prepare statement: %s\n", sqlite3_errmsg(g_db));
        return -1;
    }

    // Bind parameters
    sqlite3_bind_text(stmt, 1, event_type, -1, SQLITE_STATIC);
    
    if (payload) {
        sqlite3_bind_text(stmt, 2, payload, -1, SQLITE_STATIC);
    } else {
        sqlite3_bind_null(stmt, 2);
    }
    
    if (details) {
        sqlite3_bind_text(stmt, 3, details, -1, SQLITE_STATIC);
    } else {
        sqlite3_bind_null(stmt, 3);
    }

    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        fprintf(stderr, "[db] Failed to log event: %s\n", sqlite3_errmsg(g_db));
        return -1;
    }

    printf("[db] Logged event: %s\n", event_type);
    return 0;
}

/**
 * Query verified alerts from the database
 */
int db_query_verified_alerts(time_t since_timestamp, VerifiedAlert *results, int max_results) {
    if (g_db == NULL || results == NULL || max_results <= 0) {
        fprintf(stderr, "[db] Invalid parameters\n");
        return -1;
    }

    const char *sql = 
        "SELECT alert_key, latitude, longitude, hazard_type, confidence, "
        "       first_seen, verified_at, confirmations, confirmers, raw_payload "
        "FROM verified_alerts WHERE verified_at >= ? ORDER BY verified_at DESC LIMIT ?;";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL);
    
    if (rc != SQLITE_OK) {
        fprintf(stderr, "[db] Failed to prepare statement: %s\n", sqlite3_errmsg(g_db));
        return -1;
    }

    sqlite3_bind_int64(stmt, 1, since_timestamp);
    sqlite3_bind_int(stmt, 2, max_results);

    int count = 0;
    while ((rc = sqlite3_step(stmt)) == SQLITE_ROW && count < max_results) {
        VerifiedAlert *alert = &results[count];
        
        // Fetch data
        const char *alert_key = (const char *)sqlite3_column_text(stmt, 0);
        strncpy(alert->alert_key, alert_key, sizeof(alert->alert_key) - 1);
        alert->alert_key[sizeof(alert->alert_key) - 1] = '\0';
        
        alert->latitude = sqlite3_column_double(stmt, 1);
        alert->longitude = sqlite3_column_double(stmt, 2);
        
        const char *hazard_type = (const char *)sqlite3_column_text(stmt, 3);
        strncpy(alert->hazard_type, hazard_type, sizeof(alert->hazard_type) - 1);
        alert->hazard_type[sizeof(alert->hazard_type) - 1] = '\0';
        
        alert->confidence = sqlite3_column_double(stmt, 4);
        alert->first_seen = sqlite3_column_int64(stmt, 5);
        alert->verified_at = sqlite3_column_int64(stmt, 6);
        alert->confirmations = sqlite3_column_int(stmt, 7);
        
        const char *confirmers = (const char *)sqlite3_column_text(stmt, 8);
        if (confirmers) {
            strncpy(alert->confirmers_json, confirmers, sizeof(alert->confirmers_json) - 1);
            alert->confirmers_json[sizeof(alert->confirmers_json) - 1] = '\0';
        } else {
            alert->confirmers_json[0] = '\0';
        }
        
        const char *raw_payload = (const char *)sqlite3_column_text(stmt, 9);
        if (raw_payload) {
            strncpy(alert->raw_payload, raw_payload, sizeof(alert->raw_payload) - 1);
            alert->raw_payload[sizeof(alert->raw_payload) - 1] = '\0';
        } else {
            alert->raw_payload[0] = '\0';
        }
        
        count++;
    }

    sqlite3_finalize(stmt);
    
    if (rc != SQLITE_DONE && rc != SQLITE_ROW) {
        fprintf(stderr, "[db] Query error: %s\n", sqlite3_errmsg(g_db));
        return -1;
    }

    return count;
}

/**
 * Get database statistics
 */
int db_get_stats(int *total_alerts, int *total_events) {
    if (g_db == NULL || total_alerts == NULL || total_events == NULL) {
        return -1;
    }

    const char *sql = "SELECT COUNT(*) FROM verified_alerts;";
    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL);
    
    if (rc != SQLITE_OK) {
        return -1;
    }

    rc = sqlite3_step(stmt);
    if (rc == SQLITE_ROW) {
        *total_alerts = sqlite3_column_int(stmt, 0);
    }
    sqlite3_finalize(stmt);

    sql = "SELECT COUNT(*) FROM audit_log;";
    rc = sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL);
    
    if (rc != SQLITE_OK) {
        return -1;
    }

    rc = sqlite3_step(stmt);
    if (rc == SQLITE_ROW) {
        *total_events = sqlite3_column_int(stmt, 0);
    }
    sqlite3_finalize(stmt);

    return 0;
}

