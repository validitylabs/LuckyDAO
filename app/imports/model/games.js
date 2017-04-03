import {Meteor} from "meteor/meteor";
import {Mongo} from "meteor/mongo";

export const Games = new Mongo.Collection('games');

Games.deny({
    insert: function (userId, doc) {
        return !Meteor.isServer;
    },
    update: function (userId, doc, fields, modifier) {
        return !Meteor.isServer;
    },
    remove: function (userId, doc) {
        return !Meteor.isServer;
    }
});