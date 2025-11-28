#include "jsonmsg.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Returns heap-allocated canonical JSON string. Caller must free().
char *build_canonical_hazard_json(
	const char *msg_type,
	const char *ephemeral_id,
	uint64_t seq,
	uint64_t timestamp,
	double lat, double lon,
	double speed, double heading,
	const char *hazard_type,
	double confidence,
	int ttl_seconds
) {
	if (!msg_type) msg_type = "hazard_report";
	if (!ephemeral_id) ephemeral_id = "unknown";
	if (!hazard_type) hazard_type = "unknown";

	// Construct with snprintf into a dynamically sized buffer.
	// First, compute required size.
	char preview[1];
	int needed = snprintf(
		preview, sizeof(preview),
		"{\"msg_type\":\"%s\",\"version\":1,\"ephemeral_id\":\"%s\",\"seq\":%llu,\"timestamp\":%llu,\"location\":[%.6f,%.6f],\"speed\":%.2f,\"heading\":%.2f,\"hazard_type\":\"%s\",\"confidence\":%.4f,\"ttl_seconds\":%d}",
		msg_type,
		ephemeral_id,
		(unsigned long long)seq,
		(unsigned long long)timestamp,
		lat, lon,
		speed, heading,
		hazard_type,
		confidence,
		ttl_seconds
	);
	if (needed < 0) return NULL;

	char *buf = (char *)malloc((size_t)needed + 1);
	if (!buf) return NULL;

	int written = snprintf(
		buf, (size_t)needed + 1,
		"{\"msg_type\":\"%s\",\"version\":1,\"ephemeral_id\":\"%s\",\"seq\":%llu,\"timestamp\":%llu,\"location\":[%.6f,%.6f],\"speed\":%.2f,\"heading\":%.2f,\"hazard_type\":\"%s\",\"confidence\":%.4f,\"ttl_seconds\":%d}",
		msg_type,
		ephemeral_id,
		(unsigned long long)seq,
		(unsigned long long)timestamp,
		lat, lon,
		speed, heading,
		hazard_type,
		confidence,
		ttl_seconds
	);
	if (written < 0 || written > needed) {
		free(buf);
		return NULL;
	}
	return buf;
}



