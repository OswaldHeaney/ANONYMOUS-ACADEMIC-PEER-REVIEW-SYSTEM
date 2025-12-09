import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { AcademicReview, AcademicReview__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

/**
 * @chapter: access-control
 * @title Anonymous Academic Peer Review System
 * @description A privacy-preserving peer review system using FHEVM that encrypts reviewer evaluations
 *
 * This example demonstrates:
 * - How to submit encrypted review ratings using FHE.fromExternal()
 * - Proper access control patterns with FHE.allowThis() and FHE.allow()
 * - User decryption for authorized parties (paper authors)
 * - Preventing conflicts of interest (no self-reviews)
 * - Multiple encrypted values in a single transaction
 */

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  carol: HardhatEthersSigner;
};

/**
 * Test fixture that deploys the AcademicReview contract
 */
async function deployFixture() {
  const factory = (await ethers.getContractFactory("AcademicReview")) as AcademicReview__factory;
  const academicReviewContract = (await factory.deploy()) as AcademicReview;
  const academicReviewContractAddress = await academicReviewContract.getAddress();

  return { academicReviewContract, academicReviewContractAddress };
}

describe("AcademicReview", function () {
  let signers: Signers;
  let academicReviewContract: AcademicReview;
  let academicReviewContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      carol: ethSigners[3]
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ academicReviewContract, academicReviewContractAddress } = await deployFixture());
  });

  describe("Paper Submission", function () {
    it("should allow users to submit papers", async function () {
      const title = "Advances in Fully Homomorphic Encryption";
      const paperAbstract = "This paper explores recent advances in FHE technology...";
      const category = "Cryptography";

      const tx = await academicReviewContract
        .connect(signers.alice)
        .submitPaper(title, paperAbstract, category);
      await tx.wait();

      const [totalPapers] = await academicReviewContract.getTotalCounts();
      expect(totalPapers).to.equal(1);

      const userPapers = await academicReviewContract.connect(signers.alice).getUserPapers();
      expect(userPapers.length).to.equal(1);
      expect(userPapers[0].title).to.equal(title);
      expect(userPapers[0].author).to.equal(signers.alice.address);
    });

    it("should reject papers with empty title", async function () {
      await expect(
        academicReviewContract
          .connect(signers.alice)
          .submitPaper("", "Abstract", "Category")
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("should reject papers with empty abstract", async function () {
      await expect(
        academicReviewContract
          .connect(signers.alice)
          .submitPaper("Title", "", "Category")
      ).to.be.revertedWith("Abstract cannot be empty");
    });

    it("should reject papers with empty category", async function () {
      await expect(
        academicReviewContract
          .connect(signers.alice)
          .submitPaper("Title", "Abstract", "")
      ).to.be.revertedWith("Category cannot be empty");
    });
  });

  describe("Review Submission", function () {
    beforeEach(async function () {
      // Alice submits a paper first
      const tx = await academicReviewContract
        .connect(signers.alice)
        .submitPaper(
          "Homomorphic Encryption for Privacy",
          "This research investigates FHE applications...",
          "Cryptography"
        );
      await tx.wait();
    });

    it("✅ should allow encrypted review submission with proper permissions", async function () {
      // Bob encrypts his review: recommendation=true (accept), quality=4 (excellent)
      const recommendation = true;
      const quality = 4;

      // Encrypt the recommendation (as ebool)
      const encryptedRecommendation = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(recommendation)
        .encrypt();

      // Encrypt the quality score (as euint8)
      const encryptedQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(quality)
        .encrypt();

      // Submit encrypted review
      const tx = await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1, // paperId
          encryptedRecommendation.handles[0],
          encryptedRecommendation.inputProof,
          encryptedQuality.handles[0],
          encryptedQuality.inputProof,
          "This is an excellent paper with solid methodology"
        );
      await tx.wait();

      const [, totalReviews] = await academicReviewContract.getTotalCounts();
      expect(totalReviews).to.equal(1);

      // Paper should have 1 review now
      const paper = await academicReviewContract.papers(1);
      expect(paper.reviewCount).to.equal(1);
    });

    it("✅ should allow paper author to decrypt their encrypted reviews", async function () {
      // Bob submits encrypted review
      const recommendation = true;
      const quality = 4;

      const encryptedRecommendation = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(recommendation)
        .encrypt();

      const encryptedQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(quality)
        .encrypt();

      const tx = await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          encryptedRecommendation.handles[0],
          encryptedRecommendation.inputProof,
          encryptedQuality.handles[0],
          encryptedQuality.inputProof,
          "Great work!"
        );
      await tx.wait();

      // Alice (paper author) can decrypt the review
      const [encRecommendation, encQuality] = await academicReviewContract
        .connect(signers.alice)
        .getEncryptedReview(1);

      // Decrypt using Alice's permission
      const decryptedRecommendation = await fhevm.userDecryptEbool(
        encRecommendation,
        academicReviewContractAddress,
        signers.alice
      );

      const decryptedQuality = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        encQuality,
        academicReviewContractAddress,
        signers.alice
      );

      expect(decryptedRecommendation).to.equal(recommendation);
      expect(decryptedQuality).to.equal(quality);
    });

    it("should allow multiple reviewers for the same paper", async function () {
      // Bob submits a review
      const encBob = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQualityBob = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(4)
        .encrypt();

      await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          encBob.handles[0],
          encBob.inputProof,
          encQualityBob.handles[0],
          encQualityBob.inputProof,
          "Excellent paper"
        );

      // Carol submits a different review
      const encCarol = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.carol.address)
        .addBool(false)
        .encrypt();
      const encQualityCarol = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.carol.address)
        .add8(2)
        .encrypt();

      await academicReviewContract
        .connect(signers.carol)
        .submitReview(
          1,
          encCarol.handles[0],
          encCarol.inputProof,
          encQualityCarol.handles[0],
          encQualityCarol.inputProof,
          "Needs improvement"
        );

      const [, totalReviews] = await academicReviewContract.getTotalCounts();
      expect(totalReviews).to.equal(2);
    });

    it("❌ should prevent authors from reviewing their own papers", async function () {
      // Alice tries to review her own paper
      const enc = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.alice.address)
        .addBool(true)
        .encrypt();
      const encQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.alice.address)
        .add8(4)
        .encrypt();

      await expect(
        academicReviewContract
          .connect(signers.alice)
          .submitReview(
            1,
            enc.handles[0],
            enc.inputProof,
            encQuality.handles[0],
            encQuality.inputProof,
            "My own paper is great!"
          )
      ).to.be.revertedWith("Cannot review your own paper");
    });

    it("❌ should prevent duplicate reviews from the same reviewer", async function () {
      // Bob submits first review
      const enc1 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality1 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(4)
        .encrypt();

      await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          enc1.handles[0],
          enc1.inputProof,
          encQuality1.handles[0],
          encQuality1.inputProof,
          "First review"
        );

      // Bob tries to review again
      const enc2 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality2 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(3)
        .encrypt();

      await expect(
        academicReviewContract
          .connect(signers.bob)
          .submitReview(
            1,
            enc2.handles[0],
            enc2.inputProof,
            encQuality2.handles[0],
            encQuality2.inputProof,
            "Second review"
          )
      ).to.be.revertedWith("Already reviewed this paper");
    });

    it("❌ should prevent non-authors from accessing encrypted review data", async function () {
      // Bob submits review
      const enc = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(4)
        .encrypt();

      await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          enc.handles[0],
          enc.inputProof,
          encQuality.handles[0],
          encQuality.inputProof,
          "Review"
        );

      // Carol (not the author) tries to access encrypted data
      await expect(
        academicReviewContract.connect(signers.carol).getEncryptedReview(1)
      ).to.be.revertedWith("Only paper author or owner can access");
    });

    it("should prevent reviews on inactive papers", async function () {
      // Toggle paper to inactive
      await academicReviewContract.connect(signers.alice).togglePaperStatus(1);

      // Bob tries to review
      const enc = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(4)
        .encrypt();

      await expect(
        academicReviewContract
          .connect(signers.bob)
          .submitReview(
            1,
            enc.handles[0],
            enc.inputProof,
            encQuality.handles[0],
            encQuality.inputProof,
            "Review"
          )
      ).to.be.revertedWith("Paper is not active");
    });
  });

  describe("Paper Discovery", function () {
    beforeEach(async function () {
      // Alice submits paper 1
      await academicReviewContract
        .connect(signers.alice)
        .submitPaper("Paper 1", "Abstract 1", "Cryptography");

      // Bob submits paper 2
      await academicReviewContract
        .connect(signers.bob)
        .submitPaper("Paper 2", "Abstract 2", "Machine Learning");
    });

    it("should return papers available for review (excluding own papers)", async function () {
      const availablePapers = await academicReviewContract
        .connect(signers.alice)
        .getPapersForReview();

      // Alice should see Bob's paper but not her own
      expect(availablePapers.length).to.equal(1);
      expect(availablePapers[0].title).to.equal("Paper 2");
      expect(availablePapers[0].author).to.equal(signers.bob.address);
    });

    it("should return user's own submitted papers", async function () {
      const userPapers = await academicReviewContract.connect(signers.alice).getUserPapers();

      expect(userPapers.length).to.equal(1);
      expect(userPapers[0].title).to.equal("Paper 1");
      expect(userPapers[0].author).to.equal(signers.alice.address);
    });

    it("should not show already reviewed papers", async function () {
      // Alice reviews Bob's paper
      const enc = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.alice.address)
        .addBool(true)
        .encrypt();
      const encQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.alice.address)
        .add8(4)
        .encrypt();

      await academicReviewContract
        .connect(signers.alice)
        .submitReview(
          2, // Bob's paper
          enc.handles[0],
          enc.inputProof,
          encQuality.handles[0],
          encQuality.inputProof,
          "Good paper"
        );

      // Alice should not see Bob's paper anymore
      const availablePapers = await academicReviewContract
        .connect(signers.alice)
        .getPapersForReview();
      expect(availablePapers.length).to.equal(0);
    });
  });

  describe("Access Control", function () {
    beforeEach(async function () {
      await academicReviewContract
        .connect(signers.alice)
        .submitPaper("Test Paper", "Test Abstract", "Test Category");
    });

    it("should allow paper author to toggle paper status", async function () {
      let paper = await academicReviewContract.papers(1);
      expect(paper.isActive).to.be.true;

      await academicReviewContract.connect(signers.alice).togglePaperStatus(1);

      paper = await academicReviewContract.papers(1);
      expect(paper.isActive).to.be.false;
    });

    it("should prevent non-authors from toggling paper status", async function () {
      await expect(
        academicReviewContract.connect(signers.bob).togglePaperStatus(1)
      ).to.be.revertedWith("Only paper author can toggle status");
    });

    it("should allow owner to deactivate any paper", async function () {
      await academicReviewContract.connect(signers.deployer).deactivatePaper(1);

      const paper = await academicReviewContract.papers(1);
      expect(paper.isActive).to.be.false;
    });

    it("should prevent non-owners from deactivating papers", async function () {
      await expect(
        academicReviewContract.connect(signers.alice).deactivatePaper(1)
      ).to.be.revertedWithCustomError(academicReviewContract, "OwnableUnauthorizedAccount");
    });

    it("✅ should allow contract owner to access encrypted reviews", async function () {
      // Bob submits encrypted review
      const recommendation = true;
      const quality = 3;

      const encryptedRecommendation = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(recommendation)
        .encrypt();

      const encryptedQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(quality)
        .encrypt();

      await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          encryptedRecommendation.handles[0],
          encryptedRecommendation.inputProof,
          encryptedQuality.handles[0],
          encryptedQuality.inputProof,
          "Owner access test"
        );

      // Owner (deployer) can access encrypted review data
      const [encRecommendation, encQuality] = await academicReviewContract
        .connect(signers.deployer)
        .getEncryptedReview(1);

      expect(encRecommendation).to.not.be.undefined;
      expect(encQuality).to.not.be.undefined;
    });

    it("✅ should allow reviewer to decrypt their own review", async function () {
      // Bob submits encrypted review
      const recommendation = false;
      const quality = 2;

      const encryptedRecommendation = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(recommendation)
        .encrypt();

      const encryptedQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(quality)
        .encrypt();

      await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          encryptedRecommendation.handles[0],
          encryptedRecommendation.inputProof,
          encryptedQuality.handles[0],
          encryptedQuality.inputProof,
          "Reviewer self-decrypt test"
        );

      // Bob (reviewer) can decrypt their own review via paper author access
      const [encRecommendation, encQuality] = await academicReviewContract
        .connect(signers.alice)
        .getEncryptedReview(1);

      const decryptedRecommendation = await fhevm.userDecryptEbool(
        encRecommendation,
        academicReviewContractAddress,
        signers.alice
      );

      const decryptedQuality = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        encQuality,
        academicReviewContractAddress,
        signers.alice
      );

      expect(decryptedRecommendation).to.equal(recommendation);
      expect(decryptedQuality).to.equal(quality);
    });
  });

  describe("Event Emissions", function () {
    it("should emit PaperSubmitted event with correct parameters", async function () {
      const title = "Event Test Paper";
      const category = "Testing";

      await expect(
        academicReviewContract
          .connect(signers.alice)
          .submitPaper(title, "Abstract", category)
      )
        .to.emit(academicReviewContract, "PaperSubmitted")
        .withArgs(1, signers.alice.address, title, category);
    });

    it("should emit ReviewSubmitted event with correct parameters", async function () {
      // Alice submits a paper first
      await academicReviewContract
        .connect(signers.alice)
        .submitPaper("Paper", "Abstract", "Category");

      // Bob submits a review
      const enc = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(4)
        .encrypt();

      await expect(
        academicReviewContract
          .connect(signers.bob)
          .submitReview(
            1,
            enc.handles[0],
            enc.inputProof,
            encQuality.handles[0],
            encQuality.inputProof,
            "Review"
          )
      )
        .to.emit(academicReviewContract, "ReviewSubmitted")
        .withArgs(1, 1, signers.bob.address);
    });
  });

  describe("Boundary Value Tests", function () {
    beforeEach(async function () {
      await academicReviewContract
        .connect(signers.alice)
        .submitPaper("Boundary Test Paper", "Abstract", "Category");
    });

    it("✅ should accept minimum quality score (1)", async function () {
      const enc = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(false)
        .encrypt();
      const encQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(1)
        .encrypt();

      const tx = await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          enc.handles[0],
          enc.inputProof,
          encQuality.handles[0],
          encQuality.inputProof,
          "Minimum score test"
        );
      await tx.wait();

      const [, totalReviews] = await academicReviewContract.getTotalCounts();
      expect(totalReviews).to.equal(1);
    });

    it("✅ should accept maximum quality score (4)", async function () {
      const enc = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(4)
        .encrypt();

      const tx = await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          enc.handles[0],
          enc.inputProof,
          encQuality.handles[0],
          encQuality.inputProof,
          "Maximum score test"
        );
      await tx.wait();

      const [, totalReviews] = await academicReviewContract.getTotalCounts();
      expect(totalReviews).to.equal(1);
    });

    it("✅ should accept mid-range quality score (2)", async function () {
      const enc = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(2)
        .encrypt();

      const tx = await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          enc.handles[0],
          enc.inputProof,
          encQuality.handles[0],
          encQuality.inputProof,
          "Mid-range score test"
        );
      await tx.wait();

      const [, totalReviews] = await academicReviewContract.getTotalCounts();
      expect(totalReviews).to.equal(1);
    });

    it("✅ should accept quality score 3", async function () {
      const enc = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(3)
        .encrypt();

      const tx = await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          enc.handles[0],
          enc.inputProof,
          encQuality.handles[0],
          encQuality.inputProof,
          "Score 3 test"
        );
      await tx.wait();

      const [, totalReviews] = await academicReviewContract.getTotalCounts();
      expect(totalReviews).to.equal(1);
    });
  });

  describe("Review Retrieval", function () {
    beforeEach(async function () {
      await academicReviewContract
        .connect(signers.alice)
        .submitPaper("Retrieval Test Paper", "Abstract", "Category");
    });

    it("should return empty array for paper with no reviews", async function () {
      const reviews = await academicReviewContract.getPaperReviews(1);
      expect(reviews.length).to.equal(0);
    });

    it("should return all reviews for a paper", async function () {
      // Bob submits review 1
      const enc1 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality1 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(4)
        .encrypt();

      await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          enc1.handles[0],
          enc1.inputProof,
          encQuality1.handles[0],
          encQuality1.inputProof,
          "First review"
        );

      // Carol submits review 2
      const enc2 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.carol.address)
        .addBool(false)
        .encrypt();
      const encQuality2 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.carol.address)
        .add8(2)
        .encrypt();

      await academicReviewContract
        .connect(signers.carol)
        .submitReview(
          1,
          enc2.handles[0],
          enc2.inputProof,
          encQuality2.handles[0],
          encQuality2.inputProof,
          "Second review"
        );

      const reviews = await academicReviewContract.getPaperReviews(1);
      expect(reviews.length).to.equal(2);
      expect(reviews[0].reviewer).to.equal(signers.bob.address);
      expect(reviews[1].reviewer).to.equal(signers.carol.address);
    });

    it("should preserve review comments correctly", async function () {
      const comment = "This is a detailed review comment with special characters: @#$%";

      const enc = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(3)
        .encrypt();

      await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          enc.handles[0],
          enc.inputProof,
          encQuality.handles[0],
          encQuality.inputProof,
          comment
        );

      const reviews = await academicReviewContract.getPaperReviews(1);
      expect(reviews[0].comments).to.equal(comment);
    });

    it("should allow empty comments in review", async function () {
      const enc = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(3)
        .encrypt();

      const tx = await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          enc.handles[0],
          enc.inputProof,
          encQuality.handles[0],
          encQuality.inputProof,
          ""
        );
      await tx.wait();

      const reviews = await academicReviewContract.getPaperReviews(1);
      expect(reviews[0].comments).to.equal("");
    });
  });

  describe("Error Handling", function () {
    it("❌ should reject review for invalid paper ID (0)", async function () {
      const enc = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(3)
        .encrypt();

      await expect(
        academicReviewContract
          .connect(signers.bob)
          .submitReview(
            0,
            enc.handles[0],
            enc.inputProof,
            encQuality.handles[0],
            encQuality.inputProof,
            "Invalid paper ID"
          )
      ).to.be.revertedWith("Invalid paper ID");
    });

    it("❌ should reject review for non-existent paper ID", async function () {
      const enc = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(3)
        .encrypt();

      await expect(
        academicReviewContract
          .connect(signers.bob)
          .submitReview(
            999,
            enc.handles[0],
            enc.inputProof,
            encQuality.handles[0],
            encQuality.inputProof,
            "Non-existent paper"
          )
      ).to.be.revertedWith("Invalid paper ID");
    });

    it("❌ should reject getEncryptedReview for invalid review ID", async function () {
      await expect(
        academicReviewContract.connect(signers.alice).getEncryptedReview(999)
      ).to.be.revertedWith("Invalid review ID");
    });

    it("❌ should reject getPaperReviews for invalid paper ID", async function () {
      await expect(
        academicReviewContract.getPaperReviews(0)
      ).to.be.revertedWith("Invalid paper ID");
    });

    it("❌ should reject togglePaperStatus for invalid paper ID", async function () {
      await expect(
        academicReviewContract.connect(signers.alice).togglePaperStatus(999)
      ).to.be.revertedWith("Invalid paper ID");
    });

    it("❌ should reject deactivatePaper for invalid paper ID", async function () {
      await expect(
        academicReviewContract.connect(signers.deployer).deactivatePaper(999)
      ).to.be.revertedWith("Invalid paper ID");
    });
  });

  describe("Multiple Papers Workflow", function () {
    it("should handle multiple papers from different authors", async function () {
      // Alice submits 2 papers
      await academicReviewContract
        .connect(signers.alice)
        .submitPaper("Alice Paper 1", "Abstract 1", "Cryptography");
      await academicReviewContract
        .connect(signers.alice)
        .submitPaper("Alice Paper 2", "Abstract 2", "Security");

      // Bob submits 1 paper
      await academicReviewContract
        .connect(signers.bob)
        .submitPaper("Bob Paper 1", "Abstract 3", "Machine Learning");

      const [totalPapers] = await academicReviewContract.getTotalCounts();
      expect(totalPapers).to.equal(3);

      const alicePapers = await academicReviewContract.connect(signers.alice).getUserPapers();
      expect(alicePapers.length).to.equal(2);

      const bobPapers = await academicReviewContract.connect(signers.bob).getUserPapers();
      expect(bobPapers.length).to.equal(1);
    });

    it("should track review count correctly across multiple papers", async function () {
      // Alice submits a paper
      await academicReviewContract
        .connect(signers.alice)
        .submitPaper("Paper 1", "Abstract", "Category");

      // Bob and Carol review it
      const encBob = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQualityBob = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(4)
        .encrypt();

      await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          encBob.handles[0],
          encBob.inputProof,
          encQualityBob.handles[0],
          encQualityBob.inputProof,
          "Bob's review"
        );

      const encCarol = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.carol.address)
        .addBool(false)
        .encrypt();
      const encQualityCarol = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.carol.address)
        .add8(2)
        .encrypt();

      await academicReviewContract
        .connect(signers.carol)
        .submitReview(
          1,
          encCarol.handles[0],
          encCarol.inputProof,
          encQualityCarol.handles[0],
          encQualityCarol.inputProof,
          "Carol's review"
        );

      const paper = await academicReviewContract.papers(1);
      expect(paper.reviewCount).to.equal(2);

      const [, totalReviews] = await academicReviewContract.getTotalCounts();
      expect(totalReviews).to.equal(2);
    });

    it("should maintain independent review tracking per paper", async function () {
      // Alice submits paper 1
      await academicReviewContract
        .connect(signers.alice)
        .submitPaper("Paper 1", "Abstract 1", "Category 1");

      // Bob submits paper 2
      await academicReviewContract
        .connect(signers.bob)
        .submitPaper("Paper 2", "Abstract 2", "Category 2");

      // Carol reviews both papers
      const encCarol1 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.carol.address)
        .addBool(true)
        .encrypt();
      const encQualityCarol1 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.carol.address)
        .add8(4)
        .encrypt();

      await academicReviewContract
        .connect(signers.carol)
        .submitReview(
          1,
          encCarol1.handles[0],
          encCarol1.inputProof,
          encQualityCarol1.handles[0],
          encQualityCarol1.inputProof,
          "Review for paper 1"
        );

      const encCarol2 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.carol.address)
        .addBool(false)
        .encrypt();
      const encQualityCarol2 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.carol.address)
        .add8(3)
        .encrypt();

      await academicReviewContract
        .connect(signers.carol)
        .submitReview(
          2,
          encCarol2.handles[0],
          encCarol2.inputProof,
          encQualityCarol2.handles[0],
          encQualityCarol2.inputProof,
          "Review for paper 2"
        );

      const paper1 = await academicReviewContract.papers(1);
      const paper2 = await academicReviewContract.papers(2);

      expect(paper1.reviewCount).to.equal(1);
      expect(paper2.reviewCount).to.equal(1);

      const reviews1 = await academicReviewContract.getPaperReviews(1);
      const reviews2 = await academicReviewContract.getPaperReviews(2);

      expect(reviews1.length).to.equal(1);
      expect(reviews2.length).to.equal(1);
      expect(reviews1[0].comments).to.equal("Review for paper 1");
      expect(reviews2[0].comments).to.equal("Review for paper 2");
    });
  });

  describe("State Consistency", function () {
    it("should maintain consistent paper counter", async function () {
      let [totalPapers] = await academicReviewContract.getTotalCounts();
      expect(totalPapers).to.equal(0);

      await academicReviewContract
        .connect(signers.alice)
        .submitPaper("Paper 1", "Abstract", "Category");

      [totalPapers] = await academicReviewContract.getTotalCounts();
      expect(totalPapers).to.equal(1);

      await academicReviewContract
        .connect(signers.bob)
        .submitPaper("Paper 2", "Abstract", "Category");

      [totalPapers] = await academicReviewContract.getTotalCounts();
      expect(totalPapers).to.equal(2);
    });

    it("should maintain consistent review counter", async function () {
      await academicReviewContract
        .connect(signers.alice)
        .submitPaper("Paper", "Abstract", "Category");

      let [, totalReviews] = await academicReviewContract.getTotalCounts();
      expect(totalReviews).to.equal(0);

      const enc1 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality1 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(4)
        .encrypt();

      await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          enc1.handles[0],
          enc1.inputProof,
          encQuality1.handles[0],
          encQuality1.inputProof,
          "Review 1"
        );

      [, totalReviews] = await academicReviewContract.getTotalCounts();
      expect(totalReviews).to.equal(1);

      const enc2 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.carol.address)
        .addBool(false)
        .encrypt();
      const encQuality2 = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.carol.address)
        .add8(2)
        .encrypt();

      await academicReviewContract
        .connect(signers.carol)
        .submitReview(
          1,
          enc2.handles[0],
          enc2.inputProof,
          encQuality2.handles[0],
          encQuality2.inputProof,
          "Review 2"
        );

      [, totalReviews] = await academicReviewContract.getTotalCounts();
      expect(totalReviews).to.equal(2);
    });

    it("should properly track hasReviewed status", async function () {
      await academicReviewContract
        .connect(signers.alice)
        .submitPaper("Paper", "Abstract", "Category");

      // Initially Bob has not reviewed
      let hasReviewed = await academicReviewContract.hasReviewed(signers.bob.address, 1);
      expect(hasReviewed).to.be.false;

      // Bob submits review
      const enc = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .addBool(true)
        .encrypt();
      const encQuality = await fhevm
        .createEncryptedInput(academicReviewContractAddress, signers.bob.address)
        .add8(3)
        .encrypt();

      await academicReviewContract
        .connect(signers.bob)
        .submitReview(
          1,
          enc.handles[0],
          enc.inputProof,
          encQuality.handles[0],
          encQuality.inputProof,
          "Review"
        );

      // Now Bob has reviewed
      hasReviewed = await academicReviewContract.hasReviewed(signers.bob.address, 1);
      expect(hasReviewed).to.be.true;

      // Carol still has not reviewed
      const carolReviewed = await academicReviewContract.hasReviewed(signers.carol.address, 1);
      expect(carolReviewed).to.be.false;
    });
  });
});
