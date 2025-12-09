# Architecture & Design Documentation

Comprehensive system architecture and design patterns for the Anonymous Academic Peer Review System.

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend dApp Layer                      │
│  (Web3.js/ethers.js, MetaMask, User Interface)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Encrypted Transactions
                     │ (FHEVM + Zero-Knowledge Proofs)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Blockchain Transaction Layer                      │
│  (Gas-optimized calls, Event logging, State changes)        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Smart Contract Layer (FHEVM Contracts)              │
│ ┌──────────────────┬──────────────────┬───────────────────┐│
│ │ AcademicReview   │ AcademicEval     │ ZLETHWrapper      ││
│ │ (Main logic)     │ (Alternative)    │ (Token wrapper)   ││
│ └──────────────────┴──────────────────┴───────────────────┘│
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Encrypted Data Storage (on-chain)                       ││
│ │ • Papers (plaintext metadata)                           ││
│ │ • Reviews (encrypted recommendation + quality)         ││
│ │ • Encrypted state (balances, counters)                ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  FHEVM Encryption Engine   │
        │  • FHE.fromExternal()      │
        │  • FHE.allow() / allowThis │
        │  • Encrypted Operations    │
        └────────────────────────────┘
```

---

## Core Components

### 1. AcademicReview Contract

**Purpose**: Main peer review functionality

**State Variables**:
```solidity
mapping(uint256 => Paper) papers              // Paper metadata
mapping(uint256 => Review) reviews            // Review data (encrypted)
mapping(address => uint256[]) userPapers     // User's papers
mapping(uint256 => uint256[]) paperReviews   // Paper's reviews
```

**Key Functions**:

| Function | Type | Input | Output | Encrypted |
|----------|------|-------|--------|-----------|
| submitPaper | State | title, abstract, category | paperId | None |
| submitReview | State | paperId, enc_rec, enc_qual, comments | reviewId | Yes |
| getEncryptedReview | View | reviewId | (ebool, euint8) | Yes |
| getPapersForReview | View | none | Paper[] | None |
| getPaperReviews | View | paperId | Review[] | None |
| getTotalCounts | View | none | (papers, reviews) | None |

**Access Control**:
- Public: submitPaper, getPapersForReview, getUserPapers
- Author-only: togglePaperStatus, getEncryptedReview
- Owner-only: deactivatePaper

### 2. AcademicEvaluation Contract

**Purpose**: Multi-criteria evaluation with more fields

**Encrypted Fields**:
- recommendation (ebool)
- originality (euint8)
- quality (euint8)
- clarity (euint8)
- significance (euint8)

**Enhancement**: Demonstrates storing multiple encrypted uint8 fields

### 3. ZLETHWrapper Contract

**Purpose**: ETH ⇄ ZLETH conversion with encrypted balances

**Key Features**:
- Deposit ETH → receive ZLETH
- Encrypted balance storage
- Confidential transfers
- Async withdrawal via oracle
- Rate conversion (1 ETH = 1e9 ZLETH)

### 4. ZamaLinkCampaign Contract

**Purpose**: Private fundraising with ZLETH integration

**Features**:
- Create campaigns
- Private ZLETH donations
- Anonymous donation option
- Encrypted donation totals
- Automatic ETH-ZLETH wrapping/unwrapping

---

## Data Flow Diagrams

### Paper Submission Flow

```
User submits paper
    ▼
Check validation
    ▼
Create Paper struct
    ▼
Store in mapping
    ▼
Emit PaperSubmitted event
    ▼
Return paperId
```

### Encrypted Review Submission Flow

```
User encrypts review (client-side)
    ▼
Encrypted values + input proofs
    ▼
Submit transaction
    ▼
Convert external → internal encrypted
    ▼
Validate (optionally with encrypted comparisons)
    ▼
Grant FHE permissions
    ├─ FHE.allowThis()
    └─ FHE.allow(address)
    ▼
Store encrypted data
    ▼
Update mappings
    ▼
Emit ReviewSubmitted event
    ▼
Emit onchain (data encrypted)
```

### Decryption Flow (Author-Only)

```
Paper author calls getEncryptedReview(reviewId)
    ▼
Check authorization
    ├─ require(msg.sender == paper.author || owner)
    ├─ Returns encrypted data only
    ▼
Author has FHE permissions (pre-granted)
    ▼
Client-side decryption with private key
    ▼
Author sees plaintext review
```

---

## Encryption Model

### Input Encryption (Client → Contract)

```
User's plaintext value
    ▼
Encrypt with FHEVM SDK
    ├─ Contract address binding
    ├─ User signer binding
    └─ Zero-knowledge proof generation
    ▼
externalEuint8 (encrypted bytes)
bytes inputProof (zero-knowledge proof)
    ▼
Send via transaction
```

### On-Chain Storage

```
Receive externalEuint8 + proof
    ▼
FHE.fromExternal(externalEuint8, proof)
    ▼
euint8 (internal encrypted type)
    ▼
Store in contract state
    ▼
Grant permissions:
    ├─ FHE.allowThis() - contract can use it
    └─ FHE.allow(user) - user can decrypt it
    ▼
Data now encrypted on-chain
```

### User Decryption (Authorized Only)

```
User is in FHE.allow() permission list
    ▼
Call fhevm.userDecryptEuint()
    ├─ Contract address
    ├─ Encrypted value
    └─ User signer
    ▼
Decrypt locally (private key)
    ▼
Plaintext value (only for authorized user)
```

---

## Security Architecture

### Access Control Layers

```
Layer 1: Smart Contract Level
├─ Require statements (basic checks)
├─ Onlyowner/onlyauth modifiers
├─ Reentrancy guards
└─ State validation

Layer 2: FHE Encryption
├─ Data encrypted on-chain
├─ Permission-based access
├─ Zero-knowledge proofs
└─ No decryption without permission

Layer 3: Cryptographic Guarantees
├─ Encrypted storage (unreadable without key)
├─ Input proofs (prevents tampering)
├─ Binding to address (prevents reuse)
└─ Immutable blockchain (prevents rollback)
```

### Threat Model & Mitigations

| Threat | Mitigation |
|--------|-----------|
| Author reviews own paper | Require statement: `papers[id].author != msg.sender` |
| Duplicate reviews | Require statement: `!hasReviewed[msg.sender][paperId]` |
| Reentrancy attack | `nonReentrant` modifier on state-changing functions |
| Unauthorized decryption | FHE.allow() list checks before returning encrypted data |
| Missing FHE permissions | Both allowThis() and allow() required (tests verify) |
| Encrypted data leakage | Data stored as encrypted bytes (meaningless without key) |
| Input tampering | Zero-knowledge proofs verify correct encryption |

---

## State Management

### Paper State Lifecycle

```
SUBMITTED
    ↓
ACTIVE ← → INACTIVE
    ↓
DEACTIVATED (owner-only)
```

### Review State Lifecycle

```
SUBMITTED (encrypted)
    ↓
ACCESSIBLE TO AUTHOR (permissions granted)
    ↓
IMMUTABLE (blockchain permanent)
```

### Permission State Lifecycle

```
DEFAULT: No permissions
    ↓
FHE.allowThis() granted (contract can use)
    ↓
FHE.allow(user) granted (user can decrypt)
    ↓
PERMANENT: Permissions cannot be revoked
```

---

## Gas Optimization Strategies

### Storage Optimization

```solidity
// ❌ Wastes storage - separate mappings
mapping(uint256 => ebool) recommendations;
mapping(uint256 => euint8) qualities;
mapping(uint256 => uint256) timestamps;
mapping(uint256 => string) comments;

// ✅ Better - struct packing
struct Review {
    ebool recommendation;
    euint8 quality;
    uint256 timestamp;
    string comments;
}
mapping(uint256 => Review) reviews;
```

### Operation Optimization

```solidity
// ❌ Inefficient - multiple calls
FHE.allowThis(value1);
FHE.allowThis(value2);
FHE.allowThis(value3);

// ✅ Efficient - batch in loop if needed
for (uint i = 0; i < 3; i++) {
    FHE.allowThis(values[i]);
}
```

### Loop Optimization

```solidity
// ❌ Inefficient - unbounded loop
for (uint i = 1; i <= paperCount; i++) {
    // Check every paper
}

// ✅ Better - bounded and filtered
function getPapersForReview() external view returns (Paper[] memory) {
    uint256 availableCount = 0;
    // Count first pass
    for (uint256 i = 1; i <= paperCount; i++) {
        if (papers[i].isActive && papers[i].author != msg.sender) {
            availableCount++;
        }
    }
    // Build array with correct size
    Paper[] memory available = new Paper[](availableCount);
    // ... populate
}
```

---

## Scalability Considerations

### Current Limitations

1. **Storage**: Each review requires encrypted storage
2. **Computation**: FHE operations more expensive than regular ops
3. **Throughput**: Limited by Ethereum block time
4. **State Size**: Grows with number of papers and reviews

### Future Scaling Solutions

1. **Layer 2**: Deploy on Polygon/Arbitrum (lower gas)
2. **Batch Operations**: Process multiple reviews together
3. **Data Archival**: Move old reviews to IPFS
4. **Sharding**: Distribute across multiple contracts

---

## Testing Architecture

### Test Organization

```
test/
└── AcademicReview.ts
    ├── Paper Submission
    │   ├── ✅ Valid submission
    │   ├── ❌ Invalid inputs
    │   └── Edge cases
    ├── Review Submission
    │   ├── ✅ Encrypted submission
    │   ├── ✅ Permissions granted
    │   ├── ❌ Self-review
    │   ├── ❌ Duplicate review
    │   └── ❌ Wrong signer
    ├── Decryption
    │   ├── ✅ Author decryption
    │   └── ❌ Unauthorized access
    └── Edge Cases
        ├── ✅ Boundary values
        └── ❌ Invalid states
```

### Test Categories

1. **Unit Tests**: Individual function behavior
2. **Integration Tests**: Contract interactions
3. **Security Tests**: Access control verification
4. **Encryption Tests**: FHE pattern correctness
5. **Edge Cases**: Boundary conditions

---

## Deployment Architecture

### Network Support

```
Development
├─ Hardhat local network
├─ Anvil fork
└─ Ganache

Testing
├─ Sepolia testnet
└─ Goerli testnet

Production
└─ Ethereum mainnet
```

### Deployment Pipeline

```
Code
    ▼
Compile (tsc + solc)
    ▼
Lint (ESLint + solhint)
    ▼
Format (Prettier)
    ▼
Unit Tests
    ▼
Coverage Report
    ▼
Deploy (hardhat-deploy)
    ▼
Verify on Etherscan
    ▼
Integration Test
    ▼
Monitor
```

---

## Monitoring & Observability

### Key Events

```solidity
event PaperSubmitted(uint256 indexed paperId, address indexed author);
event ReviewSubmitted(uint256 indexed reviewId, uint256 indexed paperId);
event ReviewDecrypted(uint256 indexed reviewId, bool recommendation);
```

### Monitoring Points

1. **Paper Submissions**: Track activity levels
2. **Review Submissions**: Monitor engagement
3. **Access Attempts**: Verify authorization
4. **Transaction Failures**: Identify issues

### Metrics to Track

- Papers created per day
- Reviews per paper
- Success/failure ratio
- Average gas usage
- Decryption requests

---

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| submitPaper | O(1) | Simple storage |
| submitReview | O(1) | Mapping insertion |
| getPapersForReview | O(n) | n = paperCount |
| getPaperReviews | O(1) | Pre-stored array |
| getEncryptedReview | O(1) | Direct access |

### Space Complexity

| Data | Storage | Growth |
|------|---------|--------|
| Paper | ~500 bytes | Linear with papers |
| Review | ~1000 bytes (encrypted) | Linear with reviews |
| Mapping | ~32 bytes per entry | Linear |

### Gas Estimates

| Operation | Gas | Cost (Sepolia) |
|-----------|-----|---|
| Deploy | ~100k | ~$0.01 |
| Submit Paper | ~100k | ~$0.01 |
| Submit Review | ~150k | ~$0.015 |
| Get Papers | 0 (view) | Free |
| Decrypt | 0 (view) | Free |

---

## Future Architecture Improvements

### Planned Enhancements

1. **Batching**: Process multiple operations atomically
2. **Upgradeable Contracts**: Proxy pattern for updates
3. **Multi-sig**: Committee-based governance
4. **Oracles**: Real-world data integration
5. **Notifications**: Event-driven alerts

### Potential Extensions

1. **ERC7984 Integration**: Confidential token features
2. **Blind Auctions**: Sealed-bid patterns
3. **Voting**: Privacy-preserving voting
4. **Insurance**: Confidential claim processing

---

## Architecture Decision Records (ADRs)

### ADR-1: Direct Encryption vs Proxy Encryption

**Decision**: Direct encryption on contract

**Rationale**:
- Simpler architecture
- No proxy dependencies
- Direct control
- Transparent permissions

**Tradeoff**: Slightly higher gas costs

### ADR-2: Storage Pattern for Encrypted Data

**Decision**: Use structs for related encrypted fields

**Rationale**:
- Better organization
- Easier to extend
- More efficient storage
- Type safety

**Tradeoff**: Can't store arrays of encrypted values easily

### ADR-3: Permission Model

**Decision**: FHE.allow() + FHE.allowThis() both required

**Rationale**:
- Explicit permission control
- Contract and user authorization
- Prevents accidental leaks
- Industry standard pattern

**Tradeoff**: Requires developer discipline

---

## References

- FHEVM Architecture: https://docs.zama.ai/fhevm/architecture
- Smart Contract Patterns: https://docs.soliditylang.org/
- EIP-2891 (Encrypted Storage): https://eips.ethereum.org/EIPS/eip-2891
- Threat Modeling: https://www.owasp.org/index.php/Threat_Model

---

**Last Updated**: December 8, 2025
**Version**: 1.0.0

For detailed code examples, see the source files. For deployment details, see DEPLOYMENT_GUIDE.md.
