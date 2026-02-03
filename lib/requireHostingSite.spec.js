"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const requireHostingSite_1 = require("./requireHostingSite");
const hosting = require("./getDefaultHostingSite");
describe("requireHostingSite", () => {
    let getDefaultHostingSiteStub;
    beforeEach(() => {
        getDefaultHostingSiteStub = sinon.stub(hosting, "getDefaultHostingSite");
    });
    afterEach(() => {
        sinon.restore();
    });
    it("should do nothing if options.site is already set", async () => {
        const options = { site: "my-site" };
        await (0, requireHostingSite_1.requireHostingSite)(options);
        (0, chai_1.expect)(options.site).to.equal("my-site");
        (0, chai_1.expect)(getDefaultHostingSiteStub).to.not.have.been.called;
    });
    it("should call getDefaultHostingSite if options.site is not set", async () => {
        const options = {};
        getDefaultHostingSiteStub.resolves("default-site");
        await (0, requireHostingSite_1.requireHostingSite)(options);
        (0, chai_1.expect)(getDefaultHostingSiteStub).to.have.been.calledOnce;
    });
    it("should set options.site to the value returned by getDefaultHostingSite", async () => {
        const options = {};
        getDefaultHostingSiteStub.resolves("default-site");
        await (0, requireHostingSite_1.requireHostingSite)(options);
        (0, chai_1.expect)(options.site).to.equal("default-site");
    });
    it("should not throw an error if getDefaultHostingSite resolves", async () => {
        const options = {};
        getDefaultHostingSiteStub.resolves("default-site");
        await (0, chai_1.expect)((0, requireHostingSite_1.requireHostingSite)(options)).to.be.fulfilled;
    });
});
//# sourceMappingURL=requireHostingSite.spec.js.map