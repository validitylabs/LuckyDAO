# LuckyDAO

LuckyDAO to which subscribed users can send Ether in order to increase chances of winning something. The likelihood of winning increases proportional to the number of Ethers that the luckiDAO received from that address.

## Development environment setup

as the first step, clone this repo. We will refer to the location you cloned the repository to as `<project-folder`

### Truffle

In order to test and deploy the smart contracts in this project you need truffle-framework. The installation instructions can be found [here](http://truffleframework.com/docs/getting_started/installation)

In short, make sure you have node 7 and npm 4 and run `npm install -g truffle`

### Ethereum Test-RPC

The fastest way to run contracts is to fake it. To this end we'll use [testrpc](https://github.com/ethereumjs/testrpc)

same as above for the versions and then `npm install -g ethereumjs-testrpc`

### Meteor

This project has been developped with [meteor](https://www.meteor.com/) a great full stack javascript framework that has a lot of neat features. The main reason being the DDP (Distributed Data Protocol) which allows to use an efficient pub-sub paradigm for data.

If you have not installed Meteor yet, you will need to [do so now](https://www.meteor.com/install) in order to execute this project locally.

## Running a Lucky Game

simply `cd <application-folder>` and execute `./migrate-and-run test` This will:

* launch a test-rpc node with a predefined mnemonic
* deploy the contracts to test-rpc
* run the tests to verify nothing is broken
* launch meteor and make the app available at `http://localhsot:8080`

## Layout

### Status page (landing page)

* Count-down timer with end of sign up period and finally show winner address
* Button to go to sign up page / sub-section
* List of addresses and their likelihood to win the game in % and with bars
* Own address (e.g. stored in cookie) highlighted/marked
* Real-time data feed about new users/investments
* Address and QR code of contract

### User sign up page

* Ethereum address
* Name
* Street + number
* ZIP code
* Town
* Country
* Submit button

### Admin page
* Requiring login with password
* Display all signed up users (accepted and pending)
* Not approved users can be accepted or rejected via checkbox
* Submit button

### Functionality
* Web server connected to local geth 
* Pending and accepted users stored in local database (e.g. mongoDB)
* On public Ethereum chain
* Winner address will be displayed and winner will receive something (off-chain)
* Approved addresses will be written via web-interface and geth to SC
* Payment via fallback function, not via SC function call
  * Second payment increases balance & triggers probability computing
* App acts as oracle
* Contract contains end timestamp
* Contract is closed after end
* Deployment of contract is manual / scripted
