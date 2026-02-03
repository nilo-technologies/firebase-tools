"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const requireDatabaseInstance_1 = require("./requireDatabaseInstance");
const db = require("./getDefaultDatabaseInstance");
const error_1 = require("./error");
describe("requireDatabaseInstance", () => {
    let getDefaultDatabaseInstanceStub;
    beforeEach(() => {
        getDefaultDatabaseInstanceStub = sinon.stub(db, "getDefaultDatabaseInstance");
    });
    afterEach(() => {
        sinon.restore();
    });
    it("should do nothing if options.instance is already set", async () => {
        const options = { instance: "my-instance" };
        await (0, requireDatabaseInstance_1.requireDatabaseInstance)(options);
        (0, chai_1.expect)(options.instance).to.equal("my-instance");
        (0, chai_1.expect)(getDefaultDatabaseInstanceStub).to.not.have.been.called;
    });
    it("should call getDefaultDatabaseInstance if options.instance is not set", async () => {
        const options = {};
        getDefaultDatabaseInstanceStub.resolves("default-instance");
        await (0, requireDatabaseInstance_1.requireDatabaseInstance)(options);
        (0, chai_1.expect)(getDefaultDatabaseInstanceStub).to.have.been.calledOnce;
    });
    it("should set options.instance to the value returned by getDefaultDatabaseInstance", async () => {
        const options = {};
        getDefaultDatabaseInstanceStub.resolves("default-instance");
        await (0, requireDatabaseInstance_1.requireDatabaseInstance)(options);
        (0, chai_1.expect)(options.instance).to.equal("default-instance");
    });
    it("should throw a FirebaseError if getDefaultDatabaseInstance returns an empty string", async () => {
        const options = {};
        getDefaultDatabaseInstanceStub.resolves("");
        await (0, chai_1.expect)((0, requireDatabaseInstance_1.requireDatabaseInstance)(options)).to.be.rejectedWith(error_1.FirebaseError, requireDatabaseInstance_1.MISSING_DEFAULT_INSTANCE_ERROR_MESSAGE);
    });
    it("should throw a FirebaseError if getDefaultDatabaseInstance throws an error", async () => {
        const options = { project: "my-project" };
        const error = new Error("Something went wrong");
        getDefaultDatabaseInstanceStub.rejects(error);
        await (0, chai_1.expect)((0, requireDatabaseInstance_1.requireDatabaseInstance)(options)).to.be.rejectedWith(error_1.FirebaseError, "Failed to get details for project: my-project.");
    });
});
//# sourceMappingURL=requireDatabaseInstance.spec.js.map