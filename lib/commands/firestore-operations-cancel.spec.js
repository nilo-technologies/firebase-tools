"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const firestore_operations_cancel_1 = require("./firestore-operations-cancel");
const fsi = require("../firestore/api");
const prompt = require("../prompt");
const utils = require("../utils");
describe("firestore:operations:cancel", () => {
    const sandbox = sinon.createSandbox();
    let firestoreApiStub;
    let confirmStub;
    let logSuccessStub;
    let logWarningStub;
    beforeEach(() => {
        firestoreApiStub = sandbox.createStubInstance(fsi.FirestoreApi);
        sandbox.stub(fsi, "FirestoreApi").returns(firestoreApiStub);
        confirmStub = sandbox.stub(prompt, "confirm");
        logSuccessStub = sandbox.stub(utils, "logSuccess");
        logWarningStub = sandbox.stub(utils, "logWarning");
    });
    afterEach(() => {
        sandbox.restore();
    });
    it("should call the Firestore API with the correct parameters with --force", async () => {
        const options = { project: "test-project", database: "test-db", force: true };
        const operationName = "test-operation";
        firestoreApiStub.cancelOperation.resolves({ success: true });
        await firestore_operations_cancel_1.command.runner()(operationName, options);
        (0, chai_1.expect)(firestoreApiStub.cancelOperation).to.be.calledOnceWith("test-project", "test-db", operationName);
        (0, chai_1.expect)(confirmStub).to.not.be.called;
    });
    it("should prompt for confirmation and continue if confirmed", async () => {
        const options = { project: "test-project", database: "test-db", force: false };
        const operationName = "test-operation";
        confirmStub.resolves(true);
        firestoreApiStub.cancelOperation.resolves({ success: true });
        await firestore_operations_cancel_1.command.runner()(operationName, options);
        (0, chai_1.expect)(confirmStub).to.be.calledOnce;
        (0, chai_1.expect)(firestoreApiStub.cancelOperation).to.be.calledOnceWith("test-project", "test-db", operationName);
        (0, chai_1.expect)(logSuccessStub).to.be.calledOnceWith("Operation cancelled successfully.");
    });
    it("should not cancel the operation if not confirmed", async () => {
        const options = { project: "test-project", database: "test-db", force: false };
        const operationName = "test-operation";
        confirmStub.resolves(false);
        await (0, chai_1.expect)(firestore_operations_cancel_1.command.runner()(operationName, options)).to.be.rejectedWith("Command aborted.");
        (0, chai_1.expect)(confirmStub).to.be.calledOnce;
        (0, chai_1.expect)(firestoreApiStub.cancelOperation).to.not.be.called;
    });
    it("should log a warning if operation cancellation fails", async () => {
        const options = { project: "test-project", database: "test-db", force: true };
        const operationName = "test-operation";
        firestoreApiStub.cancelOperation.resolves({ success: false });
        await firestore_operations_cancel_1.command.runner()(operationName, options);
        (0, chai_1.expect)(firestoreApiStub.cancelOperation).to.be.calledOnce;
        (0, chai_1.expect)(logWarningStub).to.be.calledOnceWith("Canceling the operation failed.");
    });
    it("should print status in JSON format when --json is specified", async () => {
        const options = { project: "test-project", database: "test-db", force: true, json: true };
        const operationName = "test-operation";
        const status = { success: true };
        firestoreApiStub.cancelOperation.resolves(status);
        const jsonResult = await firestore_operations_cancel_1.command.runner()(operationName, options);
        (0, chai_1.expect)(jsonResult).to.eql(status);
    });
});
//# sourceMappingURL=firestore-operations-cancel.spec.js.map