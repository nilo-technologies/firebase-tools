"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const nock = require("nock");
const api = require("../../../api");
const update_template_1 = require("./update_template");
const util_1 = require("../../util");
const PROJECT_ID = "the-remote-config-project";
const TEMPLATE = {
    conditions: [],
    parameters: {},
    parameterGroups: {},
    etag: "whatever",
    version: {
        versionNumber: "1",
        updateTime: "2020-01-01T12:00:00.000000Z",
        updateUser: {
            email: "someone@google.com",
        },
        updateOrigin: "CONSOLE",
        updateType: "INCREMENTAL_UPDATE",
    },
};
describe("update_template", () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });
    afterEach(() => {
        sandbox.restore();
        nock.cleanAll();
    });
    it("should publish the latest template", async () => {
        nock(api.remoteConfigApiOrigin())
            .put(`/v1/projects/${PROJECT_ID}/remoteConfig`)
            .reply(200, TEMPLATE);
        const result = await update_template_1.update_template.fn({ template: TEMPLATE }, {
            projectId: PROJECT_ID,
        });
        (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)(TEMPLATE));
    });
    it("should publish the latest template with * etag", async () => {
        nock(api.remoteConfigApiOrigin())
            .put(`/v1/projects/${PROJECT_ID}/remoteConfig`, undefined, {
            reqheaders: {
                "If-Match": "*",
            },
        })
            .reply(200, TEMPLATE);
        const result = await update_template_1.update_template.fn({ template: TEMPLATE, force: true }, {
            projectId: PROJECT_ID,
        });
        (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)(TEMPLATE));
    });
    it("should reject if the publish api call fails", async () => {
        nock(api.remoteConfigApiOrigin()).put(`/v1/projects/${PROJECT_ID}/remoteConfig`).reply(404, {});
        await (0, chai_1.expect)(update_template_1.update_template.fn({ template: TEMPLATE }, { projectId: PROJECT_ID })).to.be.rejected;
    });
    it("should return a rollback to the version number specified", async () => {
        nock(api.remoteConfigApiOrigin())
            .post(`/v1/projects/${PROJECT_ID}/remoteConfig:rollback?versionNumber=1`)
            .reply(200, TEMPLATE);
        const result = await update_template_1.update_template.fn({ version_number: 1 }, {
            projectId: PROJECT_ID,
        });
        (0, chai_1.expect)(result).to.deep.equal((0, util_1.toContent)(TEMPLATE));
    });
    it("should reject if the rollback api call fails", async () => {
        nock(api.remoteConfigApiOrigin())
            .post(`/v1/projects/${PROJECT_ID}/remoteConfig:rollback?versionNumber=1`)
            .reply(404, {});
        await (0, chai_1.expect)(update_template_1.update_template.fn({ version_number: 1 }, { projectId: PROJECT_ID })).to.be.rejected;
    });
});
//# sourceMappingURL=update_template.spec.js.map