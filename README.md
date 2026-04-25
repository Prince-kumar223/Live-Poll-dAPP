# Live Poll - Stellar Level 2

A production-oriented React + Soroban starter for the Stellar Monthly Challenge Level 2.

## Setup
```bash
npm install
cp .env.example .env   # fill in your contract ID
npm run dev
```

## Deploy Contract
```bash
cd contracts/poll
cargo build --target wasm32-unknown-unknown --release
./scripts/deploy.sh
```

## Live Demo
[link here]

## Contract Address
C... (Stellar Testnet)

## Transaction Hash (sample contract call)
[verifiable on https://stellar.expert/explorer/testnet]

## Screenshots
[wallet options screenshot]

## Features
- Multi-wallet support (Freighter, xBull, LOBSTR)
- Real-time vote results via event polling
- Full error handling (wallet not found, rejected, already voted)
- Transaction status tracking

## Project Structure
```text
contracts/poll/        Soroban contract
scripts/deploy.sh      Root deploy script
src/components/        UI building blocks
src/hooks/             Wallet, poll, vote, event hooks
src/lib/               Contract + error helpers
```

## Environment

Use `.env.example` as the source of truth:

```bash
VITE_CONTRACT_ID=C...
VITE_NETWORK=testnet
VITE_RPC_URL=https://soroban-testnet.stellar.org
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
```

## Commit Plan

The requested commit sequence for a fresh repo is:

1. `feat: scaffold Vite+React app and Soroban contract`
2. `feat: implement StellarWalletsKit multi-wallet connect`
3. `feat: deploy poll contract and wire up vote + results`
4. `feat: add real-time event listener and tx status badge`
5. `fix: handle WalletNotFound, UserRejected, AlreadyVoted errors`

## Notes

- The frontend reads `question`, `options`, `results`, and `has_voted` from Soroban.
- The contract emits a `vote` event on every successful vote.
- The deploy scripts expect `cargo`, `soroban`, and a configured `SOROBAN_SOURCE_ACCOUNT`.
- Replace the placeholder demo link, contract address, transaction hash, and screenshot after deployment.

#SCREENSHOT
1) wallet options available:
![alt text](<Screenshot 2026-04-25 003719.png>)
2) Deployed contract address:-
![alt text](<Screenshot 2026-04-25 003640.png>)
3)Transaction hash of a contract call :-
![alt text](<Screenshot 2026-04-23 200104.png>)

LIVE APP DEMO LINK:- https://live-poll-d-app.vercel.app/
