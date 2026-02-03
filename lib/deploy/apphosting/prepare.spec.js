"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const backend = require("../../apphosting/backend");
const config_1 = require("../../config");
const apiEnabled = require("../../ensureApiEnabled");
const apphosting = require("../../gcp/apphosting");
const devconnect = require("../../gcp/devConnect");
const prompt = require("../../prompt");
const rc_1 = require("../../rc");
const prepare_1 = require("./prepare");
const localbuilds = require("../../apphosting/localbuilds");
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
function initializeContext() {
    return {
        backendConfigs: {},
        backendLocations: {},
        backendStorageUris: {},
        backendLocalBuilds: {},
    };
}
describe("apphosting", () => {
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
    let confirmStub;
    let checkboxStub;
    let doSetupSourceDeployStub;
    let listBackendsStub;
    let getGitRepositoryLinkStub;
    beforeEach(() => {
        sinon.stub(opts.config, "writeProjectFile").returns();
        confirmStub = sinon.stub(prompt, "confirm").throws("Unexpected confirm call");
        checkboxStub = sinon.stub(prompt, "checkbox").throws("Unexpected checkbox scall");
        doSetupSourceDeployStub = sinon
            .stub(backend, "doSetupSourceDeploy")
            .throws("Unexpected doSetupSourceDeploy call");
        listBackendsStub = sinon
            .stub(apphosting, "listBackends")
            .throws("Unexpected listBackends call");
        sinon.stub(backend, "ensureAppHostingComputeServiceAccount").resolves();
        sinon.stub(apiEnabled, "ensure").resolves();
        getGitRepositoryLinkStub = sinon
            .stub(devconnect, "getGitRepositoryLink")
            .throws("Unexpected getGitRepositoryLink call");
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    describe("prepare", () => {
        it("correctly creates configs for localBuild backends", async () => {
            const optsWithLocalBuild = {
                ...opts,
                config: new config_1.Config({
                    apphosting: {
                        backendId: "foo",
                        rootDir: "/",
                        ignore: [],
                        localBuild: true,
                    },
                }),
            };
            const context = initializeContext();
            const annotations = {
                adapterPackageName: "@apphosting/angular-adapter",
                adapterVersion: "14.1",
                framework: "nextjs",
            };
            const buildConfig = {
                runCommand: "npm run build:prod",
                env: [],
            };
            sinon.stub(localbuilds, "localBuild").resolves({
                outputFiles: ["./next/standalone"],
                buildConfig,
                annotations,
            });
            listBackendsStub.onFirstCall().resolves({
                backends: [
                    {
                        name: "projects/my-project/locations/us-central1/backends/foo",
                    },
                ],
            });
            await (0, prepare_1.default)(context, optsWithLocalBuild);
            (0, chai_1.expect)(context.backendLocations["foo"]).to.equal("us-central1");
            (0, chai_1.expect)(context.backendConfigs["foo"]).to.deep.equal({
                backendId: "foo",
                rootDir: "/",
                ignore: [],
                localBuild: true,
            });
            (0, chai_1.expect)(context.backendLocalBuilds["foo"]).to.deep.equal({
                buildDir: "./next/standalone",
                buildConfig,
                annotations,
            });
        });
        it("links to existing backend if it already exists", async () => {
            const context = initializeContext();
            listBackendsStub.onFirstCall().resolves({
                backends: [
                    {
                        name: "projects/my-project/locations/us-central1/backends/foo",
                    },
                ],
            });
            await (0, prepare_1.default)(context, opts);
            (0, chai_1.expect)(context.backendLocations["foo"]).to.equal("us-central1");
            (0, chai_1.expect)(context.backendConfigs["foo"]).to.deep.equal({
                backendId: "foo",
                rootDir: "/",
                ignore: [],
            });
            (0, chai_1.expect)(context.backendLocalBuilds["foo"]).to.be.undefined;
        });
        it("creates a backend if it doesn't exist yet", async () => {
            const context = initializeContext();
            listBackendsStub.onFirstCall().resolves({
                backends: [],
            });
            doSetupSourceDeployStub.resolves({ location: "us-central1" });
            confirmStub.resolves(true);
            checkboxStub.resolves(["foo"]);
            await (0, prepare_1.default)(context, opts);
            (0, chai_1.expect)(doSetupSourceDeployStub).to.be.calledWith("my-project", "foo");
            (0, chai_1.expect)(context.backendLocations["foo"]).to.equal("us-central1");
            (0, chai_1.expect)(context.backendConfigs["foo"]).to.deep.equal({
                backendId: "foo",
                rootDir: "/",
                ignore: [],
            });
            (0, chai_1.expect)(context.backendLocalBuilds["foo"]).to.be.undefined;
        });
        it("skips backend deployment if alwaysDeployFromSource is false", async () => {
            const optsWithAlwaysDeploy = {
                ...opts,
                config: new config_1.Config({
                    apphosting: {
                        backendId: "foo",
                        rootDir: "/",
                        ignore: [],
                        alwaysDeployFromSource: false,
                    },
                }),
            };
            const context = initializeContext();
            listBackendsStub.onFirstCall().resolves({
                backends: [
                    {
                        name: "projects/my-project/locations/us-central1/backends/foo",
                        codebase: {
                            repository: "remote-repo.git",
                        },
                    },
                ],
            });
            await (0, prepare_1.default)(context, optsWithAlwaysDeploy);
            (0, chai_1.expect)(context.backendLocations["foo"]).to.be.undefined;
            (0, chai_1.expect)(context.backendConfigs["foo"]).to.be.undefined;
            (0, chai_1.expect)(context.backendLocalBuilds["foo"]).to.be.undefined;
        });
        it("prompts user if codebase is already connected and alwaysDeployFromSource is undefined", async () => {
            const context = initializeContext();
            listBackendsStub.onFirstCall().resolves({
                backends: [
                    {
                        name: "projects/my-project/locations/us-central1/backends/foo",
                        codebase: {
                            repository: "projects/my-project/locations/us-central1/connections/my-connection/gitRepositoryLinks/foo",
                        },
                    },
                ],
            });
            getGitRepositoryLinkStub.onFirstCall().resolves({
                cloneUri: "github.com/my-org/foo.git",
            });
            confirmStub.onFirstCall().resolves(true);
            await (0, prepare_1.default)(context, opts);
            (0, chai_1.expect)(context.backendLocations["foo"]).to.equal("us-central1");
            (0, chai_1.expect)(context.backendConfigs["foo"]).to.deep.equal({
                backendId: "foo",
                rootDir: "/",
                ignore: [],
                alwaysDeployFromSource: true,
            });
            (0, chai_1.expect)(context.backendLocalBuilds["foo"]).to.undefined;
        });
    });
    describe("getBackendConfigs", () => {
        const apphostingConfig = [
            {
                backendId: "foo",
                rootDir: "/",
                ignore: [],
            },
            {
                backendId: "bar",
                rootDir: "/",
                ignore: [],
            },
        ];
        it("selects all backends when no --only is passed", () => {
            const configs = (0, prepare_1.getBackendConfigs)({
                ...BASE_OPTS,
                only: "",
                config: new config_1.Config({
                    apphosting: apphostingConfig,
                }),
            });
            (0, chai_1.expect)(configs).to.deep.equal(apphostingConfig);
        });
        it("selects all backends when --apphosting is passed", () => {
            const configs = (0, prepare_1.getBackendConfigs)({
                ...BASE_OPTS,
                only: "apphosting",
                config: new config_1.Config({
                    apphosting: apphostingConfig,
                }),
            });
            (0, chai_1.expect)(configs).to.deep.equal(apphostingConfig);
        });
        it("selects App Hosting backends when multiple product filters are passed", () => {
            const configs = (0, prepare_1.getBackendConfigs)({
                ...BASE_OPTS,
                only: "functions,apphosting",
                config: new config_1.Config({
                    functions: {},
                    hosting: {},
                    apphosting: apphostingConfig,
                }),
            });
            (0, chai_1.expect)(configs).to.deep.equal(apphostingConfig);
        });
        it("selects a specific App Hosting backend", () => {
            const configs = (0, prepare_1.getBackendConfigs)({
                ...BASE_OPTS,
                only: "apphosting:foo",
                config: new config_1.Config({
                    apphosting: apphostingConfig,
                }),
            });
            (0, chai_1.expect)(configs).to.deep.equal([
                {
                    backendId: "foo",
                    rootDir: "/",
                    ignore: [],
                },
            ]);
        });
    });
});
//# sourceMappingURL=prepare.spec.js.map