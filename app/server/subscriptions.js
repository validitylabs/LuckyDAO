import {Globals} from "../imports/model/globals";
import {Games} from "../imports/model/games";
import {EJSON} from "meteor/ejson";
import {getBalance} from "../imports/ethereum/ethereum-services";

Meteor.startup(function () {
    Assets.getText("build/contracts/LuckyDAO.json", function (err, json) {
        Globals.upsert({name: "contractInterfaces"}, {$set: {contracts: {
            LuckyDAO: EJSON.parse(json)
        }}})
    });

    Globals.upsert({name: "appAccount"},
        {$set: {balance: getBalance(Meteor.settings.appAddress)}})
});

Meteor.publish("globals", function () {
    return Globals.find();
});

Meteor.publish("game-list", function () {
    return Games.find({}, {sort: {endTimestamp: -1}, limit: 10});
});
