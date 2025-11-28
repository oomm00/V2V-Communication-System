// UDP networking helpers for V2V node

#ifndef NET_H
#define NET_H

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#include <stdint.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <arpa/inet.h>
#include <netinet/in.h>
#include <stdint.h>
#endif

int udp_socket_bind(int port);
int udp_send(int sock, const char* ip, int port, const char* msg);
int udp_recv(int sock, char* buf, int buflen, struct sockaddr_in* src);

#endif // NET_H


