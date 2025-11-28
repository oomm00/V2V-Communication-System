#ifndef DB_H
#define DB_H

#include <sqlite3.h>
#include <time.h>

// Database connection handle
extern sqlite3 *g_db;

// Structure matching the verified_alerts table
typedef struct {
    char alert_key[128];
    double latitude;
    double longitude;
    char hazard_type[32];
    double confidence;
    time_t first_seen;
    time_t verified_at;
    int confirmations;
    char confirmers_json[512];  // JSON array of confirming ephemeral IDs
    char raw_payload[2048];     // Original JSON message
} VerifiedAlert;

// Function declarations

/**
 * Initialize SQLite database connection
 * @param db_path Path to SQLite database file (creates if doesn't exist)
 * @return 0 on success, -1 on error
 */
int db_init(const char *db_path);

/**
 * Close database connection and free resources
 * @return 0 on success
 */
int db_close(void);

/**
 * Initialize tables from schema if they don't exist
 * @return 0 on success, -1 on error
 */
int db_init_schema(void);

/**
 * Insert a verified alert into the database
 * @param alert Pointer to VerifiedAlert structure
 * @return 0 on success, -1 on error
 */
int db_insert_verified_alert(const VerifiedAlert *alert);

/**
 * Log an audit event to the database
 * @param event_type Event type string (e.g., "alert_verified", "alert_expired")
 * @param payload JSON string with event metadata (can be NULL)
 * @param details Human-readable description
 * @return 0 on success, -1 on error
 */
int db_log_event(const char *event_type, const char *payload, const char *details);

/**
 * Query verified alerts from the database
 * @param since_timestamp Only return alerts verified after this timestamp
 * @param results Array to populate (caller allocates)
 * @param max_results Maximum number of results to return
 * @return Number of results populated, -1 on error
 */
int db_query_verified_alerts(time_t since_timestamp, VerifiedAlert *results, int max_results);

/**
 * Get database statistics
 * @param total_alerts Output parameter for total alert count
 * @param total_events Output parameter for total event count
 * @return 0 on success, -1 on error
 */
int db_get_stats(int *total_alerts, int *total_events);

#endif // DB_H

