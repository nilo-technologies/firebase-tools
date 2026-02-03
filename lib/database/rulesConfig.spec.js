"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const rulesConfig_1 = require("./rulesConfig");
const rc_1 = require("../rc");
describe("rulesConfig", () => {
    describe("getRulesConfig", () => {
        it("should return empty array if database config is not defined", () => {
            const options = {
                config: {
                    src: {},
                },
            };
            const result = (0, rulesConfig_1.getRulesConfig)("projectId", options);
            (0, chai_1.expect)(result).to.deep.equal([]);
        });
        it("should get rules config for single database config", () => {
            const options = {
                config: {
                    src: {
                        database: {
                            rules: "rules.json",
                        },
                    },
                },
                project: "projectId",
            };
            const result = (0, rulesConfig_1.getRulesConfig)("projectId", options);
            (0, chai_1.expect)(result).to.deep.equal([{ instance: "projectId-default-rtdb", rules: "rules.json" }]);
        });
        it("should get rules config for multiple database configs", () => {
            const options = {
                config: {
                    src: {
                        database: [
                            {
                                instance: "instance1",
                                rules: "rules1.json",
                            },
                            {
                                instance: "instance2",
                                rules: "rules2.json",
                            },
                        ],
                    },
                },
                rc: new rc_1.RC(),
            };
            const result = (0, rulesConfig_1.getRulesConfig)("projectId", options);
            (0, chai_1.expect)(result).to.deep.equal([
                { instance: "instance1", rules: "rules1.json" },
                { instance: "instance2", rules: "rules2.json" },
            ]);
        });
        it("should filter rules config by 'only' option", () => {
            const options = {
                config: {
                    src: {
                        database: [
                            {
                                target: "target1",
                                rules: "rules1.json",
                            },
                            {
                                target: "target2",
                                rules: "rules2.json",
                            },
                        ],
                    },
                },
                only: "database:target1",
                rc: {
                    requireTarget: sinon.spy(),
                    target: sinon.stub().returns(["instance1"]),
                },
            };
            const result = (0, rulesConfig_1.getRulesConfig)("projectId", options);
            (0, chai_1.expect)(result).to.deep.equal([{ instance: "instance1", rules: "rules1.json" }]);
        });
        it("should throw error if target is not found", () => {
            const options = {
                config: {
                    src: {
                        database: [
                            {
                                target: "target1",
                                rules: "rules1.json",
                            },
                        ],
                    },
                },
                only: "database:target2",
                rc: {
                    requireTarget: sinon.spy(),
                    target: sinon.stub().returns([]),
                },
            };
            (0, chai_1.expect)(() => (0, rulesConfig_1.getRulesConfig)("projectId", options)).to.throw("Could not find configurations in firebase.json for the following database targets: target2");
        });
        it("should throw error if config is invalid", () => {
            const options = {
                config: {
                    src: {
                        database: [{}],
                    },
                },
                rc: new rc_1.RC(),
            };
            (0, chai_1.expect)(() => (0, rulesConfig_1.getRulesConfig)("projectId", options)).to.throw('Must supply either "target" or "instance" in database config');
        });
    });
});
//# sourceMappingURL=rulesConfig.spec.js.map