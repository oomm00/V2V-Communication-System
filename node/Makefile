CC = gcc
CFLAGS = -Wall -Wextra -O2
LDFLAGS = -pthread -lssl -lcrypto

SRC = src/main.c src/net.c src/jsonmsg.c src/crypto.c
OBJ = $(SRC:.c=.o)

BIN = node

all: $(BIN)

$(BIN): $(OBJ)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJ) $(BIN)

.PHONY: all clean


