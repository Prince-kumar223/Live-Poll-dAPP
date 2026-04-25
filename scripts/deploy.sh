#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACT_DIR="$ROOT_DIR/contracts/poll"

: "${SOROBAN_SOURCE_ACCOUNT:?Set SOROBAN_SOURCE_ACCOUNT to the soroban identity or account alias to deploy from.}"

cd "$CONTRACT_DIR"

cargo build --target wasm32-unknown-unknown --release

soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/poll.wasm \
  --network testnet \
  --source "$SOROBAN_SOURCE_ACCOUNT"
