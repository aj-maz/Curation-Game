# Curation Game

> A decentralized curation system for decentralized gitcoin built on top of 🏗 Scaffold-Eth

🧪 A fully decentralized system that incentivize users to curate correctly so they could increase their reputation and bounty they get.

![image](https://i.ibb.co/xsn2DkZ/curation-game.png)


# 🏄‍♂️ Quick Start

Prerequisites: [Node](https://nodejs.org/en/download/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads)

> clone/fork Curation Game:

```bash
git clone https://github.com/Ajand/Curation-Game.git
```

> install and start your 👷‍ Hardhat chain:

```bash
cd scaffold-eth
yarn install
yarn chain
```

> in a second terminal window, start your 📱 frontend:

```bash
cd scaffold-eth
yarn start
```

> in a third terminal window, 🛰 deploy your contract:

```bash
cd scaffold-eth
yarn deploy
yarn help-abi
```

__Don't miss the help-abi! Since curation game smart contract system uses an internal contract it will help to copy its abi so if you don't run the command system simpley won't work__

📱 Open http://localhost:3000 to see the app

# 📚 Documentation

System is mostly based on the specification. Also smart contracts are pretty readable and have meaningful test, so they would answer alot of questions.

📕 Read the specifications: https://docs.google.com/document/d/1BnVxfHa59x_tR-H6BwvaKdfAq4xz7Q0L5w7Jz8Qj1b0/edit?usp=sharing

The main focus of this project was on mechanism design and smart contracts and the frontend is just an implementation of different possible implementations of the system so I start by explaining them. There are 6 smart contract in the project. The GTC and POHmimic are for testing and local development and going to be replaced by _gtc contract_ and _Proof of Humanity_ so I won't explain them. 

## TriageGroup

This is the simplest contract and is useful when a grant curation need a triage. There is only one required function needed for this contract which is the **reviewGrant()** that is currently everyone can call it, but in future it must get limitation logic. For example we could implement a multisignature, dao voting, etc ..

## Reputations

This contract is used to store and calculate curators reputation points. These points will be use to dispatch curation bounties, and will determine the weight of curators votes. Point calculation algorithm is commented in the contract so you could check it out.

## GrantManager

This is the entry point contract which will need the _GTC_, _POH_ and _TriageGroup_ contract's addresses to be deployed. It then internally deploys a _Reputations_ contract. For every grants that is created this contract will deploy a _Grant_ contract, which will be responsible for the curation of that grant. 

_Also this contract will Calculate the amount of gtc needed to be staked as a bounty for curators which will be a variable of the amount of grants that needed to be judged._

__All of the staked bounty will be distribute among curators because if we would want to get back a part of it to owner if he passes then different actors would be incentivized to make it fail.__

## Grant

This is the main contract of the system. 

First of all each grant has a grant hash which I currently use to store an IPFS CID but it could easily be use for storing an object hash to verify a grant document. Obviously, IPFS has the advantage of decentralization but for integrating with old systems it maybe useful to have this feature. Also each Curation has a curation hash which is very similar to this.

The grant has an status state which will tell the current state of the grant. When a grant created it's in __INITIATED__ status. In this status the only possible action is make **makeJudgeable()**. 
_Remember that for calling this function you first need to transfer the amount of needed gtc for bounties to contract so if you use the "Make it Judgable" button in frontend without having some GTC it will throw errors. So you MUST first get some gtc from utility tab_. The second status is __TO_BE_JUDGED__ which will make **addPeerReview** and **finalizeResult** available to users. The third status is __FINALIZED__ which is only attainable when the result is either **PASS** or **FAIL**. The other possible statuses are **NEED_EDIT** and **NEED_TRIAGE** and they will make **edit()** and **triageReview()** possible.

The grant has also a result state which is obviously the result of the grant _but only shows it when status is nor INITIATED nor TO_BE_JUDGED_.

The grant has a version state which is by default 0 and whenever the owner edit the grant it will increase. Votes and their consensus will be calculated based on each version.

The confindence will be calculated whenever the status become **FINALIZED** and it's based on the curator's votes weight which will come form the curator's reputation point in the _Reputations Contract_.

The **compileSingle()** function is a pure function which will take a single curation and will return a single result based on specification.

With this knowledge I guess reading other functions are pretty possible even tho I try to complete the docs more.

**There are lots of comments in the contracts for possible improvments and critical points**

## Frontend

The frontend is pretty straightforward. But just reminds:

- This frontend is just one possible implementation of the smart contract system, which is decentralized and uses IPFS to store files. We can easily translate it to a more centralized system with verifiable hash and traditional API
- For creating grant go to utility tab, the bottom form doesn't have proper validation. Please complete it fully to decrease the chance of unwanted behaviour.
- For making a grant judgeable you need test gtc. You can grab some in utility tab.
- For adding peer review you need to prove that you're a human using our POHMimic. You can use utility tab for that as well.


# Features, Todos And Bugs

- Features
    - Variable Bounty: The bounty needed to be staked will increase if demands goes higher.
- TODOs
  - [ ] Gas Effiency
  - [ ] The Graph API : I didn't implemented the needed endpoints of the specification cause I thought if the whole system is decentralized it would need a decentralized indexing system which was out of the scope of this bounty.
- Bugs
  - I suspect there is some logical bug in distributing bounties in cases the triage is needed.
