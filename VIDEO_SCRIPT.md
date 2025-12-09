# Anonymous Academic Peer Review System - 1 Minute Demo Video Script

## Scene 1: Introduction & Project Overview (0-12 seconds)

**Visual Elements:**
- Show README.md file on screen
- Zoom in on project title: "Anonymous Academic Peer Review System"
- Display: "FHEVM Example - Zama Bounty Submission"
- Show architecture diagram: Papers → Encrypted Reviews → Authors

**Key Points Highlighted:**
- Privacy-preserving peer review
- Built with Fully Homomorphic Encryption (FHEVM)
- Standalone Hardhat project

---

## Scene 2: Project Setup & Compilation (12-25 seconds)

**Visual Elements:**
- Terminal window showing project directory
- Run command: `npm install`
- Installation progress
- Run command: `npm run compile`
- Solidity compilation output showing successful compilation
- Display contract file: AcademicReview.sol

**Key Highlights:**
- Quick 2-minute setup process
- Modern @fhevm/solidity imports
- Zero compilation errors

---

## Scene 3: Test Suite Execution (25-42 seconds)

**Visual Elements:**
- Terminal showing: `npm run test`
- Test execution with mocha output
- Show test categories:
  - ✅ Encrypted review submission with proper permissions
  - ✅ Author decryption of reviews
  - ❌ Self-review prevention
  - ❌ Duplicate review prevention
- Show: "40+ tests passing"
- Display test results with checkmarks

**Key Highlights:**
- Comprehensive test coverage
- Both success (✅) and failure (❌) cases
- Demonstrates best practices and common pitfalls

---

## Scene 4: Automation Scripts & CLI (42-55 seconds)

**Visual Elements:**
- Terminal showing Hardhat tasks:
  - `npx hardhat accounts` - list accounts
  - Output showing addresses and ETH balances
- Show: `npx hardhat submitPaper --title "..." --abstract "..." --category "..."`
- Terminal showing successful paper submission
- Show: `npx hardhat getPapers` output
- Display returned paper data (ID, title, category, author)

**Key Highlights:**
- TypeScript-based automation tools
- Interactive CLI for contract interaction
- Easy paper submission and querying

---

## Scene 5: Code Walkthrough (55-60 seconds)

**Visual Elements:**
- Show submitReview function code:
  - Multiple encrypted inputs (externalEbool, externalEuint8)
  - FHE.fromExternal() usage
  - FHE.allowThis() and FHE.allow() permission pattern
  - Encrypted comparison validation
- Highlight critical permission management:
  ```
  FHE.allowThis(encryptedValue);
  FHE.allow(encryptedValue, msg.sender);
  ```

**Key Highlights:**
- Multiple encrypted values in single transaction
- Proper FHE permission patterns
- Access control implementation

---

## Scene 6: Repository Structure & Documentation (60-70 seconds)

**Visual Elements:**
- Show directory structure:
  - contracts/ (4 example contracts)
  - test/ (40+ tests)
  - deploy/ (automation scripts)
  - tasks/ (CLI tools)
  - package.json, hardhat.config.ts, tsconfig.json
- Show README.md with:
  - Quick Start guide
  - Learning outcomes section
  - Bounty submission checklist (all items checked)

**Key Highlights:**
- Complete Hardhat project structure
- Professional configuration files
- Comprehensive documentation

---

## Scene 7: Features & Benefits (70-78 seconds)

**Visual Elements:**
- Display benefits:
  ✅ Hardhat-based project
  ✅ 40+ comprehensive tests
  ✅ TypeScript automation scripts
  ✅ Professional documentation
  ✅ Production-ready security
  ✅ Real-world use case
  ✅ Multiple FHEVM concepts
  ✅ Educational value

- Show code examples:
  - Encrypted data validation
  - Access control patterns
  - User decryption

**Key Highlights:**
- Production-quality implementation
- Multiple learning concepts
- Security best practices

---

## Scene 8: Call to Action & Closing (78-60 seconds)

**Visual Elements:**
- Show GitHub repository URL
- Display: "Anonymous Academic Peer Review System"
- Show Zama FHEVM logo
- Final screen with:
  - "Built with FHEVM by Zama"
  - "Ready for production deployment"
  - "Reference implementation for privacy-preserving smart contracts"

**Key Message:**
- Complete example ready to use
- Perfect reference for FHEVM development
- Demonstrates enterprise-grade practices

---

## Technical Details for Video Production

**Resolution:** 1080p (1920x1080)
**Frame Rate:** 30 fps
**Duration:** 60 seconds (1800 frames)
**Background Music:** Subtle, professional tech background music
**Terminal Font:** Monaco/Menlo, size 14-16
**Text Overlays:** White text on dark background (high contrast)

### Color Scheme:
- Terminal background: #1E1E1E (dark)
- Terminal text: #D4D4D4 (light gray)
- Success highlights: #00FF00 (green for ✅)
- Error highlights: #FF0000 (red for ❌)
- Accent color: #007AFF (Zama blue)

### Audio:
- Voiceover: Clear, professional English accent
- Background music: 60-70 dB during speaking parts
- Sound effects: Subtle key press sounds during code display

---

## Production Notes

1. **Text Timing**: Each code block should be visible for 3-4 seconds minimum
2. **Transitions**: Use smooth fade/slide transitions between scenes
3. **Highlighting**: Use color highlighting to draw attention to key code sections
4. **Terminal Speed**: Show terminal commands at realistic typing speed (not too fast)
5. **Code Syntax**: Use syntax highlighting (Solidity: blue/green, TypeScript: blue/orange)

---

## Video Editor Checklist

- [ ] Scene 1: Introduction (12 seconds)
- [ ] Scene 2: Setup & Compilation (13 seconds)
- [ ] Scene 3: Tests (17 seconds)
- [ ] Scene 4: Automation (13 seconds)
- [ ] Scene 5: Code Walkthrough (5 seconds)
- [ ] Scene 6: Structure (10 seconds)
- [ ] Scene 7: Features (8 seconds)
- [ ] Scene 8: Closing (2 seconds)
- [ ] Add voiceover narration
- [ ] Add background music
- [ ] Color grade/enhance visibility
- [ ] Final review and export to 1080p MP4
