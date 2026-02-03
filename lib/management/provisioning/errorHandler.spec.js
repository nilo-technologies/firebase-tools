"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const error_1 = require("../../error");
const errorHandler_1 = require("./errorHandler");
describe("errorHandler", () => {
    describe("enhanceProvisioningError", () => {
        it("should include ErrorInfo details in error message", () => {
            const originalError = new error_1.FirebaseError("Permission denied", {
                context: {
                    body: {
                        error: {
                            code: 403,
                            message: "The user has not accepted the terms of service.",
                            status: "PERMISSION_DENIED",
                            details: [
                                {
                                    "@type": "type.googleapis.com/google.rpc.ErrorInfo",
                                    reason: "TOS_REQUIRED: The following ToS's must be accepted: [generative-language-api].",
                                    domain: "firebase.googleapis.com",
                                },
                            ],
                        },
                    },
                },
            });
            const result = (0, errorHandler_1.enhanceProvisioningError)(originalError, "Failed to provision Firebase app");
            (0, chai_1.expect)(result).to.be.instanceOf(error_1.FirebaseError);
            (0, chai_1.expect)(result.message).to.include("Failed to provision Firebase app: Permission denied");
            (0, chai_1.expect)(result.message).to.include("Error details:");
            (0, chai_1.expect)(result.message).to.include("Reason: TOS_REQUIRED: The following ToS's must be accepted: [generative-language-api].");
            (0, chai_1.expect)(result.message).to.include("Domain: firebase.googleapis.com");
            (0, chai_1.expect)(result.exit).to.equal(2);
            (0, chai_1.expect)(result.original).to.equal(originalError);
        });
        it("should include HelpLinks in error message", () => {
            const originalError = new error_1.FirebaseError("Permission denied", {
                context: {
                    body: {
                        error: {
                            code: 403,
                            message: "The user has not accepted the terms of service.",
                            status: "PERMISSION_DENIED",
                            details: [
                                {
                                    "@type": "type.googleapis.com/google.rpc.Help",
                                    links: [
                                        {
                                            description: "Link to accept Generative Language terms of service",
                                            url: "https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?authuser=0&forceCheckTos=true",
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
            });
            const result = (0, errorHandler_1.enhanceProvisioningError)(originalError, "Failed to provision Firebase app");
            (0, chai_1.expect)(result.message).to.include("For help resolving this issue:");
            (0, chai_1.expect)(result.message).to.include("Link to accept Generative Language terms of service");
            (0, chai_1.expect)(result.message).to.include("https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?authuser=0&forceCheckTos=true");
        });
        it("should include both ErrorInfo and HelpLinks in error message", () => {
            const originalError = new error_1.FirebaseError("Permission denied", {
                context: {
                    body: {
                        error: {
                            code: 403,
                            message: "The user has not accepted the terms of service.",
                            status: "PERMISSION_DENIED",
                            details: [
                                {
                                    "@type": "type.googleapis.com/google.rpc.ErrorInfo",
                                    reason: "TOS_REQUIRED: The following ToS's must be accepted: [generative-language-api].",
                                    domain: "firebase.googleapis.com",
                                },
                                {
                                    "@type": "type.googleapis.com/google.rpc.Help",
                                    links: [
                                        {
                                            description: "Link to accept Generative Language terms of service",
                                            url: "https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?authuser=0&forceCheckTos=true",
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
            });
            const result = (0, errorHandler_1.enhanceProvisioningError)(originalError, "Failed to provision Firebase app");
            (0, chai_1.expect)(result.message).to.include("Error details:");
            (0, chai_1.expect)(result.message).to.include("Reason: TOS_REQUIRED: The following ToS's must be accepted: [generative-language-api].");
            (0, chai_1.expect)(result.message).to.include("Domain: firebase.googleapis.com");
            (0, chai_1.expect)(result.message).to.include("For help resolving this issue:");
            (0, chai_1.expect)(result.message).to.include("Link to accept Generative Language terms of service");
        });
        it("should include ErrorInfo with metadata in error message", () => {
            const originalError = new error_1.FirebaseError("Invalid request", {
                context: {
                    body: {
                        error: {
                            code: 400,
                            message: "Invalid request",
                            status: "INVALID_ARGUMENT",
                            details: [
                                {
                                    "@type": "type.googleapis.com/google.rpc.ErrorInfo",
                                    reason: "INVALID_FIELD",
                                    domain: "firebase.googleapis.com",
                                    metadata: {
                                        field: "displayName",
                                        constraint: "max_length",
                                    },
                                },
                            ],
                        },
                    },
                },
            });
            const result = (0, errorHandler_1.enhanceProvisioningError)(originalError, "Operation failed");
            (0, chai_1.expect)(result.message).to.include("Reason: INVALID_FIELD");
            (0, chai_1.expect)(result.message).to.include("Domain: firebase.googleapis.com");
            (0, chai_1.expect)(result.message).to.include("Additional Info:");
            (0, chai_1.expect)(result.message).to.include("field");
        });
        it("should include multiple help links in error message", () => {
            const originalError = new error_1.FirebaseError("Multiple help links", {
                context: {
                    body: {
                        error: {
                            code: 403,
                            message: "Permission denied",
                            status: "PERMISSION_DENIED",
                            details: [
                                {
                                    "@type": "type.googleapis.com/google.rpc.Help",
                                    links: [
                                        {
                                            description: "First help link",
                                            url: "https://example.com/help1",
                                        },
                                        {
                                            description: "Second help link",
                                            url: "https://example.com/help2",
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
            });
            const result = (0, errorHandler_1.enhanceProvisioningError)(originalError, "Operation failed");
            (0, chai_1.expect)(result.message).to.include("First help link");
            (0, chai_1.expect)(result.message).to.include("https://example.com/help1");
            (0, chai_1.expect)(result.message).to.include("Second help link");
            (0, chai_1.expect)(result.message).to.include("https://example.com/help2");
        });
        it("should handle errors without details gracefully", () => {
            const originalError = new error_1.FirebaseError("Firebase error without details", {
                context: {
                    body: {
                        error: {
                            code: 400,
                            message: "Bad Request",
                            status: "INVALID_ARGUMENT",
                        },
                    },
                },
            });
            const result = (0, errorHandler_1.enhanceProvisioningError)(originalError, "Operation failed");
            (0, chai_1.expect)(result).to.be.instanceOf(error_1.FirebaseError);
            (0, chai_1.expect)(result.message).to.equal("Operation failed: Firebase error without details");
            (0, chai_1.expect)(result.exit).to.equal(2);
        });
        it("should handle non-Error types gracefully", () => {
            const result = (0, errorHandler_1.enhanceProvisioningError)("String error", "Operation failed");
            (0, chai_1.expect)(result).to.be.instanceOf(error_1.FirebaseError);
            (0, chai_1.expect)(result.message).to.equal("Operation failed: String error");
            (0, chai_1.expect)(result.exit).to.equal(2);
            (0, chai_1.expect)(result.original).to.be.instanceOf(Error);
        });
        it("should handle regular Error without context", () => {
            const regularError = new Error("Regular error");
            const result = (0, errorHandler_1.enhanceProvisioningError)(regularError, "Context message");
            (0, chai_1.expect)(result).to.be.instanceOf(error_1.FirebaseError);
            (0, chai_1.expect)(result.message).to.equal("Context message: Regular error");
            (0, chai_1.expect)(result.original).to.equal(regularError);
        });
        it("should ignore unknown detail types", () => {
            const originalError = new error_1.FirebaseError("Unknown detail type", {
                context: {
                    body: {
                        error: {
                            code: 500,
                            message: "Internal error",
                            status: "INTERNAL",
                            details: [
                                {
                                    "@type": "type.googleapis.com/google.rpc.UnknownType",
                                    someField: "someValue",
                                },
                            ],
                        },
                    },
                },
            });
            const result = (0, errorHandler_1.enhanceProvisioningError)(originalError, "Operation failed");
            (0, chai_1.expect)(result.message).to.equal("Operation failed: Unknown detail type");
            (0, chai_1.expect)(result.message).to.not.include("Error details:");
            (0, chai_1.expect)(result.message).to.not.include("For help");
        });
    });
});
//# sourceMappingURL=errorHandler.spec.js.map