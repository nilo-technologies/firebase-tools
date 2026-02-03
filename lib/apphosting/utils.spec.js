"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const utils = require("./utils");
const promptImport = require("../prompt");
const sinon = require("sinon");
describe("utils", () => {
    describe("getEnvironmentName", () => {
        it("should throw an error if environment can't be found", () => {
            (0, chai_1.expect)(utils.getEnvironmentName.bind(utils.getEnvironmentName, "apphosting.yaml")).to.throw("Invalid apphosting environment file");
        });
        it("should return the environment if valid environment specific apphosting file is given", () => {
            (0, chai_1.expect)(utils.getEnvironmentName("apphosting.staging.yaml")).to.equal("staging");
        });
    });
    describe("promptForAppHostingYaml", () => {
        let prompt;
        beforeEach(() => {
            prompt = sinon.stub(promptImport);
        });
        afterEach(() => {
            sinon.verifyAndRestore();
        });
        it("should prompt with the correct options", async () => {
            const apphostingFileNameToPathMap = new Map([
                ["apphosting.yaml", "/parent/cwd/apphosting.yaml"],
                ["apphosting.staging.yaml", "/parent/apphosting.staging.yaml"],
            ]);
            prompt.select.returns(Promise.resolve());
            await utils.promptForAppHostingYaml(apphostingFileNameToPathMap);
            (0, chai_1.expect)(prompt.select).to.have.been.calledWith({
                message: "Please select an App Hosting config:",
                choices: [
                    {
                        name: "base (apphosting.yaml)",
                        value: "/parent/cwd/apphosting.yaml",
                    },
                    {
                        name: "staging (apphosting.yaml + apphosting.staging.yaml)",
                        value: "/parent/apphosting.staging.yaml",
                    },
                ],
            });
        });
    });
});
//# sourceMappingURL=utils.spec.js.map