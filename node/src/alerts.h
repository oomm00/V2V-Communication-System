#ifndef ALERTS_H
#define ALERTS_H

#include <time.h>

#define ALERT_KEY_MAX 128
#define HAZARD_TYPE_MAX 32
#define CONFIRMERS_MAX 10
#define CONFIRMER_ID_MAX 64
#define ALERT_STATUS_MAX 16
#define ALERT_TTL 600  // seconds

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
    struct Alert *hh_next;              // uthash handle
    struct Alert *hh_prev;
    unsigned hh_hashv;
    struct Alert *hh_next_bucket;
    struct Alert *hh_prev_bucket;
} Alert;

void add_or_update_alert(const char *ephemeral_id, const char *hazard_type,
                         double lat, double lon, double confidence);

void promote_alert_if_threshold(Alert *alert);

void expire_old_alerts();

void print_alerts();

#endif // ALERTS_H