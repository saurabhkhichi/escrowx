#!/bin/bash
set -e

echo "🚀 FreelanceHub Contract Deployment Script"
echo "=========================================="
echo ""

# Check for required tools
if ! command -v stellar &> /dev/null; then
    echo "❌ Stellar CLI not found. Install it from: https://developers.stellar.org/docs/tools/cli"
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo not found. Install Rust from: https://rustup.rs"
    exit 1
fi

echo "📦 Step 1: Building contract..."
cd "$(dirname "$0")/../contract"
stellar contract build
echo "✅ Contract built successfully"
echo ""

echo "🔑 Step 2: Generating testnet keypair..."
stellar keys generate dev --network testnet --fund 2>/dev/null || echo "Keypair 'dev' already exists"
echo "✅ Keypair ready"
echo ""

echo "📤 Step 3: Deploying contract to testnet..."
CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32v1-none/release/contract.wasm \
    --source-account dev \
    --network testnet)
echo "✅ Contract deployed!"
echo ""

echo "📋 Step 4: Contract Details"
echo "=========================================="
echo "Contract Address: $CONTRACT_ID"
echo "Network: Testnet"
echo "Explorer: https://stellar.expert/testnet/contract/$CONTRACT_ID"
echo ""

echo "📝 Step 5: Initialize contract..."
stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source-account dev \
    --network testnet \
    -- initialize \
    --admin "$(stellar keys address dev)"
echo "✅ Contract initialized"
echo ""

echo "=========================================="
echo "✅ Deployment complete!"
echo ""
echo "Add this to your .env.local file:"
echo "NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ID"
echo ""
echo "View on explorer:"
echo "https://stellar.expert/testnet/contract/$CONTRACT_ID"
echo "=========================================="
