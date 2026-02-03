"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const errors_1 = require("./errors");
describe("errors", () => {
    describe("getIncompatibleSchemaError", () => {
        it("should return undefined if no incompatible schema error", () => {
            const err = {
                context: {
                    body: {
                        error: {
                            details: [{ "@type": "some.other.Error" }],
                        },
                    },
                },
            };
            (0, chai_1.expect)((0, errors_1.getIncompatibleSchemaError)(err)).to.be.undefined;
        });
        it("should extract violation type from precondition failure", () => {
            const err = {
                context: {
                    body: {
                        error: {
                            details: [
                                {
                                    "@type": "type.googleapis.com/google.rpc.PreconditionFailure",
                                    violations: [{ type: "INCOMPATIBLE_SCHEMA" }],
                                },
                                { "@type": "IncompatibleSqlSchemaError" },
                            ],
                        },
                    },
                },
            };
            const result = (0, errors_1.getIncompatibleSchemaError)(err);
            (0, chai_1.expect)(result).to.not.be.undefined;
            (0, chai_1.expect)(result?.violationType).to.equal("INCOMPATIBLE_SCHEMA");
        });
    });
    describe("getInvalidConnectors", () => {
        it("should return an empty array if no invalid connectors", () => {
            const err = {
                context: {
                    body: {
                        error: {
                            details: [{ "@type": "some.other.Error" }],
                        },
                    },
                },
            };
            (0, chai_1.expect)((0, errors_1.getInvalidConnectors)(err)).to.be.empty;
        });
        it("should extract invalid connectors from precondition failure", () => {
            const err = {
                context: {
                    body: {
                        error: {
                            details: [
                                {
                                    "@type": "type.googleapis.com/google.rpc.PreconditionFailure",
                                    violations: [
                                        { type: "INCOMPATIBLE_CONNECTOR", subject: "users" },
                                        { type: "INCOMPATIBLE_CONNECTOR", subject: "posts" },
                                    ],
                                },
                            ],
                        },
                    },
                },
            };
            const result = (0, errors_1.getInvalidConnectors)(err);
            (0, chai_1.expect)(result).to.deep.equal(["users", "posts"]);
        });
    });
});
//# sourceMappingURL=errors.spec.js.map