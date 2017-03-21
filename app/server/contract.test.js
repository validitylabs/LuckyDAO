import {compile, deploy} from "./deploy-contract";
import {chai} from "meteor/practicalmeteor:chai";

describe("deploy and test", function () {
    this.timeout(50000);
    let compiledContracts = undefined;

    describe("setup", function () {
        it("compiles the contracts", function () {
            return compile().then(function (output) {
                chai.assert.equal(typeof output, "object");
                compiledContracts = output;
            }).catch(function (err) {
                chai.assert.fail("", "output", err.message);
            })
        });

        it("deploys the contracts", function () {
            return deploy({contracts: {owner: "0x4615ff6690a3bb23bd85051c5c69abba4092bbb4"}})
        })
    })

    before(function (done) {
        done();
    })
})