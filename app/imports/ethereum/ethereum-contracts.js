import {Meteor} from "meteor/meteor";
import {Promise} from "meteor/promise";
import {getWeb3} from "./ethereum-services";
import {Mongo} from "meteor/mongo";
import {Globals} from "../model/globals";

/**
 * get the contract interface JSON from the project Assets (the private folder)
 * the JSON is pushed to the Globals collection to make it accessible by the client
 *
 * @returns {Promise that resolves with a JSON}
 */
export const contractDefs = function () {
    let contractDefs = Globals.findOne({name: "contractInterfaces"});
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
        if (!contracts[name]) try {
            contracts[name] = getWeb3(event).eth.contract(contractDefs[name].abi).at(contractDefs[name].address);
        } catch (err) {
            reject(err);
            return;
        }
        resolve(contracts[name]);
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
