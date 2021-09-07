const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("Curation Game", function () {
  let grantManager;
  let gtc;
  let poh;
  let triageGroup;

  const GTC_DEPLOYER_SUPPLY = "10000000000"

  describe("GrantManger", function () {
    it("Should deploy Grant Manager, GTC, POH", async function () {
      const TriageGroup = await ethers.getContractFactory("TriageGroup");
      triageGroup = await TriageGroup.deploy()
      const POH = await ethers.getContractFactory("POHmimic");
      poh = await POH.deploy()
      const GTC = await ethers.getContractFactory("GTC");
      gtc = await GTC.deploy()
      const GrantManager = await ethers.getContractFactory("GrantManager");
      grantManager = await GrantManager.deploy(gtc.address, poh.address, triageGroup.address);
    });

    // !IMPORTANT! This implementation of Proof of Humanity is just for test and must be replaced with
    // ! Proper implenmentation

    it("POH Should work in isoliation", async function () {
      const currentSigner = (await ethers.getSigners())[0].address
      expect(await poh.isRegistered(currentSigner)).to.be.false
      await poh.register(currentSigner)
      expect(await poh.isRegistered(currentSigner)).to.be.true
    })

    describe("Single Grant", function () {
      let simpleGrant = {
        "id": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        "owner": "0x6BF1EBa9740441D0A8822EDa4E116a74f850d81B",
        "payee": "0x931896A8A9313F622a2AFCA76d1471B97955e551",
        "metaPtr": "https://blah.eth/my_metadata.json",
        "metadata": {
          "name": "Make ETH Better",
          "description": "We are building tools to make Ethereum better",
          "image": "https://my.image.com/image.jpg",
          "properties": {
            "projectWebsite": "https://makeethbetter.com",
            "projectGithub": "https://github.io/meb/project",
            "bannerImage": "https://my.image.com/banner.jpg",
            "twitterHandle": "makeethbetterer",
            "keywords": ["infrastructure", "ethereum"],
            "endDate": "2017 Mar 03 05:12:41.211 PDT",
          }
        }
      }

      const simpleGrantHash = (ethers.utils.id(JSON.stringify(simpleGrant)))

      it("Should be able to create a grant from grant manager", async function () {
       const nGrant = await grantManager.createGrant(simpleGrantHash)
       expect(nGrant.value).to.equal(0)
      });

      it("Bounty and Stake Amount", async function () {
        expect(String(await grantManager.calculateStakeAndBounty())).to.equal(String(10000))
      });

      it("Should be able to get the created grant", async function () {
        const GrantContract = await ethers.getContractFactory("Grant");
        const currentSigner = (await ethers.getSigners())[0].address
        const newGrantAddress = await grantManager.grants(0)
        const newGrant = await GrantContract.attach(newGrantAddress)
        const newGrantHash = await newGrant.grantHash()
        const newGrantOwner = await newGrant.owner()
        const newGrantVersion = await newGrant.version()
        expect(String(newGrantHash)).to.equal(String(simpleGrantHash))
        expect(String(newGrantVersion)).to.equal(String(0))
        expect(String(newGrantOwner)).to.equal(String(currentSigner))
      });

      it("Should be able to put bounty into grant", async function () {
        const currentSigner = (await ethers.getSigners())[0].address
        const currentSignerGTCBalance = await gtc.balanceOf(currentSigner)
        expect(String(currentSignerGTCBalance)).to.equal(String(GTC_DEPLOYER_SUPPLY))
        const GrantContract = await ethers.getContractFactory("Grant");
        const newGrantAddress = await grantManager.grants(0)
        const newGrant = await GrantContract.attach(newGrantAddress)
        const currentBounty = await grantManager.calculateStakeAndBounty()
        let grantStatus = await newGrant.status()
        expect(grantStatus).to.equal(0)
        await gtc.transfer(newGrantAddress, currentBounty)
        await newGrant.makeJudgeable()
        let grantBalance = await gtc.balanceOf(newGrant.address)
        grantStatus = await newGrant.status()
        expect(String(grantBalance)).to.equal(String(currentBounty))
        expect(grantStatus).to.equal(1)
      });

      it("Add Peer Review", async function () {
        const GrantContract = await ethers.getContractFactory("Grant");
        const newGrantAddress = await grantManager.grants(0)
        const newGrant = await GrantContract.attach(newGrantAddress)
        const simpleReview = {
          "id": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
          "result": "mods",
          "confidence": "96",
          "mod_required": true,
          "data": {
            "mod": {
              "mod_for": "category",
              "comment": "Please update the category for your grant to Infrastructure"
            }
          }
        }
        const simpleReviewHash = (ethers.utils.id(JSON.stringify(simpleReview)))

        await newGrant.addPeerReview(simpleReviewHash, 0, 1, 0)

        //console.log(await newGrant.curations(0, 0))

      })

      it("Let's Finalize a grant", async function () {
        const GrantContract = await ethers.getContractFactory("Grant");
        const newGrantAddress = await grantManager.grants(0)
        const newGrant = await GrantContract.attach(newGrantAddress)


        await expect(newGrant.finalizeResult()).to.be.revertedWith("For finalizing a grant curation atleast 3 vote is required");


        const simpleReview1 = {
          "id": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        }
        const simpleReview2 = {
          "id": "0x71C7656EC7aplplb88b098defB751B7401B5f6d8976F",
        }

        const simpleReview1Hash = (ethers.utils.id(JSON.stringify(simpleReview1)))
        const simpleReview2Hash = (ethers.utils.id(JSON.stringify(simpleReview2)))

        const [user1, user2, user3, user4] = await ethers.getSigners();


        //console.log(user2, user3, user4)
        await poh.register(user2.address)
        await poh.register(user3.address)
        await poh.register(user4.address)

        await newGrant.connect(user2).addPeerReview(simpleReview1Hash, 0, 0, 0)
        await newGrant.connect(user3).addPeerReview(simpleReview1Hash, 0, 0, 0)
        await newGrant.connect(user4).addPeerReview(simpleReview2Hash, 0, 3, 0)


        await newGrant.finalizeResult()

        expect(await newGrant.confidence()).to.equal(50);
        expect(await newGrant.result()).to.equal(0);
        expect(await newGrant.status()).to.equal(2);
      })

      it("Let's Do An Edit", async function () {
        const GrantContract = await ethers.getContractFactory("Grant");
        let editGrantData = { id: "bibili" }
        const editGrantHash = (ethers.utils.id(JSON.stringify(editGrantData)))
        grantManager.createGrant(editGrantHash)
        const editGrantAddress = await grantManager.grants(1)
        const editGrant = await GrantContract.attach(editGrantAddress)


        const editReviews = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }]

        const editReviewshash = editReviews.map((review) => ethers.utils.id(JSON.stringify(review)))

        const editBounty = await grantManager.calculateStakeAndBounty()
        await gtc.transfer(editGrantAddress, editBounty)
        await editGrant.makeJudgeable()

        const [user1, user2, user3, user4] = await ethers.getSigners();



        // Make some peer review to get 100 confidence on mods 
        await editGrant.connect(user2).addPeerReview(editReviewshash[0], 0, 0, 3)
        await editGrant.connect(user3).addPeerReview(editReviewshash[1], 3, 0, 0)
        await editGrant.connect(user4).addPeerReview(editReviewshash[2], 0, 3, 0)

        await editGrant.finalizeResult()

        // Expect to 100 confidence on mods result and need to be edit status
        expect(await editGrant.confidence()).to.equal(100);
        expect(await editGrant.result()).to.equal(3);
        expect(await editGrant.status()).to.equal(3);

        let newEditGrantData = { id: "babli" }
        const newEditGrantHash = (ethers.utils.id(JSON.stringify(newEditGrantData)))

        await editGrant.edit(newEditGrantHash)

        // Expect to edit change the version and delete the result variables
        const editGrantVersion = await editGrant.version()
        expect(String(editGrantVersion)).to.equal(String(1))
        expect(await editGrant.confidence()).to.equal(0);
        expect(await editGrant.result()).to.equal(0);
        expect(await editGrant.status()).to.equal(1);

        // Make some peer review to make it pass
        await editGrant.connect(user2).addPeerReview(editReviewshash[3], 0, 0, 0)
        await editGrant.connect(user3).addPeerReview(editReviewshash[4], 0, 0, 0)
        await editGrant.connect(user4).addPeerReview(editReviewshash[5], 0, 0, 0)

        await editGrant.finalizeResult()

        // Expect to 100 confidence on pass result and finalized status

        expect(await editGrant.confidence()).to.equal(100);
        expect(await editGrant.result()).to.equal(0);
        expect(await editGrant.status()).to.equal(2);
      })

      it("Let's Do A triage", async function () {
        const GrantContract = await ethers.getContractFactory("Grant");
        let triageGrantData = { id: "bibilibabali" }
        const triageGrantHash = (ethers.utils.id(JSON.stringify(triageGrantData)))
        grantManager.createGrant(triageGrantHash)
        const triageGrantAddress = await grantManager.grants(2)
        const triageGrant = await GrantContract.attach(triageGrantAddress)


        const triageReviews = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }]

        const triageReviewshash = triageReviews.map((review) => ethers.utils.id(JSON.stringify(review)))

        const triageBounty = await grantManager.calculateStakeAndBounty()
        await gtc.transfer(triageGrantAddress, triageBounty)
        await triageGrant.makeJudgeable()

        const [user1, user2, user3, user4, user5] = await ethers.getSigners();

        // Make some peer review to get 100 confidence on mods 
        await triageGrant.connect(user2).addPeerReview(triageReviewshash[0], 2, 0, 3)
        await triageGrant.connect(user3).addPeerReview(triageReviewshash[1], 3, 2, 0)
        await triageGrant.connect(user4).addPeerReview(triageReviewshash[2], 3, 2, 0)

        await triageGrant.finalizeResult()

        // Expect to 100 confidence on mods result and need to be edit status
        expect(await triageGrant.confidence()).to.equal(100);
        expect(await triageGrant.result()).to.equal(2); // 2
        expect(await triageGrant.status()).to.equal(4); // 4

        await expect(triageGrant.triageReview(triageReviewshash[3], 0, 0, 0)).to.be.revertedWith("Only the triage group can do this transaction.");

        await triageGroup.reviewGrant(triageGrantAddress, triageReviewshash[3], 0, 0, 0)


        expect(await triageGrant.confidence()).to.not.equal(100);
        expect(await triageGrant.result()).to.equal(0);
        expect(await triageGrant.status()).to.equal(2);

      })

      it('Lets pay the bounties', async function () {
        const GrantContract = await ethers.getContractFactory("Grant");
        const firstGrantAddress = await grantManager.grants(0)
        const firstGrant = await GrantContract.attach(firstGrantAddress)

        const [user1, user2, user3, user4, user5] = await ethers.getSigners();

        await firstGrant.connect(user3).takeBounty()
        await firstGrant.connect(user2).takeBounty()

        expect(await gtc.balanceOf(firstGrantAddress)).to.equal(0); // 4

      })

      it("It\'s all about reputation", async function () {
        const ReputationsContract = await ethers.getContractFactory("Reputations");
        const ReputationsAddress = await grantManager.reputation()

        const reputations = await ReputationsContract.attach(ReputationsAddress)


        const [user1, user2, user3, user4, user5] = await ethers.getSigners();


        expect(await reputations.getReputationPoint(user1.address)).to.not.equal(1);
        expect(await reputations.getReputationPoint(user5.address)).to.equal(1);
      })
    });
  });
});


// Triage -> DONE!
// Get Bounties -> DONE!
// Set Reputations --> DONE!

// Frontend
// gtc faucet
// poh adding


// - create grant
// - pay bounty and make it judgeable
// - add peer review
// - edit grant
