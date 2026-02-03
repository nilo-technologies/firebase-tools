"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const timeout_1 = require("./timeout");
describe("timeoutFallback", () => {
    it("should resolve with the promise value when it completes before timeout", async () => {
        const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 10));
        const result = await (0, timeout_1.timeoutFallback)(promise, "fallback", 20);
        (0, chai_1.expect)(result).to.equal("success");
    });
    it("should resolve with the fallback value when timeout occurs", async () => {
        const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 30));
        const result = await (0, timeout_1.timeoutFallback)(promise, "fallback", 20);
        (0, chai_1.expect)(result).to.equal("fallback");
    });
});
describe("timeoutError", () => {
    it("should resolve with the promise value when it completes before timeout", async () => {
        const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 10));
        const result = await (0, timeout_1.timeoutError)(promise, "error", 20);
        (0, chai_1.expect)(result).to.equal("success");
    });
    it("should reject with a default error when timeout occurs", async () => {
        const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 30));
        try {
            await (0, timeout_1.timeoutError)(promise, undefined, 20);
            chai_1.expect.fail("should have thrown");
        }
        catch (e) {
            (0, chai_1.expect)(e.message).to.equal("Operation timed out.");
        }
    });
    it("should reject with a custom error message when timeout occurs", async () => {
        const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 30));
        const errorMessage = "custom error";
        try {
            await (0, timeout_1.timeoutError)(promise, errorMessage, 20);
            chai_1.expect.fail("should have thrown");
        }
        catch (e) {
            (0, chai_1.expect)(e.message).to.equal(errorMessage);
        }
    });
    it("should reject with a custom error object when timeout occurs", async () => {
        const promise = new Promise((resolve) => setTimeout(() => resolve("success"), 30));
        const error = new Error("custom error object");
        try {
            await (0, timeout_1.timeoutError)(promise, error, 20);
            chai_1.expect.fail("should have thrown");
        }
        catch (e) {
            (0, chai_1.expect)(e).to.equal(error);
        }
    });
});
//# sourceMappingURL=timeout.spec.js.map