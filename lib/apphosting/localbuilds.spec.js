"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const localBuildModule = require("@apphosting/build");
const localbuilds_1 = require("./localbuilds");
describe("localBuild", () => {
    afterEach(() => {
        sinon.restore();
    });
    it("returns the expected output", async () => {
        const bundleConfig = {
            version: "v1",
            runConfig: {
                runCommand: "npm run build:prod",
            },
            metadata: {
                adapterPackageName: "@apphosting/angular-adapter",
                adapterVersion: "14.1",
                framework: "nextjs",
            },
            outputFiles: {
                serverApp: {
                    include: ["./next/standalone"],
                },
            },
        };
        const expectedAnnotations = {
            adapterPackageName: "@apphosting/angular-adapter",
            adapterVersion: "14.1",
            framework: "nextjs",
        };
        const expectedOutputFiles = ["./next/standalone"];
        const expectedBuildConfig = {
            runCommand: "npm run build:prod",
            env: [],
        };
        const localApphostingBuildStub = sinon
            .stub(localBuildModule, "localBuild")
            .resolves(bundleConfig);
        const { outputFiles, annotations, buildConfig } = await (0, localbuilds_1.localBuild)("./", "nextjs");
        (0, chai_1.expect)(annotations).to.deep.equal(expectedAnnotations);
        (0, chai_1.expect)(buildConfig).to.deep.equal(expectedBuildConfig);
        (0, chai_1.expect)(outputFiles).to.deep.equal(expectedOutputFiles);
        sinon.assert.calledWith(localApphostingBuildStub, "./", "nextjs");
    });
});
//# sourceMappingURL=localbuilds.spec.js.map