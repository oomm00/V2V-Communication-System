#ifndef REPLAY_H
#define REPLAY_H

#include <stdint.h>
#include <time.h>
#ifdef _WIN32
#include <windows.h>
#else
#include <pthread.h>
#endif

// Replay cache configuration
#define REPLAY_CACHE_TTL 600  // 10 minutes in seconds

// Replay cache entry structure
typedef struct replay_entry {
    char ephemeral_id[64];
    uint64_t seq;
    time_t timestamp;
    struct replay_entry *next;
    struct replay_entry *prev;
} replay_entry_t;

// Replay cache structure
typedef struct {
    replay_entry_t *entries;
#ifdef _WIN32
    CRITICAL_SECTION mutex;
#else
    pthread_mutex_t mutex;
#endif
    size_t count;
} replay_cache_t;

// Global replay cache instance
extern replay_cache_t g_replay_cache;

// Function declarations
void replay_cache_init(void);
int replay_cache_check_and_add(const char *ephemeral_id, uint64_t seq);
void replay_cache_cleanup(void);
void replay_cache_expire_old_entries(void);

#endif // REPLAY_H
