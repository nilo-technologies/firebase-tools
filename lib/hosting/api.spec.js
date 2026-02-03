"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const api_1 = require("../api");
const error_1 = require("../error");
const hostingApi = require("./api");
const TEST_CHANNELS_RESPONSE = {
    channels: [
        { url: "https://my-site--ch1-4iyrl1uo.web.app" },
        { url: "https://my-site--ch2-ygd8582v.web.app" },
    ],
};
const TEST_GET_DOMAINS_RESPONSE = {
    authorizedDomains: [
        "localhost",
        "randomurl.com",
        "my-site--ch1-4iyrl1uo.web.app",
        "my-site--expiredchannel-difhyc76.web.app",
    ],
};
const EXPECTED_DOMAINS_RESPONSE = ["localhost", "randomurl.com", "my-site--ch1-4iyrl1uo.web.app"];
const PROJECT_ID = "test-project";
const SITE = "my-site";
const SITE_DOMAINS_API = `/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/domains`;
const GET_SITE_DOMAINS_BODY = EXPECTED_DOMAINS_RESPONSE.map((domain) => ({
    site: `projects/${PROJECT_ID}/sites/${SITE}`,
    domainName: domain,
    updateTime: "2023-01-11T15:28:08.980038900Z",
    provisioning: [
        {
            certStatus: "CERT_ACTIVE",
            dnsStatus: "DNS_MATCH",
            expectedIps: ["0.0.0.0"],
        },
    ],
    status: "DOMAIN_ACTIVE",
}));
describe("hosting", () => {
    describe("getChannel", () => {
        afterEach(nock.cleanAll);
        it("should make the API request for a channel", async () => {
            const CHANNEL_ID = "my-channel";
            const CHANNEL = { name: "my-channel" };
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`)
                .reply(200, CHANNEL);
            const res = await hostingApi.getChannel(PROJECT_ID, SITE, CHANNEL_ID);
            (0, chai_1.expect)(res).to.deep.equal({ name: "my-channel" });
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should return null if there's no channel", async () => {
            const CHANNEL_ID = "my-channel";
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`)
                .reply(404, {});
            const res = await hostingApi.getChannel(PROJECT_ID, SITE, CHANNEL_ID);
            (0, chai_1.expect)(res).to.deep.equal(null);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const CHANNEL_ID = "my-channel";
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`)
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.getChannel(PROJECT_ID, SITE, CHANNEL_ID)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("listChannels", () => {
        afterEach(nock.cleanAll);
        it("should make a single API requests to list a small number of channels", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(200, { channels: [{ name: "channel01" }] });
            const res = await hostingApi.listChannels(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.deep.equal([{ name: "channel01" }]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should return 0 channels if none are returned", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(200, {});
            const res = await hostingApi.listChannels(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.deep.equal([]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should make multiple API requests to list channels", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(200, { channels: [{ name: "channel01" }], nextPageToken: "02" });
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`)
                .query({ pageToken: "02", pageSize: 10 })
                .reply(200, { channels: [{ name: "channel02" }] });
            const res = await hostingApi.listChannels(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.deep.equal([{ name: "channel01" }, { name: "channel02" }]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should return an error if there's no channel", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(404, {});
            await (0, chai_1.expect)(hostingApi.listChannels(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /could not find channels/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.listChannels(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("createChannel", () => {
        afterEach(nock.cleanAll);
        it("should make the API request to create a channel", async () => {
            const CHANNEL_ID = "my-channel";
            const CHANNEL = { name: "my-channel" };
            nock((0, api_1.hostingApiOrigin)())
                .post(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`, { ttl: "604800s" })
                .query({ channelId: CHANNEL_ID })
                .reply(201, CHANNEL);
            const res = await hostingApi.createChannel(PROJECT_ID, SITE, CHANNEL_ID);
            (0, chai_1.expect)(res).to.deep.equal(CHANNEL);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should let us customize the TTL", async () => {
            const CHANNEL_ID = "my-channel";
            const CHANNEL = { name: "my-channel" };
            const TTL = "60s";
            nock((0, api_1.hostingApiOrigin)())
                .post(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`, { ttl: TTL })
                .query({ channelId: CHANNEL_ID })
                .reply(201, CHANNEL);
            const res = await hostingApi.createChannel(PROJECT_ID, SITE, CHANNEL_ID, 60000);
            (0, chai_1.expect)(res).to.deep.equal(CHANNEL);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const CHANNEL_ID = "my-channel";
            nock((0, api_1.hostingApiOrigin)())
                .post(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`, { ttl: "604800s" })
                .query({ channelId: CHANNEL_ID })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.createChannel(PROJECT_ID, SITE, CHANNEL_ID)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("updateChannelTtl", () => {
        afterEach(nock.cleanAll);
        it("should make the API request to update a channel", async () => {
            const CHANNEL_ID = "my-channel";
            const CHANNEL = { name: "my-channel" };
            nock((0, api_1.hostingApiOrigin)())
                .patch(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`, {
                ttl: "604800s",
            })
                .query({ updateMask: "ttl" })
                .reply(201, CHANNEL);
            const res = await hostingApi.updateChannelTtl(PROJECT_ID, SITE, CHANNEL_ID);
            (0, chai_1.expect)(res).to.deep.equal(CHANNEL);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should let us customize the TTL", async () => {
            const CHANNEL_ID = "my-channel";
            const CHANNEL = { name: "my-channel" };
            const TTL = "60s";
            nock((0, api_1.hostingApiOrigin)())
                .patch(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`, { ttl: TTL })
                .query({ updateMask: "ttl" })
                .reply(201, CHANNEL);
            const res = await hostingApi.updateChannelTtl(PROJECT_ID, SITE, CHANNEL_ID, 60000);
            (0, chai_1.expect)(res).to.deep.equal(CHANNEL);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const CHANNEL_ID = "my-channel";
            nock((0, api_1.hostingApiOrigin)())
                .patch(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`, {
                ttl: "604800s",
            })
                .query({ updateMask: "ttl" })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.updateChannelTtl(PROJECT_ID, SITE, CHANNEL_ID)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("deleteChannel", () => {
        afterEach(nock.cleanAll);
        it("should make the API request to delete a channel", async () => {
            const CHANNEL_ID = "my-channel";
            const CHANNEL = { name: "my-channel" };
            nock((0, api_1.hostingApiOrigin)())
                .delete(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`)
                .reply(204, CHANNEL);
            const res = await hostingApi.deleteChannel(PROJECT_ID, SITE, CHANNEL_ID);
            (0, chai_1.expect)(res).to.be.undefined;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const CHANNEL_ID = "my-channel";
            nock((0, api_1.hostingApiOrigin)())
                .delete(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`)
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.deleteChannel(PROJECT_ID, SITE, CHANNEL_ID)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("createVersion", () => {
        afterEach(nock.cleanAll);
        it("should make the API requests to create a version", async () => {
            const VERSION = { status: "CREATED" };
            const FULL_NAME = `projects/-/sites/${SITE}/versions/my-new-version`;
            nock((0, api_1.hostingApiOrigin)())
                .post(`/v1beta1/projects/-/sites/${SITE}/versions`, VERSION)
                .reply(200, { name: FULL_NAME });
            const res = await hostingApi.createVersion(SITE, VERSION);
            (0, chai_1.expect)(res).to.deep.equal(FULL_NAME);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const VERSION = { status: "CREATED" };
            nock((0, api_1.hostingApiOrigin)())
                .post(`/v1beta1/projects/-/sites/${SITE}/versions`, VERSION)
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.createVersion(SITE, VERSION)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("updateVersion", () => {
        afterEach(nock.cleanAll);
        it("should make the API requests to update a version", async () => {
            const VERSION = { status: "FINALIZED" };
            nock((0, api_1.hostingApiOrigin)())
                .patch(`/v1beta1/projects/-/sites/${SITE}/versions/my-version`, VERSION)
                .query({ updateMask: "status" })
                .reply(200, VERSION);
            const res = await hostingApi.updateVersion(SITE, "my-version", VERSION);
            (0, chai_1.expect)(res).to.deep.equal(VERSION);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const VERSION = { status: "FINALIZED" };
            nock((0, api_1.hostingApiOrigin)())
                .patch(`/v1beta1/projects/-/sites/${SITE}/versions/my-version`, VERSION)
                .query({ updateMask: "status" })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.updateVersion(SITE, "my-version", VERSION)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("listVersions", () => {
        afterEach(nock.cleanAll);
        const VERSION_1 = {
            name: `projects/-/sites/${SITE}/versions/v1`,
            status: "FINALIZED",
            config: {},
            createTime: "now",
            createUser: {
                email: "inlined@google.com",
            },
            fileCount: 0,
            versionBytes: 0,
        };
        const VERSION_2 = {
            ...VERSION_1,
            name: `projects/-/sites/${SITE}/versions/v2`,
        };
        it("returns no versions if no versions are returned", async () => {
            nock((0, api_1.hostingApiOrigin)()).get(`/v1beta1/projects/-/sites/${SITE}/versions`).reply(200, {});
            nock((0, api_1.hostingApiOrigin)());
            const versions = await hostingApi.listVersions(SITE);
            (0, chai_1.expect)(versions).deep.equals([]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("returns a single page of versions", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/-/sites/${SITE}/versions`)
                .reply(200, { versions: [VERSION_1] });
            nock((0, api_1.hostingApiOrigin)());
            const versions = await hostingApi.listVersions(SITE);
            (0, chai_1.expect)(versions).deep.equals([VERSION_1]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("paginates through many versions", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/-/sites/${SITE}/versions`)
                .reply(200, { versions: [VERSION_1], nextPageToken: "page2" });
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/-/sites/${SITE}/versions?pageToken=page2`)
                .reply(200, { versions: [VERSION_2] });
            const versions = await hostingApi.listVersions(SITE);
            (0, chai_1.expect)(versions).deep.equals([VERSION_1, VERSION_2]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("handles errors", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/-/sites/${SITE}/versions`)
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.listVersions(SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("cloneVersion", () => {
        afterEach(nock.cleanAll);
        it("should make the API requests to clone a version", async () => {
            const SOURCE_VERSION = "my-version";
            const VERSION = { name: "my-new-version" };
            nock((0, api_1.hostingApiOrigin)())
                .post(`/v1beta1/projects/-/sites/${SITE}/versions:clone`, {
                sourceVersion: SOURCE_VERSION,
                finalize: false,
            })
                .reply(200, { name: `projects/${PROJECT_ID}/operations/op` });
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/operations/op`)
                .reply(200, {
                name: `projects/${PROJECT_ID}/operations/op`,
                done: true,
                response: VERSION,
            });
            const res = await hostingApi.cloneVersion(SITE, SOURCE_VERSION);
            (0, chai_1.expect)(res).to.deep.equal(VERSION);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const SOURCE_VERSION = "my-version";
            nock((0, api_1.hostingApiOrigin)())
                .post(`/v1beta1/projects/-/sites/${SITE}/versions:clone`, {
                sourceVersion: SOURCE_VERSION,
                finalize: false,
            })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.cloneVersion(SITE, SOURCE_VERSION)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("createRelease", () => {
        afterEach(nock.cleanAll);
        it("should make the API request to create a release", async () => {
            const CHANNEL_ID = "my-channel";
            const RELEASE = { name: "my-new-release" };
            const VERSION = "version";
            const VERSION_NAME = `sites/${SITE}/versions/${VERSION}`;
            nock((0, api_1.hostingApiOrigin)())
                .post(`/v1beta1/projects/-/sites/${SITE}/channels/${CHANNEL_ID}/releases`)
                .query({ versionName: VERSION_NAME })
                .reply(201, RELEASE);
            const res = await hostingApi.createRelease(SITE, CHANNEL_ID, VERSION_NAME);
            (0, chai_1.expect)(res).to.deep.equal(RELEASE);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should include a message, if provided", async () => {
            const CHANNEL_ID = "my-channel";
            const RELEASE = { name: "my-new-release" };
            const VERSION = "version";
            const VERSION_NAME = `sites/${SITE}/versions/${VERSION}`;
            const MESSAGE = "yo dawg";
            nock((0, api_1.hostingApiOrigin)())
                .post(`/v1beta1/projects/-/sites/${SITE}/channels/${CHANNEL_ID}/releases`, {
                message: MESSAGE,
            })
                .query({ versionName: VERSION_NAME })
                .reply(201, RELEASE);
            const res = await hostingApi.createRelease(SITE, CHANNEL_ID, VERSION_NAME, {
                message: MESSAGE,
            });
            (0, chai_1.expect)(res).to.deep.equal(RELEASE);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const CHANNEL_ID = "my-channel";
            const VERSION = "VERSION";
            const VERSION_NAME = `sites/${SITE}/versions/${VERSION}`;
            nock((0, api_1.hostingApiOrigin)())
                .post(`/v1beta1/projects/-/sites/${SITE}/channels/${CHANNEL_ID}/releases`)
                .query({ versionName: VERSION_NAME })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.createRelease(SITE, CHANNEL_ID, VERSION_NAME)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("getSite", () => {
        afterEach(nock.cleanAll);
        it("should make the API request for a channel", async () => {
            const SITE_BODY = { name: "my-site" };
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`)
                .reply(200, SITE_BODY);
            const res = await hostingApi.getSite(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.deep.equal(SITE_BODY);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the site doesn't exist", async () => {
            nock((0, api_1.hostingApiOrigin)()).get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`).reply(404, {});
            await (0, chai_1.expect)(hostingApi.getSite(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /could not find site/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`)
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.getSite(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("listSites", () => {
        afterEach(nock.cleanAll);
        it("should make a single API requests to list a small number of sites", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(200, { sites: [{ name: "site01" }] });
            const res = await hostingApi.listSites(PROJECT_ID);
            (0, chai_1.expect)(res).to.deep.equal([{ name: "site01" }]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should return no sites if none are returned", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(200, {});
            const res = await hostingApi.listSites(PROJECT_ID);
            (0, chai_1.expect)(res).to.deep.equal([]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should make multiple API requests to list sites", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(200, { sites: [{ name: "site01" }], nextPageToken: "02" });
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites`)
                .query({ pageToken: "02", pageSize: 10 })
                .reply(200, { sites: [{ name: "site02" }] });
            const res = await hostingApi.listSites(PROJECT_ID);
            (0, chai_1.expect)(res).to.deep.equal([{ name: "site01" }, { name: "site02" }]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should return an error if there's no site", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(404, {});
            await (0, chai_1.expect)(hostingApi.listSites(PROJECT_ID)).to.eventually.be.rejectedWith(error_1.FirebaseError, /could not find sites/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.listSites(PROJECT_ID)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("createSite", () => {
        afterEach(nock.cleanAll);
        it("should make the API request to create a channel", async () => {
            const SITE_BODY = { name: "my-new-site" };
            nock((0, api_1.hostingApiOrigin)())
                .post(`/v1beta1/projects/${PROJECT_ID}/sites`, { appId: "" })
                .query({ siteId: SITE })
                .reply(201, SITE_BODY);
            const res = await hostingApi.createSite(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.deep.equal(SITE_BODY);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .post(`/v1beta1/projects/${PROJECT_ID}/sites`, { appId: "" })
                .query({ siteId: SITE })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.createSite(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("updateSite", () => {
        const SITE_OBJ = {
            name: "my-site",
            defaultUrl: "",
            appId: "foo",
            labels: {},
        };
        afterEach(nock.cleanAll);
        it("should make the API request to update a site", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .patch(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`)
                .query({ updateMask: "appId" })
                .reply(201, SITE_OBJ);
            const res = await hostingApi.updateSite(PROJECT_ID, SITE_OBJ, ["appId"]);
            (0, chai_1.expect)(res).to.deep.equal(SITE_OBJ);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .patch(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`)
                .query({ updateMask: "appId" })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.updateSite(PROJECT_ID, SITE_OBJ, ["appId"])).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("deleteSite", () => {
        afterEach(nock.cleanAll);
        it("should make the API request to delete a site", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .delete(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`)
                .reply(201, {});
            const res = await hostingApi.deleteSite(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.be.undefined;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .delete(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`)
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.deleteSite(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("getCleanDomains", () => {
        afterEach(() => {
            nock.cleanAll();
        });
        it("should return the list of expected auth domains after syncing", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`)
                .query(() => true)
                .reply(200, TEST_CHANNELS_RESPONSE);
            nock((0, api_1.identityOrigin)())
                .get(`/admin/v2/projects/${PROJECT_ID}/config`)
                .reply(200, TEST_GET_DOMAINS_RESPONSE);
            const res = await hostingApi.getCleanDomains(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.deep.equal(EXPECTED_DOMAINS_RESPONSE);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should not remove sites that are similarly named", async () => {
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`)
                .query(() => true)
                .reply(200, {
                channels: [
                    { url: "https://my-site--ch1-4iyrl1uo.web.app" },
                    { url: "https://my-site--ch2-ygd8582v.web.app" },
                ],
            });
            nock((0, api_1.identityOrigin)())
                .get(`/admin/v2/projects/${PROJECT_ID}/config`)
                .reply(200, {
                authorizedDomains: [
                    "localhost",
                    "randomurl.com",
                    "my-site--ch1-4iyrl1uo.web.app",
                    "my-site--expiredchannel-difhyc76.web.app",
                    "backendof-my-site--some-abcd1234.web.app",
                ],
            });
            const res = await hostingApi.getCleanDomains(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.deep.equal([
                "localhost",
                "randomurl.com",
                "my-site--ch1-4iyrl1uo.web.app",
                "backendof-my-site--some-abcd1234.web.app",
            ]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("getSiteDomains", () => {
        afterEach(nock.cleanAll);
        it("should get the site domains", async () => {
            nock((0, api_1.hostingApiOrigin)()).get(SITE_DOMAINS_API).reply(200, { domains: GET_SITE_DOMAINS_BODY });
            const res = await hostingApi.getSiteDomains(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.deep.equal(GET_SITE_DOMAINS_BODY);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the site doesn't exist", async () => {
            nock((0, api_1.hostingApiOrigin)()).get(SITE_DOMAINS_API).reply(404, {});
            await (0, chai_1.expect)(hostingApi.getSiteDomains(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /could not find site/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            nock((0, api_1.hostingApiOrigin)()).get(SITE_DOMAINS_API).reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.getSiteDomains(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("getAllSiteDomains", () => {
        afterEach(nock.cleanAll);
        it("should get the site domains", async () => {
            nock((0, api_1.hostingApiOrigin)()).get(SITE_DOMAINS_API).reply(200, { domains: GET_SITE_DOMAINS_BODY });
            const GET_SITE_BODY = {
                name: `projects/${PROJECT_ID}/sites/${SITE}`,
                defaultUrl: EXPECTED_DOMAINS_RESPONSE[0],
                type: "DEFAULT_SITE",
            };
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`)
                .reply(200, GET_SITE_BODY);
            const allDomainsPlusWebAppAndFirebaseApp = [
                ...EXPECTED_DOMAINS_RESPONSE,
                `${SITE}.web.app`,
                `${SITE}.firebaseapp.com`,
            ];
            (0, chai_1.expect)(await hostingApi.getAllSiteDomains(PROJECT_ID, SITE)).to.have.members(allDomainsPlusWebAppAndFirebaseApp);
        });
        it("should throw an error if the site doesn't exist", async () => {
            nock((0, api_1.hostingApiOrigin)()).get(SITE_DOMAINS_API).reply(404, {});
            nock((0, api_1.hostingApiOrigin)()).get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`).reply(404, {});
            await (0, chai_1.expect)(hostingApi.getAllSiteDomains(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /could not find site/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("getDeploymentDomain", () => {
        afterEach(nock.cleanAll);
        it("should get the default site domain when hostingChannel is omitted", async () => {
            const defaultDomain = EXPECTED_DOMAINS_RESPONSE[EXPECTED_DOMAINS_RESPONSE.length - 1];
            const defaultUrl = `https://${defaultDomain}`;
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`)
                .reply(200, { defaultUrl });
            (0, chai_1.expect)(await hostingApi.getDeploymentDomain(PROJECT_ID, SITE)).to.equal(defaultDomain);
        });
        it("should get the default site domain when hostingChannel is undefined", async () => {
            const defaultDomain = EXPECTED_DOMAINS_RESPONSE[EXPECTED_DOMAINS_RESPONSE.length - 1];
            const defaultUrl = `https://${defaultDomain}`;
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`)
                .reply(200, { defaultUrl });
            (0, chai_1.expect)(await hostingApi.getDeploymentDomain(PROJECT_ID, SITE, undefined)).to.equal(defaultDomain);
        });
        it("should get the channel domain", async () => {
            const channelId = "my-channel";
            const channelDomain = `${PROJECT_ID}--${channelId}-123123.web.app`;
            const channel = { url: `https://${channelDomain}` };
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${channelId}`)
                .reply(200, channel);
            (0, chai_1.expect)(await hostingApi.getDeploymentDomain(PROJECT_ID, SITE, channelId)).to.equal(channelDomain);
        });
        it("should return null if channel not found", async () => {
            const channelId = "my-channel";
            nock((0, api_1.hostingApiOrigin)())
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${channelId}`)
                .reply(404, {});
            (0, chai_1.expect)(await hostingApi.getDeploymentDomain(PROJECT_ID, SITE, channelId)).to.be.null;
        });
        it("should return null if site not found", async () => {
            nock((0, api_1.hostingApiOrigin)()).get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`).reply(404, {});
            (0, chai_1.expect)(await hostingApi.getDeploymentDomain(PROJECT_ID, SITE)).to.be.null;
        });
    });
});
describe("normalizeName", () => {
    const tests = [
        { in: "happy-path", out: "happy-path" },
        { in: "feature/branch", out: "feature-branch" },
        { in: "featuRe/Branch", out: "featuRe-Branch" },
        { in: "what/are:you_thinking", out: "what-are-you-thinking" },
        { in: "happyBranch", out: "happyBranch" },
        { in: "happy:branch", out: "happy-branch" },
        { in: "happy_branch", out: "happy-branch" },
        { in: "happy#branch", out: "happy-branch" },
    ];
    for (const t of tests) {
        it(`should handle the normalization of ${t.in}`, () => {
            (0, chai_1.expect)(hostingApi.normalizeName(t.in)).to.equal(t.out);
        });
    }
});
//# sourceMappingURL=api.spec.js.map