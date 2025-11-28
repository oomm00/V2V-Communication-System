#!/bin/bash
cd "$(dirname "$0")"

npx hardhat node &
sleep 8

cd node && node server.js &
sleep 5
cd ..

cd frontend && npm run dev &
sleep 3
cd ..

python3 node/scripts/simulator.py &

wait
