#include "net.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#include <sys/socket.h>
#endif

#ifdef _WIN32
// Windows doesn't have inet_ntop/pton in MinGW, so we implement them
const char* inet_ntop(int af, const void* src, char* dst, socklen_t size) {
	if (af == AF_INET) {
		const struct in_addr* addr = (const struct in_addr*)src;
		snprintf(dst, size, "%d.%d.%d.%d", 
			(addr->s_addr & 0xFF),
			(addr->s_addr >> 8) & 0xFF,
			(addr->s_addr >> 16) & 0xFF,
			(addr->s_addr >> 24) & 0xFF);
		return dst;
	}
	return NULL;
}

int inet_pton(int af, const char* src, void* dst) {
	if (af == AF_INET) {
		struct in_addr* addr = (struct in_addr*)dst;
		unsigned int a, b, c, d;
		if (sscanf(src, "%u.%u.%u.%u", &a, &b, &c, &d) == 4) {
			if (a <= 255 && b <= 255 && c <= 255 && d <= 255) {
				addr->s_addr = htonl((a << 24) | (b << 16) | (c << 8) | d);
				return 1;
			}
		}
	}
	return 0;
}
#endif

int udp_socket_bind(int port) {
#ifdef _WIN32
	WSADATA wsaData;
	if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
		fprintf(stderr, "WSAStartup failed\n");
		return -1;
	}
#endif

	int sockfd = socket(AF_INET, SOCK_DGRAM, 0);
	if (sockfd < 0) {
		perror("socket");
		return -1;
	}

	struct sockaddr_in addr;
	memset(&addr, 0, sizeof(addr));
	addr.sin_family = AF_INET;
	addr.sin_addr.s_addr = htonl(INADDR_ANY);
	addr.sin_port = htons((uint16_t)port);

	int opt = 1;
	if (setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt)) < 0) {
		perror("setsockopt");
		// continue; non-fatal
	}

	if (bind(sockfd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
		perror("bind");
#ifdef _WIN32
		closesocket(sockfd);
#else
		close(sockfd);
#endif
		return -1;
	}

	return sockfd;
}

int udp_send(int sock, const char* ip, int port, const char* msg) {
	if (!ip || !msg) return -1;
	struct sockaddr_in dst;
	memset(&dst, 0, sizeof(dst));
	dst.sin_family = AF_INET;
	dst.sin_port = htons((uint16_t)port);
	if (inet_pton(AF_INET, ip, &dst.sin_addr) != 1) {
		perror("inet_pton");
		return -1;
	}
	int n = sendto(sock, msg, (int)strlen(msg), 0, (struct sockaddr*)&dst, sizeof(dst));
	if (n < 0) {
		perror("sendto");
		return -1;
	}
	return n;
}

int udp_recv(int sock, char* buf, int buflen, struct sockaddr_in* src) {
	if (!buf || buflen <= 0) return -1;
#ifdef _WIN32
	int slen = sizeof(struct sockaddr_in);
#else
	socklen_t slen = sizeof(struct sockaddr_in);
#endif
	struct sockaddr_in tmp;
	struct sockaddr_in* from = src ? src : &tmp;
	int n = recvfrom(sock, buf, buflen - 1, 0, (struct sockaddr*)from, &slen);
	if (n < 0) {
		perror("recvfrom");
		return -1;
	}
	buf[n] = '\0';
	return n;
}


