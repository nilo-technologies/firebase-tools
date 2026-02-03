"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const requireInteractive_1 = require("./requireInteractive");
const error_1 = require("./error");
describe("requireInteractive", () => {
    it("should resolve if options.nonInteractive is false", async () => {
        const options = { nonInteractive: false };
        await (0, chai_1.expect)((0, requireInteractive_1.default)(options)).to.be.fulfilled;
    });
    it("should resolve if options.nonInteractive is undefined", async () => {
        const options = {};
        await (0, chai_1.expect)((0, requireInteractive_1.default)(options)).to.be.fulfilled;
    });
    it("should reject with a FirebaseError if options.nonInteractive is true", async () => {
        const options = { nonInteractive: true };
        await (0, chai_1.expect)((0, requireInteractive_1.default)(options)).to.be.rejectedWith(error_1.FirebaseError, "This command cannot run in non-interactive mode");
    });
});
//# sourceMappingURL=requireInteractive.spec.js.map