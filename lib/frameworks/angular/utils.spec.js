"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const chai_1 = require("chai");
describe("Angular utils", () => {
    describe("getBuilderType", () => {
        it("should return the correct builder type for valid builders", () => {
            (0, chai_1.expect)((0, utils_1.getBuilderType)("@angular-devkit/build-angular:browser")).to.equal(utils_1.BuilderType.BROWSER);
            (0, chai_1.expect)((0, utils_1.getBuilderType)("@angular-devkit/build-angular:server")).to.equal(utils_1.BuilderType.SERVER);
            (0, chai_1.expect)((0, utils_1.getBuilderType)("@angular-devkit/build-angular:dev-server")).to.equal(utils_1.BuilderType.DEV_SERVER);
            (0, chai_1.expect)((0, utils_1.getBuilderType)("@angular-devkit/build-angular:ssr-dev-server")).to.equal(utils_1.BuilderType.SSR_DEV_SERVER);
            (0, chai_1.expect)((0, utils_1.getBuilderType)("@angular-devkit/build-angular:prerender")).to.equal(utils_1.BuilderType.PRERENDER);
            (0, chai_1.expect)((0, utils_1.getBuilderType)("@angular-devkit/build-angular:application")).to.equal(utils_1.BuilderType.APPLICATION);
            (0, chai_1.expect)((0, utils_1.getBuilderType)("@angular-devkit/build-angular:browser-esbuild")).to.equal(utils_1.BuilderType.BROWSER_ESBUILD);
            (0, chai_1.expect)((0, utils_1.getBuilderType)("@angular-devkit/build-angular:deploy")).to.equal(utils_1.BuilderType.DEPLOY);
        });
        it("should return null for invalid builders", () => {
            (0, chai_1.expect)((0, utils_1.getBuilderType)("@angular-devkit/build-angular:invalid")).to.be.null;
            (0, chai_1.expect)((0, utils_1.getBuilderType)("invalid")).to.be.null;
            (0, chai_1.expect)((0, utils_1.getBuilderType)(":")).to.be.null;
            (0, chai_1.expect)((0, utils_1.getBuilderType)("::")).to.be.null;
            (0, chai_1.expect)((0, utils_1.getBuilderType)("random:string")).to.be.null;
        });
        it("should handle builders with no colon", () => {
            (0, chai_1.expect)((0, utils_1.getBuilderType)("@angular-devkit/build-angular")).to.be.null;
        });
    });
});
//# sourceMappingURL=utils.spec.js.map