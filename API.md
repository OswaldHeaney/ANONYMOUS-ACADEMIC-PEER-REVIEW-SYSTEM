# Smart Contract API Reference

Complete API documentation for all smart contracts in the Anonymous Academic Peer Review System.

## AcademicReview Contract

Contract for managing papers and encrypted reviews with privacy-preserving features.

### Address
```
Sepolia Testnet: [To be deployed]
Mainnet: [To be deployed]
```

### State Variables

#### Public Mappings

```solidity
mapping(uint256 => Paper) papers
mapping(uint256 => Review) reviews
mapping(address => uint256[]) userPapers
mapping(uint256 => uint256[]) paperReviews
mapping(address => mapping(uint256 => bool)) hasReviewed
```

#### Public Counters

```solidity
uint256 paperCounter          // Total papers submitted
uint256 reviewCounter         // Total reviews submitted
```

---

## Paper Management Functions

### submitPaper

Submit a new paper for review.

**Function Signature**
```solidity
function submitPaper(
    string memory _title,
    string memory _paperAbstract,
    string memory _category
) external nonReentrant
```

**Parameters**
| Name | Type | Description |
|------|------|-------------|
| _title | string | Paper title (required, non-empty) |
| _paperAbstract | string | Paper abstract (required, non-empty) |
| _category | string | Research category (required, non-empty) |

**Returns**
None (emits PaperSubmitted event with paperId)

**Access Control**
- Public (anyone)

**Events**
```solidity
event PaperSubmitted(
    uint256 indexed paperId,
    address indexed author,
    string title,
    string category
)
```

**Gas Estimate**
~100k gas

**Example**
```typescript
const tx = await contract.submitPaper(
    "Advances in FHE",
    "This paper explores recent advances in fully homomorphic encryption...",
    "Cryptography"
);
await tx.wait();
const receipt = tx;  // paperId in events
```

**Errors**
- `"Title cannot be empty"` - Title is required
- `"Abstract cannot be empty"` - Abstract is required
- `"Category cannot be empty"` - Category is required

---

### getPapersForReview

Get all papers available for the caller to review (excludes own papers and already-reviewed papers).

**Function Signature**
```solidity
function getPapersForReview() external view returns (Paper[] memory)
```

**Parameters**
None

**Returns**
| Type | Description |
|------|-------------|
| Paper[] | Array of reviewable papers |

**Access Control**
- Public (caller-specific)

**Example**
```typescript
const papers = await contract.getPapersForReview();
papers.forEach(paper => {
    console.log(`${paper.id}: ${paper.title}`);
});
```

**Paper Struct**
```solidity
struct Paper {
    uint256 id;           // Unique paper ID
    string title;         // Paper title
    string paperAbstract; // Paper abstract
    string category;      // Research category
    address author;       // Paper author address
    uint256 timestamp;    // Submission timestamp
    uint256 reviewCount;  // Number of reviews
    bool isActive;        // Is paper accepting reviews
}
```

---

### getUserPapers

Get all papers submitted by the caller.

**Function Signature**
```solidity
function getUserPapers() external view returns (Paper[] memory)
```

**Parameters**
None

**Returns**
| Type | Description |
|------|-------------|
| Paper[] | Array of user's papers |

**Access Control**
- Public (caller-specific)

**Example**
```typescript
const myPapers = await contract.getUserPapers();
console.log(`You have submitted ${myPapers.length} papers`);
```

---

### togglePaperStatus

Activate or deactivate a paper (only author can call).

**Function Signature**
```solidity
function togglePaperStatus(uint256 _paperId) external
```

**Parameters**
| Name | Type | Description |
|------|------|-------------|
| _paperId | uint256 | ID of paper to toggle |

**Returns**
None (modifies isActive status)

**Access Control**
- Paper author only

**Example**
```typescript
// Deactivate paper (stop receiving reviews)
await contract.togglePaperStatus(1);

// Reactivate
await contract.togglePaperStatus(1);
```

**Errors**
- `"Invalid paper ID"` - Paper doesn't exist
- `"Only paper author can toggle status"` - Unauthorized

---

### deactivatePaper

Emergency function to deactivate a paper (owner only).

**Function Signature**
```solidity
function deactivatePaper(uint256 _paperId) external onlyOwner
```

**Parameters**
| Name | Type | Description |
|------|------|-------------|
| _paperId | uint256 | ID of paper to deactivate |

**Returns**
None

**Access Control**
- Contract owner only

**Example**
```typescript
// Owner emergency action
await contract.deactivatePaper(1);
```

**Errors**
- `"Invalid paper ID"` - Paper doesn't exist
- `OwnableUnauthorizedAccount` - Not contract owner

---

## Review Management Functions

### submitReview

Submit an encrypted review for a paper.

**Function Signature**
```solidity
function submitReview(
    uint256 _paperId,
    externalEbool _encryptedRecommendation,
    bytes calldata _recommendationProof,
    externalEuint8 _encryptedQuality,
    bytes calldata _qualityProof,
    string memory _comments
) external nonReentrant
```

**Parameters**
| Name | Type | Description |
|------|------|-------------|
| _paperId | uint256 | ID of paper to review |
| _encryptedRecommendation | externalEbool | Encrypted recommendation (accept/reject) |
| _recommendationProof | bytes | Input proof for recommendation |
| _encryptedQuality | externalEuint8 | Encrypted quality score (1-4) |
| _qualityProof | bytes | Input proof for quality |
| _comments | string | Public review comments (optional) |

**Returns**
None (emits ReviewSubmitted event with reviewId)

**Access Control**
- Public (with validation)

**Events**
```solidity
event ReviewSubmitted(
    uint256 indexed reviewId,
    uint256 indexed paperId,
    address indexed reviewer
)
```

**Gas Estimate**
~150k gas

**Example**
```typescript
// Encrypt review data
const recommendation = true;  // accept
const quality = 4;            // excellent

const encRecommendation = await fhevm
    .createEncryptedInput(contractAddr, alice.address)
    .addBool(recommendation)
    .encrypt();

const encQuality = await fhevm
    .createEncryptedInput(contractAddr, alice.address)
    .add8(quality)
    .encrypt();

// Submit encrypted review
const tx = await contract.connect(alice).submitReview(
    paperId,
    encRecommendation.handles[0],
    encRecommendation.inputProof,
    encQuality.handles[0],
    encQuality.inputProof,
    "Excellent paper with solid methodology"
);
await tx.wait();
```

**Encryption Requirements**
- Both inputs must be encrypted with correct signer address
- Input proofs must match the encrypted data
- Recommendation and Quality must have valid ranges (1-4)

**Errors**
- `"Invalid paper ID"` - Paper doesn't exist
- `"Paper is not active"` - Paper not accepting reviews
- `"Cannot review your own paper"` - Self-review attempt
- `"Already reviewed this paper"` - Duplicate review
- `"Input signature mismatch"` - Wrong signer for encryption

---

### getEncryptedReview

Get encrypted review data (author or owner only).

**Function Signature**
```solidity
function getEncryptedReview(uint256 _reviewId)
    external view
    returns (ebool encryptedRecommendation, euint8 encryptedQuality)
```

**Parameters**
| Name | Type | Description |
|------|------|-------------|
| _reviewId | uint256 | ID of review to retrieve |

**Returns**
| Type | Description |
|------|-------------|
| ebool | Encrypted recommendation |
| euint8 | Encrypted quality score |

**Access Control**
- Paper author only
- Contract owner

**Example**
```typescript
// Paper author retrieves encrypted review
const [encRecommendation, encQuality] = await contract
    .connect(paperAuthor)
    .getEncryptedReview(reviewId);

// Decrypt client-side with private key
const recommendation = await fhevm.userDecryptEbool(
    encRecommendation,
    contractAddr,
    paperAuthor
);

const quality = await fhevm.userDecryptEuint(
    FhevmType.euint8,
    encQuality,
    contractAddr,
    paperAuthor
);
```

**Errors**
- `"Invalid review ID"` - Review doesn't exist
- `"Only paper author or owner can access"` - Unauthorized

---

### getPaperReviews

Get all public review information for a paper.

**Function Signature**
```solidity
function getPaperReviews(uint256 _paperId)
    external view
    returns (Review[] memory)
```

**Parameters**
| Name | Type | Description |
|------|------|-------------|
| _paperId | uint256 | ID of paper |

**Returns**
| Type | Description |
|------|-------------|
| Review[] | Array of reviews (public data only) |

**Access Control**
- Public

**Review Struct (Public Fields Only)**
```solidity
struct Review {
    uint256 paperId;                    // Paper ID
    address reviewer;                   // Reviewer address
    ebool encryptedRecommendation;      // Encrypted (not in this view)
    euint8 encryptedQuality;            // Encrypted (not in this view)
    string comments;                    // Public comments
    uint256 timestamp;                  // Review timestamp
}
```

**Example**
```typescript
const reviews = await contract.getPaperReviews(paperId);
reviews.forEach(review => {
    console.log(`Review at ${review.timestamp}: ${review.comments}`);
});
```

**Note**
Encrypted fields are returned but not decryptable without authorization.

---

## Statistics Functions

### getTotalCounts

Get total number of papers and reviews.

**Function Signature**
```solidity
function getTotalCounts()
    external view
    returns (uint256 totalPapers, uint256 totalReviews)
```

**Parameters**
None

**Returns**
| Type | Description |
|------|-------------|
| uint256 | Total papers submitted |
| uint256 | Total reviews submitted |

**Access Control**
- Public

**Example**
```typescript
const [papers, reviews] = await contract.getTotalCounts();
console.log(`System has ${papers} papers and ${reviews} reviews`);
```

---

## Events

### PaperSubmitted

```solidity
event PaperSubmitted(
    uint256 indexed paperId,
    address indexed author,
    string title,
    string category
)
```

**Parameters**
| Name | Type | Description |
|------|------|-------------|
| paperId | uint256 (indexed) | ID of submitted paper |
| author | address (indexed) | Paper author address |
| title | string | Paper title |
| category | string | Research category |

---

### ReviewSubmitted

```solidity
event ReviewSubmitted(
    uint256 indexed reviewId,
    uint256 indexed paperId,
    address indexed reviewer
)
```

**Parameters**
| Name | Type | Description |
|------|------|-------------|
| reviewId | uint256 (indexed) | ID of submitted review |
| paperId | uint256 (indexed) | ID of reviewed paper |
| reviewer | address (indexed) | Reviewer address |

---

### ReviewDecrypted

```solidity
event ReviewDecrypted(
    uint256 indexed reviewId,
    bool recommendation,
    uint8 quality
)
```

**Parameters**
| Name | Type | Description |
|------|------|-------------|
| reviewId | uint256 (indexed) | ID of review |
| recommendation | bool | Decrypted recommendation |
| quality | uint8 | Decrypted quality score |

---

## Hardhat Tasks

### accounts

List all available accounts and their balances.

**Usage**
```bash
npx hardhat accounts --network [network]
```

**Output**
```
0x1234...5678 (100.0 ETH)
0xabcd...ef00 (100.0 ETH)
...
```

### submitPaper

Submit a paper via CLI.

**Usage**
```bash
npx hardhat submitPaper \
  --title "Paper Title" \
  --abstract "Paper abstract..." \
  --category "Category" \
  --network [network]
```

**Parameters**
- `--title`: Paper title
- `--abstract`: Paper abstract
- `--category`: Research category
- `--network`: Network (default: hardhat)

### getPapers

Get papers available for review.

**Usage**
```bash
npx hardhat getPapers --network [network]
```

### getUserPapers

Get user's submitted papers.

**Usage**
```bash
npx hardhat getUserPapers --network [network]
```

### getCounts

Get system statistics.

**Usage**
```bash
npx hardhat getCounts --network [network]
```

**Output**
```
Total Papers: 5
Total Reviews: 12
```

---

## Deployment Information

### Prerequisites
- Node.js 20+
- npm 7+
- Hardhat
- @fhevm/solidity v0.9.1+

### Deployment Steps

```bash
# 1. Install dependencies
npm install

# 2. Compile
npm run compile

# 3. Deploy locally
npx hardhat run --no-compile deploy/AcademicReview.ts

# 4. Deploy to Sepolia
npm run deploy:sepolia

# 5. Verify
npm run verify:sepolia 0xCONTRACT_ADDRESS
```

---

## Integration Examples

### Web3.js Integration

```typescript
const Web3 = require('web3');
const web3 = new Web3('https://sepolia.infura.io/v3/YOUR_KEY');

const abi = require('./abi/AcademicReview.json');
const contract = new web3.eth.Contract(abi, '0x...');

const papers = await contract.methods.getTotalCounts().call();
```

### ethers.js Integration

```typescript
import { ethers } from 'ethers';

const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_KEY');
const contract = new ethers.Contract(address, abi, provider);

const papers = await contract.getTotalCounts();
```

### Hardhat Integration

```typescript
import { ethers } from "hardhat";

const contract = await ethers.getContractAt("AcademicReview", address);
const tx = await contract.submitPaper(title, abstract, category);
```

---

## Error Codes & Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `"Title cannot be empty"` | Missing title | Provide non-empty title |
| `"Abstract cannot be empty"` | Missing abstract | Provide non-empty abstract |
| `"Category cannot be empty"` | Missing category | Provide non-empty category |
| `"Invalid paper ID"` | Paper doesn't exist | Use valid paper ID |
| `"Paper is not active"` | Paper deactivated | Check paper status |
| `"Cannot review your own paper"` | Self-review | Review another paper |
| `"Already reviewed this paper"` | Duplicate review | Choose different paper |
| `"Input signature mismatch"` | Wrong signer | Match encryption signer to caller |
| `"Only paper author can toggle status"` | Not authorized | Must be paper author |
| `OwnableUnauthorizedAccount` | Not owner | Only contract owner |

---

## Rate Limiting & Quotas

None currently implemented. Consider adding for production:
- Max reviews per user per paper
- Max papers per author per period
- Cooldown between submissions

---

## Changelog

### v1.0.0 (December 8, 2025)
- Initial release
- Core paper and review management
- Encrypted review storage
- Author-only decryption

---

**Last Updated**: December 8, 2025
**API Version**: 1.0.0

For more examples, see `test/AcademicReview.ts` and `README.md`
