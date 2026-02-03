"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const sinon = require("sinon");
const developmentServer_1 = require("./developmentServer");
const chai_1 = require("chai");
describe("utils", () => {
    let pathExistsStub;
    beforeEach(() => {
        pathExistsStub = sinon.stub(fs, "pathExists");
    });
    afterEach(() => {
        pathExistsStub.restore();
    });
    describe("detectPackageManager", () => {
        it("returns npm if package-lock.json file fond", async () => {
            pathExistsStub.callsFake((...args) => {
                if (args[0] === "package-lock.json") {
                    return true;
                }
                return false;
            });
            (0, chai_1.expect)(await (0, developmentServer_1.detectPackageManager)("./")).to.equal("npm");
        });
        it("returns pnpm if pnpm-lock.json file fond", async () => {
            pathExistsStub.callsFake((...args) => {
                if (args[0] === "pnpm-lock.yaml") {
                    return true;
                }
                return false;
            });
            (0, chai_1.expect)(await (0, developmentServer_1.detectPackageManager)("./")).to.equal("pnpm");
        });
    });
    it("returns yarn if yarn.lock file fond", async () => {
        pathExistsStub.callsFake((...args) => {
            if (args[0] === "yarn.lock") {
                return true;
            }
            return false;
        });
        (0, chai_1.expect)(await (0, developmentServer_1.detectPackageManager)("./")).to.equal("yarn");
    });
});
//# sourceMappingURL=developmentServer.spec.js.map