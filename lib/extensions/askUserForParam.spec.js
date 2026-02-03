"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const askUserForParam_1 = require("./askUserForParam");
const utils = require("../utils");
const prompt = require("../prompt");
const types_1 = require("./types");
const extensionsHelper = require("./extensionsHelper");
const secretManagerApi = require("../gcp/secretManager");
const secretsUtils = require("./secretsUtils");
describe("askUserForParam", () => {
    const testSpec = {
        param: "NAME",
        type: types_1.ParamType.STRING,
        label: "Name",
        default: "Lauren",
        validationRegex: "^[a-z,A-Z]*$",
    };
    describe("checkResponse", () => {
        let logWarningSpy;
        beforeEach(() => {
            logWarningSpy = sinon.spy(utils, "logWarning");
        });
        afterEach(() => {
            logWarningSpy.restore();
        });
        it("should return false if required variable is not set", () => {
            (0, chai_1.expect)((0, askUserForParam_1.checkResponse)("", {
                param: "param",
                label: "fill in the blank!",
                type: types_1.ParamType.STRING,
                required: true,
            })).to.equal(false);
            (0, chai_1.expect)(logWarningSpy.calledWith(`Param param is required, but no value was provided.`)).to.equal(true);
        });
        it("should return false if regex validation fails", () => {
            (0, chai_1.expect)((0, askUserForParam_1.checkResponse)("123", {
                param: "param",
                label: "fill in the blank!",
                type: types_1.ParamType.STRING,
                validationRegex: "foo",
                required: true,
            })).to.equal(false);
            const expectedWarning = `123 is not a valid value for param since it does not meet the requirements of the regex validation: "foo"`;
            (0, chai_1.expect)(logWarningSpy.calledWith(expectedWarning)).to.equal(true);
        });
        it("should return false if regex validation fails on an optional param that is not empty", () => {
            (0, chai_1.expect)((0, askUserForParam_1.checkResponse)("123", {
                param: "param",
                label: "fill in the blank!",
                type: types_1.ParamType.STRING,
                validationRegex: "foo",
                required: false,
            })).to.equal(false);
            const expectedWarning = `123 is not a valid value for param since it does not meet the requirements of the regex validation: "foo"`;
            (0, chai_1.expect)(logWarningSpy.calledWith(expectedWarning)).to.equal(true);
        });
        it("should return true if no value is passed for an optional param", () => {
            (0, chai_1.expect)((0, askUserForParam_1.checkResponse)("", {
                param: "param",
                label: "fill in the blank!",
                type: types_1.ParamType.STRING,
                validationRegex: "foo",
                required: false,
            })).to.equal(true);
        });
        it("should not check against list of options if no value is passed for an optional SELECT", () => {
            (0, chai_1.expect)((0, askUserForParam_1.checkResponse)("", {
                param: "param",
                label: "fill in the blank!",
                type: types_1.ParamType.SELECT,
                required: false,
                options: [{ value: "aaa" }, { value: "bbb" }, { value: "ccc" }],
            })).to.equal(true);
        });
        it("should not check against list of options if no value is passed for an optional MULTISELECT", () => {
            (0, chai_1.expect)((0, askUserForParam_1.checkResponse)("", {
                param: "param",
                label: "fill in the blank!",
                type: types_1.ParamType.MULTISELECT,
                required: false,
                options: [{ value: "aaa" }, { value: "bbb" }, { value: "ccc" }],
            })).to.equal(true);
        });
        it("should use custom validation error message if provided", () => {
            const message = "please enter a word with foo in it";
            (0, chai_1.expect)((0, askUserForParam_1.checkResponse)("123", {
                param: "param",
                label: "fill in the blank!",
                type: types_1.ParamType.STRING,
                validationRegex: "foo",
                validationErrorMessage: message,
                required: true,
            })).to.equal(false);
            (0, chai_1.expect)(logWarningSpy.calledWith(message)).to.equal(true);
        });
        it("should return true if all conditions pass", () => {
            (0, chai_1.expect)((0, askUserForParam_1.checkResponse)("123", {
                param: "param",
                label: "fill in the blank!",
                type: types_1.ParamType.STRING,
            })).to.equal(true);
            (0, chai_1.expect)(logWarningSpy.called).to.equal(false);
        });
        it("should return false if an invalid choice is selected", () => {
            (0, chai_1.expect)((0, askUserForParam_1.checkResponse)("???", {
                param: "param",
                label: "pick one!",
                type: types_1.ParamType.SELECT,
                options: [{ value: "aaa" }, { value: "bbb" }, { value: "ccc" }],
            })).to.equal(false);
        });
        it("should return true if an valid choice is selected", () => {
            (0, chai_1.expect)((0, askUserForParam_1.checkResponse)("aaa", {
                param: "param",
                label: "pick one!",
                type: types_1.ParamType.SELECT,
                options: [{ value: "aaa" }, { value: "bbb" }, { value: "ccc" }],
            })).to.equal(true);
        });
        it("should return false if multiple invalid choices are selected", () => {
            (0, chai_1.expect)((0, askUserForParam_1.checkResponse)("d,e,f", {
                param: "param",
                label: "pick multiple!",
                type: types_1.ParamType.MULTISELECT,
                options: [{ value: "aaa" }, { value: "bbb" }, { value: "ccc" }],
            })).to.equal(false);
        });
        it("should return true if one valid choice is selected", () => {
            (0, chai_1.expect)((0, askUserForParam_1.checkResponse)("ccc", {
                param: "param",
                label: "pick multiple!",
                type: types_1.ParamType.MULTISELECT,
                options: [{ value: "aaa" }, { value: "bbb" }, { value: "ccc" }],
            })).to.equal(true);
        });
        it("should return true if multiple valid choices are selected", () => {
            (0, chai_1.expect)((0, askUserForParam_1.checkResponse)("aaa,bbb,ccc", {
                param: "param",
                label: "pick multiple!",
                type: types_1.ParamType.MULTISELECT,
                options: [{ value: "aaa" }, { value: "bbb" }, { value: "ccc" }],
            })).to.equal(true);
        });
    });
    describe("getInquirerDefaults", () => {
        it("should return the label of the option whose value matches the default", () => {
            const options = [
                { label: "lab", value: "val" },
                { label: "lab1", value: "val1" },
            ];
            const def = "val1";
            const res = (0, askUserForParam_1.getInquirerDefault)(options, def);
            (0, chai_1.expect)(res).to.equal("lab1");
        });
        it("should return the value of the default option if it doesnt have a label", () => {
            const options = [{ label: "lab", value: "val" }, { value: "val1" }];
            const def = "val1";
            const res = (0, askUserForParam_1.getInquirerDefault)(options, def);
            (0, chai_1.expect)(res).to.equal("val1");
        });
        it("should return an empty string if a default option is not found", () => {
            const options = [{ label: "lab", value: "val" }, { value: "val1" }];
            const def = "val2";
            const res = (0, askUserForParam_1.getInquirerDefault)(options, def);
            (0, chai_1.expect)(res).to.equal("");
        });
    });
    describe("askForParam with string param", () => {
        let inputStub;
        beforeEach(() => {
            inputStub = sinon.stub(prompt, "input");
            inputStub.onCall(0).returns("Invalid123");
            inputStub.onCall(1).returns("InvalidStill123");
            inputStub.onCall(2).returns("ValidName");
        });
        afterEach(() => {
            inputStub.restore();
        });
        it("should keep prompting user until valid input is given", async () => {
            await (0, askUserForParam_1.askForParam)({
                projectId: "project-id",
                instanceId: "instance-id",
                paramSpec: testSpec,
                reconfiguring: false,
            });
            (0, chai_1.expect)(inputStub).to.be.calledThrice;
        });
    });
    describe("askForParam with secret param", () => {
        const stubSecret = {
            name: "new-secret",
            projectId: "firebase-project-123",
        };
        const stubSecretVersion = {
            secret: stubSecret,
            versionId: "1.0.0",
        };
        const secretSpec = {
            param: "API_KEY",
            type: types_1.ParamType.SECRET,
            label: "API Key",
            default: "XXX.YYY",
        };
        let checkboxStub;
        let inputStub;
        let confirmStub;
        let passwordStub;
        let createSecret;
        let secretExists;
        let addVersion;
        let grantRole;
        beforeEach(() => {
            checkboxStub = sinon.stub(prompt, "checkbox");
            inputStub = sinon.stub(prompt, "input");
            confirmStub = sinon.stub(prompt, "confirm");
            passwordStub = sinon.stub(prompt, "password");
            secretExists = sinon.stub(secretManagerApi, "secretExists");
            createSecret = sinon.stub(secretManagerApi, "createSecret");
            addVersion = sinon.stub(secretManagerApi, "addVersion");
            grantRole = sinon.stub(secretsUtils, "grantFirexServiceAgentSecretAdminRole");
            secretExists.onCall(0).resolves(false);
            createSecret.onCall(0).resolves(stubSecret);
            addVersion.onCall(0).resolves(stubSecretVersion);
            grantRole.onCall(0).resolves(undefined);
        });
        afterEach(() => {
            checkboxStub.restore();
            inputStub.restore();
            confirmStub.restore();
            passwordStub.restore();
            secretExists.restore();
            createSecret.restore();
            addVersion.restore();
            grantRole.restore();
        });
        it("should return the correct user input for secret stored with Secret Manager", async () => {
            confirmStub.onFirstCall().resolves(true);
            checkboxStub.onFirstCall().resolves([askUserForParam_1.SecretLocation.CLOUD.toString()]);
            passwordStub.onFirstCall().resolves("ABC.123");
            const result = await (0, askUserForParam_1.askForParam)({
                projectId: "project-id",
                instanceId: "instance-id",
                paramSpec: secretSpec,
                reconfiguring: false,
            });
            (0, chai_1.expect)(checkboxStub).to.be.calledOnce;
            (0, chai_1.expect)(passwordStub).to.be.calledOnce;
            (0, chai_1.expect)(grantRole).to.be.calledOnce;
            (0, chai_1.expect)(result).to.be.eql({
                baseValue: `projects/${stubSecret.projectId}/secrets/${stubSecret.name}/versions/${stubSecretVersion.versionId}`,
            });
        });
        it("should return the correct user input for secret stored in a local file", async () => {
            confirmStub.onFirstCall().resolves(true);
            checkboxStub.onFirstCall().resolves([askUserForParam_1.SecretLocation.LOCAL.toString()]);
            inputStub.onFirstCall().resolves("ABC.123");
            const result = await (0, askUserForParam_1.askForParam)({
                projectId: "project-id",
                instanceId: "instance-id",
                paramSpec: secretSpec,
                reconfiguring: false,
            });
            (0, chai_1.expect)(checkboxStub).to.be.called.calledOnce;
            (0, chai_1.expect)(inputStub).to.be.calledOnce;
            (0, chai_1.expect)(passwordStub).to.not.have.been.called;
            (0, chai_1.expect)(grantRole).to.not.have.been.called;
            (0, chai_1.expect)(result).to.be.eql({
                baseValue: "",
                local: "ABC.123",
            });
        });
        it("should handle cloud & local secret storage at the same time", async () => {
            checkboxStub
                .onFirstCall()
                .returns([askUserForParam_1.SecretLocation.CLOUD.toString(), askUserForParam_1.SecretLocation.LOCAL.toString()]);
            inputStub.onFirstCall().returns("local");
            passwordStub.onFirstCall().returns("ABC.123");
            inputStub.onFirstCall().returns("LOCAL.ABC.123");
            const result = await (0, askUserForParam_1.askForParam)({
                projectId: "project-id",
                instanceId: "instance-id",
                paramSpec: secretSpec,
                reconfiguring: false,
            });
            (0, chai_1.expect)(checkboxStub).to.have.been.calledOnce;
            (0, chai_1.expect)(passwordStub).to.have.been.calledOnce;
            (0, chai_1.expect)(inputStub).to.have.been.calledOnce;
            (0, chai_1.expect)(grantRole).to.have.been.calledOnce;
            (0, chai_1.expect)(result).to.be.eql({
                baseValue: `projects/${stubSecret.projectId}/secrets/${stubSecret.name}/versions/${stubSecretVersion.versionId}`,
                local: "LOCAL.ABC.123",
            });
        });
    });
    describe("ask", () => {
        let subVarSpy;
        let promptStub;
        beforeEach(() => {
            subVarSpy = sinon.spy(extensionsHelper, "substituteParams");
            promptStub = sinon.stub(prompt, "input").resolves("ValidName");
        });
        afterEach(() => {
            subVarSpy.restore();
            promptStub.restore();
        });
        it("should call substituteParams with the right parameters", async () => {
            const spec = [testSpec];
            const firebaseProjectVars = { PROJECT_ID: "my-project" };
            await (0, askUserForParam_1.ask)({
                projectId: "project-id",
                instanceId: "instance-id",
                paramSpecs: spec,
                firebaseProjectParams: firebaseProjectVars,
                reconfiguring: false,
            });
            (0, chai_1.expect)(subVarSpy.calledWith(spec, firebaseProjectVars)).to.be.true;
        });
    });
});
//# sourceMappingURL=askUserForParam.spec.js.map