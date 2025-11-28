#ifndef CRYPTO_H
#define CRYPTO_H

#include <stddef.h>

int generate_ephemeral_keypair(const char *priv_path, const char *pub_path);
int sign_message(const char *priv_path, const char *msg, unsigned char **sig, size_t *sig_len);
int verify_message(const char *pub_path, const char *msg, const unsigned char *sig, size_t sig_len);

int base64_encode(const unsigned char *in, size_t in_len, char **out_str);
int base64_decode(const char *in_str, unsigned char **out, size_t *out_len);

#endif // CRYPTO_H


