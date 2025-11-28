#ifndef ALERTS_H
#define ALERTS_H

#include <time.h>

#define ALERT_KEY_MAX 128
#define HAZARD_TYPE_MAX 32
#define CONFIRMERS_MAX 10
#define CONFIRMER_ID_MAX 64
#define ALERT_STATUS_MAX 16
#define ALERT_TTL 600  // seconds
#define ALERT_VERIFICATION_THRESHOLD 2  // require 2 confirmations to verify

typedef struct Alert {
    char alert_key[ALERT_KEY_MAX];      // rounded lat/lon + hazard_type
    double latitude;
    double longitude;
    char hazard_type[HAZARD_TYPE_MAX];
    double confidence;
    time_t first_seen;
    time_t last_seen;
    int confirmations;                  // unique valid nodes confirming this
    char confirmers[CONFIRMERS_MAX][CONFIRMER_ID_MAX]; // ephemeral IDs
    char status[ALERT_STATUS_MAX];      // "TENTATIVE" or "VERIFIED"
    struct Alert *next;                 // hash collision chain
} Alert;

// Hash map for alerts (keyed by alert_key)
typedef struct {
    Alert **buckets;
    size_t bucket_count;
#ifdef _WIN32
    void *mutex;  // CRITICAL_SECTION
#else
    pthread_mutex_t mutex;
#endif
} alerts_map_t;

// Global alerts map
extern alerts_map_t g_alerts_map;

// Function declarations
void alerts_map_init(void);
void alerts_map_cleanup(void);
void add_or_update_alert(const char *ephemeral_id, const char *hazard_type,
                         double lat, double lon, double confidence);
void promote_alert_if_threshold(Alert *alert);
void expire_old_alerts(void);
void print_alerts(void);

#endif // ALERTS_H

