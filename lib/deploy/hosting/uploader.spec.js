"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const fs = require("fs");
const zlib = require("zlib");
const uploader_1 = require("./uploader");
const apiv2_1 = require("../../apiv2");
const hashcache = require("./hashcache");
const stream_1 = require("stream");
describe("deploy/hosting/uploader", () => {
    let clientPostStub;
    let clientRequestStub;
    class MockQueue {
        constructor(options) {
            this.promises = [];
            this.handler = options.handler;
        }
        add(item) {
            const p = Promise.resolve(this.handler(item));
            this.promises.push(p);
        }
        process() {
        }
        async wait() {
            await Promise.all(this.promises);
            return Promise.resolve();
        }
        close() {
        }
        stats() {
            return { total: 0, complete: 0, cursor: 0 };
        }
    }
    beforeEach(() => {
        sinon.stub(fs, "statSync");
        sinon.stub(fs, "createReadStream");
        sinon.stub(zlib, "createGzip");
        clientPostStub = sinon.stub(apiv2_1.Client.prototype, "post");
        clientRequestStub = sinon.stub(apiv2_1.Client.prototype, "request");
        sinon.stub(hashcache, "load").returns(new Map());
        sinon.stub(hashcache, "dump");
    });
    afterEach(() => {
        sinon.restore();
    });
    it("should initialize correctly", () => {
        const uploader = new uploader_1.Uploader({
            version: "v1",
            projectRoot: "root",
            files: ["file1.txt"],
            public: "public",
        });
        (0, chai_1.expect)(uploader).to.be.instanceOf(uploader_1.Uploader);
    });
    it("should hash files and populate version", async () => {
        const uploader = new uploader_1.Uploader({
            version: "v1",
            projectRoot: "root",
            files: ["file1.txt", "file2.txt"],
            public: "public",
        });
        uploader.hashQueue = new MockQueue({
            handler: uploader.hashHandler.bind(uploader),
        });
        uploader.populateQueue = new MockQueue({
            handler: uploader.populateHandler.bind(uploader),
        });
        uploader.uploadQueue = new MockQueue({
            handler: uploader.uploadHandler.bind(uploader),
        });
        fs.statSync.returns({ mtime: new Date(), size: 100 });
        const mockStream1 = new stream_1.Readable({
            read() {
                this.push(Buffer.from("hash1"));
                this.push(null);
            },
        });
        const mockStream2 = new stream_1.Readable({
            read() {
                this.push(Buffer.from("hash2"));
                this.push(null);
            },
        });
        zlib.createGzip.callsFake(() => new stream_1.PassThrough());
        fs.createReadStream.callsFake((filePath) => {
            if (filePath.includes("file1.txt")) {
                return mockStream1;
            }
            if (filePath.includes("file2.txt")) {
                return mockStream2;
            }
            return new stream_1.PassThrough();
        });
        clientPostStub.resolves({
            body: {
                uploadUrl: "https://upload.url",
                uploadRequiredHashes: [
                    "af316ecb91a8ee7ae99210702b2d4758f30cdde3bf61e3d8e787d74681f90a6e",
                    "e7bf382f6e5915b3f88619b866223ebf1d51c4c5321cccde2e9ff700a3259086",
                ],
            },
        });
        clientRequestStub.resolves({ status: 200, response: { text: sinon.stub().resolves("") } });
        await uploader.start();
        (0, chai_1.expect)(clientPostStub.calledWithMatch(/\/v1:populateFiles/)).to.be.true;
        (0, chai_1.expect)(clientPostStub.firstCall.args[1].files).to.have.property("/file1.txt");
        (0, chai_1.expect)(clientPostStub.firstCall.args[1].files).to.have.property("/file2.txt");
        (0, chai_1.expect)(clientRequestStub.calledTwice).to.be.true;
    });
});
//# sourceMappingURL=uploader.spec.js.map