#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <time.h>
#ifdef _WIN32
#include <windows.h>
#else
#include <pthread.h>
#endif
#ifndef _WIN32
#include <arpa/inet.h>
#include <netinet/in.h>
#endif

#ifndef INET_ADDRSTRLEN
#define INET_ADDRSTRLEN 16
#endif

#include "net.h"
#include "jsonmsg.h"
#include "crypto.h"
#include "replay.h"
#include "ratelimit.h"

// Forward declarations
static int parse_json_fields(const char* json, char* ephemeral_id, uint64_t* seq);
static int parse_ip_port(const char* s, char* out_ip, int* out_port);

typedef struct {
	int sockfd;
	// Add other fields as needed, e.g. peer_ip, peer_port
	char peer_ip[64];
	int peer_port;
} app_config_t;

#ifdef _WIN32
DWORD WINAPI recv_thread(LPVOID arg) {
	app_config_t* cfg = (app_config_t*)arg;
	char buf[2048];
	struct sockaddr_in src;
	for (;;) {
		int n = udp_recv(cfg->sockfd, buf, sizeof(buf) - 1, &src);
		if (n > 0) {
			buf[n] = '\0';
			char ipstr[INET_ADDRSTRLEN];
			inet_ntop(AF_INET, &src.sin_addr, ipstr, sizeof(ipstr));
			
			// Print received JSON message
			printf("RECEIVED from %s:%d -> %s\n", ipstr, ntohs(src.sin_port), buf);
			
			// Extract ephemeral_id and seq from JSON
			char ephemeral_id[64] = {0};
			uint64_t seq = 0;
			
			if (!parse_json_fields(buf, ephemeral_id, &seq)) {
				printf("❌ Invalid JSON format - missing ephemeral_id or seq\n");
				fflush(stdout);
				continue;
			}
			
			// Check for replay attacks
			if (!replay_cache_check_and_add(ephemeral_id, seq)) {
				printf("⛔ Replay detected from %s (ephemeral_id: %s, seq: %llu)\n", 
				       ipstr, ephemeral_id, (unsigned long long)seq);
				fflush(stdout);
				continue;
			}
			
			// Check rate limiting
			if (!ratelimit_allow(ephemeral_id)) {
				printf("🚫 Rate limit exceeded from %s (ephemeral_id: %s)\n", 
				       ipstr, ephemeral_id);
				fflush(stdout);
				continue;
			}
			
			// Verify signature (stub implementation always succeeds)
			int verify_result = verify_message("peer_pub.pem", buf, NULL, 0);
			if (verify_result == 0) {
				printf("SIGNATURE VERIFICATION: VALID ✓\n");
			} else {
				printf("SIGNATURE VERIFICATION: INVALID ✗\n");
			}
			fflush(stdout);
		}
	}
	return 0;
}

DWORD WINAPI send_thread(LPVOID arg) {
	app_config_t* cfg = (app_config_t*)arg;
	static uint64_t seq = 0;
	
	for (;;) {
		// Generate hazard report JSON message
		char* json_msg = build_canonical_hazard_json(
			"hazard_report",
			"node_001",
			++seq,
			(uint64_t)time(NULL),
			40.7128, -74.0060,  // NYC coordinates
			65.5, 180.0,        // speed and heading
			"ice_patch",
			0.95,
			300
		);
		
		if (json_msg) {
			printf("SENDING: %s\n", json_msg);
			
			// Sign the message
			unsigned char* sig = NULL;
			size_t sig_len = 0;
			int sign_result = sign_message("node_priv.pem", json_msg, &sig, &sig_len);
			
			if (sign_result == 0) {
				printf("MESSAGE SIGNED ✓\n");
				if (sig) free(sig);
			} else {
				printf("SIGNING FAILED ✗\n");
			}
			
			udp_send(cfg->sockfd, cfg->peer_ip, cfg->peer_port, json_msg);
			free(json_msg);
		}
		Sleep(3000);
	}
	return 0;
}
#else
void* recv_thread(void* arg) {
	app_config_t* cfg = (app_config_t*)arg;
	char buf[2048];
	struct sockaddr_in src;
	for (;;) {
		int n = udp_recv(cfg->sockfd, buf, sizeof(buf), &src);
		if (n > 0) {
			char ipstr[INET_ADDRSTRLEN];
			inet_ntop(AF_INET, &src.sin_addr, ipstr, sizeof(ipstr));
			
			// Print received JSON message
			printf("RECEIVED from %s:%d -> %s\n", ipstr, ntohs(src.sin_port), buf);
			
			// Extract ephemeral_id and seq from JSON
			char ephemeral_id[64] = {0};
			uint64_t seq = 0;
			
			if (!parse_json_fields(buf, ephemeral_id, &seq)) {
				printf("❌ Invalid JSON format - missing ephemeral_id or seq\n");
				fflush(stdout);
				continue;
			}
			
			// Check for replay attacks
			if (!replay_cache_check_and_add(ephemeral_id, seq)) {
				printf("⛔ Replay detected from %s (ephemeral_id: %s, seq: %llu)\n", 
				       ipstr, ephemeral_id, (unsigned long long)seq);
				fflush(stdout);
				continue;
			}
			
			// Check rate limiting
			if (!ratelimit_allow(ephemeral_id)) {
				printf("🚫 Rate limit exceeded from %s (ephemeral_id: %s)\n", 
				       ipstr, ephemeral_id);
				fflush(stdout);
				continue;
			}
			
			// Verify signature (stub implementation always succeeds)
			int verify_result = verify_message("peer_pub.pem", buf, NULL, 0);
			if (verify_result == 0) {
				printf("SIGNATURE VERIFICATION: VALID ✓\n");
			} else {
				printf("SIGNATURE VERIFICATION: INVALID ✗\n");
			}
			fflush(stdout);
		}
	}
	return NULL;
}

void* send_thread(void* arg) {
	app_config_t* cfg = (app_config_t*)arg;
	static uint64_t seq = 0;
	
	for (;;) {
		// Generate hazard report JSON message
		char* json_msg = build_canonical_hazard_json(
			"hazard_report",
			"node_002",
			++seq,
			(uint64_t)time(NULL),
			40.7589, -73.9851,  // Different NYC coordinates
			55.0, 270.0,        // speed and heading
			"debris",
			0.88,
			300
		);
		
		if (json_msg) {
			printf("SENDING: %s\n", json_msg);
			
			// Sign the message
			unsigned char* sig = NULL;
			size_t sig_len = 0;
			int sign_result = sign_message("node_priv.pem", json_msg, &sig, &sig_len);
			
			if (sign_result == 0) {
				printf("MESSAGE SIGNED ✓\n");
				if (sig) free(sig);
			} else {
				printf("SIGNING FAILED ✗\n");
			}
			
			udp_send(cfg->sockfd, cfg->peer_ip, cfg->peer_port, json_msg);
			free(json_msg);
		}
		sleep(3);
	}
	return NULL;
}
#endif

// Simple JSON parser to extract ephemeral_id and seq
static int parse_json_fields(const char* json, char* ephemeral_id, uint64_t* seq) {
	if (!json || !ephemeral_id || !seq) return 0;
	
	// Look for ephemeral_id field
	const char* id_start = strstr(json, "\"ephemeral_id\":\"");
	if (id_start) {
		id_start += 15; // Skip "ephemeral_id":"
		const char* id_end = strchr(id_start, '"');
		if (id_end) {
			size_t id_len = id_end - id_start;
			if (id_len < 64) {
				strncpy(ephemeral_id, id_start, id_len);
				ephemeral_id[id_len] = '\0';
			} else {
				return 0;
			}
		} else {
			return 0;
		}
	} else {
		return 0;
	}
	
	// Look for seq field
	const char* seq_start = strstr(json, "\"seq\":");
	if (seq_start) {
		seq_start += 6; // Skip "seq":
		*seq = strtoull(seq_start, NULL, 10);
		return 1;
	}
	
	return 0;
}

static int parse_ip_port(const char* s, char* out_ip, int* out_port) {
	const char* colon = strchr(s, ':');
	if (!colon) return -1;
	size_t iplen = (size_t)(colon - s);
	if (iplen >= 63) return -1;
	memcpy(out_ip, s, iplen);
	out_ip[iplen] = '\0';
	*out_port = atoi(colon + 1);
	return (*out_port > 0 && *out_port < 65536) ? 0 : -1;
}

int main(int argc, char** argv) {
	int port = 0;
	char peer_ip[64] = {0};
	int peer_port = 0;
	const char* peer = NULL;

	// Simple argument parsing: expect --port <port> --peer <ip:port>
	for (int i = 1; i < argc; ++i) {
		if (strcmp(argv[i], "--port") == 0 && i + 1 < argc) {
			port = atoi(argv[++i]);
		} else if (strcmp(argv[i], "--peer") == 0 && i + 1 < argc) {
			peer = argv[++i];
		}
	}

	if (port <= 0 || !peer) {
		fprintf(stderr, "Usage: %s --port <port> --peer <ip:port>\n", argv[0]);
		return 1;
	}

	if (parse_ip_port(peer, peer_ip, &peer_port) != 0) {
		fprintf(stderr, "invalid --peer, expected IP:PORT\n");
		return 1;
	}

	int sockfd = udp_socket_bind(port);
	if (sockfd < 0) {
		fprintf(stderr, "failed to bind UDP socket on port %d\n", port);
		return 1;
	}

	// Initialize replay protection and rate limiting
	replay_cache_init();
	ratelimit_init();

	app_config_t cfg;
	cfg.sockfd = sockfd;
	strncpy(cfg.peer_ip, peer_ip, sizeof(cfg.peer_ip) - 1);
	cfg.peer_ip[sizeof(cfg.peer_ip) - 1] = '\0';
	cfg.peer_port = peer_port;

#ifdef _WIN32
	HANDLE th_recv = CreateThread(NULL, 0, recv_thread, &cfg, 0, NULL);
	if (th_recv == NULL) {
		fprintf(stderr, "CreateThread recv failed\n");
		return 1;
	}
	HANDLE th_send = CreateThread(NULL, 0, send_thread, &cfg, 0, NULL);
	if (th_send == NULL) {
		fprintf(stderr, "CreateThread send failed\n");
		return 1;
	}
	WaitForSingleObject(th_recv, INFINITE);
	WaitForSingleObject(th_send, INFINITE);
	CloseHandle(th_recv);
	CloseHandle(th_send);
#else
	pthread_t th_recv, th_send;
	if (pthread_create(&th_recv, NULL, recv_thread, &cfg) != 0) {
		perror("pthread_create recv");
		return 1;
	}
	if (pthread_create(&th_send, NULL, send_thread, &cfg) != 0) {
		perror("pthread_create send");
		return 1;
	}
	pthread_join(th_recv, NULL);
	pthread_join(th_send, NULL);
#endif

	// Cleanup replay protection and rate limiting
	replay_cache_cleanup();
	ratelimit_cleanup();

	return 0;
}


