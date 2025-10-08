#ifndef RATELIMIT_H
#define RATELIMIT_H

#include <stdint.h>
#include <time.h>
#ifdef _WIN32
#include <windows.h>
#else
#include <pthread.h>
#endif

// Rate limiting configuration
#define MAX_PER_WINDOW 6      // Maximum messages per window
#define WINDOW_SECONDS 10      // Window size in seconds

// Rate limit entry structure
typedef struct rate_entry {
    char id[64];
    time_t timestamps[MAX_PER_WINDOW];
    int count;
    struct rate_entry *next;
    struct rate_entry *prev;
} rate_entry_t;

// Rate limiter structure
typedef struct {
    rate_entry_t *entries;
#ifdef _WIN32
    CRITICAL_SECTION mutex;
#else
    pthread_mutex_t mutex;
#endif
    size_t count;
} rate_limiter_t;

// Global rate limiter instance
extern rate_limiter_t g_rate_limiter;

// Function declarations
void ratelimit_init(void);
int ratelimit_allow(const char *ephemeral_id);
void ratelimit_cleanup(void);
void ratelimit_expire_inactive_senders(void);

#endif // RATELIMIT_H
