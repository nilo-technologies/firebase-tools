"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const api_1 = require("../api");
const invokeTests_1 = require("./invokeTests");
const error_1 = require("../error");
const types_1 = require("./types");
describe("invokeTests", () => {
    describe("invokeTests", () => {
        const projectNumber = "123456789";
        const appId = `1:${projectNumber}:ios:abc123def456`;
        it("throws FirebaseError if invocation request fails", async () => {
            nock((0, api_1.appTestingOrigin)())
                .post(`/v1alpha/projects/${projectNumber}/apps/${appId}/testInvocations:invokeTestCases`)
                .reply(400, { error: {} });
            await (0, chai_1.expect)((0, invokeTests_1.invokeTests)(appId, "https://www.example.com", [])).to.be.rejectedWith(error_1.FirebaseError, "Test invocation failed");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("returns operation when successful", async () => {
            nock((0, api_1.appTestingOrigin)())
                .post(`/v1alpha/projects/${projectNumber}/apps/${appId}/testInvocations:invokeTestCases`)
                .reply(200, { name: "foo/bar/biz" });
            const operation = await (0, invokeTests_1.invokeTests)(appId, "https://www.example.com", []);
            (0, chai_1.expect)(operation).to.eql({ name: "foo/bar/biz" });
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("builds the correct request", async () => {
            let requestBody;
            nock((0, api_1.appTestingOrigin)())
                .post(`/v1alpha/projects/${projectNumber}/apps/${appId}/testInvocations:invokeTestCases`, (r) => {
                requestBody = r;
                return true;
            })
                .reply(200, { name: "foo/bar/biz" });
            await (0, invokeTests_1.invokeTests)(appId, "https://www.example.com", [
                {
                    testCase: {
                        startUri: "https://www.example.com",
                        displayName: "testName1",
                        steps: [{ goal: "test this app", hint: "try clicking the button" }],
                    },
                    testExecution: [{ config: { browser: types_1.Browser.CHROME } }],
                },
                {
                    testCase: {
                        startUri: "https://www.example.com",
                        displayName: "testName2",
                        steps: [{ goal: "retest it", successCriteria: "a dialog appears" }],
                    },
                    testExecution: [{ config: { browser: types_1.Browser.CHROME } }],
                },
            ]);
            (0, chai_1.expect)(requestBody).to.eql({
                resource: {
                    testCaseInvocations: [
                        {
                            testCase: {
                                displayName: "testName1",
                                steps: [
                                    {
                                        goal: "test this app",
                                        hint: "try clicking the button",
                                    },
                                ],
                                startUri: "https://www.example.com",
                            },
                            testExecution: [
                                {
                                    config: {
                                        browser: "CHROME",
                                    },
                                },
                            ],
                        },
                        {
                            testCase: {
                                displayName: "testName2",
                                steps: [
                                    {
                                        goal: "retest it",
                                        successCriteria: "a dialog appears",
                                    },
                                ],
                                startUri: "https://www.example.com",
                            },
                            testExecution: [
                                {
                                    config: {
                                        browser: "CHROME",
                                    },
                                },
                            ],
                        },
                    ],
                    testInvocation: {},
                },
            });
        });
    });
    describe("pollInvocationStatus", () => {
        const operationName = "operations/foo/bar";
        beforeEach(() => {
            nock((0, api_1.appTestingOrigin)())
                .get(`/v1alpha/${operationName}`)
                .reply(200, { done: false, metadata: { count: 1 } });
            nock((0, api_1.appTestingOrigin)())
                .get(`/v1alpha/${operationName}`)
                .reply(200, { done: false, metadata: { count: 2 } });
            nock((0, api_1.appTestingOrigin)())
                .get(`/v1alpha/${operationName}`)
                .reply(200, { done: true, metadata: { count: 3 }, response: { foo: "12" } });
        });
        it("calls poll callback with metadata on each poll", async () => {
            const pollResponses = [];
            await (0, invokeTests_1.pollInvocationStatus)(operationName, (op) => {
                pollResponses.push(op.metadata);
            }, 1);
            (0, chai_1.expect)(pollResponses).to.eql([{ count: 1 }, { count: 2 }, { count: 3 }]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("returns the response", async () => {
            const response = await (0, invokeTests_1.pollInvocationStatus)(operationName, () => null, 1);
            (0, chai_1.expect)(response).to.eql({ foo: "12" });
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
});
//# sourceMappingURL=invokeTests.spec.js.map