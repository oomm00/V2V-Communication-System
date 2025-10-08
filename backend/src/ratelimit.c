#include "ratelimit.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#ifdef _WIN32
#include <windows.h>
#else
#include <pthread.h>
#endif

// Global rate limiter instance
rate_limiter_t g_rate_limiter = {0};

void ratelimit_init(void) {
    g_rate_limiter.entries = NULL;
    g_rate_limiter.count = 0;
    
#ifdef _WIN32
    InitializeCriticalSection(&g_rate_limiter.mutex);
#else
    if (pthread_mutex_init(&g_rate_limiter.mutex, NULL) != 0) {
        fprintf(stderr, "Failed to initialize rate limiter mutex\n");
        exit(1);
    }
#endif
    
    printf("Rate limiter initialized (max %d messages per %d seconds)\n", 
           MAX_PER_WINDOW, WINDOW_SECONDS);
}

int ratelimit_allow(const char *ephemeral_id) {
    if (!ephemeral_id) {
        return 0; // Invalid input
    }
    
    time_t now = time(NULL);
    
    // Lock the rate limiter
#ifdef _WIN32
    EnterCriticalSection(&g_rate_limiter.mutex);
#else
    if (pthread_mutex_lock(&g_rate_limiter.mutex) != 0) {
        fprintf(stderr, "Failed to lock rate limiter mutex\n");
        return 0;
    }
#endif
    
    // First, clean up inactive senders
    ratelimit_expire_inactive_senders();
    
    // Find existing entry for this sender
    rate_entry_t *entry = g_rate_limiter.entries;
    while (entry != NULL) {
        if (strcmp(entry->id, ephemeral_id) == 0) {
            break;
        }
        entry = entry->next;
    }
    
    // If no entry exists, create one
    if (entry == NULL) {
        entry = (rate_entry_t*)malloc(sizeof(rate_entry_t));
        if (!entry) {
#ifdef _WIN32
            LeaveCriticalSection(&g_rate_limiter.mutex);
#else
            pthread_mutex_unlock(&g_rate_limiter.mutex);
#endif
            fprintf(stderr, "Failed to allocate memory for rate limit entry\n");
            return 0;
        }
        
        strncpy(entry->id, ephemeral_id, sizeof(entry->id) - 1);
        entry->id[sizeof(entry->id) - 1] = '\0';
        entry->count = 0;
        memset(entry->timestamps, 0, sizeof(entry->timestamps));
        
        // Add to the beginning of the list
        entry->next = g_rate_limiter.entries;
        entry->prev = NULL;
        
        if (g_rate_limiter.entries != NULL) {
            g_rate_limiter.entries->prev = entry;
        }
        
        g_rate_limiter.entries = entry;
        g_rate_limiter.count++;
    }
    
    // Remove timestamps older than the window
    int valid_count = 0;
    for (int i = 0; i < MAX_PER_WINDOW; i++) {
        if (entry->timestamps[i] != 0 && 
            (now - entry->timestamps[i]) <= WINDOW_SECONDS) {
            // Keep this timestamp
            if (valid_count != i) {
                entry->timestamps[valid_count] = entry->timestamps[i];
                entry->timestamps[i] = 0;
            }
            valid_count++;
        } else {
            entry->timestamps[i] = 0;
        }
    }
    
    // Check if we're at the limit
    if (valid_count >= MAX_PER_WINDOW) {
#ifdef _WIN32
        LeaveCriticalSection(&g_rate_limiter.mutex);
#else
        pthread_mutex_unlock(&g_rate_limiter.mutex);
#endif
        return 0; // Rate limit exceeded
    }
    
    // Add current timestamp
    entry->timestamps[valid_count] = now;
    entry->count = valid_count + 1;
    
#ifdef _WIN32
    LeaveCriticalSection(&g_rate_limiter.mutex);
#else
    pthread_mutex_unlock(&g_rate_limiter.mutex);
#endif
    return 1; // Allowed
}

void ratelimit_expire_inactive_senders(void) {
    time_t now = time(NULL);
    rate_entry_t *current = g_rate_limiter.entries;
    
    while (current != NULL) {
        rate_entry_t *next = current->next;
        
        // Check if sender has been inactive for more than 2 windows
        int has_recent_activity = 0;
        for (int i = 0; i < MAX_PER_WINDOW; i++) {
            if (current->timestamps[i] != 0 && 
                (now - current->timestamps[i]) <= (WINDOW_SECONDS * 2)) {
                has_recent_activity = 1;
                break;
            }
        }
        
        if (!has_recent_activity) {
            // Remove inactive sender
            if (current->prev != NULL) {
                current->prev->next = current->next;
            } else {
                g_rate_limiter.entries = current->next;
            }
            
            if (current->next != NULL) {
                current->next->prev = current->prev;
            }
            
            g_rate_limiter.count--;
            free(current);
        }
        
        current = next;
    }
}

void ratelimit_cleanup(void) {
#ifdef _WIN32
    EnterCriticalSection(&g_rate_limiter.mutex);
#else
    if (pthread_mutex_lock(&g_rate_limiter.mutex) != 0) {
        fprintf(stderr, "Failed to lock rate limiter mutex for cleanup\n");
        return;
    }
#endif
    
    // Free all entries
    rate_entry_t *current = g_rate_limiter.entries;
    while (current != NULL) {
        rate_entry_t *next = current->next;
        free(current);
        current = next;
    }
    
    g_rate_limiter.entries = NULL;
    g_rate_limiter.count = 0;
    
#ifdef _WIN32
    LeaveCriticalSection(&g_rate_limiter.mutex);
    DeleteCriticalSection(&g_rate_limiter.mutex);
#else
    pthread_mutex_unlock(&g_rate_limiter.mutex);
    pthread_mutex_destroy(&g_rate_limiter.mutex);
#endif
    
    printf("Rate limiter cleaned up\n");
}
