import {Meteor} from "meteor/meteor";
import {Promise} from "meteor/promise";
import {ether, getWeb3, signAndSubmit} from "./ethereum-services";
import {Mongo} from "meteor/mongo";
import {Globals} from "../model/globals";
import {txutils} from "eth-lightwallet";
import BigNumber from "bignumber.js";

/**
 * get the contract interface JSON from the project Assets (the private folder)
 * the JSON is pushed to the Globals collection to make it accessible by the client
 *
 * @returns {Promise that resolves with a JSON}
 */
export const contractDefs = function (name) {
    let contractDefs = Globals.findOne({name: "contractInterfaces"});
    if(name){
        return contractDefs.contracts[name];
    }
    return contractDefs ? contractDefs.contracts : {};
};

/**the events are used to record all the contract events that happen.
 * it is also used to avoid duplicate event triggering*/
export const Events = new Mongo.Collection('eth-events');

if (Meteor.isServer) {
    Meteor.startup(() => {
        Events._ensureIndex({hash: 1, logIndex: 1}, {unique: true});
        Events._ensureIndex({executed: 1}, {unique: false});
    })
}

let contracts = {};
export const getContract = (name) => {
    return new Promise((resolve, reject) => {
        try {
            let contractDef = contractDefs(name);
            if (!contracts[name] && contractDef.address) {
                contracts[name] = getWeb3().eth.contract(contractDef.abi).at(contractDef.address);
            } else if (!contracts[name]) {
                contracts[name] = getWeb3().eth.contract(contractDef.abi);
            }
        } catch (err) {
            reject(err);
            return;
        }
        resolve(contracts[name]);
    });
};

const getNonce = function (address) {
    /*the nonce is the count of the next transaction*/
    return getWeb3().eth.getTransactionCount(address, "pending");
};

/**
 * create an instance of the contract. the constructor parameters can be passed after the name
 * @param name of the contract ot create
 * @param sender
 * @param password
 */
export const getInstance = (contractName, sender, password) => {
    let web3 = getWeb3();
    let gasPrice = web3.toHex(web3.eth.gasPrice);

    return getContract(contractName)
        .then((contract) => {
            let args = Array.from(arguments).slice(3);
            args.push({
                data: contract.unlinked_binary
            });
            let payloadData = contract.new.getData.apply(this, args);
            let gasEstimate = web3.toHex(web3.eth.estimateGas({
                    value: web3.toHex(0),
                    data: payloadData
                }) + 10000);

            let nonce = getNonce(sender);
            console.log("the nonce is", nonce, "gas estimate", gasEstimate / 5);

            var rawTx = {
                nonce: nonce,
                gasPrice: gasPrice,
                gasLimit: gasEstimate,
                from: sender,
                value: web3.toHex(0),
                data: payloadData,
            };

            let rawContractTx = txutils.createContractTx(sender, rawTx);

            return {
                rawTx: rawContractTx.tx,
                transactionCost: new BigNumber(gasEstimate.toString()).times(gasPrice).dividedBy(ether).toNumber(),
                accountBalance: web3.eth.getBalance(sender).dividedBy(ether).toNumber(),
                address: rawContractTx.addr,
            };
        })
        .then(function (txObject) {
            if (password) {
                return new Promise((resolve, reject) => {
                    signAndSubmit(password, txObject.rawTx, sender, true).then(function () {
                        resolve(txObject);
                    }).catch((err) => {
                        reject(err);
                    })
                });
            } else {
                return txObject;
            }
        })
        .catch((err) => {
            throw new Meteor.Error("create new instance of", contractName, err.message);
        });
};

/**
 * create a transaction for the contract method. If a password is passed, the transaction will be signed and
 * the result will be returned. If no password is set, the raw TX will be returned
 * @param contractName a string with the name of the contract
 * @param funcName a string with the name of the function
 * @param value the amount of Wei to send with the call (this is not gas)
 * @param sender the address from which the TX should be sent
 * @param password the password to use for unlocking the from account
 */
export const callContractTxMethod = function (contractName, funcName, value, sender, password) {
    let web3 = getWeb3();
    let gasPrice = web3.toHex(web3.eth.gasPrice);

    return getContract(contractName)
        .then((contract) => {
            let args;
            if(password)
                args = Array.from(arguments).slice(5);
            else
                args = Array.from(arguments).slice(4);

            let payloadData = contract[funcName].getData.apply(this, args);
            let gasEstimate = web3.toHex(web3.eth.estimateGas({
                    to: contract.address,
                    value: web3.toHex(value),
                    data: payloadData
                }) * 3);

            let nonce = getNonce(sender);
            console.log("the nonce is", nonce, "gas estimate", gasEstimate / 5);

            var rawTx = {
                nonce: nonce,
                gasPrice: gasPrice,
                gasLimit: gasEstimate,
                to: contract.address,
                from: sender,
                value: web3.toHex(value),
                data: payloadData,
            };

            let rawTxString = txutils.functionTx(contract.abi, funcName, args, rawTx);

            return {
                rawTx: rawTxString,
                transactionCost: new BigNumber(gasEstimate.toString()).times(gasPrice).dividedBy(ether).toNumber(),
                accountBalance: web3.eth.getBalance(sender).dividedBy(ether).toNumber(),
                recipient: contract.address,
            };
        })
        .then(function (txObject) {
            if (password) {
                return signAndSubmit(password, txObject.rawTx, sender, true);
            } else {
                return txObject;
            }
        })
        .catch((err) => {
            throw new Meteor.Error("create function call for contract", contractName, funcName, err.message);
        });
};

export const callContractMethod = function (contract, funcName) {
    let args = Array.from(arguments).slice(2);
    return getContract(contract).then((contract) => {
        return contract[funcName].call.apply(this, args);
    })
};

/*start listening for events of this type*/
export const listenToEvent = function (contractName, event, filter, callback) {
    return getContract(contractName, true).then((contract) => {
        let listener = {
            callback: callback,
            failures: 0,
            event: contract[event](filter, {fromBlock: 'latest', toBlock: 'latest'})
        };

        startWatching = function () {
            try {
                listener.event.watch(Meteor.bindEnvironment(function (error, result) {
                    if (error) {
                        try {
                            listener.event.stopWatching();
                            if (listener.failures++ < 10) {
                                Meteor.setTimeout(startWatching, 1000);
                                console.log("WARNING watcher restarted", contractName, event, error);
                            } else {
                                console.log("ERROR stopped watching", contractName, event, error);
                                Kadira.error()
                            }
                        } catch (exception) {
                            console.log("ERROR exception in", contractName, event, error, exception);
                        }
                    } else {
                        listener.failures = 0;
                        if (typeof result == 'object' && result.args) {
                            if (Events.find({hash: result.transactionHash, logIndex: result.logIndex}).count() == 0) {
                                /**convert any numeric argument to number*/
                                let args = {};
                                Object.entries(result.args).forEach((item) => {
                                    let key = item[0];
                                    let value = item[1];

                                    if (typeof value.toNumber == 'function')
                                        args[key] = value.toNumber();
                                    else
                                        args[key] = value;
                                });
                                /**the event will be picked up by the observer setup in data-sync*/
                                Events.insert({
                                    hash: result.transactionHash,
                                    logIndex: result.logIndex,
                                    method: listener.callback,
                                    timestamp: new Date().getTime(),
                                    executed: false,
                                    result: {args: args}
                                });
                            }
                        }
                    }
                }))
            } catch (error) {
                console.log("ERROR did not start watching", contractName, event, error);
            }
        };
        startWatching();
    })
};
