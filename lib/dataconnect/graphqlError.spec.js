"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const graphqlError_1 = require("./graphqlError");
describe("graphqlError", () => {
    describe("prettify", () => {
        it("should format a simple error", () => {
            const err = {
                message: "Something went wrong",
                path: ["users", 0, "name"],
                locations: [{ line: 10, column: 2 }],
                extensions: { file: "users.gql" },
            };
            const result = (0, graphqlError_1.prettify)(err);
            (0, chai_1.expect)(result).to.equal("users.gql:10: On users[0].name: Something went wrong");
        });
        it("should handle missing path", () => {
            const err = {
                message: "Another issue",
                locations: [{ line: 5, column: 1 }],
                extensions: { file: "posts.gql" },
            };
            const result = (0, graphqlError_1.prettify)(err);
            (0, chai_1.expect)(result).to.equal("posts.gql:5: Another issue");
        });
    });
    describe("prettifyTable", () => {
        it("should format a list of errors into a table", () => {
            const errs = [
                {
                    message: "BREAKING: A breaking change",
                    path: ["users"],
                    locations: [{ line: 1, column: 1 }],
                    extensions: {
                        file: "schema.gql",
                        workarounds: [{ description: "Do this", reason: "Because", replaceWith: "That" }],
                    },
                },
                {
                    message: "INSECURE: An insecure change",
                    path: ["posts"],
                    locations: [{ line: 2, column: 2 }],
                    extensions: {
                        file: "schema.gql",
                    },
                },
            ];
            const result = (0, graphqlError_1.prettifyTable)(errs);
            (0, chai_1.expect)(result).to.include("BREAKING");
            (0, chai_1.expect)(result).to.include("A breaking change");
            (0, chai_1.expect)(result).to.include("Do this");
            (0, chai_1.expect)(result).to.include("Because");
            (0, chai_1.expect)(result).to.include("INSECURE");
            (0, chai_1.expect)(result).to.include("An insecure change");
        });
    });
});
//# sourceMappingURL=graphqlError.spec.js.map