import solc from "solc";
import {Promise} from "meteor/promise";
import {getWeb3, add0x} from "../imports/ethereum/ethereum-services";
import {Globals} from "../imports/model/globals";

function getContract(name) {
    return new Promise(function (resolve, reject) {
        Assets.getText("contracts/" + name, function (err, source) {
            if (err) {
                reject(err);
            } else {
                let contract = {};
                contract.name = name;
                contract.source = source;
                resolve(contract);
            }
        })
    })
}

export const compile = function () {
    return Promise.all([
        getContract("Owned.sol"),
        getContract("Mortal.sol"),
        getContract("LuckyDAO.sol")
    ]).then(function (contracts) {
        let input = {};
        contracts.forEach(function (contract) {
            input[contract.name] = contract.source;
        });
        try {
            var output = solc.compile({sources: input}, 1);
            return output;
        } catch (err) {
            throw new Meteor.Error(err);
        }
    })
}

export const deploy = function (settings) {
    return compile().then(function (output) {
        let contracts = {};
        contracts.Owned = output.contracts['Owned.sol:Owned'];
        contracts.Mortal = output.contracts['Mortal.sol:Mortal'];
        contracts.LuckyDAO = output.contracts['LuckyDAO.sol:LuckyDAO'];

        contracts.Owned.abi = JSON.parse(contracts.Owned.interface);
        contracts.Mortal.abi = JSON.parse(contracts.Mortal.interface);
        contracts.LuckyDAO.abi = JSON.parse(contracts.LuckyDAO.interface);

        delete contracts.Owned.assembly;
        delete contracts.Mortal.assembly;
        delete contracts.LuckyDAO.assembly;

        Globals.upsert({name: "contractInterfaces"}, {$set: {contracts: contracts}});
        return contracts;
    }).then(function (contracts) {
        return new Promise(function (resole, reject) {
            let payload = {
                from: settings.contracts.owner,
                data: add0x(contracts.LuckyDAO.bytecode),
                gas: 100000
            };
            console.log(payload);

            getWeb3(false).eth.contract(contracts.LuckyDAO.abi).new(payload,
                function (err, contract) {
                    if (err) {
                        reject(err);
                    } else {
                        if (contract.address) {
                            Globals.update(
                                {name: "contractInterfaces"},
                                {$set: {"contracts.LuckyDAO.address": contract.address}}
                            );
                            resole(contract);
                        }
                    }
                })
        })
    })
};


Meteor.methods({
    "deploy": function () {
        return deploy({contracts: {owner: "0x4615ff6690a3bb23bd85051c5c69abba4092bbb4"}});
    }
})