"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const get_environment_1 = require("./get_environment");
const projectUtils = require("../../../projectUtils");
const configstore_1 = require("../../../configstore");
const appUtils = require("../../../appUtils");
const auth = require("../../../auth");
const rc_1 = require("../../../rc");
const config_1 = require("../../../config");
const __1 = require("../..");
describe("get_environment tool", () => {
    let sandbox;
    let getAliasesStub;
    let configstoreGetStub;
    let detectAppsStub;
    let getAllAccountsStub;
    let server;
    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        getAliasesStub = sandbox.stub(projectUtils, "getAliases");
        configstoreGetStub = sandbox.stub(configstore_1.configstore, "get");
        detectAppsStub = sandbox.stub(appUtils, "detectApps");
        getAllAccountsStub = sandbox.stub(auth, "getAllAccounts");
        server = new __1.FirebaseMcpServer({ projectRoot: "/test-dir" });
        server.cachedProjectDir = "/test-dir";
    });
    afterEach(() => {
        sandbox.restore();
    });
    const mockToolOptions = (projectId, accountEmail, projectFileExists = false, rcProjects = {}, firebaseJsonContent = "") => {
        const rc = new rc_1.RC(undefined, { projects: rcProjects });
        const config = new config_1.Config({}, { cwd: "/test-dir" });
        sandbox.stub(config, "projectFileExists").returns(projectFileExists);
        sandbox.stub(config, "path").returns("/test-dir/firebase.json");
        sandbox.stub(config, "readProjectFile").returns(firebaseJsonContent);
        return {
            projectId: projectId || "",
            host: server,
            accountEmail: accountEmail ? accountEmail : null,
            rc,
            config,
            firebaseCliCommand: "firebase",
            isBillingEnabled: false,
        };
    };
    it("should show minimal environment", async () => {
        getAliasesStub.returns([]);
        configstoreGetStub.withArgs("gemini").returns(false);
        detectAppsStub.resolves([]);
        getAllAccountsStub.returns([]);
        const options = mockToolOptions(undefined);
        const result = await get_environment_1.get_environment.fn({}, options);
        const expectedOutput = `# Environment Information

Project Directory: /test-dir
Project Config Path: <NO CONFIG PRESENT>
Active Project ID: <NONE>
Gemini in Firebase Terms of Service: <NOT ACCEPTED>
Billing Enabled: N/A
Authenticated User: <NONE>
Detected App IDs: <NONE>
Available Project Aliases (format: '[alias]: [projectId]'): <NONE>

No firebase.json file was found.

If this project does not use Firebase services that require a firebase.json file, no action is necessary.

If this project uses Firebase services that require a firebase.json file, the user will most likely want to:

a) Change the project directory using the 'firebase_update_environment' tool to select a directory with a 'firebase.json' file in it, or
b) Initialize a new Firebase project directory using the 'firebase_init' tool.

Confirm with the user before taking action.`;
        (0, chai_1.expect)(result.content[0].text).to.equal(expectedOutput);
    });
    it("should show full environment", async () => {
        getAliasesStub.returns(["my-alias"]);
        configstoreGetStub.withArgs("gemini").returns(true);
        detectAppsStub.resolves([
            { platform: "WEB", directory: "web", appId: "web-app-id" },
            {
                platform: "ANDROID",
                directory: "android",
                appId: "android-app-id",
                bundleId: "com.foo.bar",
            },
        ]);
        getAllAccountsStub.returns([
            { user: { email: "test@example.com" } },
            { user: { email: "another@example.com" } },
        ]);
        const options = mockToolOptions("test-project", "test@example.com", true, { "my-alias": "test-project", "other-alias": "other-project" }, '{ "hosting": { "public": "public" } }');
        const result = await get_environment_1.get_environment.fn({}, options);
        const expectedOutput = `# Environment Information

Project Directory: /test-dir
Project Config Path: /test-dir/firebase.json
Active Project ID: test-project (alias: my-alias)
Gemini in Firebase Terms of Service: Accepted
Billing Enabled: No
Authenticated User: test@example.com
Detected App IDs: 

web-app-id: <UNKNOWN BUNDLE ID>
android-app-id: com.foo.bar

Available Project Aliases (format: '[alias]: [projectId]'): 

my-alias: test-project
other-alias: other-project

Available Accounts: 

- test@example.com
- another@example.com

firebase.json contents:

\`\`\`json
{ "hosting": { "public": "public" } }
\`\`\``;
        (0, chai_1.expect)(result.content[0].text).to.equal(expectedOutput);
    });
    it("should handle a single alias", async () => {
        getAliasesStub.returns(["my-alias"]);
        detectAppsStub.resolves([]);
        getAllAccountsStub.returns([]);
        const options = mockToolOptions("test-project", "test@example.com", false, {
            "my-alias": "test-project",
        });
        const result = await get_environment_1.get_environment.fn({}, options);
        (0, chai_1.expect)(result.content[0].text).to.include("Active Project ID: test-project (alias: my-alias)");
        (0, chai_1.expect)(result.content[0].text).to.include(`Available Project Aliases (format: '[alias]: [projectId]'): 

my-alias: test-project

`);
    });
    it("should handle multiple aliases", async () => {
        getAliasesStub.returns(["alias1", "alias2"]);
        detectAppsStub.resolves([]);
        getAllAccountsStub.returns([]);
        const options = mockToolOptions("test-project", "test@example.com", false, {
            alias1: "test-project",
            alias2: "test-project",
        });
        const result = await get_environment_1.get_environment.fn({}, options);
        (0, chai_1.expect)(result.content[0].text).to.include("Active Project ID: test-project (alias: alias1,alias2)");
        (0, chai_1.expect)(result.content[0].text).to.include(`Available Project Aliases (format: '[alias]: [projectId]'): 

alias1: test-project
alias2: test-project

`);
    });
    it("should handle multiple accounts", async () => {
        getAliasesStub.returns([]);
        detectAppsStub.resolves([]);
        getAllAccountsStub.returns([
            { user: { email: "test@example.com" } },
            { user: { email: "another@example.com" } },
        ]);
        const options = mockToolOptions("test-project", "test@example.com");
        const result = await get_environment_1.get_environment.fn({}, options);
        (0, chai_1.expect)(result.content[0].text).to.include("Authenticated User: test@example.com");
        (0, chai_1.expect)(result.content[0].text).to.include(`Available Accounts: 

- test@example.com
- another@example.com

`);
    });
    it("should handle a single detected app", async () => {
        getAliasesStub.returns([]);
        detectAppsStub.resolves([{ platform: "WEB", directory: "web", appId: "web-app-id" }]);
        getAllAccountsStub.returns([]);
        const options = mockToolOptions();
        const result = await get_environment_1.get_environment.fn({}, options);
        (0, chai_1.expect)(result.content[0].text).to.include(`Detected App IDs: 

web-app-id: <UNKNOWN BUNDLE ID>

`);
    });
    it("should handle multiple detected apps with bundleId", async () => {
        getAliasesStub.returns([]);
        detectAppsStub.resolves([
            { platform: "WEB", directory: "web", appId: "web-app-id" },
            {
                platform: "ANDROID",
                directory: "android",
                appId: "android-app-id",
                bundleId: "com.foo.bar",
            },
        ]);
        getAllAccountsStub.returns([]);
        const options = mockToolOptions();
        const result = await get_environment_1.get_environment.fn({}, options);
        (0, chai_1.expect)(result.content[0].text).to.include(`Detected App IDs: 

web-app-id: <UNKNOWN BUNDLE ID>
android-app-id: com.foo.bar

`);
    });
    it("should show Gemini ToS not accepted", async () => {
        getAliasesStub.returns([]);
        configstoreGetStub.withArgs("gemini").returns(false);
        detectAppsStub.resolves([]);
        getAllAccountsStub.returns([]);
        const options = mockToolOptions();
        const result = await get_environment_1.get_environment.fn({}, options);
        (0, chai_1.expect)(result.content[0].text).to.include("Gemini in Firebase Terms of Service: <NOT ACCEPTED>");
    });
});
//# sourceMappingURL=get_environment.spec.js.map