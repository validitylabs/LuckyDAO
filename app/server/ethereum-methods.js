import {getAddresses, getWeb3} from "../imports/ethereum/ethereum-services";

Meteor.methods({
    'submit-raw-tx': function (rawTxHexString) {
        return submitRawTx(rawTxHexString);
    },

    'wait-for-tx-mining': function (txHash) {
        const web3 = getWeb3();
        if (txHash && typeof txHash === 'string' && web3.eth.getTransaction(txHash)) {
            return new Promise((resolve, reject) => {
                console.log("pending transactions", getWeb3().eth.pendingTransactions);
                let txloop = Meteor.setInterval(Meteor.bindEnvironment(function () {
                    try {
                        let tx = web3.eth.getTransaction(txHash);
                        if (tx && tx.blockNumber) {
                            Meteor.clearInterval(txloop);
                            let txR = web3.eth.getTransactionReceipt(txHash);
                            resolve(web3.eth.getTransactionReceipt(txHash));
                        }
                    } catch (err) {
                        console.log("ERROR: wait for tx to mine", err);
                        Meteor.clearInterval(txloop);
                        reject(new Meteor.Error("wait for TX to mine", err.message));
                    }
                }), 1000);
            })
        } else {
            throw new Meteor.Error("the txHash is mandatory and must be a string identifying a transaction");
        }
    },
    'server-eth-address': function () {
        return getAddresses()[0];
    }
});

