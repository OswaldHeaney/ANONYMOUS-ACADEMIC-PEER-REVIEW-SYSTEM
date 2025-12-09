# Contributing & Extending Examples

Guidelines for contributing to the Anonymous Academic Peer Review System and creating new FHEVM examples.

## How to Contribute

### 1. Adding a New Encrypted Contract Function

#### Step 1: Design the Function

Ask yourself:
- What encrypted data am I working with?
- How many encrypted inputs do I have?
- What access control is needed?
- How will users decrypt results?

#### Step 2: Write the Contract

```solidity
// ✅ GOOD: Multiple encrypted values with proper permissions
function submitEnhancedReview(
    uint256 _paperId,
    externalEbool _recommendation,
    bytes calldata _recommendationProof,
    externalEuint8 _confidence,
    bytes calldata _confidenceProof
) external nonReentrant {
    // Import encrypted values
    ebool recommendation = FHE.fromExternal(_recommendation, _recommendationProof);
    euint8 confidence = FHE.fromExternal(_confidence, _confidenceProof);

    // Store encrypted data
    review.encryptedRecommendation = recommendation;
    review.encryptedConfidence = confidence;

    // CRITICAL: Grant both permissions
    FHE.allowThis(recommendation);
    FHE.allow(recommendation, msg.sender);
    FHE.allowThis(confidence);
    FHE.allow(confidence, msg.sender);

    // Emit event
    emit ReviewEnhanced(paperId, msg.sender);
}

// ❌ BAD: Missing permission grants
function submitBadReview(uint256 paperId, externalEuint8 quality, bytes calldata proof) external {
    euint8 q = FHE.fromExternal(quality, proof);
    review.encryptedQuality = q;
    // Missing: FHE.allowThis() and FHE.allow()
    // This will fail!
}
```

#### Step 3: Write Tests

```typescript
// test/MyNewFeature.ts
import { ethers, fhevm } from "hardhat";
import { expect } from "chai";

/**
 * @chapter: access-control
 * @title Enhanced Review Submission
 * @description Shows how to handle multiple encrypted inputs with confidence scores
 */
describe("EnhancedReview", function () {
  it("✅ should allow submission with multiple encrypted values", async function () {
    // Encrypt inputs with correct signer
    const encRec = await fhevm
      .createEncryptedInput(contractAddr, alice.address)
      .addBool(true)
      .encrypt();

    const encConf = await fhevm
      .createEncryptedInput(contractAddr, alice.address)
      .add8(9)  // 9/10 confidence
      .encrypt();

    // Submit transaction
    const tx = await contract.connect(alice).submitEnhancedReview(
      paperId,
      encRec.handles[0],
      encRec.inputProof,
      encConf.handles[0],
      encConf.inputProof
    );
    await tx.wait();

    // Verify
    const [, totalReviews] = await contract.getTotalCounts();
    expect(totalReviews).to.equal(1);
  });

  it("❌ should prevent missing permission errors", async function () {
    // This test would check that functions without proper permissions fail
    // (Our contracts should always have both permissions)
  });
});
```

#### Step 4: Update README

Add section to `README.md`:

```markdown
### New Feature: Enhanced Reviews

Demonstrates handling multiple encrypted values with confidence scoring.

```solidity
function submitEnhancedReview(
    uint256 paperId,
    externalEbool recommendation,
    bytes calldata recommendationProof,
    externalEuint8 confidence,
    bytes calldata confidenceProof
) external nonReentrant
```

Shows:
- Multiple encrypted inputs in one transaction
- Proper permission management
- Access control patterns
- Event emissions
```

---

## Style Guide

### Solidity Code

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

// Organize imports: FHEVM, then OpenZeppelin, then custom
import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ContractName
 * @dev Short description of what the contract does
 * @notice Key features and guarantees
 * @chapter: keyword (e.g., access-control, user-decryption)
 */
contract MyContract is ZamaEthereumConfig, Ownable {
    // 1. Events (at top)
    event ActionPerformed(indexed uint256 id, indexed address actor, uint256 timestamp);

    // 2. State variables
    mapping(uint256 => EncryptedData) public data;
    uint256 public totalItems;

    // 3. Constructor
    constructor() Ownable(msg.sender) {}

    // 4. Public functions (external first, then public)
    /**
     * @notice What this function does
     * @param paramName What this parameter means
     * @return returnName What it returns
     */
    function publicFunction(uint256 paramName) external returns (uint256) {
        // Implementation
        emit ActionPerformed(id, msg.sender, block.timestamp);
        return result;
    }

    // 5. Internal functions
    function _internalFunction() internal {
        // Implementation
    }

    // 6. View/Pure functions
    function getStatus() external view returns (bool) {
        return true;
    }
}
```

### TypeScript/Test Code

```typescript
/**
 * @chapter: chapter-name
 * @title Test Suite Title
 * @description What this test suite demonstrates
 */
describe("FeatureName", function () {
  let contract: ContractType;
  let signers: {
    alice: HardhatEthersSigner;
    bob: HardhatEthersSigner;
  };

  before(async function () {
    // Setup shared resources
  });

  beforeEach(async function () {
    // Check if tests can run
    if (!fhevm.isMock) {
      console.warn("Cannot run on testnet");
      this.skip();
    }

    // Deploy fresh instance for each test
  });

  // ✅ Good patterns
  it("✅ should [describe expected behavior]", async function () {
    // Arrange: Setup test data
    const input = await fhevm
      .createEncryptedInput(address, signer.address)
      .add32(123)
      .encrypt();

    // Act: Execute function
    const tx = await contract.connect(signer).function(
      input.handles[0],
      input.inputProof
    );
    await tx.wait();

    // Assert: Verify results
    expect(result).to.equal(expected);
  });

  // ❌ Bad patterns and error cases
  it("❌ should prevent [bad behavior]", async function () {
    await expect(
      contract.connect(signer).badFunction()
    ).to.be.revertedWith("Error message");
  });
});
```

---

## Testing Checklist

When adding new tests:

- [ ] Test success case (✅)
- [ ] Test failure cases (❌)
- [ ] Test with wrong signer (input mismatch)
- [ ] Test without permissions
- [ ] Test access control
- [ ] Test event emissions
- [ ] Test state changes
- [ ] Test edge cases (0, max values)

Example structure:

```typescript
describe("FeatureName", function () {
  describe("Success Cases", function () {
    it("✅ should work with valid input", async function () {});
    it("✅ should emit correct event", async function () {});
  });

  describe("Failure Cases", function () {
    it("❌ should reject invalid input", async function () {});
    it("❌ should reject unauthorized caller", async function () {});
  });

  describe("Edge Cases", function () {
    it("✅ should handle zero values", async function () {});
    it("✅ should handle maximum values", async function () {});
  });
});
```

---

## Documentation Guidelines

### Comments in Code

```solidity
/// @notice One-line description visible to users
/// @dev Implementation details (optional)
/// @param paramName Description of parameter
/// @return returnName Description of return value
function myFunction(uint256 paramName) external returns (uint256) {
    // Single-line comments for logic blocks

    // Multi-line comments for complex sections:
    // - Point 1
    // - Point 2
}
```

### README Sections

Every new example should update README with:

1. **Overview**: What does it demonstrate?
2. **Code Example**: Snippet showing the pattern
3. **Test Examples**: Both ✅ and ❌ cases
4. **Use Cases**: Real-world applications
5. **Common Pitfalls**: What to avoid

---

## Security Checklist

When adding new features:

- [ ] Input validation for all parameters
- [ ] Access control checks (authorized caller?)
- [ ] Reentrancy protection (use nonReentrant)
- [ ] No plain-text sensitive data in logs
- [ ] Proper FHE permissions (allowThis + allow)
- [ ] Safe arithmetic (no overflow/underflow)
- [ ] No state changes in view functions
- [ ] Proper error messages
- [ ] Tests for security issues

---

## Performance Optimization

### Gas Efficiency

```solidity
// ❌ Inefficient: Multiple FHE operations
euint32 a = FHE.asEuint32(10);
euint32 b = FHE.asEuint32(20);
euint32 c = FHE.add(a, b);
euint32 d = FHE.add(c, FHE.asEuint32(30));

// ✅ Efficient: Batch operations when possible
euint32 result = FHE.add(FHE.add(
    FHE.asEuint32(10),
    FHE.asEuint32(20)
), FHE.asEuint32(30));

// ✅ Efficient: Reuse encrypted values
euint32 constant = FHE.asEuint32(1);
euint32 result = FHE.add(value, constant);
```

### Storage Optimization

```solidity
// ❌ Wastes storage (separate encrypted values)
mapping(uint256 => euint32) scores;
mapping(uint256 => ebool) approved;

// ✅ Better: Group related data
struct EncryptedRecord {
    euint32 score;
    ebool approved;
}
mapping(uint256 => EncryptedRecord) records;
```

---

## Pull Request Process

### Before Submitting

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes following style guide
4. Run tests: `npm run test`
5. Check linting: `npm run lint`
6. Update README and documentation
7. Commit with clear messages: `git commit -m "feat: add new feature"`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactor

## Changes Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests passing
- [ ] Linting passing

## Related Issues
Fixes #123

## Screenshots (if applicable)
```

---

## Code Review Process

Reviewers will check:

1. **Correctness**: Does it work as intended?
2. **Security**: Are there vulnerabilities?
3. **Style**: Does it follow guidelines?
4. **Tests**: Is it properly tested?
5. **Documentation**: Is it documented?

---

## Maintenance

### Updating for New FHEVM Versions

When @fhevm/solidity updates:

1. Update package.json
2. Run `npm install`
3. Run `npm run compile` to check compatibility
4. Update any deprecated imports or functions
5. Run full test suite
6. Update CHANGELOG.md
7. Create release notes

Example:

```bash
npm install @fhevm/solidity@latest
npm run compile
npm run test
npm run lint
```

---

## Common Patterns

### Pattern 1: Multiple Encrypted Inputs

```solidity
function processMultipleEncrypted(
    externalEuint32 a,
    bytes calldata aProof,
    externalEuint32 b,
    bytes calldata bProof
) external {
    euint32 decryptedA = FHE.fromExternal(a, aProof);
    euint32 decryptedB = FHE.fromExternal(b, bProof);

    // Grant both permissions for each value
    FHE.allowThis(decryptedA);
    FHE.allow(decryptedA, msg.sender);
    FHE.allowThis(decryptedB);
    FHE.allow(decryptedB, msg.sender);

    // Use encrypted values
    euint32 result = FHE.add(decryptedA, decryptedB);
}
```

### Pattern 2: User-Only Decryption

```solidity
function allowUserDecryption(uint256 id) external {
    EncryptedData storage data = records[id];
    require(data.owner == msg.sender, "Only owner can decrypt");

    // User can now decrypt their encrypted data
    FHE.allow(data.encryptedValue, msg.sender);
}
```

### Pattern 3: Access Control

```solidity
function getEncryptedData(uint256 id) external view returns (euint32) {
    require(
        records[id].owner == msg.sender || msg.sender == owner(),
        "Not authorized"
    );
    return records[id].value;
}
```

---

## Resources

- **FHEVM Docs**: https://docs.zama.ai/fhevm
- **Solidity Best Practices**: https://docs.soliditylang.org/
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/
- **Hardhat Documentation**: https://hardhat.org/docs

---

## Getting Help

- **Zama Community**: https://www.zama.ai/community
- **Discord**: https://discord.com/invite/zama
- **GitHub Issues**: Report bugs and request features

---

**Thanks for contributing to the FHEVM ecosystem! 🚀**
