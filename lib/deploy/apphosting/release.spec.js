"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const rollout = require("../../apphosting/rollout");
const config_1 = require("../../config");
const rc_1 = require("../../rc");
const release_1 = require("./release");
const chai_1 = require("chai");
const BASE_OPTS = {
    cwd: "/",
    configPath: "/",
    except: "",
    force: false,
    nonInteractive: false,
    debug: false,
    filteredTargets: [],
    rc: new rc_1.RC(),
};
describe("apphosting", () => {
    let orchestrateRolloutStub;
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    describe("release", () => {
        const opts = {
            ...BASE_OPTS,
            projectId: "my-project",
            only: "apphosting",
            config: new config_1.Config({
                apphosting: {
                    backendId: "foo",
                    rootDir: "/",
                    ignore: [],
                },
            }),
        };
        it("does not block rollouts of other backends if one rollout fails", async () => {
            const context = {
                backendConfigs: {
                    foo: {
                        backendId: "foo",
                        rootDir: "/",
                        ignore: [],
                    },
                },
                backendLocations: { foo: "us-central1" },
                backendStorageUris: {
                    foo: "gs://firebaseapphosting-sources-us-central1/foo-1234.zip",
                },
                backendLocalBuilds: {},
            };
            orchestrateRolloutStub = sinon
                .stub(rollout, "orchestrateRollout")
                .throws("Unexpected orchestrateRollout call");
            orchestrateRolloutStub.onFirstCall().rejects();
            orchestrateRolloutStub.onSecondCall().resolves();
            await (0, chai_1.expect)((0, release_1.default)(context, opts)).to.eventually.not.rejected;
        });
    });
});
//# sourceMappingURL=release.spec.js.map