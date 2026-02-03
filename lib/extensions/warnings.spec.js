"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const warnings = require("./warnings");
const types_1 = require("./types");
const utils = require("../utils");
const testExtensionVersion = (listingState) => {
    return {
        name: "test",
        ref: "test/test@0.1.0",
        state: "PUBLISHED",
        hash: "abc123",
        sourceDownloadUri: "https://download.com/source",
        spec: {
            name: "test",
            version: "0.1.0",
            resources: [],
            params: [],
            systemParams: [],
            sourceUrl: "github.com/test/meout",
        },
        listing: {
            state: listingState,
        },
    };
};
const testExtension = (publisherId) => {
    return {
        name: "test",
        state: "PUBLISHED",
        ref: `${publisherId}/test`,
        registryLaunchStage: types_1.RegistryLaunchStage.BETA,
        createTime: "101",
        visibility: types_1.Visibility.PUBLIC,
    };
};
const testInstanceSpec = (publisherId, instanceId, listingState) => {
    return {
        instanceId,
        ref: {
            publisherId,
            extensionId: "test",
            version: "0.1.0",
        },
        params: {},
        systemParams: {},
        extensionVersion: testExtensionVersion(listingState),
        extension: testExtension(publisherId),
    };
};
describe("displayWarningsForDeploy", () => {
    let loggerStub;
    beforeEach(() => {
        loggerStub = sinon.stub(utils, "logLabeledBullet");
    });
    afterEach(() => {
        loggerStub.restore();
    });
    it("should not warn if published", async () => {
        const toCreate = [
            testInstanceSpec("firebase", "ext-id-1", "APPROVED"),
            testInstanceSpec("firebase", "ext-id-2", "APPROVED"),
        ];
        const warned = await warnings.displayWarningsForDeploy(toCreate);
        (0, chai_1.expect)(warned).to.be.false;
        (0, chai_1.expect)(loggerStub).to.not.have.been.called;
    });
    it("should not warn if not published", async () => {
        const toCreate = [
            testInstanceSpec("pubby-mcpublisher", "ext-id-1", "PENDING"),
            testInstanceSpec("pubby-mcpublisher", "ext-id-2", "REJECTED"),
        ];
        const warned = await warnings.displayWarningsForDeploy(toCreate);
        (0, chai_1.expect)(warned).to.be.true;
        (0, chai_1.expect)(loggerStub).to.have.been.calledWithMatch("extensions", "have not been published to the Firebase Extensions Hub");
    });
});
//# sourceMappingURL=warnings.spec.js.map