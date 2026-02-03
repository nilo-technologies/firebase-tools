"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const index_1 = require("./index");
describe("Deploy", () => {
    describe("isDeployingWebFramework", () => {
        let options;
        beforeEach(() => {
            options = {
                config: {
                    get: sinon.stub(),
                },
                only: undefined,
            };
        });
        for (const key of ["site", "target"]) {
            describe(`with ${key} in config`, () => {
                describe("with a single web framework", () => {
                    beforeEach(() => {
                        options.config.get
                            .withArgs("hosting")
                            .returns([{ source: "src", [key]: "webframework" }]);
                    });
                    describe("without 'only' option", () => {
                        it("should return true if a web framework is in config", () => {
                            (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.true;
                        });
                    });
                    describe("with 'only' option", () => {
                        it(`should return false if 'only' option does not match the ${key}`, () => {
                            options.only = "hosting:othersite";
                            (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.false;
                        });
                        it(`should return true if 'only' option matches the ${key}`, () => {
                            options.only = `hosting:webframework`;
                            (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.true;
                        });
                        it("should return false if 'only' option matches a function, not a web framework", () => {
                            options.only = "functions:webframework";
                            (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.false;
                        });
                    });
                });
                describe("with both a web framework and a non-web framework", () => {
                    beforeEach(() => {
                        options.config.get.withArgs("hosting").returns([
                            { source: "src", [key]: "webframework" },
                            { public: "public", [key]: "public" },
                        ]);
                    });
                    describe("without 'only' option", () => {
                        it("should return true if a web framework is in config", () => {
                            (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.true;
                        });
                    });
                    describe("with 'only' option", () => {
                        it(`should return false if 'only' option does not match the web framework ${key}`, () => {
                            options.only = "hosting:othersite";
                            (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.false;
                        });
                        it(`should return true if 'only' option matches the web framework ${key}`, () => {
                            options.only = `hosting:webframework`;
                            (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.true;
                        });
                        it(`should return false if 'only' option matches a non-web framework ${key}`, () => {
                            options.only = "hosting:public";
                            (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.false;
                        });
                        it("should return false if 'only' option matches a function, not a web framework", () => {
                            options.only = "functions:webframework";
                            (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.false;
                        });
                    });
                });
                describe("with more than one web framework in config", () => {
                    beforeEach(() => {
                        options.config.get.withArgs("hosting").returns([
                            { source: "src", [key]: "prod" },
                            { source: "src", [key]: "staging" },
                            { public: "public", [key]: "static" },
                        ]);
                    });
                    it("should return true when only 'hosting' is specified", () => {
                        options.only = "hosting";
                        (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.true;
                    });
                    it("should return true when targeting a web framework site", () => {
                        options.only = "hosting:prod";
                        (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.true;
                        options.only = "hosting:staging";
                        (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.true;
                    });
                    it("should return false when targeting a non-web framework site", () => {
                        options.only = "hosting:static";
                        (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.false;
                    });
                });
            });
            describe("with no web framework in config", () => {
                beforeEach(() => {
                    options.config.get.withArgs("hosting").returns([{ [key]: "public", public: "public" }]);
                });
                describe("without 'only' option", () => {
                    it("should return false if no web framework is in config", () => {
                        (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.false;
                    });
                });
                describe("with 'only' option", () => {
                    it("should return false regardless of 'only' option", () => {
                        options.only = "hosting:webframework";
                        (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.false;
                    });
                });
                it("should return false when config is null", () => {
                    options.config.get.withArgs("hosting").returns(null);
                    (0, chai_1.expect)((0, index_1.isDeployingWebFramework)(options)).to.be.false;
                });
            });
        }
    });
});
//# sourceMappingURL=index.spec.js.map