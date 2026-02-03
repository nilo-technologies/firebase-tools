"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const error_1 = require("../../error");
const backend = require("./backend");
const functionPrompts = require("./prompts");
const prompt = require("../../prompt");
const utils = require("../../utils");
const rc_1 = require("../../rc");
const SAMPLE_EVENT_TRIGGER = {
    eventType: "google.pubsub.topic.publish",
    eventFilters: { resource: "projects/a/topics/b" },
    retry: false,
};
const SAMPLE_ENDPOINT = {
    platform: "gcfv1",
    id: "c",
    region: "us-central1",
    project: "a",
    entryPoint: "function",
    labels: {},
    environmentVariables: {},
    runtime: "nodejs16",
    eventTrigger: SAMPLE_EVENT_TRIGGER,
};
const SAMPLE_OPTIONS = {
    cwd: "/",
    configPath: "/",
    config: {},
    only: "functions",
    except: "",
    nonInteractive: false,
    debug: false,
    force: false,
    filteredTargets: ["functions"],
    rc: new rc_1.RC(),
};
describe("promptForFailurePolicies", () => {
    let confirmStub;
    beforeEach(() => {
        confirmStub = sinon.stub(prompt, "confirm");
    });
    afterEach(() => {
        confirmStub.restore();
    });
    it("should prompt if there are new functions with failure policies", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            eventTrigger: {
                ...SAMPLE_EVENT_TRIGGER,
                retry: true,
            },
        };
        confirmStub.resolves(true);
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(SAMPLE_OPTIONS, backend.of(endpoint), backend.empty())).not.to.be.rejected;
        (0, chai_1.expect)(confirmStub).to.have.been.calledOnce;
    });
    it("should not prompt if all functions with failure policies already had failure policies", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            eventTrigger: {
                ...SAMPLE_EVENT_TRIGGER,
                retry: true,
            },
        };
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(SAMPLE_OPTIONS, backend.of(endpoint), backend.of(endpoint))).eventually.be.fulfilled;
        (0, chai_1.expect)(confirmStub).to.not.have.been.called;
    });
    it("should throw if user declines the prompt", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            eventTrigger: {
                ...SAMPLE_EVENT_TRIGGER,
                retry: true,
            },
        };
        confirmStub.resolves(false);
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(SAMPLE_OPTIONS, backend.of(endpoint), backend.empty())).to.eventually.be.rejectedWith(error_1.FirebaseError, /Deployment canceled/);
        (0, chai_1.expect)(confirmStub).to.have.been.calledOnce;
    });
    it("should prompt if an existing function adds a failure policy", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            eventTrigger: {
                ...SAMPLE_EVENT_TRIGGER,
            },
        };
        const newEndpoint = {
            ...SAMPLE_ENDPOINT,
            eventTrigger: {
                ...SAMPLE_EVENT_TRIGGER,
                retry: true,
            },
        };
        confirmStub.resolves(true);
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(SAMPLE_OPTIONS, backend.of(newEndpoint), backend.of(endpoint))).eventually.be.fulfilled;
        (0, chai_1.expect)(confirmStub).to.have.been.calledOnce;
    });
    it("should throw if there are any functions with failure policies and the user doesn't accept the prompt", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            eventTrigger: {
                ...SAMPLE_EVENT_TRIGGER,
                retry: true,
            },
        };
        confirmStub.resolves(false);
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(SAMPLE_OPTIONS, backend.of(endpoint), backend.empty())).to.eventually.be.rejectedWith(error_1.FirebaseError, /Deployment canceled/);
        (0, chai_1.expect)(confirmStub).to.have.been.calledOnce;
    });
    it("should not prompt if there are no functions with failure policies", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            eventTrigger: {
                ...SAMPLE_EVENT_TRIGGER,
            },
        };
        confirmStub.resolves();
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(SAMPLE_OPTIONS, backend.of(endpoint), backend.empty())).to.eventually.be.fulfilled;
        (0, chai_1.expect)(confirmStub).not.to.have.been.called;
    });
    it("should throw if there are any functions with failure policies, in noninteractive mode, without the force flag set", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            eventTrigger: {
                ...SAMPLE_EVENT_TRIGGER,
                retry: true,
            },
        };
        const options = { ...SAMPLE_OPTIONS, nonInteractive: true };
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(options, backend.of(endpoint), backend.empty())).to.be.rejectedWith(error_1.FirebaseError, /--force option/);
        (0, chai_1.expect)(confirmStub).not.to.have.been.called;
    });
    it("should not throw if there are any functions with failure policies, in noninteractive mode, with the force flag set", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            eventTrigger: {
                ...SAMPLE_EVENT_TRIGGER,
                retry: true,
            },
        };
        const options = { ...SAMPLE_OPTIONS, nonInteractive: true, force: true };
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(options, backend.of(endpoint), backend.empty())).to.eventually.be.fulfilled;
        (0, chai_1.expect)(confirmStub).not.to.have.been.called;
    });
});
describe("promptForMinInstances", () => {
    let confirmStub;
    let logStub;
    beforeEach(() => {
        confirmStub = sinon.stub(prompt, "confirm");
        logStub = sinon.stub(utils, "logLabeledWarning");
    });
    afterEach(() => {
        confirmStub.restore();
        logStub.restore();
    });
    it("should prompt if there are new functions with minInstances", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            minInstances: 1,
        };
        confirmStub.resolves(true);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(endpoint), backend.empty())).not.to.be.rejected;
        (0, chai_1.expect)(confirmStub).to.have.been.calledOnce;
    });
    it("should not prompt if no fucntion has minInstance", async () => {
        const bkend = backend.of(SAMPLE_ENDPOINT);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, bkend, bkend)).to.eventually
            .be.fulfilled;
        (0, chai_1.expect)(confirmStub).to.not.have.been.called;
    });
    it("should not prompt if all functions with minInstances already had the same number of minInstances", async () => {
        const bkend = backend.of({
            ...SAMPLE_ENDPOINT,
            minInstances: 1,
        });
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, bkend, bkend)).to.eventually
            .be.fulfilled;
        (0, chai_1.expect)(confirmStub).to.not.have.been.called;
    });
    it("should not prompt if functions decrease in minInstances", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            minInstances: 2,
        };
        const newEndpoint = {
            ...SAMPLE_ENDPOINT,
            minInstances: 1,
        };
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(newEndpoint), backend.of(endpoint))).eventually.be.fulfilled;
        (0, chai_1.expect)(confirmStub).to.not.have.been.called;
    });
    it("should throw if user declines the prompt", async () => {
        const bkend = backend.of({
            ...SAMPLE_ENDPOINT,
            minInstances: 1,
        });
        confirmStub.resolves(false);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, bkend, backend.empty())).to.eventually.be.rejectedWith(error_1.FirebaseError, /Deployment canceled/);
        (0, chai_1.expect)(confirmStub).to.have.been.calledOnce;
    });
    it("should prompt if an existing function sets minInstances", async () => {
        const newEndpoint = {
            ...SAMPLE_ENDPOINT,
            minInstances: 1,
        };
        confirmStub.resolves(true);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(newEndpoint), backend.of(SAMPLE_ENDPOINT))).eventually.be.fulfilled;
        (0, chai_1.expect)(confirmStub).to.have.been.calledOnce;
    });
    it("should prompt if an existing function increases minInstances", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            minInstances: 1,
        };
        const newEndpoint = {
            ...SAMPLE_ENDPOINT,
            minInstances: 2,
        };
        confirmStub.resolves(true);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(newEndpoint), backend.of(endpoint))).eventually.be.fulfilled;
        (0, chai_1.expect)(confirmStub).to.have.been.calledOnce;
    });
    it("should prompt if a minInstance function increases resource reservations", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            minInstances: 2,
            availableMemoryMb: 1024,
        };
        const newEndpoint = {
            ...SAMPLE_ENDPOINT,
            minInstances: 2,
            availableMemoryMb: 2048,
        };
        confirmStub.resolves(true);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(newEndpoint), backend.of(endpoint))).eventually.be.fulfilled;
        (0, chai_1.expect)(confirmStub).to.have.been.calledOnce;
    });
    it("should throw if there are any functions with failure policies and the user doesn't accept the prompt", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            minInstances: 2,
        };
        confirmStub.resolves(false);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(endpoint), backend.empty())).to.eventually.be.rejectedWith(error_1.FirebaseError, /Deployment canceled/);
        (0, chai_1.expect)(confirmStub).to.have.been.calledOnce;
    });
    it("should not prompt if there are no functions with minInstances", async () => {
        confirmStub.resolves();
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(SAMPLE_ENDPOINT), backend.empty())).to.eventually.be.fulfilled;
        (0, chai_1.expect)(confirmStub).not.to.have.been.called;
    });
    it("should throw if there are any functions with minInstances, in noninteractive mode, without the force flag set", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            minInstances: 1,
        };
        const options = { ...SAMPLE_OPTIONS, nonInteractive: true };
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(options, backend.of(endpoint), backend.empty())).to.be.rejectedWith(error_1.FirebaseError, /--force option/);
        (0, chai_1.expect)(confirmStub).not.to.have.been.called;
    });
    it("should not throw if there are any functions with minInstances, in noninteractive mode, with the force flag set", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            minInstances: 1,
        };
        const options = { ...SAMPLE_OPTIONS, nonInteractive: true, force: true };
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(options, backend.of(endpoint), backend.empty())).to.eventually.be.fulfilled;
        (0, chai_1.expect)(confirmStub).not.to.have.been.called;
    });
    it("Should disclaim if a bill cannot be calculated", async () => {
        const endpoint = {
            ...SAMPLE_ENDPOINT,
            region: "fillory",
            minInstances: 1,
        };
        confirmStub.resolves(true);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(endpoint), backend.empty())).to.eventually.be.fulfilled;
        (0, chai_1.expect)(confirmStub).to.have.been.called;
        (0, chai_1.expect)(logStub.firstCall.args[1]).to.match(/Cannot calculate the minimum monthly bill/);
    });
});
describe("promptForUnsafeMigration", () => {
    let confirmStub;
    beforeEach(() => {
        confirmStub = sinon.stub(prompt, "confirm");
    });
    afterEach(() => {
        confirmStub.restore();
    });
    const firestoreEventTrigger = {
        eventType: "google.cloud.firestore.document.v1.written",
        eventFilters: { namespace: "(default)", document: "messages/{id}" },
        retry: false,
    };
    const v2Endpoint0 = {
        platform: "gcfv2",
        id: "0",
        region: "us-central1",
        project: "a",
        entryPoint: "function",
        labels: {},
        environmentVariables: {},
        runtime: "nodejs18",
        eventTrigger: firestoreEventTrigger,
    };
    const v2Endpoint1 = {
        platform: "gcfv2",
        id: "1",
        region: "us-central1",
        project: "a",
        entryPoint: "function",
        labels: {},
        environmentVariables: {},
        runtime: "nodejs18",
        eventTrigger: firestoreEventTrigger,
    };
    it("should prompt if there are potentially unsafe function updates", async () => {
        confirmStub.resolves(false);
        const epUpdates = [
            {
                endpoint: v2Endpoint0,
            },
            {
                endpoint: v2Endpoint1,
                unsafe: true,
            },
        ];
        await functionPrompts.promptForUnsafeMigration(epUpdates, SAMPLE_OPTIONS);
        (0, chai_1.expect)(confirmStub).to.have.been.calledOnce;
    });
    it("should only keep function updates that have been confirmed by user", async () => {
        confirmStub.onFirstCall().resolves(true);
        confirmStub.onSecondCall().resolves(false);
        const epUpdates = [
            {
                endpoint: v2Endpoint0,
                unsafe: true,
            },
            {
                endpoint: v2Endpoint1,
                unsafe: true,
            },
        ];
        await (0, chai_1.expect)(functionPrompts.promptForUnsafeMigration(epUpdates, SAMPLE_OPTIONS)).to.eventually.deep.equal([{ endpoint: v2Endpoint0, unsafe: true }]);
    });
    it("should force unsafe function updates when flag is set", async () => {
        const epUpdates = [
            {
                endpoint: v2Endpoint0,
                unsafe: true,
            },
            {
                endpoint: v2Endpoint1,
                unsafe: true,
            },
        ];
        const options = { ...SAMPLE_OPTIONS, force: true };
        await (0, chai_1.expect)(functionPrompts.promptForUnsafeMigration(epUpdates, options)).to.eventually.equal(epUpdates);
        (0, chai_1.expect)(confirmStub).to.have.not.been.called;
    });
    it("should not proceed with unsafe function updates in non-interactive mode", async () => {
        const epUpdates = [
            {
                endpoint: v2Endpoint0,
                unsafe: true,
            },
            {
                endpoint: v2Endpoint1,
                unsafe: false,
            },
        ];
        const options = { ...SAMPLE_OPTIONS, nonInteractive: true };
        await (0, chai_1.expect)(functionPrompts.promptForUnsafeMigration(epUpdates, options)).to.eventually.deep.equal([{ endpoint: v2Endpoint1, unsafe: false }]);
        (0, chai_1.expect)(confirmStub).to.have.not.been.called;
    });
});
//# sourceMappingURL=prompts.spec.js.map