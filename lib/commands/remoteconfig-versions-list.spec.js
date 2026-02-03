"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const remoteconfig_versions_list_1 = require("./remoteconfig-versions-list");
const logger_1 = require("../logger");
describe("remoteconfig:versions:list", () => {
    let sandbox;
    let loggerInfoStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        loggerInfoStub = sandbox.stub(logger_1.logger, "info");
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe("printVersionsTable", () => {
        it("should print an empty table when versions is undefined", () => {
            (0, remoteconfig_versions_list_1.printVersionsTable)({});
            (0, chai_1.expect)(loggerInfoStub.calledOnce).to.be.true;
            (0, chai_1.expect)(loggerInfoStub.getCall(0).args[0]).to.not.be.empty;
        });
        it("should print an empty table when versions is an empty array", () => {
            (0, remoteconfig_versions_list_1.printVersionsTable)({ versions: [] });
            (0, chai_1.expect)(loggerInfoStub.calledOnce).to.be.true;
            (0, chai_1.expect)(loggerInfoStub.getCall(0).args[0]).to.not.be.empty;
        });
        it("should print a table with version data", () => {
            const versions = [
                {
                    versionNumber: "1",
                    updateTime: "2025-02-12T00:00:00.000Z",
                    updateUser: { email: "foo@bar.com" },
                },
            ];
            (0, remoteconfig_versions_list_1.printVersionsTable)({ versions });
            (0, chai_1.expect)(loggerInfoStub.calledOnce).to.be.true;
            const output = loggerInfoStub.getCall(0).args[0];
            (0, chai_1.expect)(output).to.include("1");
            (0, chai_1.expect)(output).to.include("foo@bar.com");
        });
    });
});
//# sourceMappingURL=remoteconfig-versions-list.spec.js.map