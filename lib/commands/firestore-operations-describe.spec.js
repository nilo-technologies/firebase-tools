"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const firestore_operations_describe_1 = require("./firestore-operations-describe");
const fsi = require("../firestore/api");
const logger_1 = require("../logger");
const pretty_print_1 = require("../firestore/pretty-print");
const error_1 = require("../error");
describe("firestore:operations:describe", () => {
    const sandbox = sinon.createSandbox();
    let firestoreApiStub;
    let loggerInfoStub;
    let prettyPrintStub;
    beforeEach(() => {
        firestoreApiStub = sandbox.createStubInstance(fsi.FirestoreApi);
        sandbox.stub(fsi, "FirestoreApi").returns(firestoreApiStub);
        loggerInfoStub = sandbox.stub(logger_1.logger, "info");
        prettyPrintStub = sandbox.stub(pretty_print_1.PrettyPrint.prototype, "prettyPrintOperation");
    });
    afterEach(() => {
        sandbox.restore();
    });
    it("should call the Firestore API with the correct parameters", async () => {
        const options = { project: "test-project", database: "test-db" };
        const operationName = "test-operation";
        firestoreApiStub.describeOperation.resolves({ name: "op1", done: false, metadata: {} });
        await firestore_operations_describe_1.command.runner()(operationName, options);
        (0, chai_1.expect)(firestoreApiStub.describeOperation).to.be.calledOnceWith("test-project", "test-db", operationName);
    });
    it("should use default values for database if not provided", async () => {
        const options = { project: "test-project" };
        const operationName = "test-operation";
        firestoreApiStub.describeOperation.resolves({ name: "op1", done: false, metadata: {} });
        await firestore_operations_describe_1.command.runner()(operationName, options);
        (0, chai_1.expect)(firestoreApiStub.describeOperation).to.be.calledOnceWith("test-project", "(default)", operationName);
    });
    it("should print the operation in JSON format when --json is specified", async () => {
        const options = { project: "test-project", json: true };
        const operationName = "test-operation";
        const operation = { name: "op1", done: false, metadata: {} };
        firestoreApiStub.describeOperation.resolves(operation);
        const jsonResult = await firestore_operations_describe_1.command.runner()(operationName, options);
        (0, chai_1.expect)(jsonResult).to.eql(operation);
    });
    it("should pretty-print the operation when --json is not specified", async () => {
        const options = { project: "test-project" };
        const operationName = "test-operation";
        const operation = { name: "op1", done: false, metadata: {} };
        firestoreApiStub.describeOperation.resolves(operation);
        await firestore_operations_describe_1.command.runner()(operationName, options);
        (0, chai_1.expect)(prettyPrintStub).to.be.calledOnceWith(operation);
        (0, chai_1.expect)(loggerInfoStub).to.not.be.called;
    });
    it("should throw a FirebaseError if project is not defined", async () => {
        const options = {};
        const operationName = "test-operation";
        await (0, chai_1.expect)(firestore_operations_describe_1.command.runner()(operationName, options)).to.be.rejectedWith(error_1.FirebaseError, "Project is not defined. Either use `--project` or use `firebase use` to set your active project.");
    });
    it("should throw a FirebaseError if operation name is invalid", async () => {
        const options = { project: "test-project" };
        await (0, chai_1.expect)(firestore_operations_describe_1.command.runner()("/databases/blah", options)).to.be.rejectedWith(error_1.FirebaseError, '"/databases/blah" is not a valid operation name.');
        await (0, chai_1.expect)(firestore_operations_describe_1.command.runner()("projects/p/databases/d", options)).to.be.rejectedWith(error_1.FirebaseError, '"projects/p/databases/d" is not a valid operation name.');
        await (0, chai_1.expect)(firestore_operations_describe_1.command.runner()("projects/p/databases/d/operations/", options)).to.be.rejectedWith(error_1.FirebaseError, '"projects/p/databases/d/operations/" is not a valid operation name.');
    });
});
//# sourceMappingURL=firestore-operations-describe.spec.js.map