#!/bin/bash

echo "============================================"
echo "   PM System Startup Script (Linux/Mac)"
echo "============================================"
echo

cd "$(dirname "$0")/pm-system"

echo "[Step 1/2] Installing dependencies..."
npm install

echo
echo "[Step 2/2] Starting dev server..."
echo "Please visit: http://localhost:5173"
echo

npm run dev