CC = gcc
CFLAGS = -Wall -Wextra -O2
LDFLAGS = -lws2_32

# Core source files
SRC = main.c net.c jsonmsg.c crypto.c replay.c ratelimit.c
OBJ = $(SRC:.c=.o)

# Binary target
BIN = v2v_node

all: $(BIN)

$(BIN): $(OBJ)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJ) $(BIN)

.PHONY: all clean
