"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs = require("fs/promises");
const yaml = require("yaml");
const sinon = require("sinon");
const nock = require("nock");
const api = require("../../../../api");
const error_1 = require("../../../../error");
const discovery = require(".");
const build = require("../../build");
const MIN_ENDPOINT = {
    entryPoint: "entrypoint",
    httpsTrigger: {},
    serviceAccount: null,
};
const ENDPOINT = {
    ...MIN_ENDPOINT,
    platform: "gcfv2",
    project: "project",
    runtime: "nodejs16",
    region: [api.functionsDefaultRegion()],
    serviceAccount: null,
};
const YAML_OBJ = {
    specVersion: "v1alpha1",
    endpoints: { id: MIN_ENDPOINT },
};
const YAML_TEXT = yaml.stringify(YAML_OBJ);
const BUILD = build.of({ id: ENDPOINT });
describe("yamlToBuild", () => {
    it("Accepts a valid v1alpha1 spec", () => {
        const parsed = discovery.yamlToBuild(YAML_OBJ, "project", api.functionsDefaultRegion(), "nodejs16");
        (0, chai_1.expect)(parsed).to.deep.equal(BUILD);
    });
    it("Requires a spec version", () => {
        const flawed = { ...YAML_OBJ };
        delete flawed.specVersion;
        (0, chai_1.expect)(() => discovery.yamlToBuild(flawed, "project", api.functionsDefaultRegion(), "nodejs16")).to.throw(error_1.FirebaseError);
    });
    it("Throws on unknown spec versions", () => {
        const flawed = {
            ...YAML_OBJ,
            specVersion: "32767beta2",
        };
        (0, chai_1.expect)(() => discovery.yamlToBuild(flawed, "project", api.functionsDefaultRegion(), "nodejs16")).to.throw(error_1.FirebaseError);
    });
});
describe("detectFromYaml", () => {
    let readFile;
    beforeEach(() => {
        readFile = sinon.stub(fs, "readFile");
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    it("succeeds when YAML can be found", async () => {
        readFile.resolves(YAML_TEXT);
        await (0, chai_1.expect)(discovery.detectFromYaml("directory", "project", "nodejs16")).to.eventually.deep.equal(BUILD);
    });
    it("returns undefined when YAML cannot be found", async () => {
        readFile.rejects({ code: "ENOENT" });
        await (0, chai_1.expect)(discovery.detectFromYaml("directory", "project", "nodejs16")).to.eventually.equal(undefined);
    });
});
describe("detectFromPort", () => {
    afterEach(() => {
        nock.cleanAll();
    });
    it("passes as smoke test", async () => {
        nock("http://127.0.0.1:8080").get("/__/functions.yaml").times(5).replyWithError({
            message: "Still booting",
            code: "ECONNREFUSED",
        });
        nock("http://127.0.0.1:8080").get("/__/functions.yaml").times(3).replyWithError({
            message: "Almost there",
            code: "ETIMEDOUT",
        });
        nock("http://127.0.0.1:8080").get("/__/functions.yaml").reply(200, YAML_TEXT);
        const parsed = await discovery.detectFromPort(8080, "project", "nodejs16");
        (0, chai_1.expect)(parsed).to.deep.equal(BUILD);
    });
    it("retries when request times out", async () => {
        nock("http://127.0.0.1:8081").get("/__/functions.yaml").delay(1000).reply(200, YAML_TEXT);
        nock("http://127.0.0.1:8080").get("/__/functions.yaml").reply(200, YAML_TEXT);
        const parsed = await discovery.detectFromPort(8080, "project", "nodejs16", 0, 500);
        (0, chai_1.expect)(parsed).to.deep.equal(BUILD);
    });
});
//# sourceMappingURL=index.spec.js.map