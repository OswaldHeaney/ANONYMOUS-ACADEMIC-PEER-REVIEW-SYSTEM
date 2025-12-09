# Deployment & Verification Guide

Complete step-by-step guide for deploying the Anonymous Academic Peer Review System to mainnet and testnet.

## Table of Contents

1. [Pre-Deployment Setup](#pre-deployment-setup)
2. [Local Testing](#local-testing)
3. [Sepolia Testnet Deployment](#sepolia-testnet-deployment)
4. [Mainnet Deployment](#mainnet-deployment)
5. [Verification & Testing](#verification--testing)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Setup

### 1. Environment Configuration

Create a `.env` file in the project root:

```bash
# Network RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY

# Deployment Account
MNEMONIC="your twelve word mnemonic phrase here"
# OR
PRIVATE_KEY=0x...

# Etherscan API Key (for verification)
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Gas settings (optional)
GAS_PRICE=20  # in gwei
GAS_LIMIT=5000000
```

### 2. Install Dependencies

```bash
npm install

# Install Hardhat globally for easier CLI access
npm install -g hardhat
```

### 3. Compile Contracts

```bash
npm run compile

# Expected output:
# Compiling 4 contracts...
# ✓ Compilation successful
```

### 4. Verify Setup

```bash
# Check accounts
npx hardhat accounts

# Expected output showing 10 accounts with balances
```

---

## Local Testing

### Run Full Test Suite

```bash
npm run test

# Expected output:
# AcademicReview
#   Paper Submission
#     ✓ should allow users to submit papers (45ms)
#     ...
#   40 passing (5s)
```

### Run Specific Tests

```bash
# Run only access control tests
npm run test -- --grep "Access Control"

# Run only success tests
npm run test -- --grep "✅"

# Run with detailed output
npm run test -- --reporter spec
```

### Generate Coverage Report

```bash
npm run coverage

# Creates coverage/ directory with HTML report
# Open: coverage/index.html in browser
```

### Start Local Node

```bash
# Terminal 1: Start Hardhat network
npx hardhat node

# Terminal 2: Deploy locally
npm run deploy:localhost

# Terminal 3: Run tests
npm run test
```

---

## Sepolia Testnet Deployment

### Step 1: Get Sepolia ETH

1. Go to [Sepolia Faucet](https://sepoliafaucet.com)
2. Connect your MetaMask wallet
3. Request 0.5 testnet ETH
4. Wait for confirmation (usually 1-2 minutes)

### Step 2: Deploy Contract

```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Expected output:
# deploying "AcademicReview" (tx: 0x...)
# Deployed to: 0x1234...5678
```

### Step 3: Save Contract Address

```bash
# The contract address will be displayed
# Save it for verification and interaction

# Or query from deployments:
cat deployments/sepolia/AcademicReview.json | grep '"address"'
```

### Step 4: Verify on Etherscan

```bash
# Verify the contract
npm run verify:sepolia 0xYOUR_CONTRACT_ADDRESS

# Expected output:
# Successfully verified contract AcademicReview on Etherscan
# https://sepolia.etherscan.io/address/0x...
```

### Step 5: Test on Testnet

```bash
# Run tests against Sepolia
npm run test:sepolia

# Or manually interact:
# List accounts
npx hardhat accounts --network sepolia

# Submit a paper
npx hardhat submitPaper \
  --network sepolia \
  --title "My Testnet Paper" \
  --abstract "Testing on Sepolia" \
  --category "Testing"

# Get papers
npx hardhat getPapers --network sepolia
```

---

## Mainnet Deployment

### ⚠️ Pre-Deployment Checklist

- [ ] Test on Sepolia first
- [ ] Review all contracts with security audit
- [ ] Verify contract addresses
- [ ] Check gas prices
- [ ] Have sufficient ETH for deployment + gas
- [ ] Test with production account
- [ ] Have backup of private key
- [ ] Document deployment parameters

### Step 1: Update Hardhat Config

Ensure mainnet is configured in `hardhat.config.ts`:

```typescript
networks: {
  mainnet: {
    url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
    accounts: {
      mnemonic: MNEMONIC,
      path: "m/44'/60'/0'/0/",
      count: 10,
    },
    chainId: 1,
  },
  // ... other networks
}
```

### Step 2: Deploy to Mainnet

```bash
# IMPORTANT: Make absolutely sure you're using mainnet

# Check current network
npx hardhat network-info

# Deploy to mainnet
npm run deploy -- --network mainnet

# You'll be asked to confirm - review carefully!
```

### Step 3: Monitor Deployment

```bash
# Watch transaction status
npx hardhat run scripts/watch-tx.ts --network mainnet

# Or check manually on Etherscan:
# https://etherscan.io/tx/0xYOUR_TX_HASH
```

### Step 4: Verify on Etherscan

```bash
# Verify with flat sources (recommended for complex contracts)
npx hardhat verify \
  --network mainnet \
  --flatten \
  0xYOUR_DEPLOYMENT_ADDRESS
```

### Step 5: Post-Deployment

```bash
# Backup deployment artifacts
cp -r deployments/mainnet ./deployments-backup-$(date +%s)

# Document deployment
echo "AcademicReview deployed to: 0x..." >> DEPLOYMENT_LOG.md

# Verify functionality
npx hardhat verify-deployment --network mainnet
```

---

## Verification & Testing

### Verify Contract Code

```bash
# Verify on Etherscan programmatically
npx hardhat verify \
  --network sepolia \
  --constructor-args args.js \
  0x1234...5678

# Where args.js contains constructor arguments:
// args.js
module.exports = [];
```

### Test Deployments

```bash
# Create test deployment script
cat > scripts/test-deployment.ts << 'EOF'
import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const contract = await ethers.getContractAt("AcademicReview", contractAddress);

  // Test read functions
  const [totalPapers, totalReviews] = await contract.getTotalCounts();
  console.log(`Papers: ${totalPapers}, Reviews: ${totalReviews}`);

  // Test write functions (if needed)
  // const tx = await contract.submitPaper(...);
}

main().catch(console.error);
EOF

# Run test
CONTRACT_ADDRESS=0x... npx hardhat run scripts/test-deployment.ts
```

### Monitor Contract

```bash
# Watch contract events
npx hardhat run scripts/watch-events.ts \
  --network sepolia

# Get contract stats
npx hardhat getCounts --network sepolia
```

---

## Troubleshooting

### Error: "Insufficient funds for gas"

**Solution**: Add more ETH to your account
```bash
# Check account balance
npx hardhat accounts --network sepolia
```

### Error: "Contract code mismatch"

**Solution**: Ensure you're verifying with correct constructor arguments
```bash
# Retrieve constructor args from deployment
cat deployments/sepolia/AcademicReview.json | grep '"args"'
```

### Error: "Network is not supported"

**Solution**: Check your RPC URL and network configuration
```bash
# Verify RPC
curl -X POST https://sepolia.infura.io/v3/YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Error: "Transaction reverted"

**Solution**: Check contract state and requirements
```bash
# Get detailed error
npx hardhat run scripts/debug-tx.ts --network sepolia
```

### Error: "Verification already done"

**Solution**: This is OK - contract is already verified. Just view on Etherscan.

---

## Gas Optimization

### Estimate Gas Before Deployment

```bash
npm run compile
npx hardhat run scripts/estimate-gas.ts

# Check contract size
npx hardhat size-contracts
```

### Reduce Deployment Cost

```typescript
// In hardhat.config.ts
solidity: {
  version: "0.8.27",
  settings: {
    optimizer: {
      enabled: true,
      runs: 800,  // Increase for smaller bytecode
    },
  },
}
```

---

## Production Checklist

### Before Mainnet Deployment

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Gas optimization reviewed
- [ ] Contract verified on testnet
- [ ] All features tested on testnet
- [ ] Upgrade path documented
- [ ] Emergency pause mechanism tested
- [ ] Access control verified
- [ ] Event emissions correct
- [ ] Documentation updated

### After Deployment

- [ ] Contract verified on Etherscan
- [ ] ABI published
- [ ] Address added to frontend
- [ ] Monitoring set up
- [ ] Deployment documented
- [ ] Backup created
- [ ] Team notified

---

## Support

**Deployment Issues**:
- Check Hardhat docs: https://hardhat.org/docs
- Check FHEVM docs: https://docs.zama.ai/fhevm

**Network Issues**:
- Sepolia status: https://sepoliatestnet.com
- Mainnet status: https://status.ethereum.org

**Etherscan Verification**:
- Verification guide: https://docs.etherscan.io/apis/verified-contracts-api

---

**Built with Zama FHEVM**

Last updated: December 2025
