import {Meteor} from "meteor/meteor";
import {createKeystore, getBalance} from "../imports/ethereum/ethereum-services";
import {getInstance} from "../imports/ethereum/ethereum-contracts";
import {Globals} from "../imports/model/globals";

Meteor.methods({
    "verify-email": function (email) {
        return Meteor.users.find({"emails.address": email}).count() > 0;
    },

    "set-admin": function () {
        if(Meteor.users.find({}).count() == 1) {
            Meteor.users.update({_id: this.userId}, {$set: {"profile.isAdmin": true}});
        }
    },

    "refresh-app-balance": function () {
        let appAccount = Globals.findOne({name: "appAccount"});
        if(appAccount)
            Globals.update({name: "appAccount"}, {$set:
                {balance: getBalance(appAccount.address)}
            })
    },

    "create-new-game": function () {
        if(Meteor.user().profile.isAdmin) {
            let appAccount = Globals.findOne({name: "appAccount"});
            return getInstance("LuckyDAO", appAccount.address, Meteor.settings.password);
        }
    },
})

Meteor.startup(() => {
  // initialize the server wallet
    createKeystore(
        Meteor.settings.alias,
        Meteor.settings.email,
        Meteor.settings.password,
        Meteor.settings.salt,
        Meteor.settings.mnemonic
    ).then((keystore) => {
        Globals.upsert({name: "appAccount"}, {$set:
            {address: keystore.username, balance: getBalance(keystore.username)}
        })
    });


});
