"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const clc = require("colorette");
const secrets = require(".");
const dialogs = require("./dialogs");
const apphosting = require("../../gcp/apphosting");
const utilsImport = require("../../utils");
const promptImport = require("../../prompt");
describe("dialogs", () => {
    const modernA = {
        name: "projects/p/locations/l/backends/modernA",
        serviceAccount: "a",
    };
    const modernA2 = {
        name: "projects/p/locations/l2/backends/modernA2",
        serviceAccount: "a",
    };
    const modernB = {
        name: "projects/p/locations/l/backends/modernB",
        serviceAccount: "b",
    };
    const legacy = {
        name: "projects/p/locations/l/backends/legacy",
    };
    const legacy2 = {
        name: "projects/p/locations/l/backends/legacy2",
    };
    const emptyMulti = {
        buildServiceAccounts: [],
        runServiceAccounts: [],
    };
    describe("toMetadata", () => {
        it("handles explicit account", async () => {
            const metadata = await dialogs.toMetadata("number", [modernA2, modernA]);
            (0, chai_1.expect)(metadata).to.deep.equal([
                { location: "l", id: "modernA", buildServiceAccount: "a", runServiceAccount: "a" },
                { location: "l2", id: "modernA2", buildServiceAccount: "a", runServiceAccount: "a" },
            ]);
        });
        it("handles fallback for legacy SAs", async () => {
            const metadata = await dialogs.toMetadata("number", [modernA, legacy]);
            (0, chai_1.expect)(metadata).to.deep.equal([
                {
                    location: "l",
                    id: "legacy",
                    ...(await secrets.serviceAccountsForBackend("number", legacy)),
                },
                { location: "l", id: "modernA", buildServiceAccount: "a", runServiceAccount: "a" },
            ]);
        });
        it("sorts by location first and id second", async () => {
            const metadata = await dialogs.toMetadata("number", [legacy, modernA, modernA2]);
            (0, chai_1.expect)(metadata).to.deep.equal([
                {
                    location: "l",
                    id: "legacy",
                    ...(await secrets.serviceAccountsForBackend("number", legacy)),
                },
                { location: "l", id: "modernA", buildServiceAccount: "a", runServiceAccount: "a" },
                { location: "l2", id: "modernA2", buildServiceAccount: "a", runServiceAccount: "a" },
            ]);
        });
    });
    it("serviceAccountDisplay", () => {
        (0, chai_1.expect)(dialogs.serviceAccountDisplay({ buildServiceAccount: "build", runServiceAccount: "run" })).to.equal("build, run");
        (0, chai_1.expect)(dialogs.serviceAccountDisplay({ buildServiceAccount: "common", runServiceAccount: "common" })).to.equal("common");
    });
    describe("tableForBackends", () => {
        it("uses 'service account' header if all backends use one service account", async () => {
            const table = dialogs.tableForBackends(await dialogs.toMetadata("number", [modernA, modernB]));
            (0, chai_1.expect)(table[0]).to.deep.equal(["location", "backend", "service account"]);
            (0, chai_1.expect)(table[1]).to.deep.equal([
                ["l", "modernA", "a"],
                ["l", "modernB", "b"],
            ]);
        });
        it("uses 'service accounts' header if any backend uses more than one service account", async () => {
            const table = dialogs.tableForBackends(await dialogs.toMetadata("number", [legacy, modernA]));
            const legacyAccounts = await secrets.serviceAccountsForBackend("number", legacy);
            (0, chai_1.expect)(table[0]).to.deep.equal(["location", "backend", "service accounts"]);
            (0, chai_1.expect)(table[1]).to.deep.equal([
                [
                    "l",
                    "legacy",
                    `${legacyAccounts.buildServiceAccount}, ${legacyAccounts.runServiceAccount}`,
                ],
                ["l", "modernA", "a"],
            ]);
        });
    });
    it("selectFromMetadata", () => {
        const metadata = [
            {
                buildServiceAccount: "build",
                runServiceAccount: "run",
            },
            {
                buildServiceAccount: "common",
                runServiceAccount: "common",
            },
            {
                buildServiceAccount: "omittedBuild",
                runServiceAccount: "omittedRun",
            },
        ];
        (0, chai_1.expect)(dialogs.selectFromMetadata(metadata, ["build", "run", "common"])).to.deep.equal({
            buildServiceAccounts: ["build", "common"],
            runServiceAccounts: ["run"],
        });
    });
    describe("selectBackendServiceAccounts", () => {
        let listBackends;
        let utils;
        let prompt;
        beforeEach(() => {
            listBackends = sinon.stub(apphosting, "listBackends");
            utils = sinon.stub(utilsImport);
            prompt = sinon.stub(promptImport);
        });
        afterEach(() => {
            sinon.verifyAndRestore();
        });
        it("handles no backends", async () => {
            listBackends.resolves({
                backends: [],
                unreachable: [],
            });
            await (0, chai_1.expect)(dialogs.selectBackendServiceAccounts("number", "id", {})).to.eventually.deep.equal(emptyMulti);
            (0, chai_1.expect)(utils.logWarning).to.have.been.calledWith(dialogs.WARN_NO_BACKENDS);
        });
        it("handles unreachable regions", async () => {
            listBackends.resolves({
                backends: [],
                unreachable: ["us-central1"],
            });
            await (0, chai_1.expect)(dialogs.selectBackendServiceAccounts("number", "id", {})).to.eventually.deep.equal(emptyMulti);
            (0, chai_1.expect)(utils.logWarning).to.have.been.calledWith(`Could not reach location(s) us-central1. You may need to run ${clc.bold("firebase apphosting:secrets:grantaccess")} ` +
                "at a later time if you have backends in these locations");
            (0, chai_1.expect)(utils.logWarning).to.have.been.calledWith(dialogs.WARN_NO_BACKENDS);
        });
        it("handles a single backend (opt yes)", async () => {
            listBackends.resolves({
                backends: [modernA],
                unreachable: [],
            });
            prompt.confirm.resolves(true);
            await (0, chai_1.expect)(dialogs.selectBackendServiceAccounts("number", "id", {})).to.eventually.deep.equal({
                buildServiceAccounts: [modernA.serviceAccount],
                runServiceAccounts: [],
            });
            (0, chai_1.expect)(prompt.confirm).to.have.been.calledWith({
                nonInteractive: undefined,
                default: true,
                message: "To use this secret, your backend's service account must be granted access. Would you like to grant access now?",
            });
            (0, chai_1.expect)(utils.logBullet).to.not.have.been.called;
        });
        it("handles a single backend (opt no)", async () => {
            listBackends.resolves({
                backends: [modernA],
                unreachable: [],
            });
            prompt.confirm.resolves(false);
            await (0, chai_1.expect)(dialogs.selectBackendServiceAccounts("number", "id", {})).to.eventually.deep.equal(emptyMulti);
            (0, chai_1.expect)(prompt.confirm).to.have.been.calledWith({
                nonInteractive: undefined,
                default: true,
                message: "To use this secret, your backend's service account must be granted access. Would you like to grant access now?",
            });
            (0, chai_1.expect)(utils.logBullet).to.have.been.calledWith(dialogs.GRANT_ACCESS_IN_FUTURE);
        });
        it("handles multiple backends with the same (multiple) SAs (opt yes)", async () => {
            listBackends.resolves({
                backends: [legacy, legacy2],
                unreachable: [],
            });
            prompt.confirm.resolves(true);
            const accounts = await secrets.serviceAccountsForBackend("number", legacy);
            await (0, chai_1.expect)(dialogs.selectBackendServiceAccounts("number", "id", {})).to.eventually.deep.equal(secrets.toMulti(accounts));
            (0, chai_1.expect)(utils.logBullet.getCall(0).args[0]).to.eq("To use this secret, your backend's service account must be granted access.");
            (0, chai_1.expect)(utils.logBullet.getCall(1).args[0]).to.eq(`All of your backends share the following service accounts: ${dialogs.serviceAccountDisplay(accounts)}.` +
                "\nGranting access to one backend will grant access to all backends.");
            (0, chai_1.expect)(prompt.confirm).to.have.been.calledWith({
                nonInteractive: undefined,
                default: true,
                message: "Would you like to grant access to all backends now?",
            });
            (0, chai_1.expect)(utils.logBullet).to.have.been.calledTwice;
        });
        it("handles multiple backends with the same (multiple) SAs (opt no)", async () => {
            listBackends.resolves({
                backends: [legacy, legacy2],
                unreachable: [],
            });
            prompt.confirm.resolves(false);
            const legacyAccounts = await secrets.serviceAccountsForBackend("number", legacy);
            await (0, chai_1.expect)(dialogs.selectBackendServiceAccounts("number", "id", {})).to.eventually.deep.equal(emptyMulti);
            (0, chai_1.expect)(utils.logBullet.getCall(0).args[0]).to.eq("To use this secret, your backend's service account must be granted access.");
            (0, chai_1.expect)(utils.logBullet.getCall(1).args[0]).to.eq(`All of your backends share the following service accounts: ${dialogs.serviceAccountDisplay(legacyAccounts)}.` +
                "\nGranting access to one backend will grant access to all backends.");
            (0, chai_1.expect)(prompt.confirm).to.have.been.calledWith({
                nonInteractive: undefined,
                default: true,
                message: "Would you like to grant access to all backends now?",
            });
            (0, chai_1.expect)(utils.logBullet).to.have.been.calledWith(dialogs.GRANT_ACCESS_IN_FUTURE);
        });
        it("handles multiple backends with the same (single) SA (opt yes)", async () => {
            listBackends.resolves({
                backends: [modernA, modernA2],
                unreachable: [],
            });
            prompt.confirm.resolves(true);
            await (0, chai_1.expect)(dialogs.selectBackendServiceAccounts("number", "id", {})).to.eventually.deep.equal({
                buildServiceAccounts: [modernA.serviceAccount],
                runServiceAccounts: [],
            });
            (0, chai_1.expect)(utils.logBullet.getCall(0).args[0]).to.eq("To use this secret, your backend's service account must be granted access.");
            (0, chai_1.expect)(utils.logBullet.getCall(1).args[0]).to.eq(`All of your backends share the following service account: a.` +
                "\nGranting access to one backend will grant access to all backends.");
            (0, chai_1.expect)(prompt.confirm).to.have.been.calledWith({
                nonInteractive: undefined,
                default: true,
                message: "Would you like to grant access to all backends now?",
            });
            (0, chai_1.expect)(utils.logBullet).to.have.been.calledTwice;
        });
        it("handles multiple backends with the same (single) SA (opt no)", async () => {
            listBackends.resolves({
                backends: [modernA, modernA2],
                unreachable: [],
            });
            prompt.confirm.resolves(false);
            await (0, chai_1.expect)(dialogs.selectBackendServiceAccounts("number", "id", {})).to.eventually.deep.equal(emptyMulti);
            (0, chai_1.expect)(utils.logBullet.getCall(0).args[0]).to.eq("To use this secret, your backend's service account must be granted access.");
            (0, chai_1.expect)(utils.logBullet.getCall(1).args[0]).to.eq(`All of your backends share the following service account: a.` +
                "\nGranting access to one backend will grant access to all backends.");
            (0, chai_1.expect)(prompt.confirm).to.have.been.calledWith({
                nonInteractive: undefined,
                default: true,
                message: "Would you like to grant access to all backends now?",
            });
            (0, chai_1.expect)(utils.logBullet).to.have.been.calledWith(dialogs.GRANT_ACCESS_IN_FUTURE);
        });
        it("handles multiple backends with different SAs (select some)", async () => {
            listBackends.resolves({
                backends: [modernA, modernA2, modernB, legacy, legacy2],
                unreachable: [],
            });
            prompt.checkbox.resolves(["a", "b"]);
            const legacyAccounts = await secrets.serviceAccountsForBackend("number", legacy);
            await (0, chai_1.expect)(dialogs.selectBackendServiceAccounts("number", "id", {})).to.eventually.deep.equal({ buildServiceAccounts: ["a", "b"], runServiceAccounts: [] });
            (0, chai_1.expect)(prompt.checkbox).to.have.been.calledWith({
                message: "Which service accounts would you like to grant access? Press Space to select accounts, then Enter to confirm your choices.",
                choices: [
                    "a",
                    "b",
                    legacyAccounts.buildServiceAccount,
                    legacyAccounts.runServiceAccount,
                ].sort(),
            });
            (0, chai_1.expect)(utils.logBullet).to.have.been.calledWith("To use this secret, your backend's service account must be granted access. Your backends use the following service accounts:");
            (0, chai_1.expect)(utils.logBullet).to.not.have.been.calledWith(dialogs.GRANT_ACCESS_IN_FUTURE);
        });
        it("handles multiple backends with different SAs (select none)", async () => {
            listBackends.resolves({
                backends: [modernA, modernA2, modernB, legacy, legacy2],
                unreachable: [],
            });
            prompt.checkbox.resolves([]);
            const legacyAccounts = await secrets.serviceAccountsForBackend("number", legacy);
            await (0, chai_1.expect)(dialogs.selectBackendServiceAccounts("number", "id", {})).to.eventually.deep.equal(emptyMulti);
            (0, chai_1.expect)(prompt.checkbox).to.have.been.calledWith({
                message: "Which service accounts would you like to grant access? Press Space to select accounts, then Enter to confirm your choices.",
                choices: [
                    "a",
                    "b",
                    legacyAccounts.buildServiceAccount,
                    legacyAccounts.runServiceAccount,
                ].sort(),
            });
            (0, chai_1.expect)(utils.logBullet).to.have.been.calledWith("To use this secret, your backend's service account must be granted access. Your backends use the following service accounts:");
            (0, chai_1.expect)(utils.logBullet).to.have.been.calledWith(dialogs.GRANT_ACCESS_IN_FUTURE);
        });
    });
    describe("envVarForSecret", () => {
        let prompt;
        let utils;
        beforeEach(() => {
            prompt = sinon.stub(promptImport);
            utils = sinon.stub(utilsImport);
        });
        afterEach(() => {
            sinon.verifyAndRestore();
        });
        it("accepts a valid env var", async () => {
            await (0, chai_1.expect)(dialogs.envVarForSecret("VALID_KEY")).to.eventually.equal("VALID_KEY");
            (0, chai_1.expect)(prompt.input).to.not.have.been.called;
        });
        it("suggests a valid upper case name", async () => {
            prompt.input.resolves("SECRET_VALUE");
            await (0, chai_1.expect)(dialogs.envVarForSecret("secret-value")).to.eventually.equal("SECRET_VALUE");
            (0, chai_1.expect)(prompt.input).to.have.been.calledWithMatch({
                message: "What environment variable name would you like to use?",
                default: "SECRET_VALUE",
            });
        });
        it("prevents invalid keys", async () => {
            prompt.input.onFirstCall().resolves("secret-value");
            prompt.input.onSecondCall().resolves("SECRET_VALUE");
            await (0, chai_1.expect)(dialogs.envVarForSecret("secret-value")).to.eventually.equal("SECRET_VALUE");
            (0, chai_1.expect)(prompt.input).to.have.been.calledWithMatch({
                message: "What environment variable name would you like to use?",
                default: "SECRET_VALUE",
            });
            (0, chai_1.expect)(prompt.input).to.have.been.calledTwice;
            (0, chai_1.expect)(utils.logLabeledError).to.have.been.calledWith("apphosting", "Key secret-value must start with an uppercase ASCII letter or underscore, and then consist of uppercase ASCII letters, digits, and underscores.");
        });
        it("prevents reserved keys", async () => {
            prompt.input.onFirstCall().resolves("PORT");
            prompt.input.onSecondCall().resolves("SECRET_VALUE");
            await (0, chai_1.expect)(dialogs.envVarForSecret("secret-value")).to.eventually.equal("SECRET_VALUE");
            (0, chai_1.expect)(prompt.input).to.have.been.calledWithMatch({
                message: "What environment variable name would you like to use?",
                default: "SECRET_VALUE",
            });
            (0, chai_1.expect)(prompt.input).to.have.been.calledTwice;
            (0, chai_1.expect)(utils.logLabeledError).to.have.been.calledWith("apphosting", "Key PORT is reserved for internal use.");
        });
        it("prevents reserved prefixes", async () => {
            prompt.input.onFirstCall().resolves("X_GOOGLE_SECRET");
            prompt.input.onSecondCall().resolves("SECRET_VALUE");
            await (0, chai_1.expect)(dialogs.envVarForSecret("secret-value")).to.eventually.equal("SECRET_VALUE");
            (0, chai_1.expect)(prompt.input).to.have.been.calledWithMatch({
                message: "What environment variable name would you like to use?",
                default: "SECRET_VALUE",
            });
            (0, chai_1.expect)(prompt.input).to.have.been.calledTwice;
            (0, chai_1.expect)(utils.logLabeledError).to.have.been.calledWithMatch("apphosting", /Key X_GOOGLE_SECRET starts with a reserved prefix/);
        });
        it("can trim test prefixes", async () => {
            prompt.input.resolves("SECRET");
            await (0, chai_1.expect)(dialogs.envVarForSecret("test-secret", true)).to.eventually.equal("SECRET");
            (0, chai_1.expect)(prompt.input).to.have.been.calledWithMatch({
                message: "What environment variable name would you like to use?",
                default: "SECRET",
            });
        });
    });
});
//# sourceMappingURL=dialogs.spec.js.map