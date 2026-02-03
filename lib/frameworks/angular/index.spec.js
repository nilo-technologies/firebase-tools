"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const fsExtra = require("fs-extra");
const _1 = require(".");
describe("Angular", () => {
    describe("discovery", () => {
        const cwd = Math.random().toString(36).split(".")[1];
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should find an Angular app", async () => {
            sandbox.stub(fsExtra, "pathExists").resolves(true);
            (0, chai_1.expect)(await (0, _1.discover)(cwd)).to.deep.equal({
                mayWantBackend: true,
                version: undefined,
            });
        });
    });
});
//# sourceMappingURL=index.spec.js.map