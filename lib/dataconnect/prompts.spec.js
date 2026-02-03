"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const prompt = require("../prompt");
const client = require("./client");
const prompts_1 = require("./prompts");
describe("prompts", () => {
    let confirmStub;
    let deleteConnectorStub;
    beforeEach(() => {
        confirmStub = sinon.stub(prompt, "confirm");
        deleteConnectorStub = sinon.stub(client, "deleteConnector");
    });
    afterEach(() => {
        sinon.restore();
    });
    describe("promptDeleteConnector", () => {
        it("should delete connector if user confirms", async () => {
            confirmStub.resolves(true);
            deleteConnectorStub.resolves();
            await (0, prompts_1.promptDeleteConnector)({ force: false, nonInteractive: false }, "my-connector");
            (0, chai_1.expect)(confirmStub.calledOnce).to.be.true;
            (0, chai_1.expect)(deleteConnectorStub.calledOnceWith("my-connector")).to.be.true;
        });
        it("should not delete connector if user denies", async () => {
            confirmStub.resolves(false);
            await (0, prompts_1.promptDeleteConnector)({ force: false, nonInteractive: false }, "my-connector");
            (0, chai_1.expect)(confirmStub.calledOnce).to.be.true;
            (0, chai_1.expect)(deleteConnectorStub.notCalled).to.be.true;
        });
    });
});
//# sourceMappingURL=prompts.spec.js.map