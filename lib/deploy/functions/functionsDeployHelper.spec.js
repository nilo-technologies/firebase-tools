"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const backend = require("./backend");
const helper = require("./functionsDeployHelper");
const projectConfig_1 = require("../../functions/projectConfig");
const functionsDeployHelper_1 = require("./functionsDeployHelper");
describe("functionsDeployHelper", () => {
    const ENDPOINT = {
        id: "foo",
        platform: "gcfv1",
        project: "project",
        region: "us-central1",
        runtime: "nodejs16",
        entryPoint: "function",
        httpsTrigger: {},
        codebase: projectConfig_1.DEFAULT_CODEBASE,
    };
    const BASE_FILTER = {
        codebase: projectConfig_1.DEFAULT_CODEBASE,
    };
    const TEST_CONFIG = [
        { source: "functions", codebase: projectConfig_1.DEFAULT_CODEBASE },
    ];
    describe("endpointMatchesFilter", () => {
        it("should match empty filter", () => {
            const func = { ...ENDPOINT, id: "id" };
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, { ...BASE_FILTER, idChunks: [] })).to.be.true;
        });
        it("should match full names", () => {
            const func = { ...ENDPOINT, id: "id" };
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, { ...BASE_FILTER, idChunks: ["id"] })).to.be.true;
        });
        it("should match group prefixes", () => {
            const func = { ...ENDPOINT, id: "group-subgroup-func" };
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, {
                ...BASE_FILTER,
                idChunks: ["group", "subgroup", "func"],
            })).to.be.true;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, {
                ...BASE_FILTER,
                idChunks: ["group", "subgroup"],
            })).to.be.true;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, { ...BASE_FILTER, idChunks: ["group"] })).to.be
                .true;
        });
        it("should not match function that id that don't match", () => {
            const func = { ...ENDPOINT, id: "id" };
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, { ...BASE_FILTER, idChunks: ["group"] })).to.be
                .false;
        });
        it("should not match function in different codebase", () => {
            const func = { ...ENDPOINT, id: "group-subgroup-func" };
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, {
                ...BASE_FILTER,
                codebase: "another-codebase",
                idChunks: ["group", "subgroup", "func"],
            })).to.be.false;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, {
                ...BASE_FILTER,
                codebase: "another-codebase",
                idChunks: ["group", "subgroup"],
            })).to.be.false;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, {
                ...BASE_FILTER,
                codebase: "another-codebase",
                idChunks: ["group"],
            })).to.be.false;
        });
        it("should match function if backend's codebase is undefined", () => {
            const func = { ...ENDPOINT, id: "group-subgroup-func" };
            delete func.codebase;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, {
                ...BASE_FILTER,
                codebase: "my-codebase",
                idChunks: ["group", "subgroup", "func"],
            })).to.be.true;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, {
                ...BASE_FILTER,
                codebase: "my-codebase",
                idChunks: ["group", "subgroup"],
            })).to.be.true;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, { ...BASE_FILTER, idChunks: ["group"] })).to.be
                .true;
        });
        it("should match function matching ids given no codebase", () => {
            const func = { ...ENDPOINT, id: "group-subgroup-func" };
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, {
                ...BASE_FILTER,
                codebase: undefined,
                idChunks: ["group", "subgroup", "func"],
            })).to.be.true;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, {
                ...BASE_FILTER,
                codebase: undefined,
                idChunks: ["group", "subgroup"],
            })).to.be.true;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, {
                ...BASE_FILTER,
                codebase: undefined,
                idChunks: ["group"],
            })).to.be.true;
        });
    });
    describe("endpointMatchesAnyFilters", () => {
        it("should match given no filters", () => {
            const func = { ...ENDPOINT, id: "id" };
            (0, chai_1.expect)(helper.endpointMatchesAnyFilter(func)).to.be.true;
        });
        it("should match against one filter", () => {
            const func = { ...ENDPOINT, id: "id" };
            (0, chai_1.expect)(helper.endpointMatchesAnyFilter(func, [
                { ...BASE_FILTER, idChunks: ["id"] },
                { ...BASE_FILTER, idChunks: ["group"] },
            ])).to.be.true;
        });
        it("should exclude functions that don't match", () => {
            const func = { ...ENDPOINT, id: "id" };
            (0, chai_1.expect)(helper.endpointMatchesAnyFilter(func, [
                { ...BASE_FILTER, idChunks: ["group"] },
                { ...BASE_FILTER, idChunks: ["other-group"] },
            ])).to.be.false;
        });
    });
    describe("parseFunctionSelector", () => {
        const testcases = [
            {
                desc: "parses selector without codebase (not a codebase name)",
                selector: "func",
                config: [{ source: "functions", codebase: projectConfig_1.DEFAULT_CODEBASE }],
                expected: [
                    {
                        codebase: projectConfig_1.DEFAULT_CODEBASE,
                        idChunks: ["func"],
                    },
                ],
            },
            {
                desc: "parses selector without codebase (matches codebase name)",
                selector: "func",
                config: [
                    { source: "functions", codebase: projectConfig_1.DEFAULT_CODEBASE },
                    { source: "other", codebase: "func" },
                ],
                expected: [
                    {
                        codebase: "func",
                    },
                ],
            },
            {
                desc: "parses group selector (with '.') without codebase",
                selector: "g1.func",
                config: [{ source: "functions", codebase: projectConfig_1.DEFAULT_CODEBASE }],
                expected: [
                    {
                        codebase: projectConfig_1.DEFAULT_CODEBASE,
                        idChunks: ["g1", "func"],
                    },
                ],
            },
            {
                desc: "parses group selector (with '-') without codebase",
                selector: "g1-func",
                config: [{ source: "functions", codebase: projectConfig_1.DEFAULT_CODEBASE }],
                expected: [
                    {
                        codebase: projectConfig_1.DEFAULT_CODEBASE,
                        idChunks: ["g1", "func"],
                    },
                ],
            },
            {
                desc: "parses group selector (with '-') with codebase",
                selector: "node:g1-func",
                config: [{ source: "functions", codebase: projectConfig_1.DEFAULT_CODEBASE }],
                expected: [
                    {
                        codebase: "node",
                        idChunks: ["g1", "func"],
                    },
                ],
            },
        ];
        for (const tc of testcases) {
            it(tc.desc, () => {
                const actual = (0, functionsDeployHelper_1.parseFunctionSelector)(tc.selector, tc.config);
                (0, chai_1.expect)(actual.length).to.equal(tc.expected.length);
                (0, chai_1.expect)(actual).to.deep.include.members(tc.expected);
            });
        }
    });
    describe("getEndpointFilters", () => {
        const testcases = [
            {
                desc: "should parse multiple selectors",
                only: "functions:myFunc,functions:myOtherFunc",
                expected: [
                    {
                        codebase: projectConfig_1.DEFAULT_CODEBASE,
                        idChunks: ["myFunc"],
                    },
                    {
                        codebase: projectConfig_1.DEFAULT_CODEBASE,
                        idChunks: ["myOtherFunc"],
                    },
                ],
            },
            {
                desc: "should parse nested selector",
                only: "functions:groupA.myFunc",
                expected: [
                    {
                        codebase: projectConfig_1.DEFAULT_CODEBASE,
                        idChunks: ["groupA", "myFunc"],
                    },
                ],
            },
            {
                desc: "should parse selector with codebase",
                only: "functions:my-codebase:myFunc,functions:another-codebase:anotherFunc",
                expected: [
                    {
                        codebase: "my-codebase",
                        idChunks: ["myFunc"],
                    },
                    {
                        codebase: "another-codebase",
                        idChunks: ["anotherFunc"],
                    },
                ],
            },
            {
                desc: "should parse nested selector with codebase",
                only: "functions:my-codebase:groupA.myFunc",
                expected: [
                    {
                        codebase: "my-codebase",
                        idChunks: ["groupA", "myFunc"],
                    },
                ],
            },
        ];
        for (const tc of testcases) {
            it(tc.desc, () => {
                const options = {
                    only: tc.only,
                };
                const actual = helper.getEndpointFilters(options, TEST_CONFIG);
                (0, chai_1.expect)(actual?.length).to.equal(tc.expected.length);
                (0, chai_1.expect)(actual).to.deep.include.members(tc.expected);
            });
        }
        it("returns undefined given no only option", () => {
            (0, chai_1.expect)(helper.getEndpointFilters({}, TEST_CONFIG)).to.be.undefined;
        });
        it("returns undefined given no functions selector", () => {
            (0, chai_1.expect)(helper.getEndpointFilters({ only: "hosting:siteA,storage:bucketB" }, TEST_CONFIG)).to
                .be.undefined;
        });
        it("should create only codebase filter when selector matches codebase name", () => {
            const config = [
                { source: "functions", codebase: projectConfig_1.DEFAULT_CODEBASE },
                { source: "other-functions", codebase: "other" },
            ];
            const options = {
                only: "functions:other",
            };
            const actual = helper.getEndpointFilters(options, config);
            (0, chai_1.expect)(actual).to.deep.equal([{ codebase: "other" }]);
        });
        it("should create default codebase filter when selector does not match codebase name", () => {
            const config = [
                { source: "functions", codebase: projectConfig_1.DEFAULT_CODEBASE },
                { source: "python-functions", codebase: "python" },
            ];
            const options = {
                only: "functions:other",
            };
            const actual = helper.getEndpointFilters(options, config);
            (0, chai_1.expect)(actual?.length).to.equal(1);
            (0, chai_1.expect)(actual).to.deep.equal([{ codebase: projectConfig_1.DEFAULT_CODEBASE, idChunks: ["other"] }]);
        });
    });
    describe("targetCodebases", () => {
        const config = [
            {
                source: "foo",
                codebase: "default",
            },
            {
                source: "bar",
                codebase: "foobar",
            },
        ];
        it("returns all codebases in firebase.json with empty filters", () => {
            (0, chai_1.expect)(helper.targetCodebases(config)).to.have.members(["default", "foobar"]);
        });
        it("returns only codebases included in the filters", () => {
            const filters = [
                {
                    codebase: "default",
                },
            ];
            (0, chai_1.expect)(helper.targetCodebases(config, filters)).to.have.members(["default"]);
        });
        it("correctly deals with duplicate entries", () => {
            const filters = [
                {
                    codebase: "default",
                },
                {
                    codebase: "default",
                },
            ];
            (0, chai_1.expect)(helper.targetCodebases(config, filters)).to.have.members(["default"]);
        });
        it("returns all codebases given filter without codebase specified", () => {
            const filters = [
                {
                    idChunks: ["foo", "bar"],
                },
            ];
            (0, chai_1.expect)(helper.targetCodebases(config, filters)).to.have.members(["default", "foobar"]);
        });
    });
    describe("groupEndpointsByCodebase", () => {
        function endpointsOf(b) {
            return backend.allEndpoints(b).map((e) => backend.functionName(e));
        }
        it("groups codebase using codebase property", () => {
            const wantBackends = {
                default: backend.of({ ...ENDPOINT, id: "default-0", codebase: "default" }, { ...ENDPOINT, id: "default-1", codebase: "default" }),
                cb: backend.of({ ...ENDPOINT, id: "cb-0", codebase: "cb" }, { ...ENDPOINT, id: "cb-1", codebase: "cb" }),
            };
            const haveBackend = backend.of({ ...ENDPOINT, id: "default-0", codebase: "default" }, { ...ENDPOINT, id: "default-1", codebase: "default" }, { ...ENDPOINT, id: "cb-0", codebase: "cb" }, { ...ENDPOINT, id: "cb-1", codebase: "cb" }, { ...ENDPOINT, id: "orphan", codebase: "orphan" });
            const got = helper.groupEndpointsByCodebase(wantBackends, backend.allEndpoints(haveBackend));
            for (const codebase of Object.keys(got)) {
                (0, chai_1.expect)(endpointsOf(got[codebase])).to.have.members(endpointsOf(wantBackends[codebase]));
            }
        });
        it("claims endpoint with matching name regardless of codebase property", () => {
            const wantBackends = {
                default: backend.of({ ...ENDPOINT, id: "default-0", codebase: "default" }, { ...ENDPOINT, id: "default-1", codebase: "default" }),
                cb: backend.of({ ...ENDPOINT, id: "cb-0", codebase: "cb" }, { ...ENDPOINT, id: "cb-1", codebase: "cb" }),
            };
            let haveBackend = backend.of({ ...ENDPOINT, id: "default-0", codebase: "cb" }, { ...ENDPOINT, id: "default-1", codebase: "cb" }, { ...ENDPOINT, id: "cb-0", codebase: "cb" }, { ...ENDPOINT, id: "cb-1", codebase: "cb" }, { ...ENDPOINT, id: "orphan", codebase: "orphan" });
            let got = helper.groupEndpointsByCodebase(wantBackends, backend.allEndpoints(haveBackend));
            for (const codebase of Object.keys(got)) {
                (0, chai_1.expect)(endpointsOf(got[codebase])).to.have.members(endpointsOf(wantBackends[codebase]));
            }
            haveBackend = backend.of({ ...ENDPOINT, id: "default-0", codebase: "default" }, { ...ENDPOINT, id: "default-1", codebase: "default" }, { ...ENDPOINT, id: "cb-0", codebase: "default" }, { ...ENDPOINT, id: "cb-1", codebase: "default" }, { ...ENDPOINT, id: "orphan", codebase: "orphan" });
            got = helper.groupEndpointsByCodebase(wantBackends, backend.allEndpoints(haveBackend));
            for (const codebase of Object.keys(got)) {
                (0, chai_1.expect)(endpointsOf(got[codebase])).to.have.members(endpointsOf(wantBackends[codebase]));
            }
        });
    });
});
//# sourceMappingURL=functionsDeployHelper.spec.js.map