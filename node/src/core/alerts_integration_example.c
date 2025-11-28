/**
 * Example integration of alerts.c with SQLite database
 * This shows how to persist verified alerts and log events
 */

#include "../db/db.h"
#include "alerts.h"
#include <string.h>
#include <stdio.h>

/**
 * Convert an Alert structure to VerifiedAlert for database insertion
 */
static void alert_to_verified(const Alert *alert, VerifiedAlert *verified) {
    strncpy(verified->alert_key, alert->alert_key, sizeof(verified->alert_key) - 1);
    verified->alert_key[sizeof(verified->alert_key) - 1] = '\0';
    
    verified->latitude = alert->latitude;
    verified->longitude = alert->longitude;
    
    strncpy(verified->hazard_type, alert->hazard_type, sizeof(verified->hazard_type) - 1);
    verified->hazard_type[sizeof(verified->hazard_type) - 1] = '\0';
    
    verified->confidence = alert->confidence;
    verified->first_seen = alert->first_seen;
    verified->verified_at = alert->last_seen;
    verified->confirmations = alert->confirmations;
    
    // Convert confirmers array to JSON
    strcpy(verified->confirmers_json, "[");
    for (int i = 0; i < alert->confirmations && i < 10; i++) {
        if (i > 0) strcat(verified->confirmers_json, ",");
        strcat(verified->confirmers_json, "\"");
        strcat(verified->confirmers_json, alert->confirmers[i]);
        strcat(verified->confirmers_json, "\"");
    }
    strcat(verified->confirmers_json, "]");
    
    // Generate raw_payload JSON (mock for now)
    snprintf(verified->raw_payload, sizeof(verified->raw_payload),
             "{\"alert_key\":\"%s\",\"type\":\"%s\",\"lat\":%.4f,\"lng\":%.4f,\"confidence\":%.2f}",
             alert->alert_key, alert->hazard_type, alert->latitude, alert->longitude, alert->confidence);
}

/**
 * Call this when an alert becomes VERIFIED
 * Called from promote_alert_if_threshold() in alerts.c
 */
void persist_verified_alert(const Alert *alert) {
    if (alert == NULL || strcmp(alert->status, "VERIFIED") != 0) {
        return;
    }
    
    VerifiedAlert verified;
    alert_to_verified(alert, &verified);
    
    // Insert into database
    if (db_insert_verified_alert(&verified) == 0) {
        // Log the event
        char details[256];
        snprintf(details, sizeof(details), "Alert '%s' verified with %d confirmations",
                 alert->alert_key, alert->confirmations);
        
        db_log_event("alert_verified", NULL, details);
        printf("[alerts] Persisted verified alert: %s\n", alert->alert_key);
    } else {
        fprintf(stderr, "[alerts] Failed to persist alert: %s\n", alert->alert_key);
    }
}

/**
 * Call this when alerts are expired
 * Called from expire_old_alerts() in alerts.c
 */
void log_alert_expired(const Alert *alert) {
    if (alert == NULL) {
        return;
    }
    
    char details[256];
    snprintf(details, sizeof(details), "Alert '%s' expired after %ld seconds",
             alert->alert_key, time(NULL) - alert->first_seen);
    
    db_log_event("alert_expired", NULL, details);
}

/**
 * Initialize database connection during system startup
 */
void init_alerts_database(void) {
    const char *db_path = "v2v_alerts.db";
    
    if (db_init(db_path) != 0) {
        fprintf(stderr, "[alerts] Failed to initialize database\n");
        return;
    }
    
    printf("[alerts] Database ready for persistence\n");
}

/**
 * Cleanup database connection on shutdown
 */
void cleanup_alerts_database(void) {
    db_close();
    printf("[alerts] Database connection closed\n");
}

