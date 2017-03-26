var LuckyDAO = artifacts.require("./LuckyDAO.sol");

contract('LuckyDAO', function (accounts) {
    let Web3 = require("web3");
    let endTimestamp = new Date().getTime() / 1000 + 600; // it ends in 10 minutes;
    let web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8585"));

    it("is in development mode", function () {
        return LuckyDAO.deployed().then(function (instance) {
            return instance.environment();
        }).then(function (env) {
            assert.equal(env, 2, "the environment must be 2 = dev " + env);
        });
    });

    it("has a redeemer", function () {
        return LuckyDAO.deployed().then(function (instance) {
            return instance.redeemer();
        }).then(function (redeemer) {
            assert.equal(redeemer, "0x41c0b08962537ca31457eaee11e23f155a3c00f4", "the redeemer is accounts[3]");
        });
    })

    it("has the endTimestamp set to 1500000000", function () {
        return LuckyDAO.deployed().then(function (instance) {
            return instance.endTimeStamp();
        }).then(function (endTimestamp) {
            assert.equal(endTimestamp, 1500000000, "the endTimestamp set to 1500000000");
        });
    });

    it("has an end timestamp in the future", function () {
        let inst = undefined;
        return LuckyDAO.deployed()
            .then(function (instance) {
                inst = instance;
            })
            .then(function () {
                return inst.setEndTimeStamp(endTimestamp);
            })
            .then(function () {
                return inst.endTimeStamp();
            })
            .then(function (endTimestamp) {
                let now = new Date().getTime() / 1000;
                assert.equal(endTimestamp.toNumber() > now, true,
                    "the end timestamp was smaller or equal to now " + now + " was " + endTimestamp);
            });
    });

    it("registers first guess for first user", function (done) {
        /*send one ETH to the contract*/
        web3.eth.sendTransaction({
            from: accounts[0],
            to: LuckyDAO.address,
            value: 1000000000000000000,
            gas: 1000000
        }, function (err, tx) {
            if(err){
                assert.fail(err.message, "no error");
            }
            done();
        })
    });

    it("verifies probability of winning", function () {
        let inst = undefined;
        return LuckyDAO.deployed().then(function (instance) {
            inst = instance;
            return inst.winProbability(accounts[0])
        }).then(function (proba) {
            assert.equal(proba.toNumber(), 1000000, "the probability is 100% for first user");
            return inst.winProbability(accounts[1]);
        }).then(function (proba) {
            assert.equal(proba.toNumber(), 0, "the probability is 0% for second user");
        })
    });

    it("registers second guess for first user", function (done) {
        /*send one ETH to the contract*/
        web3.eth.sendTransaction({
            from: accounts[0],
            to: LuckyDAO.address,
            value: 1000000000000000000,
            gas: 1000000
        }, function (err, tx) {
            if(err){
                assert.fail(err.message, "no error");
            }
            done();
        })
    });

    it("has a balance of 2 ETH in the LuckyDAO contract", function () {
        return LuckyDAO.deployed().then(function (instance) {
            return web3.eth.getBalance(LuckyDAO.address);
        }).then(function (luckyBalance) {
            assert.equal(luckyBalance.toNumber(), 2000000000000000000, "the contract has 2 ETH");
        })
    })

    it("registers first guess for second user", function (done) {
        /*send one ETH to the contract*/
        web3.eth.sendTransaction({
            from: accounts[1],
            to: LuckyDAO.address,
            value: 1000000000000000000,
            gas: 1000000
        }, function (err, tx) {
            if(err){
                assert.fail(err.message, "no error");
            }
            done();
        })
    });

    it("registers second guess for second user", function (done) {
        /*send one ETH to the contract*/
        web3.eth.sendTransaction({
            from: accounts[1],
            to: LuckyDAO.address,
            value: 1000000000000000000,
            gas: 1000000
        }, function (err, tx) {
            if(err){
                assert.fail(err.message, "no error");
            }
            done();
        })
    });

    it("verifies probability of winning", function () {
        let inst = undefined;
        return LuckyDAO.deployed().then(function (instance) {
            inst = instance;
            return inst.winProbability(accounts[0])
        }).then(function (proba) {
            assert.equal(proba.toNumber(), 500000, "the probability is 50% for first user");
            return inst.winProbability(accounts[1]);
        }).then(function (proba) {
            assert.equal(proba.toNumber(), 500000, "the probability is 50% for second user");
        })
    });

    it("has a balance of 4 ETH in the LuckyDAO contract", function () {
        return LuckyDAO.deployed().then(function (instance) {
            return web3.eth.getBalance(LuckyDAO.address);
        }).then(function (luckyBalance) {
            assert.equal(luckyBalance.toNumber(), 4000000000000000000, "the contract has 4 ETH");
        })
    });

    it("has two participants", function () {
        let inst = undefined;
        return LuckyDAO.deployed().then(function (instance) {
            inst = instance;
            return inst.nbParticipants();
        }).then(function (nbParticipants) {
            assert.equal(nbParticipants.toNumber(), 2, "the contract has 2 participants");
            return inst.getParticipant(0);
        }).then(function (participant) {
            assert.equal(participant, accounts[0], "the first participant is account[0]")
            return inst.getParticipant(1);
        }).then(function (participant) {
            assert.equal(participant, accounts[1], "the second participant is account[1]")
        })
    })

    it("has 2 guesses for player1", function () {
        let inst = undefined;
        return LuckyDAO.deployed().then(function (instance) {
            inst = instance;
            return inst.getGuessCount(accounts[0]);
        }).then(function (guessCount) {
            assert.equal(guessCount.comparedTo(2), 0, "there are 2 guesses for player 1");
            return inst.getGuess(accounts[0], 0);
        }).then(function (guess) {
            assert.equal(guess[0].comparedTo(0), 0, "floor of first guess expected 0 " + guess[0].toString());
            assert.equal(guess[1].comparedTo(1000000000000000000), 0, "ceil of first guess is 1000000000000000000 " + guess[1].toString());
            return inst.getGuess(accounts[0], 1);
        }).then(function (guess) {
            assert.equal(guess[0].comparedTo(1000000000000000000), 0, "floor of second guess is 1000000000000000000 " + guess[0].toString());
            assert.equal(guess[1].comparedTo(2000000000000000000), 0, "floor of second guess is 2000000000000000000 " + guess[1].toString());
        });
    })

    it("has 2 guesses for player2", function () {
        let inst = undefined;
        return LuckyDAO.deployed().then(function (instance) {
            inst = instance;
            return inst.getGuessCount(accounts[1]);
        }).then(function (guessCount) {
            assert.equal(guessCount.comparedTo(2), 0, "there are 2 guesses for player 2 " + guessCount.toString());
            return inst.getGuess(accounts[1], 0);
        }).then(function (guess) {
            assert.equal(guess[0].comparedTo(2000000000000000000), 0, "floor of first guess is " + guess[0].toString());
            assert.equal(guess[1].comparedTo(3000000000000000000), 0, "ceil of first guess is " + guess[1].toString());
            return inst.getGuess(accounts[1], 1);
        }).then(function (guess) {
            assert.equal(guess[0].comparedTo(3000000000000000000), 0, "floor of first guess is " + guess[0].toString());
            assert.equal(guess[1].comparedTo(4000000000000000000), 0, "ceil of first guess is " + guess[1].toString());
        });
    })

    it("closes the game", function () {
        let inst = undefined;
        let secret = 0;
        let win1;
        return LuckyDAO.deployed().then(function (instance) {
            inst = instance;
            return inst.setEndTimeStamp(new Date().getTime() / 1000 - 1);
        }).then(function () {
            return inst.endTimeStamp();
        }).then(function (endTimestamp) {
            let now = new Date().getTime() / 1000;
            assert.equal(endTimestamp.toNumber() < now, true,
                "the end timestamp was bigger or equal to now " + now + " was " + endTimestamp);
            return web3.eth.sendTransaction({
                from: accounts[1],
                to: LuckyDAO.address,
                value: 0,
                gas: 1000000
            });
        }).then(function () {
            return inst.secret();
        }).then(function (num) {
            secret = num;
            assert.equal(secret > 0, true, "the secret must be set");
            return inst.isWinner(accounts[0]);
        }).then(function (winner) {
            assert.equal(winner, secret.comparedTo("2000000000000000000") < 0, winner + " secret in lower half winner is 1 " + secret);
            win1 = winner;
            return inst.isWinner(accounts[1])
        }).then(function (win2) {
            assert.equal(win2, secret.comparedTo("2000000000000000000") >= 0, "secret in upper half winner is 2");
            assert.notEqual(win1, win2, "there must be exactly one winner");
        })
    });

    it("registers first guess for third user", function (done) {
        /*send one ETH to the contract*/
        web3.eth.sendTransaction({
            from: accounts[2],
            to: LuckyDAO.address,
            value: 1000000000000000000,
            gas: 1000000
        }, function (err, tx) {
            if(err){
                assert.fail(err.message, "no error");
            }
            done();
        })
    });

    it("ignores guesses after contract closure", function () {
        assert.equal(web3.eth.getBalance(LuckyDAO.address).toNumber(), 4000000000000000000, "the ballance must not change");
    })

    it("redeems the ETH in the contract", function () {
        let inst = undefined;
        let redeemerBalance;
        return LuckyDAO.deployed().then(function (instance) {
            inst = instance;
            return web3.eth.getBalance(accounts[3]);
        }).then(function (balance) {
            redeemerBalance = balance;
            /*redeem from other account so that the balance is easy to compute*/
            return inst.redeem({from: accounts[1]});
        }).then(function (redeemed) {
            return web3.eth.getBalance(accounts[3]);
        }).then(function (balance) {
            assert.equal(balance.comparedTo(redeemerBalance.add(4000000000000000000)), 0)
        })
    })

});
