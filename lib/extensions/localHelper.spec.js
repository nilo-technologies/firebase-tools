"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs = require("fs-extra");
const yaml = require("yaml");
const sinon = require("sinon");
const localHelper = require("./localHelper");
const error_1 = require("../error");
const sample_ext_1 = require("../test/fixtures/extension-yamls/sample-ext");
const sample_ext_preinstall_1 = require("../test/fixtures/extension-yamls/sample-ext-preinstall");
const invalid_1 = require("../test/fixtures/extension-yamls/invalid");
const valid_yaml_invalid_spec_1 = require("../test/fixtures/extension-yamls/valid-yaml-invalid-spec");
describe("localHelper", () => {
    const sandbox = sinon.createSandbox();
    describe("getLocalExtensionSpec", () => {
        it("should return a spec when extension.yaml is present", async () => {
            const result = await localHelper.getLocalExtensionSpec(sample_ext_1.FIXTURE_DIR);
            (0, chai_1.expect)(result.name).to.equal("fixture-ext");
            (0, chai_1.expect)(result.version).to.equal("1.0.0");
            (0, chai_1.expect)(result.preinstallContent).to.be.undefined;
        });
        it("should populate preinstallContent when PREINSTALL.md is present", async () => {
            const result = await localHelper.getLocalExtensionSpec(sample_ext_preinstall_1.FIXTURE_DIR);
            (0, chai_1.expect)(result.name).to.equal("fixture-ext-with-preinstall");
            (0, chai_1.expect)(result.version).to.equal("1.0.0");
            (0, chai_1.expect)(result.preinstallContent).to.equal("This is a PREINSTALL file for testing with.\n");
        });
        it("should validate that the yaml is a valid extension spec", async () => {
            await (0, chai_1.expect)(localHelper.getLocalExtensionSpec(valid_yaml_invalid_spec_1.FIXTURE_DIR)).to.be.rejectedWith(error_1.FirebaseError, /.+Resources field must contain at least one resource/);
        });
        it("should return a nice error if there is no extension.yaml", async () => {
            await (0, chai_1.expect)(localHelper.getLocalExtensionSpec(__dirname)).to.be.rejectedWith(error_1.FirebaseError);
        });
        describe("with an invalid YAML file", () => {
            it("should return a rejected promise with a useful error if extension.yaml is invalid", async () => {
                await (0, chai_1.expect)(localHelper.getLocalExtensionSpec(invalid_1.FIXTURE_DIR)).to.be.rejectedWith(error_1.FirebaseError, /YAML Error.+Implicit keys need to be on a single line.+line 2.+/);
            });
        });
        describe("other YAML errors", () => {
            beforeEach(() => {
                sandbox.stub(yaml, "parse").throws(new Error("not the files you are looking for"));
            });
            afterEach(() => {
                sandbox.restore();
            });
            it("should rethrow normal errors", async () => {
                await (0, chai_1.expect)(localHelper.getLocalExtensionSpec(sample_ext_1.FIXTURE_DIR)).to.be.rejectedWith(error_1.FirebaseError, "not the files you are looking for");
            });
        });
    });
    describe("isLocalExtension", () => {
        let fsStub;
        beforeEach(() => {
            fsStub = sandbox.stub(fs, "readdirSync");
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should return true if a file exists there", () => {
            fsStub.returns("");
            const result = localHelper.isLocalExtension("some/local/path");
            (0, chai_1.expect)(result).to.be.true;
        });
        it("should return false if a file doesn't exist there", () => {
            fsStub.throws(new Error("directory not found"));
            const result = localHelper.isLocalExtension("some/local/path");
            (0, chai_1.expect)(result).to.be.false;
        });
    });
});
//# sourceMappingURL=localHelper.spec.js.map