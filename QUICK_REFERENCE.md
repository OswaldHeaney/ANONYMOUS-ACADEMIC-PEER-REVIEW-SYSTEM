# Quick Reference Guide

Fast lookup guide for common tasks and patterns.

## 🚀 Common Commands

### Setup & Compilation
```bash
npm install              # Install dependencies
npm run compile         # Compile contracts
npm run typechain       # Generate TypeScript types
npm run clean           # Clean artifacts
```

### Testing
```bash
npm run test            # Run all tests
npm run test:sepolia    # Run tests on testnet
npm run coverage        # Generate coverage report
```

### Code Quality
```bash
npm run lint            # Lint all files
npm run lint:sol        # Lint Solidity only
npm run lint:ts         # Lint TypeScript only
npm run prettier:check  # Check formatting
npm run prettier:write  # Auto-format code
```

### Deployment
```bash
npm run deploy:localhost  # Deploy locally
npm run deploy:sepolia    # Deploy to testnet
npm run verify:sepolia    # Verify on Etherscan
```

### Hardhat Tasks
```bash
npx hardhat accounts           # List accounts
npx hardhat submitPaper \
  --title "..." \
  --abstract "..." \
  --category "..."             # Submit paper
npx hardhat getPapers          # Get available papers
npx hardhat getUserPapers      # Get your papers
npx hardhat getCounts          # Get system stats
```

---

## 📝 Key FHE Patterns

### Pattern 1: Importing FHE

```solidity
// ✅ Correct - Modern import
import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract MyContract is ZamaEthereumConfig {
    // Implementation
}

// ❌ Wrong - Old import
import "fhevm/lib/TFHE.sol";
```

### Pattern 2: FHE Permissions (CRITICAL!)

```solidity
// ✅ ALWAYS BOTH permissions
FHE.allowThis(encryptedValue);           // Contract permission
FHE.allow(encryptedValue, msg.sender);   // User permission

// ❌ NEVER JUST ONE
FHE.allow(encryptedValue, msg.sender);   // INCOMPLETE!
FHE.allowThis(encryptedValue);           // INCOMPLETE!
```

### Pattern 3: Handle External Encrypted Input

```solidity
// ✅ Convert external to internal
euint32 decrypted = FHE.fromExternal(externalValue, proof);
FHE.allowThis(decrypted);
FHE.allow(decrypted, msg.sender);

// ❌ Don't forget proof
euint32 bad = FHE.fromExternal(externalValue);  // WRONG!
```

### Pattern 4: Multiple Encrypted Values

```solidity
// Encrypt multiple inputs
function submit(
    externalEuint8 value1,
    bytes calldata proof1,
    externalEuint8 value2,
    bytes calldata proof2
) external {
    euint8 dec1 = FHE.fromExternal(value1, proof1);
    euint8 dec2 = FHE.fromExternal(value2, proof2);

    // Grant permissions for EACH value
    FHE.allowThis(dec1);
    FHE.allow(dec1, msg.sender);
    FHE.allowThis(dec2);
    FHE.allow(dec2, msg.sender);

    // Store and use
    data.value1 = dec1;
    data.value2 = dec2;
}
```

### Pattern 5: Encrypted Comparisons

```solidity
// Validate encrypted value without revealing it
euint8 value = FHE.fromExternal(input, proof);

// Check: 1 <= value <= 10
ebool valid = FHE.and(
    FHE.ge(value, FHE.asEuint8(1)),
    FHE.le(value, FHE.asEuint8(10))
);

// Use result in conditional logic
```

### Pattern 6: User Decryption

```typescript
// In tests - authorized user can decrypt
const decrypted = await fhevm.userDecryptEuint(
    FhevmType.euint8,
    encryptedValue,
    contractAddress,
    authorizedSigner  // Must be authorized!
);
```

---

## 🧪 Testing Patterns

### Pattern 1: Correct Usage Test

```typescript
it("✅ should [work correctly]", async function () {
    // Arrange: Setup encrypted input with correct signer
    const enc = await fhevm
        .createEncryptedInput(contractAddr, alice.address)
        .add32(123)
        .encrypt();

    // Act: Execute with correct caller
    await contract.connect(alice).function(
        enc.handles[0],
        enc.inputProof
    );

    // Assert: Verify results
    expect(result).to.equal(expected);
});
```

### Pattern 2: Failure Test

```typescript
it("❌ should prevent [bad behavior]", async function () {
    await expect(
        contract.connect(bob).forbiddenFunction()
    ).to.be.revertedWith("error message");
});
```

### Pattern 3: Wrong Signer Test

```typescript
it("❌ should reject wrong signer", async function () {
    // Encrypt with Alice's address
    const enc = await fhevm
        .createEncryptedInput(contractAddr, alice.address)
        .add32(123)
        .encrypt();

    // Try to use with Bob - should fail
    await expect(
        contract.connect(bob).function(
            enc.handles[0],
            enc.inputProof
        )
    ).to.be.revertedWith("Input signature mismatch");
});
```

---

## 📊 Data Structure Patterns

### Storing Encrypted Data

```solidity
// ✅ Good - Grouped encrypted fields
struct EncryptedReview {
    uint256 paperId;
    address reviewer;
    ebool recommendation;     // Encrypted
    euint8 quality;          // Encrypted
    string comments;          // Public
    uint256 timestamp;        // Public
}

// ❌ Bad - Scattered encrypted fields
mapping(uint256 => ebool) recommendations;
mapping(uint256 => euint8) qualities;
mapping(uint256 => string) comments;
mapping(uint256 => address) reviewers;
```

---

## 🔐 Security Checklist

When writing functions:

- [ ] All parameters validated
- [ ] Access control enforced (require statements)
- [ ] Reentrancy guard used (nonReentrant)
- [ ] Both FHE permissions granted (allowThis + allow)
- [ ] No plaintext sensitive data logged
- [ ] Safe arithmetic (no overflow/underflow)
- [ ] No state changes in view functions
- [ ] Proper error messages
- [ ] Tests for security issues

---

## 📚 File Reference

| File | Purpose | Size |
|------|---------|------|
| `contracts/AcademicReview.sol` | Main example | 8KB |
| `test/AcademicReview.ts` | Test suite | 15KB |
| `hardhat.config.ts` | Configuration | 2KB |
| `package.json` | Dependencies | 4KB |
| `README.md` | Full documentation | 15KB |
| `GETTING_STARTED.md` | Quick start | 10KB |
| `DEPLOYMENT_GUIDE.md` | Deploy steps | 12KB |
| `CONTRIBUTING.md` | Extend guide | 15KB |

---

## 🔍 Debugging Tips

### Contract Won't Compile
```bash
# Check imports
npm run compile

# Check solidity version
npm run lint:sol

# Check syntax
npx hardhat typechain
```

### Tests Failing
```bash
# Check test output
npm run test -- --grep "test name"

# Run with detailed trace
npm run test -- --reporter tap

# Generate coverage
npm run coverage
```

### Deployment Issues
```bash
# Check account balance
npx hardhat accounts --network sepolia

# Check gas estimate
npx hardhat estimate-gas

# Verify RPC URL
curl -X POST $RPC_URL -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

## 📖 Documentation Maps

### For Learning FHEVM
1. README.md → "Key Concepts Demonstrated"
2. GETTING_STARTED.md → "Understanding the Project Structure"
3. contracts/AcademicReview.sol → Read with JSDoc comments
4. test/AcademicReview.ts → Study ✅ and ❌ patterns

### For Extending Project
1. CONTRIBUTING.md → "How to Contribute"
2. CONTRIBUTING.md → "Adding a New Encrypted Contract Function"
3. contracts/ → Look at AcademicReview.sol structure
4. test/ → Copy test patterns

### For Deploying
1. DEPLOYMENT_GUIDE.md → "Pre-Deployment Setup"
2. DEPLOYMENT_GUIDE.md → "Sepolia Testnet Deployment"
3. DEPLOYMENT_GUIDE.md → "Mainnet Deployment"
4. DEPLOYMENT_GUIDE.md → "Verification & Testing"

---

## 🎯 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` |
| Compilation errors | Check imports, run `npm run lint:sol` |
| Test failures | Check signer addresses match encryption |
| "allowThis is not defined" | Add import: `import {FHE} from "@fhevm/solidity/lib/FHE.sol"` |
| Contract size too large | Use optimizer: `runs: 800` |
| Gas limit exceeded | Check loop sizes, optimize operations |
| Permission denied | Check access control requirements |
| Wrong network | Check hardhat.config.ts and --network flag |

---

## 🌐 Useful Links

### Documentation
- FHEVM: https://docs.zama.ai/fhevm
- Hardhat: https://hardhat.org/docs
- ethers.js: https://docs.ethers.org/v6/
- Solidity: https://docs.soliditylang.org/

### Networks
- Sepolia: https://sepoliatestnet.com
- Etherscan: https://etherscan.io
- MetaMask: https://metamask.io

### Community
- Zama: https://www.zama.ai
- Discord: https://discord.com/invite/zama
- GitHub: https://github.com/zama-ai

---

## 💡 Pro Tips

1. **Always test locally first**: `npm run test` before deployment
2. **Use separate accounts**: Alice for creating, Bob for testing
3. **Save contract addresses**: Keep deployment info in safe place
4. **Monitor gas prices**: Check before mainnet deployment
5. **Verify contracts**: Always verify on Etherscan after deployment
6. **Read error messages**: They're specific and helpful
7. **Check permissions**: If FHE fails, check FHE.allow() calls
8. **Use console.log(): Available in hardhat via `hre.ethers.logger.network()`

---

## 📞 Quick Help

**Stuck on something?**
1. Check this file first ⬅️
2. Read the full guide: `GETTING_STARTED.md`
3. Search relevant file: `README.md`, `CONTRIBUTING.md`
4. Check code comments in contracts
5. Ask community: Discord, GitHub Issues

---

**Last Updated**: December 8, 2025
**Version**: 1.0.0

For more details, see the full documentation files!
