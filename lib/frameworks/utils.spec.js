"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const fs = require("fs");
const path_1 = require("path");
const utils_1 = require("./utils");
describe("Frameworks utils", () => {
    describe("getNodeModuleBin", () => {
        it("should return expected tsc path", () => {
            (0, chai_1.expect)((0, utils_1.getNodeModuleBin)("tsc", __dirname)).to.equal((0, path_1.resolve)((0, path_1.join)(__dirname, "..", "..", "node_modules", ".bin", "tsc")));
        }).timeout(5000);
        it("should throw when npm root not found", () => {
            (0, chai_1.expect)(() => {
                (0, utils_1.getNodeModuleBin)("tsc", "/");
            }).to.throw("Could not find the tsc executable.");
        }).timeout(5000);
        it("should throw when executable not found", () => {
            (0, chai_1.expect)(() => {
                (0, utils_1.getNodeModuleBin)("xxxxx", __dirname);
            }).to.throw("Could not find the xxxxx executable.");
        }).timeout(5000);
    });
    describe("isUrl", () => {
        it("should identify http URL", () => {
            (0, chai_1.expect)((0, utils_1.isUrl)("http://firebase.google.com")).to.be.true;
        });
        it("should identify https URL", () => {
            (0, chai_1.expect)((0, utils_1.isUrl)("https://firebase.google.com")).to.be.true;
        });
        it("should ignore URL within path", () => {
            (0, chai_1.expect)((0, utils_1.isUrl)("path/?url=https://firebase.google.com")).to.be.false;
        });
        it("should ignore path starting with http but without protocol", () => {
            (0, chai_1.expect)((0, utils_1.isUrl)("httpendpoint/foo/bar")).to.be.false;
        });
        it("should ignore path starting with https but without protocol", () => {
            (0, chai_1.expect)((0, utils_1.isUrl)("httpsendpoint/foo/bar")).to.be.false;
        });
    });
    describe("warnIfCustomBuildScript", () => {
        const framework = "Next.js";
        let sandbox;
        let consoleLogSpy;
        const packageJson = {
            scripts: {
                build: "",
            },
        };
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            consoleLogSpy = sandbox.spy(console, "warn");
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should not print warning when a default build script is found.", async () => {
            const buildScript = "next build";
            const defaultBuildScripts = ["next build"];
            packageJson.scripts.build = buildScript;
            sandbox.stub(fs.promises, "readFile").resolves(JSON.stringify(packageJson));
            await (0, utils_1.warnIfCustomBuildScript)("fakedir/", framework, defaultBuildScripts);
            (0, chai_1.expect)(consoleLogSpy.callCount).to.equal(0);
        });
        it("should print warning when a custom build script is found.", async () => {
            const buildScript = "echo 'Custom build script' && next build";
            const defaultBuildScripts = ["next build"];
            packageJson.scripts.build = buildScript;
            sandbox.stub(fs.promises, "readFile").resolves(JSON.stringify(packageJson));
            await (0, utils_1.warnIfCustomBuildScript)("fakedir/", framework, defaultBuildScripts);
            (0, chai_1.expect)(consoleLogSpy).to.be.calledOnceWith(`\nWARNING: Your package.json contains a custom build that is being ignored. Only the ${framework} default build script (e.g, "${defaultBuildScripts[0]}") is respected. If you have a more advanced build process you should build a custom integration https://firebase.google.com/docs/hosting/express\n`);
        });
    });
    describe("conjoinOptions", () => {
        const options = [14, 16, 18];
        const defaultSeparator = ",";
        const defaultConjunction = "and";
        it("should return empty string if there's no options", () => {
            (0, chai_1.expect)((0, utils_1.conjoinOptions)([])).to.be.eql("");
        });
        it("should return option if there's only one", () => {
            (0, chai_1.expect)((0, utils_1.conjoinOptions)([options[0]])).to.equal(options[0].toString());
        });
        it("should return options without separator if there's two options", () => {
            const twoOptions = options.slice(0, 2);
            (0, chai_1.expect)((0, utils_1.conjoinOptions)(twoOptions)).to.equal(`${twoOptions[0]} ${defaultConjunction} ${twoOptions[1]}`);
        });
        it("should return options with default conjunction and default separator", () => {
            (0, chai_1.expect)((0, utils_1.conjoinOptions)(options)).to.equal(`${options[0]}${defaultSeparator} ${options[1]}${defaultSeparator} ${defaultConjunction} ${options[2]}`);
        });
        it("should return options with custom separator", () => {
            const customSeparator = "/";
            (0, chai_1.expect)((0, utils_1.conjoinOptions)(options, defaultConjunction, customSeparator)).to.equal(`${options[0]}${customSeparator} ${options[1]}${customSeparator} ${defaultConjunction} ${options[2]}`);
        });
        it("should return options with custom conjunction", () => {
            const customConjuntion = "or";
            (0, chai_1.expect)((0, utils_1.conjoinOptions)(options, customConjuntion, defaultSeparator)).to.equal(`${options[0]}${defaultSeparator} ${options[1]}${defaultSeparator} ${customConjuntion} ${options[2]}`);
        });
    });
});
//# sourceMappingURL=utils.spec.js.map