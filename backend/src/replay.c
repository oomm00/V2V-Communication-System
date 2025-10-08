#include "replay.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#ifdef _WIN32
#include <windows.h>
#else
#include <pthread.h>
#endif

// Global replay cache instance
replay_cache_t g_replay_cache = {0};

void replay_cache_init(void) {
    g_replay_cache.entries = NULL;
    g_replay_cache.count = 0;
    
#ifdef _WIN32
    InitializeCriticalSection(&g_replay_cache.mutex);
#else
    if (pthread_mutex_init(&g_replay_cache.mutex, NULL) != 0) {
        fprintf(stderr, "Failed to initialize replay cache mutex\n");
        exit(1);
    }
#endif
    
    printf("Replay cache initialized\n");
}

int replay_cache_check_and_add(const char *ephemeral_id, uint64_t seq) {
    if (!ephemeral_id) {
        return 0; // Invalid input
    }
    
    time_t now = time(NULL);
    
    // Lock the cache
#ifdef _WIN32
    EnterCriticalSection(&g_replay_cache.mutex);
#else
    if (pthread_mutex_lock(&g_replay_cache.mutex) != 0) {
        fprintf(stderr, "Failed to lock replay cache mutex\n");
        return 0;
    }
#endif
    
    // First, clean up expired entries
    replay_cache_expire_old_entries();
    
    // Check if this (ephemeral_id, seq) combination already exists
    replay_entry_t *current = g_replay_cache.entries;
    while (current != NULL) {
        if (strcmp(current->ephemeral_id, ephemeral_id) == 0 && 
            current->seq == seq) {
            // Duplicate found - reject
#ifdef _WIN32
            LeaveCriticalSection(&g_replay_cache.mutex);
#else
            pthread_mutex_unlock(&g_replay_cache.mutex);
#endif
            return 0;
        }
        current = current->next;
    }
    
    // Not a duplicate - add new entry
    replay_entry_t *new_entry = (replay_entry_t*)malloc(sizeof(replay_entry_t));
    if (!new_entry) {
#ifdef _WIN32
        LeaveCriticalSection(&g_replay_cache.mutex);
#else
        pthread_mutex_unlock(&g_replay_cache.mutex);
#endif
        fprintf(stderr, "Failed to allocate memory for replay entry\n");
        return 0;
    }
    
    strncpy(new_entry->ephemeral_id, ephemeral_id, sizeof(new_entry->ephemeral_id) - 1);
    new_entry->ephemeral_id[sizeof(new_entry->ephemeral_id) - 1] = '\0';
    new_entry->seq = seq;
    new_entry->timestamp = now;
    
    // Add to the beginning of the list
    new_entry->next = g_replay_cache.entries;
    new_entry->prev = NULL;
    
    if (g_replay_cache.entries != NULL) {
        g_replay_cache.entries->prev = new_entry;
    }
    
    g_replay_cache.entries = new_entry;
    g_replay_cache.count++;
    
#ifdef _WIN32
    LeaveCriticalSection(&g_replay_cache.mutex);
#else
    pthread_mutex_unlock(&g_replay_cache.mutex);
#endif
    return 1; // Accepted
}

void replay_cache_expire_old_entries(void) {
    time_t now = time(NULL);
    replay_entry_t *current = g_replay_cache.entries;
    
    while (current != NULL) {
        replay_entry_t *next = current->next;
        
        // Check if entry is expired
        if (now - current->timestamp > REPLAY_CACHE_TTL) {
            // Remove from list
            if (current->prev != NULL) {
                current->prev->next = current->next;
            } else {
                g_replay_cache.entries = current->next;
            }
            
            if (current->next != NULL) {
                current->next->prev = current->prev;
            }
            
            g_replay_cache.count--;
            free(current);
        }
        
        current = next;
    }
}

void replay_cache_cleanup(void) {
#ifdef _WIN32
    EnterCriticalSection(&g_replay_cache.mutex);
#else
    if (pthread_mutex_lock(&g_replay_cache.mutex) != 0) {
        fprintf(stderr, "Failed to lock replay cache mutex for cleanup\n");
        return;
    }
#endif
    
    // Free all entries
    replay_entry_t *current = g_replay_cache.entries;
    while (current != NULL) {
        replay_entry_t *next = current->next;
        free(current);
        current = next;
    }
    
    g_replay_cache.entries = NULL;
    g_replay_cache.count = 0;
    
#ifdef _WIN32
    LeaveCriticalSection(&g_replay_cache.mutex);
    DeleteCriticalSection(&g_replay_cache.mutex);
#else
    pthread_mutex_unlock(&g_replay_cache.mutex);
    pthread_mutex_destroy(&g_replay_cache.mutex);
#endif
    
    printf("Replay cache cleaned up\n");
}
