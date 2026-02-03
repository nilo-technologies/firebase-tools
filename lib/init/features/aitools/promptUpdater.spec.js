"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const fs = require("fs");
const prompt = require("../../../prompt");
const promptUpdater_1 = require("./promptUpdater");
describe("promptUpdater", () => {
    let sandbox;
    let mockConfig;
    let readFileSyncStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockConfig = {
            projectDir: "/test/project",
            readProjectFile: sandbox.stub(),
            writeProjectFile: sandbox.stub(),
        };
        readFileSyncStub = sandbox.stub(fs, "readFileSync");
        readFileSyncStub.withArgs(sinon.match(/FIREBASE\.md$/)).returns(`# Firebase CLI Context

Base Firebase content`);
        readFileSyncStub.withArgs(sinon.match(/FIREBASE_FUNCTIONS\.md$/)).returns(`# Firebase Functions

Functions specific content`);
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe("generatePromptSection", () => {
        it("should generate content with base features only", () => {
            const result = (0, promptUpdater_1.generatePromptSection)([]);
            (0, chai_1.expect)(result.content).to.include("<firebase_prompts hash=");
            (0, chai_1.expect)(result.content).to.include("# Firebase CLI Context");
            (0, chai_1.expect)(result.content).to.include("Base Firebase content");
            (0, chai_1.expect)(result.content).to.not.include("Functions specific content");
            (0, chai_1.expect)(result.hash).to.have.lengthOf(8);
        });
        it("should include functions content when enabled", () => {
            const result = (0, promptUpdater_1.generatePromptSection)(["functions"]);
            (0, chai_1.expect)(result.content).to.include("<firebase_prompts hash=");
            (0, chai_1.expect)(result.content).to.include("# Firebase CLI Context");
            (0, chai_1.expect)(result.content).to.include("Base Firebase content");
            (0, chai_1.expect)(result.content).to.include("# Firebase Functions");
            (0, chai_1.expect)(result.content).to.include("Functions specific content");
        });
        it("should generate consistent hash for same content", () => {
            const result1 = (0, promptUpdater_1.generatePromptSection)(["functions"]);
            const result2 = (0, promptUpdater_1.generatePromptSection)(["functions"]);
            (0, chai_1.expect)(result1.hash).to.equal(result2.hash);
        });
        it("should generate different hash for different content", () => {
            const result1 = (0, promptUpdater_1.generatePromptSection)([]);
            const result2 = (0, promptUpdater_1.generatePromptSection)(["functions"]);
            (0, chai_1.expect)(result1.hash).to.not.equal(result2.hash);
        });
        it("should include raw prompt content without modification", () => {
            const result = (0, promptUpdater_1.generatePromptSection)([]);
            (0, chai_1.expect)(result.content).to.include("# Firebase CLI Context");
            (0, chai_1.expect)(result.content).to.include("Base Firebase content");
        });
        it("should generate wrapper with custom content but hash from actual prompts", () => {
            const customContent = "Custom import statements";
            const result = (0, promptUpdater_1.generatePromptSection)(["functions"], { customContent });
            (0, chai_1.expect)(result.content).to.include(customContent);
            (0, chai_1.expect)(result.content).to.include("<firebase_prompts hash=");
            (0, chai_1.expect)(result.content).to.not.include("Base Firebase content");
            (0, chai_1.expect)(result.content).to.not.include("Functions specific content");
            const normalResult = (0, promptUpdater_1.generatePromptSection)(["functions"]);
            (0, chai_1.expect)(result.hash).to.equal(normalResult.hash);
        });
        it("should generate same hash regardless of custom content", () => {
            const result1 = (0, promptUpdater_1.generatePromptSection)(["functions"], { customContent: "Content 1" });
            const result2 = (0, promptUpdater_1.generatePromptSection)(["functions"], { customContent: "Content 2" });
            (0, chai_1.expect)(result1.hash).to.equal(result2.hash);
        });
    });
    describe("updateFirebaseSection", () => {
        let sandbox;
        let confirmStub;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            confirmStub = sandbox.stub(prompt, "confirm").resolves(false);
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should create new file when none exists", async () => {
            mockConfig.readProjectFile.throws(new Error("File not found"));
            const result = await (0, promptUpdater_1.updateFirebaseSection)(mockConfig, "test.md", []);
            (0, chai_1.expect)(result.updated).to.be.true;
            (0, chai_1.expect)(mockConfig.writeProjectFile.calledOnce).to.be.true;
            const writtenContent = mockConfig.writeProjectFile.firstCall.args[1];
            (0, chai_1.expect)(writtenContent).to.include("<firebase_prompts hash=");
            (0, chai_1.expect)(writtenContent).to.include("Base Firebase content");
        });
        it("should add header when creating new file with header option", async () => {
            mockConfig.readProjectFile.throws(new Error("File not found"));
            const result = await (0, promptUpdater_1.updateFirebaseSection)(mockConfig, "test.md", [], {
                header: "# Custom Header",
            });
            (0, chai_1.expect)(result.updated).to.be.true;
            const writtenContent = mockConfig.writeProjectFile.firstCall.args[1];
            (0, chai_1.expect)(writtenContent.startsWith("# Custom Header\n\n<firebase_prompts")).to.be.true;
        });
        it("should not update when content hash matches", async () => {
            const { content } = (0, promptUpdater_1.generatePromptSection)([]);
            mockConfig.readProjectFile.returns(content);
            const result = await (0, promptUpdater_1.updateFirebaseSection)(mockConfig, "test.md", []);
            (0, chai_1.expect)(result.updated).to.be.false;
            (0, chai_1.expect)(mockConfig.writeProjectFile.called).to.be.false;
        });
        it("should update when content hash differs", async () => {
            const existingContent = `<firebase_prompts hash="oldhash123">
Old content
</firebase_prompts>`;
            mockConfig.readProjectFile.returns(existingContent);
            const result = await (0, promptUpdater_1.updateFirebaseSection)(mockConfig, "test.md", ["functions"]);
            (0, chai_1.expect)(result.updated).to.be.true;
            (0, chai_1.expect)(mockConfig.writeProjectFile.calledOnce).to.be.true;
            const writtenContent = mockConfig.writeProjectFile.firstCall.args[1];
            (0, chai_1.expect)(writtenContent).to.include("Functions specific content");
            (0, chai_1.expect)(writtenContent).to.not.include("Old content");
        });
        it("should append to existing file without firebase section", async () => {
            const existingContent = "# User's existing content\n\nSome text";
            mockConfig.readProjectFile.returns(existingContent);
            const result = await (0, promptUpdater_1.updateFirebaseSection)(mockConfig, "test.md", []);
            (0, chai_1.expect)(result.updated).to.be.true;
            const writtenContent = mockConfig.writeProjectFile.firstCall.args[1];
            (0, chai_1.expect)(writtenContent.startsWith("# User's existing content")).to.be.true;
            (0, chai_1.expect)(writtenContent).to.include("<firebase_prompts hash=");
        });
        it("should preserve user content when updating", async () => {
            const existingContent = `# User header
Some user content

<firebase_prompts hash="oldhash">
Old Firebase content
</firebase_prompts>

More user content`;
            mockConfig.readProjectFile.returns(existingContent);
            const result = await (0, promptUpdater_1.updateFirebaseSection)(mockConfig, "test.md", []);
            (0, chai_1.expect)(result.updated).to.be.true;
            const writtenContent = mockConfig.writeProjectFile.firstCall.args[1];
            (0, chai_1.expect)(writtenContent).to.include("# User header");
            (0, chai_1.expect)(writtenContent).to.include("Some user content");
            (0, chai_1.expect)(writtenContent).to.include("More user content");
            (0, chai_1.expect)(writtenContent).to.include("Base Firebase content");
            (0, chai_1.expect)(writtenContent).to.not.include("Old Firebase content");
        });
        it("should skip update when interactive and user declines", async () => {
            const existingContent = `<firebase_prompts hash="oldhash">Old</firebase_prompts>`;
            mockConfig.readProjectFile.returns(existingContent);
            const result = await (0, promptUpdater_1.updateFirebaseSection)(mockConfig, "test.md", [], {
                interactive: true,
            });
            (0, chai_1.expect)(result.updated).to.be.false;
            (0, chai_1.expect)(mockConfig.writeProjectFile.called).to.be.false;
            (0, chai_1.expect)(confirmStub).to.have.been.calledOnce;
        });
    });
    describe("replaceFirebaseFile", () => {
        it("should create new file when none exists", async () => {
            mockConfig.readProjectFile.throws(new Error("File not found"));
            const result = await (0, promptUpdater_1.replaceFirebaseFile)(mockConfig, "test.md", "New content");
            (0, chai_1.expect)(result.updated).to.be.true;
            (0, chai_1.expect)(mockConfig.writeProjectFile.calledWith("test.md", "New content"))
                .to.be.true;
        });
        it("should not update when content is identical", async () => {
            mockConfig.readProjectFile.returns("Existing content");
            const result = await (0, promptUpdater_1.replaceFirebaseFile)(mockConfig, "test.md", "Existing content");
            (0, chai_1.expect)(result.updated).to.be.false;
            (0, chai_1.expect)(mockConfig.writeProjectFile.called).to.be.false;
        });
        it("should update when content differs", async () => {
            mockConfig.readProjectFile.returns("Old content");
            const result = await (0, promptUpdater_1.replaceFirebaseFile)(mockConfig, "test.md", "New content");
            (0, chai_1.expect)(result.updated).to.be.true;
            (0, chai_1.expect)(mockConfig.writeProjectFile.calledWith("test.md", "New content"))
                .to.be.true;
        });
    });
    describe("generateFeaturePromptSection", () => {
        it("should generate wrapped content for base feature", () => {
            const content = (0, promptUpdater_1.generateFeaturePromptSection)("base");
            (0, chai_1.expect)(content).to.include("<firebase_base_prompts hash=");
            (0, chai_1.expect)(content).to.include("<!-- Firebase Base Context - Auto-generated, do not edit -->");
            (0, chai_1.expect)(content).to.include("# Firebase CLI Context");
            (0, chai_1.expect)(content).to.include("Base Firebase content");
        });
        it("should generate wrapped content for functions feature", () => {
            const content = (0, promptUpdater_1.generateFeaturePromptSection)("functions");
            (0, chai_1.expect)(content).to.include("<firebase_functions_prompts hash=");
            (0, chai_1.expect)(content).to.include("<!-- Firebase Functions Context - Auto-generated, do not edit -->");
            (0, chai_1.expect)(content).to.include("# Firebase Functions");
            (0, chai_1.expect)(content).to.include("Functions specific content");
        });
        it("should return empty string for unknown feature", () => {
            const content = (0, promptUpdater_1.generateFeaturePromptSection)("unknown");
            (0, chai_1.expect)(content).to.equal("");
        });
    });
    describe("getFeatureContent", () => {
        it("should return raw content for base feature", () => {
            const content = (0, promptUpdater_1.getFeatureContent)("base");
            (0, chai_1.expect)(content).to.equal("# Firebase CLI Context\n\nBase Firebase content");
        });
        it("should return raw content for functions feature", () => {
            const content = (0, promptUpdater_1.getFeatureContent)("functions");
            (0, chai_1.expect)(content).to.equal("# Firebase Functions\n\nFunctions specific content");
        });
        it("should return empty string for unknown feature", () => {
            const content = (0, promptUpdater_1.getFeatureContent)("unknown");
            (0, chai_1.expect)(content).to.equal("");
        });
    });
    describe("hash calculation", () => {
        it("should generate 8-character hash", () => {
            const { hash } = (0, promptUpdater_1.generatePromptSection)([]);
            (0, chai_1.expect)(hash).to.have.lengthOf(8);
            (0, chai_1.expect)(hash).to.match(/^[a-f0-9]{8}$/);
        });
        it("should be deterministic", () => {
            const hash1 = (0, promptUpdater_1.generatePromptSection)([]).hash;
            const hash2 = (0, promptUpdater_1.generatePromptSection)([]).hash;
            (0, chai_1.expect)(hash1).to.equal(hash2);
        });
    });
    describe("regex matching", () => {
        it("should match firebase_prompts section with hash", async () => {
            const content = `Before
<firebase_prompts hash="abc123">
Content
</firebase_prompts>
After`;
            mockConfig.readProjectFile.returns(content);
            await (0, promptUpdater_1.updateFirebaseSection)(mockConfig, "test.md", ["functions"]);
            const writtenContent = mockConfig.writeProjectFile.firstCall.args[1];
            (0, chai_1.expect)(writtenContent).to.include("Before");
            (0, chai_1.expect)(writtenContent).to.include("After");
            (0, chai_1.expect)(writtenContent).to.match(/<firebase_prompts hash="[^"]+">[\s\S]*<\/firebase_prompts>/);
        });
        it("should replace section with missing hash attribute", async () => {
            const content = `User content before\n<firebase_prompts>\nOld content without hash\n</firebase_prompts>\nUser content after`;
            mockConfig.readProjectFile.returns(content);
            const result = await (0, promptUpdater_1.updateFirebaseSection)(mockConfig, "test.md", []);
            (0, chai_1.expect)(result.updated).to.be.true;
            const writtenContent = mockConfig.writeProjectFile.firstCall.args[1];
            (0, chai_1.expect)(writtenContent).to.include("User content before");
            (0, chai_1.expect)(writtenContent).to.include("User content after");
            (0, chai_1.expect)(writtenContent).to.include("<firebase_prompts hash=");
            (0, chai_1.expect)(writtenContent).to.include("Base Firebase content");
            (0, chai_1.expect)(writtenContent).to.not.include("Old content without hash");
        });
    });
});
//# sourceMappingURL=promptUpdater.spec.js.map