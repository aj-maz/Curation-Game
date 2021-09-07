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

The main focus of this project was on mechanism design and smart contracts so I start by explaining them. There are 6 smart contract in the project. The GTC and POHmimic are for testing and local development and going to be replaced by _gtc contract_ and _Proof of Humanity_ so I won't explain them. 

## TriageGroup
This is the simplest contract and is useful when a grant curation need a triage. There is only one required function needed for this contract which is the **reviewGrant()** that is currently everyone can call it, but in future it must get limitation logic. For example we could implement a multisignature, dao voting, etc ..

## Reputations
This contract is used to store and calculate curators reputation points. These points will be use to dispatch curation bounties, and will determine the weight of curators votes.

# Video Demo

I'm a bit tired right now. going for a game and I will create the video in a bit


# Todos And Bugs

SOON


