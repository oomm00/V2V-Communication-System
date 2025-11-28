#ifndef ALERTS_INTEGRATION_H
#define ALERTS_INTEGRATION_H

#include "alerts.h"

/**
 * Persist a verified alert to the database
 * Call this when an alert status changes to VERIFIED
 */
void persist_verified_alert(const Alert *alert);

/**
 * Log an expired alert event
 * Call this when an alert is removed due to TTL expiry
 */
void log_alert_expired(const Alert *alert);

/**
 * Initialize database connection for alerts
 * Call this during system startup
 */
void init_alerts_database(void);

/**
 * Cleanup database connection
 * Call this during system shutdown
 */
void cleanup_alerts_database(void);

#endif // ALERTS_INTEGRATION_H

