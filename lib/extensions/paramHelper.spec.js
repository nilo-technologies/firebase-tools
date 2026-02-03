"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const fs = require("fs-extra");
const error_1 = require("../error");
const types_1 = require("./types");
const extensionsHelper = require("./extensionsHelper");
const paramHelper = require("./paramHelper");
const promptImport = require("../prompt");
const utils_1 = require("../utils");
const PROJECT_ID = "test-proj";
const INSTANCE_ID = "ext-instance";
const TEST_PARAMS = [
    {
        param: "A_PARAMETER",
        label: "Param",
        type: types_1.ParamType.STRING,
        required: true,
    },
    {
        param: "ANOTHER_PARAMETER",
        label: "Another Param",
        default: "default",
        type: types_1.ParamType.STRING,
        required: true,
    },
];
const TEST_PARAMS_2 = [
    {
        param: "ANOTHER_PARAMETER",
        label: "Another Param",
        type: types_1.ParamType.STRING,
        default: "default",
    },
    {
        param: "NEW_PARAMETER",
        label: "New Param",
        type: types_1.ParamType.STRING,
        default: "${PROJECT_ID}",
    },
    {
        param: "THIRD_PARAMETER",
        label: "3",
        type: types_1.ParamType.STRING,
        default: "default",
    },
];
const TEST_PARAMS_3 = [
    {
        param: "A_PARAMETER",
        label: "Param",
        type: types_1.ParamType.STRING,
    },
    {
        param: "ANOTHER_PARAMETER",
        label: "Another Param",
        default: "default",
        type: types_1.ParamType.STRING,
        description: "Something new",
        required: false,
    },
];
const SPEC = {
    name: "test",
    version: "0.1.0",
    roles: [],
    resources: [],
    sourceUrl: "test.com",
    params: TEST_PARAMS,
    systemParams: [],
};
describe("paramHelper", () => {
    describe(`${paramHelper.getBaseParamBindings.name}`, () => {
        it("should extract the baseValue param bindings", () => {
            const input = {
                pokeball: {
                    baseValue: "pikachu",
                    local: "local",
                },
                greatball: {
                    baseValue: "eevee",
                },
            };
            const output = paramHelper.getBaseParamBindings(input);
            (0, chai_1.expect)(output).to.eql({
                pokeball: "pikachu",
                greatball: "eevee",
            });
        });
    });
    describe(`${paramHelper.buildBindingOptionsWithBaseValue.name}`, () => {
        it("should build given baseValue values", () => {
            const input = {
                pokeball: "pikachu",
                greatball: "eevee",
            };
            const output = paramHelper.buildBindingOptionsWithBaseValue(input);
            (0, chai_1.expect)(output).to.eql({
                pokeball: {
                    baseValue: "pikachu",
                },
                greatball: {
                    baseValue: "eevee",
                },
            });
        });
    });
    describe("getParams", () => {
        let prompt;
        beforeEach(() => {
            sinon.stub(fs, "readFileSync").returns("");
            sinon.stub(extensionsHelper, "getFirebaseProjectParams").resolves({ PROJECT_ID });
            prompt = sinon.stub(promptImport);
            prompt.input.resolves("user input");
        });
        afterEach(() => {
            sinon.restore();
        });
        it("should prompt the user for params", async () => {
            const params = await paramHelper.getParams({
                projectId: PROJECT_ID,
                paramSpecs: TEST_PARAMS,
                instanceId: INSTANCE_ID,
            });
            (0, chai_1.expect)(params).to.eql({
                A_PARAMETER: { baseValue: "user input" },
                ANOTHER_PARAMETER: { baseValue: "user input" },
            });
            (0, chai_1.expect)(prompt.input).to.have.been.calledTwice;
            (0, chai_1.expect)(prompt.input.firstCall.args[0]).to.eql({
                default: undefined,
                message: "Enter a value for Param:",
            });
            (0, chai_1.expect)(prompt.input.secondCall.args[0]).to.eql({
                default: "default",
                message: "Enter a value for Another Param:",
            });
        });
    });
    describe("promptForNewParams", () => {
        let prompt;
        beforeEach(() => {
            prompt = sinon.stub(promptImport);
            prompt.input.rejects("Unexpected input call");
            prompt.confirm.rejects("Unexpected confirm call");
            prompt.select.rejects("Unexpected select call");
            sinon.stub(extensionsHelper, "getFirebaseProjectParams").resolves({ PROJECT_ID });
        });
        afterEach(() => {
            sinon.restore();
        });
        it("should prompt the user for any params in the new spec that are not in the current one", async () => {
            prompt.input.resolves("user input");
            const newSpec = (0, utils_1.cloneDeep)(SPEC);
            newSpec.params = TEST_PARAMS_2;
            const newParams = await paramHelper.promptForNewParams({
                spec: SPEC,
                newSpec,
                currentParams: {
                    A_PARAMETER: "value",
                    ANOTHER_PARAMETER: "value",
                },
                projectId: PROJECT_ID,
                instanceId: INSTANCE_ID,
            });
            const expected = {
                ANOTHER_PARAMETER: { baseValue: "value" },
                NEW_PARAMETER: { baseValue: "user input" },
                THIRD_PARAMETER: { baseValue: "user input" },
            };
            (0, chai_1.expect)(newParams).to.eql(expected);
            (0, chai_1.expect)(prompt.input).to.have.been.called.calledTwice;
            (0, chai_1.expect)(prompt.input.firstCall.args).to.eql([
                {
                    default: "test-proj",
                    message: "Enter a value for New Param:",
                },
            ]);
            (0, chai_1.expect)(prompt.input.secondCall.args).to.eql([
                {
                    default: "default",
                    message: "Enter a value for 3:",
                },
            ]);
        });
        it("should prompt for params that are not currently populated", async () => {
            prompt.input.resolves("user input");
            const newSpec = (0, utils_1.cloneDeep)(SPEC);
            newSpec.params = TEST_PARAMS_2;
            const newParams = await paramHelper.promptForNewParams({
                spec: SPEC,
                newSpec,
                currentParams: {
                    A_PARAMETER: "value",
                },
                projectId: PROJECT_ID,
                instanceId: INSTANCE_ID,
            });
            const expected = {
                ANOTHER_PARAMETER: { baseValue: "user input" },
                NEW_PARAMETER: { baseValue: "user input" },
                THIRD_PARAMETER: { baseValue: "user input" },
            };
            (0, chai_1.expect)(newParams).to.eql(expected);
        });
        it("should map LOCATION to system param location and not prompt for it", async () => {
            const oldSpec = (0, utils_1.cloneDeep)(SPEC);
            const newSpec = (0, utils_1.cloneDeep)(SPEC);
            oldSpec.params = [
                {
                    param: "LOCATION",
                    label: "",
                },
            ];
            newSpec.params = [];
            newSpec.systemParams = [
                {
                    param: "firebaseextensions.v1beta.function/location",
                    label: "",
                },
            ];
            const newParams = await paramHelper.promptForNewParams({
                spec: oldSpec,
                newSpec,
                currentParams: {
                    LOCATION: "us-east1",
                },
                projectId: PROJECT_ID,
                instanceId: INSTANCE_ID,
            });
            const expected = {
                "firebaseextensions.v1beta.function/location": { baseValue: "us-east1" },
            };
            (0, chai_1.expect)(newParams).to.eql(expected);
            (0, chai_1.expect)(prompt.input).not.to.have.been.called;
        });
        it("should not prompt the user for params that did not change type or param", async () => {
            const newSpec = (0, utils_1.cloneDeep)(SPEC);
            newSpec.params = TEST_PARAMS_3;
            const newParams = await paramHelper.promptForNewParams({
                spec: SPEC,
                newSpec,
                currentParams: {
                    A_PARAMETER: "value",
                    ANOTHER_PARAMETER: "value",
                },
                projectId: PROJECT_ID,
                instanceId: INSTANCE_ID,
            });
            const expected = {
                ANOTHER_PARAMETER: { baseValue: "value" },
                A_PARAMETER: { baseValue: "value" },
            };
            (0, chai_1.expect)(newParams).to.eql(expected);
            (0, chai_1.expect)(prompt.input).not.to.have.been.called;
        });
        it("should populate the spec with the default value if it is returned by prompt", async () => {
            prompt.input.onFirstCall().resolves("test-proj");
            prompt.input.onSecondCall().resolves("user input");
            const newSpec = (0, utils_1.cloneDeep)(SPEC);
            newSpec.params = TEST_PARAMS_2;
            const newParams = await paramHelper.promptForNewParams({
                spec: SPEC,
                newSpec,
                currentParams: {
                    A_PARAMETER: "value",
                    ANOTHER_PARAMETER: "value",
                },
                projectId: PROJECT_ID,
                instanceId: INSTANCE_ID,
            });
            const expected = {
                ANOTHER_PARAMETER: { baseValue: "value" },
                NEW_PARAMETER: { baseValue: "test-proj" },
                THIRD_PARAMETER: { baseValue: "user input" },
            };
            (0, chai_1.expect)(newParams).to.eql(expected);
            (0, chai_1.expect)(prompt.input).to.be.calledTwice;
            (0, chai_1.expect)(prompt.input.firstCall.args).to.eql([
                {
                    default: "test-proj",
                    message: "Enter a value for New Param:",
                },
            ]);
            (0, chai_1.expect)(prompt.input.secondCall.args).to.eql([
                {
                    default: "default",
                    message: "Enter a value for 3:",
                },
            ]);
        });
        it("shouldn't prompt if there are no new params", async () => {
            const newSpec = (0, utils_1.cloneDeep)(SPEC);
            const newParams = await paramHelper.promptForNewParams({
                spec: SPEC,
                newSpec,
                currentParams: {
                    A_PARAMETER: "value",
                    ANOTHER_PARAMETER: "value",
                },
                projectId: PROJECT_ID,
                instanceId: INSTANCE_ID,
            });
            const expected = {
                ANOTHER_PARAMETER: { baseValue: "value" },
                A_PARAMETER: { baseValue: "value" },
            };
            (0, chai_1.expect)(newParams).to.eql(expected);
            (0, chai_1.expect)(prompt.input).not.to.have.been.called;
        });
        it("should exit if a prompt fails", async () => {
            prompt.input.rejects(new error_1.FirebaseError("this is an error"));
            const newSpec = (0, utils_1.cloneDeep)(SPEC);
            newSpec.params = TEST_PARAMS_2;
            await (0, chai_1.expect)(paramHelper.promptForNewParams({
                spec: SPEC,
                newSpec,
                currentParams: {
                    A_PARAMETER: "value",
                    ANOTHER_PARAMETER: "value",
                },
                projectId: PROJECT_ID,
                instanceId: INSTANCE_ID,
            })).to.be.rejectedWith(error_1.FirebaseError, "this is an error");
            (0, chai_1.expect)(prompt.input).to.have.been.calledOnce;
        });
    });
});
//# sourceMappingURL=paramHelper.spec.js.map