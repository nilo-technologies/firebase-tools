"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const supported = require(".");
const utils = require("../../../../utils");
const sinon = require("sinon");
const error_1 = require("../../../../error");
describe("supported runtimes", () => {
    it("sorts latest numerically, not lexographically", () => {
        (0, chai_1.expect)(supported.latest("nodejs")).to.not.equal("nodejs8");
    });
    it("identifies decommissioned runtimes", () => {
        (0, chai_1.expect)(supported.isDecommissioned("nodejs8")).to.be.true;
    });
    describe("isRuntime", () => {
        it("identifies valid runtimes", () => {
            (0, chai_1.expect)(supported.isRuntime("nodejs20")).to.be.true;
        });
        it("identifies invalid runtimes", () => {
            (0, chai_1.expect)(supported.isRuntime("prolog1")).to.be.false;
        });
    });
    describe("guardVersionSupport", () => {
        let logLabeledWarning;
        beforeEach(() => {
            logLabeledWarning = sinon.stub(utils, "logLabeledWarning");
        });
        afterEach(() => {
            logLabeledWarning.restore();
        });
        it("throws an error for decommissioned runtimes", () => {
            (0, chai_1.expect)(() => supported.guardVersionSupport("nodejs8")).to.throw(error_1.FirebaseError, "Runtime Node.js 8 was decommissioned on 2021-02-01. " +
                "To deploy you must first upgrade your runtime version");
        });
        it("warns for a deprecated runtime", () => {
            supported.guardVersionSupport("nodejs20", new Date("2026-04-30"));
            (0, chai_1.expect)(logLabeledWarning).to.have.been.calledWith("functions", "Runtime Node.js 20 was deprecated on 2026-04-30 and will be " +
                "decommissioned on 2026-10-30, after which you will not be able to " +
                "deploy without upgrading. Consider upgrading now to avoid disruption. See " +
                "https://cloud.google.com/functions/docs/runtime-support for full " +
                "details on the lifecycle policy");
        });
        it("warns leading up to deprecation", () => {
            supported.guardVersionSupport("nodejs20", new Date("2026-04-01"));
            (0, chai_1.expect)(logLabeledWarning).to.have.been.calledWith("functions", "Runtime Node.js 20 will be deprecated on 2026-04-30 and will be " +
                "decommissioned on 2026-10-30, after which you will not be able to " +
                "deploy without upgrading. Consider upgrading now to avoid disruption. See " +
                "https://cloud.google.com/functions/docs/runtime-support for full " +
                "details on the lifecycle policy");
        });
    });
});
//# sourceMappingURL=supported.spec.js.map