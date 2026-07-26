# FreelanceHub - Decentralized Freelancer Marketplace

A trustless freelancer marketplace with milestone-based escrow and on-chain reputation, built on the Stellar blockchain using Soroban smart contracts.

## Overview

FreelanceHub connects freelancers and clients through a decentralized platform where:
- Jobs are posted with budgets and broken into milestones
- Freelancers apply and are assigned by clients
- Work is tracked through a milestone submission/approval system
- Freelancer reputation (ratings, completed jobs, earnings) lives on-chain
- Every action emits events that are tracked in real-time

## Features

### Smart Contract (Soroban)
- **Job Management** — Create, assign, cancel, and complete jobs
- **Milestone System** — Add, submit, and approve milestones per job
- **Freelancer Applications** — Freelancers can apply for open jobs
- **On-Chain Reputation** — Ratings, completed jobs, and total earnings
- **Event Emission** — Every state change emits trackable events

### Frontend (Next.js)
- **Multi-Wallet Support** — Freighter, LOBSTR via StellarWalletsKit
- **Wallet Dashboard** — View address, balances, stats, and network info
- **Job Marketplace** — Create, browse, apply, and manage jobs
- **Milestone Tracking** — Add milestones, submit deliverables, approve work
- **Review System** — Leave ratings and comments for freelancers
- **Activity Feed** — Real-time event feed from contract interactions
- **Transaction History** — Track all transactions with status and explorer links
- **Dark Mode** — Full dark mode with modern UI
- **Responsive Design** — Works on desktop and mobile
- **Toast Notifications** — Success/error/info feedback
- **Skeleton Loaders** — Loading states for all data fetching

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Soroban SDK v25, Rust |
| Frontend Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State Management | Zustand |
| Data Fetching | @tanstack/react-query |
| Wallet Integration | @creit.tech/stellar-wallets-kit |
| Blockchain SDK | @stellar/stellar-sdk |
| Icons | lucide-react |
| Utilities | class-variance-authority, clsx, tailwind-merge |

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (or Bun)
- [Rust](https://rustup.rs/) (for contract development)
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli) (for deployment)
- A Stellar wallet extension (Freighter recommended)

### 1. Clone and Install

```bash
# Install client dependencies
cd client
bun install  # or npm install

# Install contract toolchain (if building contract)
cd ../contract
cargo test   # verify contract builds and tests pass
```

### 2. Environment Variables

```bash
cd client
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=<your_deployed_contract_address>
```

### 3. Deploy the Smart Contract

```bash
# From project root
./scripts/deploy.sh
```

This will:
1. Build the contract WASM
2. Generate a testnet keypair
3. Deploy to Stellar Testnet
4. Initialize the contract
5. Print the contract address

Add the output address to your `.env.local`.

### 4. Run Locally

```bash
cd client
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed contract address | `CONTRACT_ADDRESS_HERE` |
| `NEXT_PUBLIC_RPC_URL` | Stellar RPC endpoint | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | Network passphrase | `Test SDF Network ; September 2015` |

## Wallet Setup

1. Install the [Freighter](https://freighter.app/) browser extension
2. Create or import a Stellar wallet
3. Switch to **Testnet** in Freighter settings
4. Fund your account using the [Stellar Laboratory](https://laboratory.stellar.org/#account/create)
5. Click "Connect Wallet" on FreelanceHub and select Freighter

### Supported Wallets

- **Freighter** — Browser extension (Chrome, Firefox, Brave)
- **LOBSTR** — Mobile wallet

## Contract Deployment

### Build Contract

```bash
cd contract
stellar contract build
```

### Run Tests

```bash
cd contract
cargo test
```

### Deploy to Testnet

```bash
cd contract

# Generate and fund a keypair
stellar keys generate dev --network testnet --fund

# Deploy
stellar contract deploy \
    --wasm target/wasm32v1-none/release/contract.wasm \
    --source-account dev \
    --network testnet

# Initialize (replace CONTRACT_ID with output above)
stellar contract invoke \
    --id <CONTRACT_ID> \
    --source-account dev \
    --network testnet \
    -- initialize \
    --admin $(stellar keys address dev)
```

## Running Locally

```bash
cd client
bun dev      # Development server
bun build    # Production build
bun start    # Production server
```

## Deployment

### Vercel

1. Push to GitHub
2. Import repository in [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS` = your deployed contract address
4. Deploy

### Manual

```bash
cd client
bun run build
bun start
```

## Contract Address

```
CONTRACT_ADDRESS_HERE
```

> Deploy using `./scripts/deploy.sh` and replace this placeholder.

## Example Transaction Hash

```
TRANSACTION_HASH_HERE
```

> After deploying and interacting with the contract, transaction hashes will appear in the Transaction History page.

## Project Structure

```
project/
├── contract/                         # Soroban smart contract
│   ├── Cargo.toml                    # Workspace configuration
│   └── contracts/contract/
│       ├── Cargo.toml                # Contract dependencies
│       └── src/
│           ├── lib.rs                # Contract logic (~250 lines)
│           └── test.rs               # 12 test cases
├── client/                           # Next.js frontend
│   ├── src/
│   │   ├── app/                      # Pages (App Router)
│   │   │   ├── layout.tsx            # Root layout with Navbar
│   │   │   ├── page.tsx              # Home page
│   │   │   ├── dashboard/page.tsx    # Wallet dashboard
│   │   │   ├── jobs/page.tsx         # Job marketplace
│   │   │   ├── activity/page.tsx     # Real-time activity feed
│   │   │   └── history/page.tsx      # Transaction history
│   │   ├── components/               # React components
│   │   │   ├── ui/                   # shadcn-style UI primitives
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   └── toast.tsx
│   │   │   ├── navbar.tsx            # Navigation bar
│   │   │   ├── wallet-dashboard.tsx  # Wallet management UI
│   │   │   ├── contract-page.tsx     # Main marketplace UI
│   │   │   ├── activity-feed.tsx     # Real-time event feed
│   │   │   └── transaction-history.tsx
│   │   ├── hooks/                    # React hooks
│   │   │   ├── wallet.ts             # StellarWalletsKit integration
│   │   │   └── contract.ts           # Contract interaction layer
│   │   ├── stores/                   # Zustand state stores
│   │   │   ├── wallet.ts             # Wallet state
│   │   │   └── transactions.ts       # Transaction & event state
│   │   ├── lib/                      # Utilities
│   │   │   ├── utils.ts              # cn(), formatXlm(), etc.
│   │   │   └── stellar.ts            # Network constants
│   │   └── types/                    # TypeScript types
│   │       └── index.ts              # All type definitions
│   └── .env.example                  # Environment template
├── scripts/
│   └── deploy.sh                     # Contract deployment script
└── README.md
```

## Smart Contract API

| Method | Auth Required | Description |
|--------|:------------:|-------------|
| `initialize(admin)` | — | Set contract admin |
| `create_job(client, title, desc, budget)` | ✅ | Create a new job listing |
| `apply_for_job(freelancer, job_id)` | ✅ | Apply for an open job |
| `assign_freelancer(client, job_id, freelancer)` | ✅ | Assign a freelancer to a job |
| `add_milestone(client, job_id, title, amount)` | ✅ | Add a milestone to a job |
| `submit_milestone(freelancer, job_id, index, url)` | ✅ | Submit milestone deliverable |
| `approve_milestone(client, job_id, index)` | ✅ | Approve a submitted milestone |
| `cancel_job(client, job_id)` | ✅ | Cancel an open/in-progress job |
| `complete_job(client, job_id)` | ✅ | Mark job as completed |
| `leave_review(reviewer, reviewee, job_id, rating, comment)` | ✅ | Leave a 1-5 star review |
| `get_config()` | — | Get contract config |
| `get_job(job_id)` | — | Get job details |
| `get_milestone(job_id, index)` | — | Get milestone details |
| `get_freelancer_stats(addr)` | — | Get freelancer reputation |
| `get_job_applicants(job_id)` | — | Get list of applicants |

## License

MIT
"contract address : CCG2GAAAFE3ZYUJSEAYMZIYIJCD5K74QEW7PADACG2EYKJSNJASHNXKJ"
