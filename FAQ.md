# Frequently Asked Questions (FAQ)

Comprehensive answers to common questions about the Anonymous Academic Peer Review System.

## 🤔 General Questions

### Q: What is FHEVM?
**A:** FHEVM (Fully Homomorphic Encryption Virtual Machine) by Zama is a protocol that enables smart contracts to perform computations on encrypted data without revealing the data. This is revolutionary for privacy-preserving applications.

### Q: What does this example demonstrate?
**A:** It demonstrates a privacy-preserving academic peer review system where:
- Papers are submitted publicly
- Reviews are submitted encrypted (hidden from everyone)
- Only paper authors can decrypt their own reviews
- Reviewers remain completely anonymous

### Q: Why would I use this instead of a regular database?
**A:**
- **Immutability**: Records are permanently on the blockchain
- **Verifiability**: Anyone can verify transactions occurred
- **No trusted intermediary**: No single entity controls the data
- **Privacy**: Sensitive data remains encrypted even in storage

### Q: Is this production-ready?
**A:** This is an excellent reference implementation and learning tool. For production:
1. Conduct a professional security audit
2. Test thoroughly on testnet
3. Consider your specific use case requirements
4. Review all security considerations in the README

---

## 🔐 Security & Privacy

### Q: Are my reviews truly private?
**A:** Yes, when using the system correctly:
- Reviews are encrypted with FHE
- Only you can decrypt your own reviews
- The blockchain stores encrypted data only
- No plaintext data is stored

### Q: Can the paper author see which reviewer left which review?
**A:** No, because:
- Reviewer addresses are encrypted in submissions
- Authors only see encrypted evaluation data
- With anonymous option, even metadata is hidden
- Only public comments are visible (and those are optional)

### Q: What if the smart contract creator wants to see my review?
**A:** They cannot, because:
- Contract creator is a standard Ethereum address
- Encrypted data requires your private key to decrypt
- Cryptographic guarantees prevent unauthorized decryption
- Even with onchain access, encrypted bytes are meaningless without decryption key

### Q: What are input proofs?
**A:** Input proofs are zero-knowledge proofs that verify encrypted inputs are correctly formed without revealing the data. They ensure:
- Data was encrypted correctly
- Data hasn't been tampered with
- Signer address matches

### Q: Why do I need both FHE.allowThis() and FHE.allow()?
**A:**
- **allowThis()**: Gives the contract permission to use the encrypted value
- **FHE.allow(address)**: Gives a specific user permission to decrypt
- Both are required for the system to work correctly
- Missing either will cause transaction failures

---

## 🚀 Getting Started

### Q: How long does setup take?
**A:** About 5 minutes:
```bash
npm install        # 2 minutes
npm run compile    # 1 minute
npm run test       # 2 minutes
```

### Q: What do I need to run this?
**A:** Just:
- Node.js 20 or higher
- npm 7 or higher
- A text editor
- Basic Solidity/TypeScript knowledge (to modify)

### Q: Which network should I use first?
**A:** Start with:
1. **Local Hardhat** - Fastest for development
2. **Sepolia Testnet** - Test realistic conditions
3. **Mainnet** - Only after full testing (costs ETH gas)

### Q: How do I know if my deployment worked?
**A:** Check:
```bash
# Look for contract address in output
npm run deploy:sepolia

# Verify on Etherscan
https://sepolia.etherscan.io/address/0xYOUR_ADDRESS
```

---

## 🧪 Testing

### Q: How many tests are included?
**A:** 40+ test cases covering:
- ✅ Success scenarios
- ❌ Failure/security scenarios
- Edge cases
- Access control
- Encryption patterns

### Q: What do the ✅ and ❌ marks mean?
**A:**
- **✅** = Correct behavior (should succeed)
- **❌** = Incorrect behavior (should fail/be prevented)

### Q: Why do some tests fail?
**A:** That's intentional! Tests like "❌ should prevent..." are designed to verify security measures work correctly. They should fail if security is working.

### Q: How do I run a specific test?
**A:**
```bash
npm run test -- --grep "your test name"
npm run test -- --grep "✅"    # Only success tests
npm run test -- --grep "❌"    # Only failure tests
```

---

## 💻 Development

### Q: How do I add a new contract function?
**A:**
1. Add function to contract with JSDoc comments
2. Include @chapter tag for documentation
3. Write ✅ and ❌ tests
4. Update README
5. Run `npm run test` to verify

See `CONTRIBUTING.md` for detailed steps.

### Q: Can I use this with my own token?
**A:** Yes! The ZLETHWrapper demonstrates token wrapping. You can:
1. Create a wrapper for your token
2. Add encrypted balance management
3. Integrate with your application

### Q: How do I integrate this with my dApp?
**A:** The contracts are callable from any web3-enabled frontend:
```typescript
const contract = new ethers.Contract(address, ABI, signer);
const tx = await contract.submitPaper(title, abstract, category);
```

### Q: What's the contract API?
**A:** See CONTRACT_API.md for complete reference, or:
```bash
npx hardhat help submitPaper   # Show task help
npx hardhat submitPaper --help # Show parameters
```

---

## 📊 Performance

### Q: How much does deployment cost?
**A:** On Sepolia (testnet):
- Deployment: ~100k gas (~$0.01 with test ETH)
- Paper submission: ~100k gas
- Review submission: ~150k gas

On mainnet, multiply by current gas price in ETH/USD.

### Q: How long do transactions take?
**A:**
- Hardhat (local): Instant
- Sepolia (testnet): 5-30 seconds
- Mainnet: 12-60 seconds depending on network

### Q: How much data is stored?
**A:** Per review:
- ~500 bytes for encrypted data
- ~200 bytes for metadata
- Plus text comments

### Q: Can I optimize gas usage?
**A:** Yes, see PERFORMANCE.md for:
- Contract optimization techniques
- Call batching strategies
- Efficient encryption patterns

---

## 🔧 Troubleshooting

### Q: "Cannot find module '@fhevm/solidity'"
**A:** Run `npm install` to install dependencies

### Q: "Compilation errors"
**A:**
1. Check imports match modern @fhevm/solidity
2. Run `npm run lint:sol`
3. Verify Solidity version 0.8.24+

### Q: "Test failures - Input signature mismatch"
**A:** The signer in `createEncryptedInput()` must match the transaction caller:
```typescript
// ✅ CORRECT
const enc = await fhevm.createEncryptedInput(addr, alice.address).add32(5).encrypt();
await contract.connect(alice).submit(enc.handles[0], enc.inputProof);

// �� WRONG - Different signer
const enc = await fhevm.createEncryptedInput(addr, alice.address).add32(5).encrypt();
await contract.connect(bob).submit(enc.handles[0], enc.inputProof);
```

### Q: "allowThis is not defined"
**A:** Add the import:
```solidity
import {FHE} from "@fhevm/solidity/lib/FHE.sol";
```

### Q: "Transaction reverted"
**A:** Check:
1. Contract state (is paper active?)
2. Permissions (did you call allowThis + allow?)
3. Input validation (valid parameters?)
4. Access control (are you authorized?)

### Q: "Insufficient gas"
**A:** Increase gas limit:
```bash
# Check current estimate
npx hardhat estimate-gas

# Or in hardhat.config.ts
gasLimit: 5000000
```

### Q: "Contract already verified"
**A:** That's OK! The contract is verified on Etherscan. View it:
`https://sepolia.etherscan.io/address/0x...`

---

## 📚 Learning & Documentation

### Q: Where do I start learning?
**A:** Follow this path:
1. Read GETTING_STARTED.md (15 min)
2. Read README.md sections (30 min)
3. Study AcademicReview.sol code (15 min)
4. Review test examples (20 min)

### Q: What are the key concepts?
**A:**
1. **Multiple Encrypted Values** - Handling 2+ encrypted inputs
2. **Access Control** - Selective decryption
3. **Permissions** - FHE.allowThis() and FHE.allow()
4. **Input Proofs** - Zero-knowledge proof verification
5. **Security** - Preventing common vulnerabilities

### Q: Are there video tutorials?
**A:** Yes! See VIDEO_SCRIPT.md for:
- Production guide (8 scenes)
- Technical specifications
- VOICEOVER with narration

### Q: How do I stay updated?
**A:**
- Watch GitHub for releases
- Join Zama Discord: https://discord.com/invite/zama
- Follow Zama on Twitter: https://twitter.com/zama

---

## 🏆 Contributing & Feedback

### Q: Can I contribute?
**A:** Yes! See CONTRIBUTING.md for:
- Code style guide
- Adding new features
- Writing tests
- Documentation standards
- Pull request process

### Q: Found a bug?
**A:**
1. Check existing issues
2. Create GitHub issue with:
   - Description
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment

### Q: Have a suggestion?
**A:**
1. Open GitHub issue with "enhancement" label
2. Describe use case
3. Explain proposed solution
4. Discuss tradeoffs

### Q: How do I report security issues?
**A:**
1. **Do NOT** post publicly
2. Email security details privately
3. Include affected version and components
4. Allow time for fix before disclosure

---

## 📖 Documentation Reference

### Main Documents
- **README.md** - Complete reference
- **GETTING_STARTED.md** - Quick onboarding
- **DEPLOYMENT_GUIDE.md** - Setup instructions
- **CONTRIBUTING.md** - Extension guidelines
- **QUICK_REFERENCE.md** - Fast lookup

### Code Documentation
- **AcademicReview.sol** - Main contract (commented)
- **test/AcademicReview.ts** - Test examples
- **hardhat.config.ts** - Configuration explained

### Additional Guides
- **VIDEO_SCRIPT.md** - Video production
- **CHANGELOG.md** - Version history
- **PROJECT_INDEX.md** - Navigation

---

## 🔗 External Resources

### Zama FHEVM
- Documentation: https://docs.zama.ai/fhevm
- GitHub: https://github.com/zama-ai/fhevm
- Community: https://www.zama.ai/community

### Hardhat
- Documentation: https://hardhat.org/docs
- GitHub: https://github.com/hardhat

### Ethereum & Solidity
- Solidity Docs: https://docs.soliditylang.org/
- Ethereum Docs: https://ethereum.org/developers
- ethers.js: https://docs.ethers.org/v6/

---

## ❓ Didn't find your answer?

1. Check QUICK_REFERENCE.md for fast lookup
2. Search code comments
3. Review test examples
4. Open GitHub issue
5. Ask Zama community

---

**Last Updated**: December 8, 2025
**Version**: 1.0.0

For more help, see the full documentation in the repository!
