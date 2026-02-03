"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const firestore_operations_list_1 = require("./firestore-operations-list");
const fsi = require("../firestore/api");
const logger_1 = require("../logger");
const pretty_print_1 = require("../firestore/pretty-print");
const error_1 = require("../error");
describe("firestore:operations:list", () => {
    const sandbox = sinon.createSandbox();
    let firestoreApiStub;
    let loggerInfoStub;
    let prettyPrintStub;
    beforeEach(() => {
        firestoreApiStub = sandbox.createStubInstance(fsi.FirestoreApi);
        sandbox.stub(fsi, "FirestoreApi").returns(firestoreApiStub);
        loggerInfoStub = sandbox.stub(logger_1.logger, "info");
        prettyPrintStub = sandbox.stub(pretty_print_1.PrettyPrint.prototype, "prettyPrintOperations");
    });
    afterEach(() => {
        sandbox.restore();
    });
    it("should call the Firestore API with the correct parameters", async () => {
        const options = { project: "test-project", database: "test-db", limit: 50 };
        firestoreApiStub.listOperations.resolves({ operations: [] });
        await firestore_operations_list_1.command.runner()(options);
        (0, chai_1.expect)(firestoreApiStub.listOperations).to.be.calledOnceWith("test-project", "test-db", 50);
    });
    it("should use default values for database and limit if not provided", async () => {
        const options = { project: "test-project" };
        firestoreApiStub.listOperations.resolves({ operations: [] });
        await firestore_operations_list_1.command.runner()(options);
        (0, chai_1.expect)(firestoreApiStub.listOperations).to.be.calledOnceWith("test-project", "(default)", 100);
    });
    it("should print operations in JSON format when --json is specified", async () => {
        const options = { project: "test-project", json: true };
        const operations = [
            { name: "op1", done: false, metadata: {} },
            { name: "op2", done: true, metadata: {} },
        ];
        firestoreApiStub.listOperations.resolves({ operations });
        const jsonResult = await firestore_operations_list_1.command.runner()(options);
        (0, chai_1.expect)(jsonResult).to.eql(operations);
    });
    it("should pretty-print operations when --json is not specified", async () => {
        const options = { project: "test-project" };
        const operations = [
            { name: "op1", done: false, metadata: {} },
            { name: "op2", done: true, metadata: {} },
        ];
        firestoreApiStub.listOperations.resolves({ operations });
        await firestore_operations_list_1.command.runner()(options);
        (0, chai_1.expect)(prettyPrintStub).to.be.calledOnceWith(operations);
        (0, chai_1.expect)(loggerInfoStub).to.not.be.called;
    });
    it("should throw a FirebaseError if project is not defined", async () => {
        const options = {};
        await (0, chai_1.expect)(firestore_operations_list_1.command.runner()(options)).to.be.rejectedWith(error_1.FirebaseError, "Project is not defined. Either use `--project` or use `firebase use` to set your active project.");
    });
});
//# sourceMappingURL=firestore-operations-list.spec.js.map