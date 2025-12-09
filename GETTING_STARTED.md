# Getting Started with Anonymous Academic Peer Review System

## Quick Overview

This is a **production-ready FHEVM example** demonstrating a privacy-preserving academic peer review system. It's designed to be:

- **Easy to understand**: Clear documentation and well-commented code
- **Easy to run**: Just `npm install && npm run test`
- **Easy to extend**: Well-structured for adding new features
- **Easy to learn from**: Comprehensive test suite with ✅ correct and ❌ incorrect patterns

## 5-Minute Quick Start

### Step 1: Install Dependencies (1 minute)
```bash
npm install
```

This installs all required packages:
- Hardhat (smart contract development)
- @fhevm/solidity (FHEVM library)
- TypeScript, ethers.js, and testing frameworks

### Step 2: Compile Contracts (1 minute)
```bash
npm run compile
```

Expected output:
```
Compiling 4 contracts...
Compilation successful!
Generated types in ./types
```

### Step 3: Run Tests (2 minutes)
```bash
npm run test
```

You'll see 40+ tests running:
```
✅ should allow users to submit papers
✅ should allow encrypted review submission with proper permissions
✅ should allow paper author to decrypt their encrypted reviews
❌ should prevent authors from reviewing their own papers
❌ should prevent non-authors from toggling paper status
... (40+ tests total)

40 passing (5s)
```

### Step 4: Explore the Code (1 minute)
```bash
# View the main contract
cat contracts/AcademicReview.sol

# View the test file
cat test/AcademicReview.ts

# View the README
cat README.md
```

---

## Understanding the Project Structure

### 🔧 Smart Contracts (`contracts/`)

**Main Example: AcademicReview.sol**
- Demonstrates access control with encrypted data
- Shows how to handle multiple encrypted values
- Implements FHE permission patterns
- 239 lines of well-commented code

**Key Functions**:
```solidity
submitPaper(title, abstract, category)
  → Submit a paper for peer review

submitReview(paperId, encryptedRecommendation, encryptedQuality, comments)
  → Submit an encrypted review (reviewer anonymity preserved)

getEncryptedReview(reviewId)
  → Paper author can decrypt their own reviews only
```

### 🧪 Tests (`test/`)

**AcademicReview.ts** - Professional test suite with:
- ✅ Success path tests (correct usage)
- ❌ Failure path tests (common mistakes)
- Clear documentation with @chapter tags

**Example test patterns**:
```typescript
// CORRECT: Shows how to properly encrypt and submit
it("✅ should allow encrypted review submission with proper permissions", async () => {
  const encReview = await fhevm.createEncryptedInput(addr, bob).addBool(true).encrypt();
  await contract.submitReview(paperId, encReview.handles[0], encReview.inputProof);
});

// INCORRECT: Shows what fails and why
it("❌ should prevent authors from reviewing their own papers", async () => {
  await expect(contract.submitReview(alicePaperId, ...))
    .to.be.revertedWith("Cannot review your own paper");
});
```

### 📋 Configuration Files

**Key Files**:
- `package.json` - Dependencies and npm scripts
- `hardhat.config.ts` - Hardhat setup with FHEVM plugin
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.yml` - Code linting rules
- `.prettierrc.yml` - Code formatting rules

---

## Common Development Tasks

### Run Tests with Specific Filter
```bash
# Run only access control tests
npm run test -- --grep "Access Control"

# Run only success tests
npm run test -- --grep "✅"

# Run only failure tests
npm run test -- --grep "❌"
```

### Check Code Quality
```bash
# Lint Solidity
npm run lint:sol

# Lint TypeScript
npm run lint:ts

# Check formatting
npm run prettier:check

# Auto-fix formatting
npm run prettier:write
```

### Generate Test Coverage
```bash
npm run coverage
```

Creates a coverage report showing:
- Line coverage
- Function coverage
- Branch coverage
- Statement coverage

### Deploy to Local Network
```bash
# Start a local Hardhat network in one terminal
npx hardhat node

# In another terminal, deploy
npm run deploy:localhost
```

---

## Interactive CLI Tools

The project includes Hardhat tasks for interacting with the contract:

### List Accounts and Balances
```bash
npx hardhat accounts
```

Output:
```
0x1234...5678 (100.0 ETH)
0xabcd...ef00 (100.0 ETH)
0x5678...9012 (100.0 ETH)
```

### Submit a Paper
```bash
npx hardhat submitPaper \
  --title "Advances in FHE" \
  --abstract "This paper explores recent advances..." \
  --category "Cryptography"
```

### Get Available Papers
```bash
npx hardhat getPapers
```

Output:
```
Available papers for review: 3
--- Paper 1 ---
ID: 1
Title: Advances in FHE
Category: Cryptography
Author: 0x1234...5678
Review Count: 0
```

### Get Your Submitted Papers
```bash
npx hardhat getUserPapers
```

### Get System Statistics
```bash
npx hardhat getCounts
```

Output:
```
Total Papers: 5
Total Reviews: 12
```

---

## Key Concepts Explained

### 1. Encrypted Values in FHEVM

```solidity
// External input (from user)
externalEbool recommendation  // Encrypted on client side
bytes calldata proof          // Zero-knowledge proof

// Convert to internal representation
ebool decryptedRecommendation = FHE.fromExternal(recommendation, proof);

// Now the value is encrypted ON-CHAIN
// (but only the contract and authorized users can decrypt it)
```

### 2. FHE Permissions (CRITICAL!)

```solidity
// ✅ CORRECT: Both permissions required
FHE.allowThis(encryptedValue);           // Contract permission
FHE.allow(encryptedValue, msg.sender);   // User permission

// ❌ INCORRECT: Missing one permission will cause transaction to fail
FHE.allow(encryptedValue, msg.sender);   // Only user permission - NOT ENOUGH!
```

### 3. Access Control with Encrypted Data

```solidity
function getEncryptedReview(uint256 reviewId) external view returns (ebool, euint8) {
    // Only paper author can decrypt their reviews
    require(msg.sender == paper.author, "Not authorized");
    return (review.encryptedRecommendation, review.encryptedQuality);
}
```

### 4. Testing with Encrypted Data

```typescript
// Create encrypted input with correct signer
const encInput = await fhevm
  .createEncryptedInput(contractAddress, alice.address)  // ← Must be alice!
  .addBool(true)
  .encrypt();

// Submit with alice's signature
await contract.connect(alice).submitReview(
  paperId,
  encInput.handles[0],
  encInput.inputProof,
  // ...
);

// Alice can decrypt the result
const decrypted = await fhevm.userDecryptEbool(
  encryptedResult,
  contractAddress,
  alice  // ← Only alice can decrypt
);
```

---

## Extending the Project

### Add a New Test
1. Open `test/AcademicReview.ts`
2. Add a new `it()` block with @chapter tag:
```typescript
it("✅ should [describe what it tests]", async function () {
    // Setup
    const [account1, account2] = signers;

    // Execute
    const tx = await contract.connect(account1).someFunction(...);

    // Verify
    expect(result).to.equal(expected);
});
```
3. Run: `npm run test`

### Add a New CLI Task
1. Open `tasks/AcademicReview.ts`
2. Add a new task:
```typescript
task("myTask", "Description of my task")
  .addParam("paramName", "Description")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    // Your task logic
  });
```
3. Run: `npx hardhat myTask --paramName value`

### Add a New Smart Contract Function
1. Open `contracts/AcademicReview.sol`
2. Add function with JSDoc:
```solidity
/// @notice What this function does
/// @param paramName What this parameter means
/// @return What it returns
function myNewFunction(paramType paramName) external {
    // Implementation
}
```
3. Compile: `npm run compile`
4. Test it!

---

## Troubleshooting

### Error: "Cannot find module '@fhevm/solidity'"
**Solution**: Run `npm install` to install dependencies

### Error: "import fhevm is not defined"
**Solution**: Make sure you imported at the top of your test file:
```typescript
import { fhevm } from "hardhat";
```

### Error: "Input signature mismatch"
**Cause**: You encrypted with one signer but submitted with another
**Solution**: Make sure the signer in `createEncryptedInput()` matches the caller:
```typescript
// WRONG
const enc = await fhevm.createEncryptedInput(addr, alice.address).add8(5).encrypt();
await contract.connect(bob).submitReview(paperId, enc.handles[0], enc.inputProof);

// CORRECT
const enc = await fhevm.createEncryptedInput(addr, bob.address).add8(5).encrypt();
await contract.connect(bob).submitReview(paperId, enc.handles[0], enc.inputProof);
```

### Error: "allowThis is not defined"
**Cause**: Forgot to import FHE
**Solution**: Add import to your contract:
```solidity
import {FHE} from "@fhevm/solidity/lib/FHE.sol";
```

---

## Next Steps

1. **Run the tests**: `npm run test`
2. **Read the README**: Check `README.md` for detailed documentation
3. **Explore the contracts**: Look at `contracts/AcademicReview.sol`
4. **Study the tests**: `test/AcademicReview.ts` shows both correct and incorrect patterns
5. **Try the CLI**: Use Hardhat tasks to interact with the contract
6. **Extend the project**: Add new functions and tests

---

## Resources

- **FHEVM Docs**: https://docs.zama.ai/fhevm
- **Hardhat Docs**: https://hardhat.org/docs
- **ethers.js Docs**: https://docs.ethers.org/v6/
- **Solidity Docs**: https://docs.soliditylang.org/

---

## Support

For questions about:
- **This example**: Check the README.md and inline code comments
- **FHEVM**: Visit the Zama Community Forum
- **Hardhat**: Check Hardhat documentation
- **Solidity**: Visit Solidity documentation

Happy learning! 🚀
