"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const init = require("./index");
const sinon = require("sinon");
const prompt = require("../../../prompt");
const config_1 = require("../../../config");
describe("init apptesting", () => {
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    describe("askQuestions", () => {
        it("populates apptesting featureInfo", async () => {
            const inputStub = sinon.stub(prompt, "input");
            inputStub.withArgs(sinon.match.has("default", "tests")).returns(Promise.resolve("tests"));
            const setup = { featureInfo: {} };
            await init.askQuestions(setup);
            (0, chai_1.expect)(setup.featureInfo).to.eql({ apptesting: { testDir: "tests" } });
        });
    });
    describe("actuate", () => {
        it("writes a sample smoke test", async () => {
            const setup = { featureInfo: { apptesting: { testDir: "my_test_dir" } } };
            const config = new config_1.Config({});
            const askWriteProjectFileStub = sinon.stub(config, "askWriteProjectFile");
            askWriteProjectFileStub.returns(Promise.resolve());
            await init.actuate(setup, config);
            sinon.assert.calledWith(askWriteProjectFileStub, "my_test_dir/smoke_test.yaml", sinon.match.string);
            (0, chai_1.expect)(config.get("apptesting.testDir")).to.eql("my_test_dir");
        });
    });
});
//# sourceMappingURL=index.spec.js.map