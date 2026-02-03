"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const docker_1 = require("./docker");
describe("DockerfileBuilder", () => {
    describe("from", () => {
        it("should add a FROM instruction to the Dockerfile", () => {
            const builder = new docker_1.DockerfileBuilder();
            builder.from("node:18", "base");
            (0, chai_1.expect)(builder.toString()).to.equal("FROM node:18 AS base\n");
        });
        it("should add a FROM instruction to the Dockerfile without a name", () => {
            const builder = new docker_1.DockerfileBuilder();
            builder.from("node:18");
            (0, chai_1.expect)(builder.toString()).to.equal("FROM node:18\n");
        });
    });
    describe("fromLastStage", () => {
        it("should add a FROM instruction to the Dockerfile using the last stage name", () => {
            const builder = new docker_1.DockerfileBuilder();
            builder.from("node:18", "base").fromLastStage("test");
            (0, chai_1.expect)(builder.toString()).to.equal("FROM node:18 AS base\nFROM base AS test\n");
        });
    });
    describe("tempFrom", () => {
        it("should add a FROM instruction without updating last stage", () => {
            const builder = new docker_1.DockerfileBuilder();
            builder.from("node:18", "base").tempFrom("node:20", "temp").fromLastStage("test");
            (0, chai_1.expect)(builder.toString()).to.equal("FROM node:18 AS base\nFROM node:20 AS temp\nFROM base AS test\n");
        });
    });
    describe("workdir", () => {
        it("should add a WORKDIR instruction to the Dockerfile", () => {
            const builder = new docker_1.DockerfileBuilder();
            builder.workdir("/app");
            (0, chai_1.expect)(builder.toString()).to.equal("WORKDIR /app\n");
        });
    });
    describe("run", () => {
        it("should add a RUN instruction to the Dockerfile", () => {
            const builder = new docker_1.DockerfileBuilder();
            builder.run('echo "test"');
            (0, chai_1.expect)(builder.toString()).to.equal('RUN echo "test"\n');
        });
    });
    describe("cmd", () => {
        it("should add a CMD instruction to the Dockerfile", () => {
            const builder = new docker_1.DockerfileBuilder();
            builder.cmd(["node", "index.js"]);
            (0, chai_1.expect)(builder.toString()).to.equal('CMD ["node", "index.js"]\n');
        });
    });
    describe("copyForFirebase", () => {
        it("should add a COPY instruction to the Dockerfile", () => {
            const builder = new docker_1.DockerfileBuilder();
            builder.copyForFirebase("src", "dest");
            (0, chai_1.expect)(builder.toString()).to.equal("COPY --chown=firebase:firebase src dest\n");
        });
    });
    describe("copyFrom", () => {
        it("should add a COPY instruction to the Dockerfile", () => {
            const builder = new docker_1.DockerfileBuilder();
            builder.copyFrom("src", "dest", "stage");
            (0, chai_1.expect)(builder.toString()).to.equal("COPY --from=stage src dest\n");
        });
    });
    describe("env", () => {
        it("should add an ENV instruction to the Dockerfile", () => {
            const builder = new docker_1.DockerfileBuilder();
            builder.env("NODE_ENV", "production");
            (0, chai_1.expect)(builder.toString()).to.equal('ENV NODE_ENV="production"\n');
        });
    });
    describe("envs", () => {
        it("should add multiple ENV instructions to the Dockerfile", () => {
            const builder = new docker_1.DockerfileBuilder();
            builder.envs({ NODE_ENV: "production", PORT: "8080" });
            (0, chai_1.expect)(builder.toString()).to.equal('ENV NODE_ENV="production"\nENV PORT="8080"\n');
        });
    });
});
//# sourceMappingURL=docker.spec.js.map