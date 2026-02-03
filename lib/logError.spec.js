"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const logError_1 = require("./logError");
const logger_1 = require("./logger");
describe("logError", () => {
    let sandbox;
    let errorSpy;
    let debugSpy;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        errorSpy = sandbox.spy(logger_1.logger, "error");
        debugSpy = sandbox.spy(logger_1.logger, "debug");
    });
    afterEach(() => {
        sandbox.restore();
    });
    it("should log a simple error message", () => {
        const error = { message: "A simple error has occurred." };
        (0, logError_1.logError)(error);
        (0, chai_1.expect)(errorSpy).to.have.been.calledWith(sinon.match.any, "A simple error has occurred.");
    });
    it("should log an error with children", () => {
        const error = {
            message: "An error with children has occurred.",
            children: [{ name: "Child1", message: "Child error 1" }, { message: "Child error 2" }],
        };
        (0, logError_1.logError)(error);
        (0, chai_1.expect)(errorSpy).to.have.been.calledWith(sinon.match.any, sinon.match(/An error with children has occurred./));
        (0, chai_1.expect)(errorSpy).to.have.been.calledWith(sinon.match(/- .*Child1.* Child error 1/));
        (0, chai_1.expect)(errorSpy).to.have.been.calledWith(sinon.match(/- Child error 2/));
    });
    it("should log an error with an original stack", () => {
        const error = {
            message: "An error with an original stack.",
            original: { stack: "the stack" },
        };
        (0, logError_1.logError)(error);
        (0, chai_1.expect)(debugSpy).to.have.been.calledWith("the stack");
    });
    it("should log an error with a context", () => {
        const error = {
            message: "An error with a context.",
            context: { key: "value" },
        };
        (0, logError_1.logError)(error);
        (0, chai_1.expect)(debugSpy).to.have.been.calledWith("Error Context:", JSON.stringify({ key: "value" }, undefined, 2));
    });
    it("should log an error with both original stack and context", () => {
        const error = {
            message: "An error with both.",
            original: { stack: "the stack" },
            context: { key: "value" },
        };
        (0, logError_1.logError)(error);
        (0, chai_1.expect)(debugSpy).to.have.been.calledWith("the stack");
        (0, chai_1.expect)(debugSpy).to.have.been.calledWith("Error Context:", JSON.stringify({ key: "value" }, undefined, 2));
    });
    it("should log an error with children and context", () => {
        const error = {
            message: "An error with children and context.",
            children: [{ message: "Child error" }],
            context: { key: "value" },
        };
        (0, logError_1.logError)(error);
        (0, chai_1.expect)(errorSpy).to.have.been.calledWith(sinon.match.any, sinon.match(/An error with children and context./));
        (0, chai_1.expect)(errorSpy).to.have.been.calledWith(sinon.match(/- Child error/));
        (0, chai_1.expect)(debugSpy).to.have.been.calledWith("Error Context:", JSON.stringify({ key: "value" }, undefined, 2));
    });
});
//# sourceMappingURL=logError.spec.js.map