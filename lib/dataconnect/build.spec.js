"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const prompt = require("../prompt");
const build_1 = require("./build");
describe("handleBuildErrors", () => {
    let selectStub;
    beforeEach(() => {
        selectStub = sinon.stub(prompt, "select").throws("unexpected call to prompt.select");
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    const cases = [
        {
            desc: "Only build error",
            graphqlErr: [{ message: "build error" }],
            nonInteractive: false,
            force: true,
            dryRun: false,
            expectErr: true,
        },
        {
            desc: "Build error with evolution error",
            graphqlErr: [
                { message: "build error" },
                { message: "evolution error", extensions: { warningLevel: "INTERACTIVE_ACK" } },
            ],
            nonInteractive: false,
            force: true,
            dryRun: false,
            expectErr: true,
        },
        {
            desc: "Interactive ack evolution error, prompt and accept",
            graphqlErr: [{ message: "evolution error", extensions: { warningLevel: "INTERACTIVE_ACK" } }],
            nonInteractive: false,
            force: false,
            dryRun: false,
            promptAnswer: "proceed",
            expectErr: false,
        },
        {
            desc: "Interactive ack evolution error, prompt and reject",
            graphqlErr: [{ message: "evolution error", extensions: { warningLevel: "INTERACTIVE_ACK" } }],
            nonInteractive: false,
            force: false,
            dryRun: false,
            promptAnswer: "abort",
            expectErr: true,
        },
        {
            desc: "Interactive ack evolution error, nonInteractive=true",
            graphqlErr: [{ message: "evolution error", extensions: { warningLevel: "INTERACTIVE_ACK" } }],
            nonInteractive: true,
            force: false,
            dryRun: false,
            expectErr: false,
        },
        {
            desc: "Interactive ack evolution error, force=true",
            graphqlErr: [{ message: "evolution error", extensions: { warningLevel: "INTERACTIVE_ACK" } }],
            nonInteractive: false,
            force: true,
            dryRun: false,
            expectErr: false,
        },
        {
            desc: "Interactive ack evolution error, dryRun=true",
            graphqlErr: [{ message: "evolution error", extensions: { warningLevel: "INTERACTIVE_ACK" } }],
            nonInteractive: false,
            force: false,
            dryRun: true,
            expectErr: false,
        },
        {
            desc: "Required ack evolution error, prompt and accept",
            graphqlErr: [{ message: "evolution error", extensions: { warningLevel: "REQUIRE_ACK" } }],
            nonInteractive: false,
            force: false,
            dryRun: false,
            promptAnswer: "proceed",
            expectErr: false,
        },
        {
            desc: "Required ack evolution error, prompt and reject",
            graphqlErr: [{ message: "evolution error", extensions: { warningLevel: "REQUIRE_ACK" } }],
            nonInteractive: false,
            force: false,
            dryRun: false,
            promptAnswer: "abort",
            expectErr: true,
        },
        {
            desc: "Required ack evolution error, nonInteractive=true, force=false",
            graphqlErr: [{ message: "evolution error", extensions: { warningLevel: "REQUIRE_ACK" } }],
            nonInteractive: true,
            force: false,
            dryRun: false,
            expectErr: true,
        },
        {
            desc: "Required ack evolution error, nonInteractive=true, force=true",
            graphqlErr: [{ message: "evolution error", extensions: { warningLevel: "REQUIRE_ACK" } }],
            nonInteractive: true,
            force: true,
            dryRun: false,
            expectErr: false,
        },
        {
            desc: "Required ack evolution error, nonInteractive=false, force=true",
            graphqlErr: [{ message: "evolution error", extensions: { warningLevel: "REQUIRE_ACK" } }],
            nonInteractive: false,
            force: true,
            dryRun: false,
            expectErr: false,
        },
        {
            desc: "Required force evolution error, force=false",
            graphqlErr: [
                { message: "inaccessible error", extensions: { warningLevel: "REQUIRE_FORCE" } },
            ],
            nonInteractive: false,
            force: false,
            dryRun: false,
            expectErr: true,
        },
        {
            desc: "Required force evolution error, force=true",
            graphqlErr: [
                { message: "inaccessible error", extensions: { warningLevel: "REQUIRE_FORCE" } },
            ],
            nonInteractive: false,
            force: true,
            dryRun: false,
            expectErr: false,
        },
    ];
    for (const c of cases) {
        it(c.desc, async () => {
            try {
                if (c.promptAnswer) {
                    selectStub.resolves(c.promptAnswer);
                }
                await (0, build_1.handleBuildErrors)(c.graphqlErr, c.nonInteractive, c.force, c.dryRun);
            }
            catch (err) {
                (0, chai_1.expect)(c.expectErr).to.be.true;
            }
        });
    }
});
//# sourceMappingURL=build.spec.js.map