import {Meteor} from "meteor/meteor";
import {Promise} from "meteor/promise";
import {keystore, signing} from "eth-lightwallet";
import CryptoJS from "crypto-js";
import W3 from "web3";
import * as LocalStorage from "meteor/simply:reactive-local-storage";
import BigNumber from "bignumber.js";

export const ether = new BigNumber("1000000000000000000");
export const ozcoin = new BigNumber("1000000");

export const initializeKeystore = ((password) => {
    return new Promise((resolve, reject) => {
        let mnemonic = LocalStorage.getItem('encrypted-mnemonic');
        if (mnemonic) {
            let salt = LocalStorage.getItem('salt');
            let alias = LocalStorage.getItem('alias');
            let email = LocalStorage.getItem('email');
            mnemonic = CryptoJS.AES.decrypt(mnemonic, password).toString(CryptoJS.enc.Utf8);

            createKeystore(alias, email, password, salt, mnemonic)
                .then((ks) => {
                    return new Promise((resolve, reject) => {
                        Meteor.loginWithPassword(ks.username, mnemonic, (err) => {
                            if (err)
                                reject(err);
                            else {
                                Meteor.call('sync-user-details', (err) => {
                                    if (err)
                                        console.log("ERROR", err);
                                    resolve(ks);
                                });
                                Meteor.call('store-salt', CryptoJS.SHA256(mnemonic).toString(), salt)
                            }
                        });
                    })
                }).then((keystore) => resolve(keystore)).catch((err) => reject(err))
        } else {
            resolve()
        }
    })
});

let initialisedWeb3 = undefined;
let eventWeb3 = undefined;
export const getWeb3 = (event) => {
    let w3;
    if (event)
        w3 = eventWeb3;
    else
        w3 = initialisedWeb3;

    if (!w3) {
        let provider;
        if (event)
            provider = new W3.providers.HttpProvider(Meteor.settings.contractEvents);
        else
            provider = new W3.providers.HttpProvider(Meteor.settings.ethNodeAddress);

        w3 = new W3(provider);

        if (event)
            eventWeb3 = w3;
        else
            initialisedWeb3 = w3;
    }
    return w3;
};

export const getBalance = (address) => {
    return getWeb3().eth.getBalance(address).toString();
}

export const signAndSubmit = (password, rawTx, sender, waitForMining) => {
    return new Promise((resolve, reject) => {
        wallet.keyFromPassword(password, Meteor.bindEnvironment(function (err, pwDerivedKey) {
            if (err) {
                reject(err);
                return;
            }
            resolve(signing.signTx(wallet, pwDerivedKey, add0x(rawTx), add0x(sender)));
        }));
    }).then(function (signedTxString) {
        return submitRawTx(add0x(signedTxString.toString('hex')));
    }).then(function (txHash) {
        if (waitForMining) {
            return new Promise((resolve, reject) => {
                Meteor.call('wait-for-tx-mining', txHash, (err, result) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        resolve(txHash);
                    }
                });
            })
        } else {
            return txHash;
        }
    }).catch(function (err) {
        console.log(err);
    })
};

export const submitRawTx = function (rawTxHexString) {
    var txHash = getWeb3().sha3(rawTxHexString, {encoding: 'hex'});
    console.log("computed hash is", txHash);
    return new Promise((resolve, reject) => {
        if (!getWeb3().eth.getTransaction(txHash)) {
            getWeb3().eth.sendRawTransaction(add0x(rawTxHexString), function (err, hash) {
                console.log('transaction hash is', hash);
                if (err) {
                    reject(new Meteor.Error('web3-error', err.message));
                } else {
                    resolve(hash);
                }
            });
        } else {
            console.log("transaction already exists", txHash);
            resolve(txHash);
        }
    })
}

let wallet = undefined;
let pdk = undefined;

export const getAddresses = () => {
    if (wallet) {
        return wallet.getAddresses();
    }
    return [];
}

export const createKeystore = (alias, email, password, salt, mnemonic) => {
    let _resolve;
    let _reject;
    let keystoreCallback = (err, ks) => {
        if (err) _reject(err);
        wallet = ks;

        // Some methods will require providing the `pwDerivedKey`,
        // Allowing you to only decrypt private keys on an as-needed basis.
        // You can generate that value with this convenient method:
        ks.keyFromPassword(password, (err, pwDerivedKey) => {
            pdk = pwDerivedKey;
            if (err) _reject(err);

            // generate one new address/private key pair
            // the corresponding private key is also encrypted
            ks.generateNewAddress(pwDerivedKey);

            let mnemonic = ks.getSeed(pwDerivedKey);

            if (Meteor.isClient) {
                LocalStorage.setItem('encrypted-mnemonic', CryptoJS.AES.encrypt(mnemonic, password).toString());
                LocalStorage.setItem('salt', ks.salt);
                LocalStorage.setItem('alias', alias);
                LocalStorage.setItem('email', email);

                LocalStorage.setItem('username', ks.getAddresses()[0]);
            }

            _resolve({
                username: ks.getAddresses()[0],
                password: mnemonic,
                salt: ks.salt,
                mnemonicHash: CryptoJS.SHA256(mnemonic).toString()
            });
        });
    };

    if (mnemonic && salt) {
        return new Promise((resolve, reject) => {
            _resolve = resolve;
            _reject = reject;
            keystore.createVault({
                password: password,
                seedPhrase: mnemonic,
                salt: salt
            }, keystoreCallback);

        });
    }
    if (mnemonic) {
        return new Promise((resolve, reject) => {
            _resolve = resolve;
            _reject = reject;
            Meteor.call('get-salt-from-mnemonic', CryptoJS.SHA256(mnemonic).toString(), function (salt) {
                let options = {
                    password: password,
                    seedPhrase: mnemonic,
                };
                if (salt) options.salt = salt;
                keystore.createVault(options, keystoreCallback);
            })
        });
    }
    return new Promise((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
        keystore.createVault({
            password: password
        }, keystoreCallback);

    });

};

export const add0x = (input) => {
    if (typeof(input) !== 'string') {
        return input;
    } else if (input.length < 2 || input.slice(0, 2) !== '0x') {
        return '0x' + input;
    } else {
        return input;
    }
};

/**
 * Checks if the given string is an address
 *
 * @method isAddress
 * @param {String} address the given HEX adress
 * @return {Boolean}
 */
export const isValidAddress = function (address) {
    address = add0x(address).toLowerCase();

    return (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address))
};

export const createRawValueTx = function (userId, recipient, value) {
    return new Promise((resolve, reject) => {
        let web3 = getWeb3();
        let gasPrice = web3.toHex(web3.eth.gasPrice);
        let profile = Profiles.findOne({owner: userId});

        let gasEstimate = web3.toHex(web3.eth.estimateGas({
            to: recipient,
            value: web3.toHex(value),
        }));

        let nonce = getNonce(profile);
        console.log("the nonce is", nonce);

        var rawTx = {
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: gasEstimate,
            to: recipient,
            from: profile.address,
            value: web3.toHex(value),
        };

        let rawTxString = txutils.valueTx(rawTx);

        resolve({
            rawTx: rawTxString,
            transactionCost: new BigNumber(gasEstimate.toString()).times(gasPrice).dividedBy(ether).toNumber(),
            accountBalance: web3.eth.getBalance(profile.address).dividedBy(ether).toNumber(),
        });
    })
};

