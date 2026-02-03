"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const yaml_1 = require("./yaml");
describe("merge", () => {
    it("merges incoming apphosting yaml config with precendence", () => {
        const apphostingYaml = yaml_1.AppHostingYamlConfig.empty();
        apphostingYaml.env = {
            ENV_1: { value: "env_1" },
            ENV_2: { value: "env_2" },
            SECRET: { secret: "secret_1" },
        };
        const incomingAppHostingYaml = yaml_1.AppHostingYamlConfig.empty();
        incomingAppHostingYaml.env = {
            ENV_1: { value: "incoming_env_1" },
            ENV_3: { value: "incoming_env_3" },
            SECRET_2: { value: "incoming_secret_2" },
        };
        apphostingYaml.merge(incomingAppHostingYaml);
        (0, chai_1.expect)(apphostingYaml.env).to.deep.equal({
            ENV_1: { value: "incoming_env_1" },
            ENV_2: { value: "env_2" },
            ENV_3: { value: "incoming_env_3" },
            SECRET: { secret: "secret_1" },
            SECRET_2: { value: "incoming_secret_2" },
        });
    });
    it("conditionally allows secrets to become plaintext", () => {
        const apphostingYaml = yaml_1.AppHostingYamlConfig.empty();
        apphostingYaml.env = {
            API_KEY: { secret: "api_key" },
        };
        const incomingYaml = yaml_1.AppHostingYamlConfig.empty();
        incomingYaml.env = {
            API_KEY: { value: "plaintext" },
        };
        (0, chai_1.expect)(() => apphostingYaml.merge(incomingYaml, false)).to.throw("Cannot convert secret to plaintext in apphosting yaml");
        (0, chai_1.expect)(() => apphostingYaml.merge(incomingYaml, true)).to.not.throw();
        (0, chai_1.expect)(apphostingYaml.env).to.deep.equal({
            API_KEY: { value: "plaintext" },
        });
    });
});
//# sourceMappingURL=yaml.spec.js.map