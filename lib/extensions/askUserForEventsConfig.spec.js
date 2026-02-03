"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const askUserForEventsConfig_1 = require("./askUserForEventsConfig");
const utils = require("../utils");
const prompt = require("../prompt");
describe("checkAllowedEventTypesResponse", () => {
    let logWarningSpy;
    beforeEach(() => {
        logWarningSpy = sinon.spy(utils, "logWarning");
    });
    afterEach(() => {
        logWarningSpy.restore();
    });
    it("should return false if allowed events is not part of extension spec's events list", () => {
        (0, chai_1.expect)((0, askUserForEventsConfig_1.checkAllowedEventTypesResponse)(["google.firebase.nonexistent-event-occurred"], [{ type: "google.firebase.custom-event-occurred", description: "A custom event occurred" }])).to.equal(false);
        (0, chai_1.expect)(logWarningSpy.calledWith("Unexpected event type 'google.firebase.nonexistent-event-occurred' was configured to be emitted. This event type is not part of the extension spec.")).to.equal(true);
    });
    it("should return true if every allowed event exists in extension spec's events list", () => {
        (0, chai_1.expect)((0, askUserForEventsConfig_1.checkAllowedEventTypesResponse)(["google.firebase.custom-event-occurred"], [{ type: "google.firebase.custom-event-occurred", description: "A custom event occurred" }])).to.equal(true);
    });
});
describe("askForAllowedEventTypes", () => {
    let checkboxStub;
    beforeEach(() => {
        checkboxStub = sinon.stub(prompt, "checkbox");
    });
    afterEach(() => {
        checkboxStub.restore();
    });
    it("should keep prompting user until valid input is given", async () => {
        checkboxStub.onCall(0).resolves(["invalid"]);
        checkboxStub.onCall(1).resolves(["stillinvalid"]);
        checkboxStub.onCall(2).resolves(["google.firebase.custom-event-occurred"]);
        await (0, askUserForEventsConfig_1.askForAllowedEventTypes)([
            { type: "google.firebase.custom-event-occurred", description: "A custom event occurred" },
        ]);
        (0, chai_1.expect)(checkboxStub).to.be.calledThrice;
    });
});
describe("askForEventarcLocation", () => {
    let selectStub;
    beforeEach(() => {
        selectStub = sinon.stub(prompt, "select");
    });
    afterEach(() => {
        selectStub.restore();
    });
    it("should keep prompting user until valid input is given", async () => {
        selectStub.onCall(0).returns("invalid-region");
        selectStub.onCall(1).returns("still-invalid-region");
        selectStub.onCall(2).returns("us-central1");
        await (0, askUserForEventsConfig_1.askForEventArcLocation)();
        (0, chai_1.expect)(selectStub).to.be.calledThrice;
    });
});
//# sourceMappingURL=askUserForEventsConfig.spec.js.map