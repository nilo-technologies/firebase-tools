"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const error_1 = require("./error");
const prompt = require("./prompt");
describe("prompt", () => {
    describe("guard", () => {
        it("returns default in non-interactive if present", () => {
            const { shouldReturn, value } = prompt.guard({
                message: "message",
                nonInteractive: true,
                default: 42,
            });
            (0, chai_1.expect)(shouldReturn).to.be.true;
            (0, chai_1.expect)(value).to.equal(42);
        });
        it("does not suggest returning if interactive", () => {
            const { shouldReturn, value } = prompt.guard({
                message: "message",
                nonInteractive: false,
                default: 42,
            });
            (0, chai_1.expect)(shouldReturn).to.be.false;
            (0, chai_1.expect)(value).to.be.undefined;
        });
        it("throws if non-interactive without default", () => {
            (0, chai_1.expect)(() => prompt.guard({
                message: "message",
                nonInteractive: true,
            })).to.throw(error_1.FirebaseError, 'Question "message" does not have a default and cannot be answered in non-interactive mode');
        });
    });
    describe("query types", () => {
        describe("confirm", () => {
            it("handles force", async () => {
                const result = await prompt.confirm({
                    message: "Continue?",
                    default: false,
                    force: true,
                });
                (0, chai_1.expect)(result).to.be.true;
            });
            it("handles non-interactive with default", async () => {
                const result = await prompt.confirm({
                    message: "Continue?",
                    nonInteractive: true,
                    default: false,
                });
                (0, chai_1.expect)(result).to.be.false;
            });
            it("throws in non-interactive without default", async () => {
                await (0, chai_1.expect)(prompt.confirm({
                    message: "Continue?",
                    nonInteractive: true,
                })).to.be.rejectedWith(error_1.FirebaseError, 'Question "Continue?" does not have a default and cannot be answered in non-interactive mode');
            });
        });
        describe("input", () => {
            it("handles non-interactive with default", async () => {
                const result = await prompt.input({
                    message: "Name?",
                    nonInteractive: true,
                    default: "Inigo Montoya",
                });
                (0, chai_1.expect)(result).to.equal("Inigo Montoya");
            });
            it("throws in non-interactive without default", async () => {
                await (0, chai_1.expect)(prompt.input({
                    message: "Name?",
                    nonInteractive: true,
                })).to.be.rejectedWith(error_1.FirebaseError, 'Question "Name?" does not have a default and cannot be answered in non-interactive mode');
            });
        });
        describe("checkbox", () => {
            it("handles non-interactive with default", async () => {
                const result = await prompt.checkbox({
                    message: "Tools?",
                    nonInteractive: true,
                    choices: ["hammer", "wrench", "saw"],
                    default: ["hammer", "wrench"],
                });
                (0, chai_1.expect)(result).to.deep.equal(["hammer", "wrench"]);
            });
            it("throws in non-interactive without default", async () => {
                await (0, chai_1.expect)(prompt.checkbox({
                    message: "Tools?",
                    nonInteractive: true,
                    choices: ["hammer", "wrench", "saw"],
                })).to.be.rejectedWith(error_1.FirebaseError, 'Question "Tools?" does not have a default and cannot be answered in non-interactive mode');
            });
        });
        describe("select", () => {
            it("handles non-interactive with default", async () => {
                const result = await prompt.select({
                    message: "Tool?",
                    nonInteractive: true,
                    choices: ["hammer", "wrench", "saw"],
                    default: "wrench",
                });
                (0, chai_1.expect)(result).to.equal("wrench");
            });
            it("throws in non-interactive without default", async () => {
                await (0, chai_1.expect)(prompt.select({
                    message: "Tool?",
                    nonInteractive: true,
                    choices: ["hammer", "wrench", "saw"],
                })).to.be.rejectedWith(error_1.FirebaseError, 'Question "Tool?" does not have a default and cannot be answered in non-interactive mode');
            });
        });
        describe("number", () => {
            it("handles non-interactive with default", async () => {
                const result = await prompt.number({
                    message: "Count?",
                    nonInteractive: true,
                    default: 42,
                });
                (0, chai_1.expect)(result).to.equal(42);
            });
            it("throws in non-interactive without default", async () => {
                await (0, chai_1.expect)(prompt.number({
                    message: "Count?",
                    nonInteractive: true,
                })).to.be.rejectedWith(error_1.FirebaseError, 'Question "Count?" does not have a default and cannot be answered in non-interactive mode');
            });
        });
        describe("password", () => {
            it("throws in non-interactive", async () => {
                await (0, chai_1.expect)(prompt.password({
                    message: "Password?",
                    nonInteractive: true,
                })).to.be.rejectedWith(error_1.FirebaseError, 'Question "Password?" does not have a default and cannot be answered in non-interactive mode');
            });
        });
        describe("search", () => {
            const source = (term) => {
                return ["a", "b", "c"];
            };
            it("handles non-interactive with default", async () => {
                const result = await prompt.search({
                    message: "Letter?",
                    nonInteractive: true,
                    source,
                    default: "b",
                });
                (0, chai_1.expect)(result).to.equal("b");
            });
            it("throws in non-interactive without default", async () => {
                await (0, chai_1.expect)(prompt.search({
                    message: "Letter?",
                    nonInteractive: true,
                    source,
                })).to.be.rejectedWith(error_1.FirebaseError, 'Question "Letter?" does not have a default and cannot be answered in non-interactive mode');
            });
        });
    });
});
//# sourceMappingURL=prompt.spec.js.map