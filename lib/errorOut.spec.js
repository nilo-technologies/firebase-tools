"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const errorOut_1 = require("./errorOut");
const error_1 = require("./error");
const logError = require("./logError");
describe("errorOut", () => {
    let sandbox;
    let logErrorStub;
    let clock;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        logErrorStub = sandbox.stub(logError, "logError");
        clock = sandbox.useFakeTimers();
    });
    afterEach(() => {
        sandbox.restore();
    });
    it("should log a FirebaseError and exit with the correct code", () => {
        const error = new error_1.FirebaseError("A Firebase error has occurred.", { exit: 123 });
        const processExitStub = sandbox.stub(process, "exit");
        (0, errorOut_1.errorOut)(error);
        (0, chai_1.expect)(logErrorStub).to.have.been.calledWith(error);
        (0, chai_1.expect)(process.exitCode).to.equal(123);
        clock.tick(251);
        (0, chai_1.expect)(processExitStub).to.have.been.calledOnce;
    });
    it("should wrap a standard Error in a FirebaseError and exit with code 2", () => {
        const error = new Error("A standard error has occurred.");
        const processExitStub = sandbox.stub(process, "exit");
        (0, errorOut_1.errorOut)(error);
        (0, chai_1.expect)(logErrorStub).to.have.been.calledWith(sinon.match.instanceOf(error_1.FirebaseError));
        (0, chai_1.expect)(logErrorStub.getCall(0).args[0].original).to.equal(error);
        (0, chai_1.expect)(process.exitCode).to.equal(2);
        clock.tick(251);
        (0, chai_1.expect)(processExitStub).to.have.been.calledOnce;
    });
    it("should exit with code 2 if exit code is 0", () => {
        const error = new error_1.FirebaseError("An error with exit code 0.", { exit: 0 });
        const processExitStub = sandbox.stub(process, "exit");
        (0, errorOut_1.errorOut)(error);
        (0, chai_1.expect)(logErrorStub).to.have.been.calledWith(error);
        (0, chai_1.expect)(process.exitCode).to.equal(2);
        clock.tick(251);
        (0, chai_1.expect)(processExitStub).to.have.been.calledOnce;
    });
});
//# sourceMappingURL=errorOut.spec.js.map