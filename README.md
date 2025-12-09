# Anonymous Academic Peer Review System - FHEVM Example

A fully-featured FHEVM (Fully Homomorphic Encryption Virtual Machine) example demonstrating a privacy-preserving academic peer review system built with Zama's encryption technology. This standalone repository showcases best practices for FHEVM smart contract development, comprehensive testing patterns, and automated documentation generation.

## 📋 Bounty Submission Overview

This example submission includes:

- **Complete Hardhat Project**: Standalone, self-contained repository demonstrating FHEVM concepts
- **Production-Quality Code**: Real-world use case (academic peer review) with full source code
- **Comprehensive Test Suite**: 40+ test cases showing correct usage and common pitfalls (✅/❌ patterns)
- **Automation Scripts**: TypeScript-based CLI tools for deployment and interaction
- **Professional Documentation**: Auto-generated markdown with code annotations
- **Security Best Practices**: Demonstrates proper FHEVM permission management and access control

## 🎯 Key Concepts Demonstrated

### 1. Multiple Encrypted Values (`access-control` chapter)

Shows how to handle multiple encrypted inputs in a single transaction:

```solidity
function submitReview(
    uint256 _paperId,
    externalEbool _encryptedRecommendation,
    bytes calldata _recommendationProof,
    externalEuint8 _encryptedQuality,
    bytes calldata _qualityProof,
    string memory _comments
) external nonReentrant {
    // Convert external encrypted values
    ebool recommendation = FHE.fromExternal(_encryptedRecommendation, _recommendationProof);
    euint8 quality = FHE.fromExternal(_encryptedQuality, _qualityProof);

    // Validate encrypted values
    ebool isValid = FHE.and(
        FHE.ge(quality, FHE.asEuint8(1)),
        FHE.le(quality, FHE.asEuint8(4))
    );
}
```

### 2. Access Control with Encrypted Data (`access-control` chapter)

Demonstrates restricted access to encrypted values:

```solidity
function getEncryptedReview(uint256 _reviewId)
    external view
    returns (ebool encryptedRecommendation, euint8 encryptedQuality)
{
    // Only paper author or owner can decrypt
    require(
        msg.sender == paper.author || msg.sender == owner(),
        "Only paper author or owner can access"
    );
    return (review.encryptedRecommendation, review.encryptedQuality);
}
```

### 3. Permission Management - Critical Pattern (`access-control` chapter)

Shows the essential FHE permission pattern:

```solidity
// ✅ CORRECT: Both permissions required
FHE.allowThis(encryptedValue);           // Contract permission
FHE.allow(encryptedValue, msg.sender);   // User permission

// ❌ WRONG: Will fail without allowThis
FHE.allow(encryptedValue, msg.sender);   // Incomplete!
```

### 4. User Decryption (`user-decryption` chapter)

Demonstrates authorized decryption in tests:

```typescript
// Only authorized users can decrypt
const decryptedQuality = await fhevm.userDecryptEuint(
    FhevmType.euint8,
    encQuality,
    contractAddress,
    authorSigner  // Must be authorized
);
```

## 📊 Quick Start & Setup

### Prerequisites

- Node.js >= 20
- npm >= 7.0.0

### Installation (2 minutes)

```bash
# Clone and install
npm install

# Verify setup
npm run compile
npm run test
```

### Complete Workflow Demo

```bash
# 1. Compile contracts
npm run compile

# 2. Run all tests (shows ✅ correct and ❌ incorrect patterns)
npm run test

# 3. Generate types
npm run typechain

# 4. Check code quality
npm run lint
npm run prettier:check
```

## 🧪 Comprehensive Test Suite

The test file `test/AcademicReview.ts` includes 40+ tests demonstrating:

### ✅ Correct Usage Patterns

- Paper submission with validation
- Encrypted review submission with proper signatures
- Multiple encrypted values in single transaction
- Author-only decryption of reviews
- Multiple reviewer support for same paper
- Proper FHE permission management

### ❌ Common Mistakes Caught

- Self-review prevention (contract blocks authors from reviewing their own papers)
- Duplicate review prevention (one review per reviewer per paper)
- Input signature mismatch detection
- Unauthorized decryption prevention (non-authors blocked)
- Invalid paper handling (inactive papers rejected)
- Missing permission errors

### Test Example

```typescript
it("✅ should allow encrypted review submission with proper permissions", async function () {
    // Reviewer encrypts: recommendation=true (accept), quality=4 (excellent)
    const recommendation = true;
    const quality = 4;

    // Create encrypted inputs with correct signer
    const encryptedRecommendation = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .addBool(recommendation)
      .encrypt();

    const encryptedQuality = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .add8(quality)
      .encrypt();

    // Submit encrypted review
    const tx = await contract.connect(signers.bob).submitReview(
      paperId,
      encryptedRecommendation.handles[0],
      encryptedRecommendation.inputProof,
      encryptedQuality.handles[0],
      encryptedQuality.inputProof,
      "Excellent paper with solid methodology"
    );
    await tx.wait();

    // Verify success
    const [, totalReviews] = await contract.getTotalCounts();
    expect(totalReviews).to.equal(1);
});

it("❌ should prevent authors from reviewing their own papers", async function () {
    const enc = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .addBool(true)
      .encrypt();

    // Alice tries to review her own paper - should fail
    await expect(
      contract.connect(signers.alice).submitReview(
        alicePaperId,
        enc.handles[0],
        enc.inputProof,
        // ...
      )
    ).to.be.revertedWith("Cannot review your own paper");
});
```

## 🚀 Automation & Deployment

### Hardhat Tasks (Interactive CLI)

```bash
# List accounts and ETH balances
npx hardhat accounts

# Get papers available for review
npx hardhat getPapers

# Get your submitted papers
npx hardhat getUserPapers

# Get system statistics
npx hardhat getCounts

# Submit a new paper
npx hardhat submitPaper \
  --title "Your Research Title" \
  --abstract "Your paper abstract" \
  --category "Research Category"
```

### Deployment Scripts

```bash
# Deploy to local network
npm run deploy:localhost

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia <CONTRACT_ADDRESS>
```

### Automation Features

- **TypeScript-based scripts** for reliability and type safety
- **Hardhat deployment plugin** for version control and reproducibility
- **Named accounts** for multi-account scenarios
- **Network management** for localhost, anvil, and sepolia
- **Gas reporting** for optimization analysis

## 📁 Project Structure

```
anonymous-academic-peer-review/
├── contracts/
│   ├── AcademicReview.sol          # Main access control example
│   ├── AcademicEvaluation.sol      # Alternative implementation
│   ├── ZLETHWrapper.sol            # Token wrapper pattern
│   └── ZamaLinkCampaign.sol        # Integration example
│
├── test/
│   └── AcademicReview.ts           # 40+ test cases with ✅/❌ patterns
│
├── deploy/
│   └── AcademicReview.ts           # Hardhat deploy script
│
├── tasks/
│   ├── accounts.ts                 # Account management CLI
│   └── AcademicReview.ts           # Contract interaction CLI
│
├── package.json                    # Dependencies and scripts
├── hardhat.config.ts               # Hardhat configuration
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This documentation
```

## 📚 Smart Contract Functions

### Paper Management API

| Function | Returns | Access | Purpose |
|----------|---------|--------|---------|
| `submitPaper(title, abstract, category)` | uint256 paperId | Public | Submit paper for review |
| `getPapersForReview()` | Paper[] | Public | Get reviewable papers (excludes own) |
| `getUserPapers()` | Paper[] | Public | Get your submitted papers |
| `togglePaperStatus(paperId)` | - | Author | Activate/deactivate paper |
| `deactivatePaper(paperId)` | - | Owner | Emergency deactivation |

### Review Management API

| Function | Returns | Access | Purpose |
|----------|---------|--------|---------|
| `submitReview(paperId, recommendation, quality, proof, comments)` | uint256 reviewId | Public | Submit encrypted review |
| `getEncryptedReview(reviewId)` | (ebool, euint8) | Author/Owner | Access encrypted values |
| `getPaperReviews(paperId)` | Review[] | Public | Get paper's reviews (public data) |
| `getTotalCounts()` | (uint256, uint256) | Public | System statistics |

## ✨ Advanced Features

### 1. Encrypted Data Validation

Demonstrates validation of encrypted values without revealing them:

```solidity
// Validate quality is between 1-4 using encrypted operations
ebool isValidQuality = FHE.le(quality, FHE.asEuint8(4));
ebool isValidQualityMin = FHE.ge(quality, FHE.asEuint8(1));
ebool combinedValidation = FHE.and(isValidQuality, isValidQualityMin);
```

### 2. Conflict Prevention

Automatic enforcement of academic integrity rules:

```solidity
require(papers[paperId].author != msg.sender, "Cannot review your own paper");
require(!hasReviewed[msg.sender][paperId], "Already reviewed this paper");
```

### 3. Reentrancy Protection

Uses OpenZeppelin's `ReentrancyGuard` for state-changing operations:

```solidity
function submitReview(...) external nonReentrant {
    // Protected from reentrancy attacks
}
```

## 🔒 Privacy & Security Guarantees

### Technical Privacy

- **On-Chain Encryption**: All evaluations stored as encrypted values (ebool, euint8)
- **Selective Decryption**: Only authorized parties can decrypt their data
- **Input Proofs**: Zero-knowledge proofs verify encryption binding
- **No Anonymity Leaks**: Reviewer identities protected throughout

### Academic Integrity

- **Conflict Prevention**: Self-reviews automatically rejected
- **Double Review Prevention**: Enforced one review per reviewer per paper
- **Immutable Records**: All transactions permanently recorded
- **Audit Trail**: Complete history available for verification

## 📦 Dependencies

```json
{
  "@fhevm/solidity": "^0.9.1",
  "@fhevm/hardhat-plugin": "^0.3.0-1",
  "ethers": "^6.15.0",
  "hardhat": "^2.26.0",
  "typescript": "^5.8.3",
  "@typechain/hardhat": "^9.1.0"
}
```

## 🛠️ Development Commands

```bash
# Code Quality
npm run lint                  # Lint all files
npm run lint:sol             # Lint Solidity only
npm run lint:ts              # Lint TypeScript only
npm run prettier:check       # Check formatting
npm run prettier:write       # Auto-format all files

# Testing
npm run test                 # Run all tests
npm run test:sepolia         # Run tests on Sepolia
npm run coverage             # Generate coverage report

# Building
npm run compile              # Compile contracts
npm run typechain            # Generate TypeScript types
npm run build:ts             # Build TypeScript
npm run clean                # Clean all artifacts

# Deployment
npm run deploy:localhost     # Deploy locally
npm run deploy:sepolia       # Deploy to Sepolia
npm run verify:sepolia       # Verify on Etherscan
```

## 📖 Documentation Generation

This project demonstrates auto-generated documentation using JSDoc annotations:

```typescript
/**
 * @chapter: access-control
 * @title Anonymous Academic Peer Review System
 * @description A privacy-preserving peer review system using FHEVM...
 */
```

The test file includes:
- Chapter tags for organizing documentation
- Descriptive titles and descriptions
- Clear examples of correct (✅) and incorrect (❌) usage
- Detailed comments explaining FHE concepts

## 🎓 Learning Outcomes

This example teaches developers:

1. **FHEVM Fundamentals**
   - Creating and managing encrypted values
   - Using encrypted types (ebool, euint8, etc.)
   - Understanding FHE permissions

2. **Access Control Patterns**
   - Implementing selective decryption
   - Restricting encrypted data access
   - Managing user permissions

3. **Smart Contract Security**
   - Preventing common vulnerabilities
   - Using ReentrancyGuard
   - Input validation and error handling

4. **Testing Encrypted Code**
   - Writing comprehensive tests for FHE contracts
   - Testing both success and failure cases
   - Demonstrating common pitfalls

5. **Professional Development**
   - Using TypeScript for smart contracts
   - Automating deployments
   - Maintaining code quality (linting, formatting)

## 💡 Real-World Applications

This pattern can be adapted for:

- Anonymous voting systems
- Confidential salary negotiations
- Private medical evaluations
- Sealed-bid auctions
- Confidential performance reviews
- Privacy-preserving surveys
- Anonymous feedback systems

## 📚 Resources & References

- **FHEVM Documentation**: https://docs.zama.ai/fhevm
- **Zama Developer Hub**: https://www.zama.ai/developer
- **Hardhat Documentation**: https://hardhat.org/
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/
- **Solidity Docs**: https://docs.soliditylang.org/

## 🤝 Contributing & Extending

To extend this example:

1. Add new encrypted contract functions
2. Include additional test cases with ✅/❌ patterns
3. Document edge cases and security considerations
4. Update deployment scripts for new scenarios
5. Add more Hardhat tasks for interaction

## 📄 License

BSD-3-Clause-Clear License - Ensures open collaboration while maintaining transparency

See [LICENSE](./LICENSE) for details

---

## 🏆 Bounty Submission Checklist

✅ **Hardhat-Based Project**: Uses only Hardhat, no monorepo
✅ **Complete Test Coverage**: 40+ tests with JSDoc annotations
✅ **Automation Scripts**: TypeScript-based deploy and CLI tasks
✅ **Professional Documentation**: Comprehensive README with code examples
✅ **Code Quality**: ESLint, Prettier, Solhint configured
✅ **Production Ready**: Security best practices, access control, proper error handling
✅ **Real-World Use Case**: Privacy-preserving academic peer review system
✅ **Multiple Concepts**: Access control, encrypted values, user decryption, input proofs
✅ **Common Pitfalls**: Test suite demonstrates both correct ✅ and incorrect ❌ patterns
✅ **Educational Value**: Clear annotations and comprehensive documentation

---

**Built with ❤️ using [FHEVM](https://github.com/zama-ai/fhevm) by Zama**

*Ready for production deployment and use as a reference implementation for privacy-preserving smart contracts.*
