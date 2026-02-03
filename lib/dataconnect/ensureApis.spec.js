"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const ensureApiEnabled = require("../ensureApiEnabled");
const apis = require("./ensureApis");
const api = require("../api");
describe("ensureApis", () => {
    let ensureStub;
    beforeEach(() => {
        ensureStub = sinon.stub(ensureApiEnabled, "ensure");
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    it("should ensure Data Connect and Cloud SQL Admin APIs are enabled", async () => {
        ensureStub.resolves();
        await apis.ensureApis("my-project");
        (0, chai_1.expect)(ensureStub).to.be.calledWith("my-project", api.dataconnectOrigin(), "dataconnect");
        (0, chai_1.expect)(ensureStub).to.be.calledWith("my-project", api.cloudSQLAdminOrigin(), "dataconnect");
    });
});
//# sourceMappingURL=ensureApis.spec.js.map