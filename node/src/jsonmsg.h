#ifndef JSONMSG_H
#define JSONMSG_H

#include <stdint.h>

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
);

#endif // JSONMSG_H



