"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const build = require("./build");
const params_1 = require("./params");
const error_1 = require("../../error");
describe("toBackend", () => {
    it("populates backend info from Build", () => {
        const desiredBuild = build.of({
            func: {
                platform: "gcfv1",
                region: ["us-central1"],
                project: "project",
                runtime: "nodejs16",
                entryPoint: "func",
                maxInstances: 42,
                minInstances: 1,
                serviceAccount: "service-account-1@",
                vpc: {
                    connector: "projects/project/locations/region/connectors/connector",
                    egressSettings: "PRIVATE_RANGES_ONLY",
                },
                ingressSettings: "ALLOW_ALL",
                labels: {
                    test: "testing",
                },
                httpsTrigger: {
                    invoker: ["public"],
                },
            },
        });
        const backend = build.toBackend(desiredBuild, {});
        (0, chai_1.expect)(Object.keys(backend.endpoints).length).to.equal(1);
        const endpointDef = Object.values(backend.endpoints)[0];
        (0, chai_1.expect)(endpointDef).to.not.equal(undefined);
        if (endpointDef) {
            (0, chai_1.expect)(endpointDef.func.id).to.equal("func");
            (0, chai_1.expect)(endpointDef.func.project).to.equal("project");
            (0, chai_1.expect)(endpointDef.func.region).to.equal("us-central1");
            (0, chai_1.expect)("httpsTrigger" in endpointDef.func
                ? endpointDef.func.httpsTrigger.invoker
                    ? endpointDef.func.httpsTrigger.invoker[0]
                    : ""
                : "").to.equal("public");
        }
    });
    it("doesn't populate if omit is set on the build", () => {
        const desiredBuild = build.of({
            func: {
                omit: true,
                platform: "gcfv1",
                region: ["us-central1"],
                project: "project",
                runtime: "nodejs16",
                entryPoint: "func",
                maxInstances: 42,
                minInstances: 1,
                serviceAccount: "service-account-1@",
                vpc: {
                    connector: "projects/project/locations/region/connectors/connector",
                    egressSettings: "PRIVATE_RANGES_ONLY",
                },
                ingressSettings: "ALLOW_ALL",
                labels: {
                    test: "testing",
                },
                httpsTrigger: {
                    invoker: ["public"],
                },
            },
        });
        const backend = build.toBackend(desiredBuild, {});
        (0, chai_1.expect)(Object.keys(backend.endpoints).length).to.equal(0);
    });
    it("populates multiple specified https invokers correctly", () => {
        const desiredBuild = build.of({
            func: {
                platform: "gcfv1",
                region: ["us-central1"],
                project: "project",
                runtime: "nodejs16",
                entryPoint: "func",
                maxInstances: 42,
                minInstances: 1,
                serviceAccount: "service-account-1@",
                vpc: {
                    connector: "projects/project/locations/region/connectors/connector",
                    egressSettings: "PRIVATE_RANGES_ONLY",
                },
                ingressSettings: "ALLOW_ALL",
                labels: {
                    test: "testing",
                },
                httpsTrigger: {
                    invoker: ["service-account-1@", "service-account-2@"],
                },
            },
        });
        const backend = build.toBackend(desiredBuild, {});
        (0, chai_1.expect)(Object.keys(backend.endpoints).length).to.equal(1);
        const endpointDef = Object.values(backend.endpoints)[0];
        (0, chai_1.expect)(endpointDef).to.not.equal(undefined);
        if (endpointDef) {
            (0, chai_1.expect)(endpointDef.func.id).to.equal("func");
            (0, chai_1.expect)(endpointDef.func.project).to.equal("project");
            (0, chai_1.expect)(endpointDef.func.region).to.equal("us-central1");
            (0, chai_1.expect)("httpsTrigger" in endpointDef.func ? endpointDef.func.httpsTrigger.invoker : []).to.have.members(["service-account-1@", "service-account-2@"]);
        }
    });
    it("populates multiple specified data connect https invokers correctly", () => {
        const desiredBuild = build.of({
            func: {
                platform: "gcfv2",
                region: ["us-central1"],
                project: "project",
                runtime: "nodejs16",
                entryPoint: "func",
                maxInstances: 42,
                minInstances: 1,
                serviceAccount: "service-account-1@",
                vpc: {
                    connector: "projects/project/locations/region/connectors/connector",
                    egressSettings: "PRIVATE_RANGES_ONLY",
                },
                ingressSettings: "ALLOW_ALL",
                labels: {
                    test: "testing",
                },
                dataConnectGraphqlTrigger: {
                    invoker: ["service-account-1@", "service-account-2@"],
                },
            },
        });
        const backend = build.toBackend(desiredBuild, {});
        (0, chai_1.expect)(Object.keys(backend.endpoints).length).to.equal(1);
        const endpointDef = Object.values(backend.endpoints)[0];
        (0, chai_1.expect)(endpointDef).to.not.equal(undefined);
        if (endpointDef) {
            (0, chai_1.expect)(endpointDef.func.id).to.equal("func");
            (0, chai_1.expect)(endpointDef.func.project).to.equal("project");
            (0, chai_1.expect)(endpointDef.func.region).to.equal("us-central1");
            (0, chai_1.expect)("dataConnectGraphqlTrigger" in endpointDef.func
                ? endpointDef.func.dataConnectGraphqlTrigger.invoker
                : []).to.have.members(["service-account-1@", "service-account-2@"]);
        }
    });
    it("populates multiple param values", () => {
        const desiredBuild = build.of({
            func: {
                platform: "gcfv2",
                region: ["us-central1"],
                project: "project",
                runtime: "nodejs16",
                entryPoint: "func",
                maxInstances: "{{ params.maxinstances }}",
                minInstances: "{{ params.mininstances }}",
                serviceAccount: "{{ params.serviceaccount }}",
                vpc: {
                    connector: "{{ params.connector }}",
                    egressSettings: "{{ params.egressSettings }}",
                },
                ingressSettings: "ALLOW_ALL",
                labels: {
                    test: "testing",
                },
                httpsTrigger: {
                    invoker: ["service-account-2@", "service-account-3@"],
                },
            },
        });
        const backend = build.toBackend(desiredBuild, {
            maxinstances: new params_1.ParamValue("42", false, { number: true }),
            mininstances: new params_1.ParamValue("1", false, { number: true }),
            serviceaccount: new params_1.ParamValue("service-account-1@", false, { string: true }),
            connector: new params_1.ParamValue("connector", false, { string: true }),
            egressSettings: new params_1.ParamValue("ALL_TRAFFIC", false, { string: true }),
        });
        (0, chai_1.expect)(Object.keys(backend.endpoints).length).to.equal(1);
        const endpointDef = Object.values(backend.endpoints)[0];
        (0, chai_1.expect)(endpointDef).to.not.equal(undefined);
        if (endpointDef) {
            (0, chai_1.expect)(endpointDef.func.id).to.equal("func");
            (0, chai_1.expect)(endpointDef.func.project).to.equal("project");
            (0, chai_1.expect)(endpointDef.func.region).to.equal("us-central1");
            (0, chai_1.expect)(endpointDef.func.maxInstances).to.equal(42);
            (0, chai_1.expect)(endpointDef.func.minInstances).to.equal(1);
            (0, chai_1.expect)(endpointDef.func.serviceAccount).to.equal("service-account-1@");
            (0, chai_1.expect)("httpsTrigger" in endpointDef.func ? endpointDef.func.httpsTrigger.invoker : []).to.have.members(["service-account-2@", "service-account-3@"]);
            (0, chai_1.expect)(endpointDef.func.vpc?.connector).to.equal("projects/project/locations/us-central1/connectors/connector");
            (0, chai_1.expect)(endpointDef.func.vpc?.egressSettings).to.equal("ALL_TRAFFIC");
        }
    });
    it("enforces enum correctness for VPC egress settings", () => {
        const desiredBuild = build.of({
            func: {
                platform: "gcfv2",
                region: ["us-central1"],
                project: "project",
                runtime: "nodejs16",
                entryPoint: "func",
                vpc: {
                    connector: "connector",
                    egressSettings: "{{ params.egressSettings }}",
                },
                httpsTrigger: {},
            },
        });
        (0, chai_1.expect)(() => {
            build.toBackend(desiredBuild, {
                egressSettings: new params_1.ParamValue("INVALID", false, { string: true }),
            });
        }).to.throw(error_1.FirebaseError, /Value "INVALID" is an invalid egress setting./);
    });
    it("can resolve a service account param", () => {
        const desiredBuild = build.of({
            func: {
                platform: "gcfv1",
                region: ["us-central1"],
                project: "project",
                runtime: "nodejs16",
                entryPoint: "func",
                maxInstances: 42,
                minInstances: 1,
                serviceAccount: "{{ params.SERVICE_ACCOUNT }}",
                vpc: {
                    connector: "projects/project/locations/region/connectors/connector",
                    egressSettings: "PRIVATE_RANGES_ONLY",
                },
                ingressSettings: "ALLOW_ALL",
                labels: {
                    test: "testing",
                },
                httpsTrigger: {
                    invoker: ["public"],
                },
            },
        });
        const env = {
            SERVICE_ACCOUNT: new params_1.ParamValue("service-account-1@", false, {
                string: true,
                number: false,
                boolean: false,
            }),
        };
        const backend = build.toBackend(desiredBuild, env);
        const endpointDef = Object.values(backend.endpoints)[0];
        if (endpointDef) {
            (0, chai_1.expect)(endpointDef.func.serviceAccount).to.equal("service-account-1@");
        }
    });
});
describe("envWithType", () => {
    it("converts raw environment variables to params with correct type", () => {
        const params = [
            {
                name: "A_STR",
                type: "string",
            },
            {
                name: "AN_INT",
                type: "int",
            },
            {
                name: "A_BOOL",
                type: "boolean",
            },
        ];
        const rawEnvs = {
            A_STR: "foo",
            AN_INT: "1",
            A_BOOL: "true",
            NOT_PARAM: "not-a-param",
        };
        const out = build.envWithTypes(params, rawEnvs);
        (0, chai_1.expect)(out).to.include.keys(["A_STR", "AN_INT", "A_BOOL"]);
        (0, chai_1.expect)(out.A_STR.legalString).to.be.true;
        (0, chai_1.expect)(out.A_STR.legalBoolean).to.be.false;
        (0, chai_1.expect)(out.A_STR.legalNumber).to.be.false;
        (0, chai_1.expect)(out.A_STR.legalList).to.be.false;
        (0, chai_1.expect)(out.A_STR.asString()).to.equal("foo");
        (0, chai_1.expect)(out.AN_INT.legalString).to.be.false;
        (0, chai_1.expect)(out.AN_INT.legalBoolean).to.be.false;
        (0, chai_1.expect)(out.AN_INT.legalNumber).to.be.true;
        (0, chai_1.expect)(out.AN_INT.legalList).to.be.false;
        (0, chai_1.expect)(out.AN_INT.asNumber()).to.equal(1);
        (0, chai_1.expect)(out.A_BOOL.legalString).to.be.false;
        (0, chai_1.expect)(out.A_BOOL.legalBoolean).to.be.true;
        (0, chai_1.expect)(out.A_BOOL.legalNumber).to.be.false;
        (0, chai_1.expect)(out.A_BOOL.legalList).to.be.false;
        (0, chai_1.expect)(out.A_BOOL.asBoolean()).to.be.true;
    });
    it("converts raw environment variable for secret param with correct type", () => {
        const params = [
            {
                name: "WHOOPS_SECRET",
                type: "secret",
            },
        ];
        const rawEnvs = {
            A_STR: "foo",
            WHOOPS_SECRET: "super-secret",
        };
        const out = build.envWithTypes(params, rawEnvs);
        (0, chai_1.expect)(out).to.include.keys(["WHOOPS_SECRET"]);
        (0, chai_1.expect)(out.WHOOPS_SECRET.legalString).to.be.true;
        (0, chai_1.expect)(out.WHOOPS_SECRET.legalBoolean).to.be.false;
        (0, chai_1.expect)(out.WHOOPS_SECRET.legalNumber).to.be.false;
        (0, chai_1.expect)(out.WHOOPS_SECRET.legalList).to.be.false;
        (0, chai_1.expect)(out.WHOOPS_SECRET.asString()).to.equal("super-secret");
    });
});
describe("applyPrefix", () => {
    const createTestBuild = () => ({
        endpoints: {
            func1: {
                region: "us-central1",
                project: "test-project",
                platform: "gcfv2",
                runtime: "nodejs18",
                entryPoint: "func1",
                httpsTrigger: {},
            },
            func2: {
                region: "us-west1",
                project: "test-project",
                platform: "gcfv1",
                runtime: "nodejs16",
                entryPoint: "func2",
                httpsTrigger: {},
            },
        },
        params: [],
        requiredAPIs: [],
    });
    it("should update endpoint keys with prefix", () => {
        const testBuild = createTestBuild();
        build.applyPrefix(testBuild, "test");
        (0, chai_1.expect)(Object.keys(testBuild.endpoints).sort()).to.deep.equal(["test-func1", "test-func2"]);
        (0, chai_1.expect)(testBuild.endpoints["test-func1"].entryPoint).to.equal("func1");
        (0, chai_1.expect)(testBuild.endpoints["test-func2"].entryPoint).to.equal("func2");
    });
    it("should do nothing for an empty prefix", () => {
        const testBuild = createTestBuild();
        build.applyPrefix(testBuild, "");
        (0, chai_1.expect)(Object.keys(testBuild.endpoints).sort()).to.deep.equal(["func1", "func2"]);
    });
    it("should prefix secret names in secretEnvironmentVariables", () => {
        const testBuild = {
            endpoints: {
                func1: {
                    region: "us-central1",
                    project: "test-project",
                    platform: "gcfv2",
                    runtime: "nodejs18",
                    entryPoint: "func1",
                    httpsTrigger: {},
                    secretEnvironmentVariables: [
                        { key: "API_KEY", secret: "api-secret", projectId: "test-project" },
                        { key: "DB_PASSWORD", secret: "db-secret", projectId: "test-project" },
                    ],
                },
                func2: {
                    region: "us-west1",
                    project: "test-project",
                    platform: "gcfv1",
                    runtime: "nodejs16",
                    entryPoint: "func2",
                    httpsTrigger: {},
                    secretEnvironmentVariables: [
                        { key: "SERVICE_TOKEN", secret: "service-secret", projectId: "test-project" },
                    ],
                },
            },
            params: [],
            requiredAPIs: [],
        };
        build.applyPrefix(testBuild, "staging");
        (0, chai_1.expect)(Object.keys(testBuild.endpoints).sort()).to.deep.equal([
            "staging-func1",
            "staging-func2",
        ]);
        (0, chai_1.expect)(testBuild.endpoints["staging-func1"].secretEnvironmentVariables).to.deep.equal([
            { key: "API_KEY", secret: "staging-api-secret", projectId: "test-project" },
            { key: "DB_PASSWORD", secret: "staging-db-secret", projectId: "test-project" },
        ]);
        (0, chai_1.expect)(testBuild.endpoints["staging-func2"].secretEnvironmentVariables).to.deep.equal([
            { key: "SERVICE_TOKEN", secret: "staging-service-secret", projectId: "test-project" },
        ]);
    });
    it("throws if combined function id exceeds 63 characters", () => {
        const longId = "a".repeat(34);
        const testBuild = build.of({
            [longId]: {
                region: "us-central1",
                project: "test-project",
                platform: "gcfv2",
                runtime: "nodejs18",
                entryPoint: longId,
                httpsTrigger: {},
            },
        });
        const longPrefix = "p".repeat(30);
        (0, chai_1.expect)(() => build.applyPrefix(testBuild, longPrefix)).to.throw(/exceeds 63 characters/);
    });
    it("throws if prefix makes function id invalid (must start with a letter)", () => {
        const testBuild = build.of({
            func: {
                region: "us-central1",
                project: "test-project",
                platform: "gcfv2",
                runtime: "nodejs18",
                entryPoint: "func",
                httpsTrigger: {},
            },
        });
        (0, chai_1.expect)(() => build.applyPrefix(testBuild, "1abc")).to.throw(/Function names must start with a letter/);
    });
});
//# sourceMappingURL=build.spec.js.map