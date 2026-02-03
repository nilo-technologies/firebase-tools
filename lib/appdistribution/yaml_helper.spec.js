"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsYaml = require("js-yaml");
const yaml_helper_1 = require("./yaml_helper");
const chai_1 = require("chai");
const APP_NAME = "projects/12345/apps/1:12345:android:beef";
const TEST_CASES = [
    {
        displayName: "test-display-name",
        name: "projects/12345/apps/1:12345:android:beef/testCases/test-case-id",
        prerequisiteTestCase: "projects/12345/apps/1:12345:android:beef/testCases/prerequisite-test-case-id",
        aiInstructions: {
            steps: [
                {
                    goal: "test-goal",
                    hint: "test-hint",
                    successCriteria: "test-success-criteria",
                },
            ],
        },
    },
    {
        displayName: "minimal-case",
        name: "projects/12345/apps/1:12345:android:beef/testCases/minimal-id",
        aiInstructions: { steps: [{ goal: "win" }] },
    },
];
const YAML_STRING = `- displayName: test-display-name
  id: test-case-id
  prerequisiteTestCaseId: prerequisite-test-case-id
  steps:
    - goal: test-goal
      hint: test-hint
      successCriteria: test-success-criteria
- displayName: minimal-case
  id: minimal-id
  steps:
    - goal: win
`;
const YAML_DATA = [
    {
        displayName: "test-display-name",
        id: "test-case-id",
        prerequisiteTestCaseId: "prerequisite-test-case-id",
        steps: [
            {
                goal: "test-goal",
                hint: "test-hint",
                successCriteria: "test-success-criteria",
            },
        ],
    },
    {
        displayName: "minimal-case",
        id: "minimal-id",
        steps: [{ goal: "win" }],
    },
];
describe("YamlHelper", () => {
    it("converts TestCase[] to YAML string", () => {
        const yamlString = (0, yaml_helper_1.toYaml)(TEST_CASES);
        (0, chai_1.expect)(jsYaml.safeLoad(yamlString)).to.eql(YAML_DATA);
        (0, chai_1.expect)(yamlString).to.eq(YAML_STRING);
    });
    it("converts YAML string to TestCase[]", () => {
        const testCases = (0, yaml_helper_1.fromYaml)(APP_NAME, YAML_STRING);
        (0, chai_1.expect)(testCases).to.eql(TEST_CASES);
    });
    it("converts YAML without ID", () => {
        const testCases = (0, yaml_helper_1.fromYaml)(APP_NAME, `- displayName: minimal-case
  steps:
    - goal: win
`);
        (0, chai_1.expect)(testCases).to.eql([
            {
                displayName: "minimal-case",
                aiInstructions: { steps: [{ goal: "win" }] },
            },
        ]);
    });
    it("throws error if displayName is missing", () => {
        (0, chai_1.expect)(() => (0, yaml_helper_1.fromYaml)(APP_NAME, `- steps:
  - goal: test-goal
    hint: test-hint
    successCriteria: test-success-criteria
`)).to.throw(/"displayName" is required/);
    });
    it("throws error if steps is missing", () => {
        (0, chai_1.expect)(() => (0, yaml_helper_1.fromYaml)(APP_NAME, `- displayName: test-display-name`)).to.throw(/"steps" is required/);
    });
    it("throws error if goal is missing", () => {
        (0, chai_1.expect)(() => (0, yaml_helper_1.fromYaml)(APP_NAME, `- displayName: test-display-name
  steps:
    - hint: test-hint
      successCriteria: test-success-criteria
`)).to.throw(/"goal" is required/);
    });
    it("throws error if additional property is present in test case", () => {
        (0, chai_1.expect)(() => (0, yaml_helper_1.fromYaml)(APP_NAME, `- displayName: test-display-name
  extraTestCaseProperty: property
  steps:
    - goal: test-goal
`)).to.throw(/unexpected property "extraTestCaseProperty"/);
    });
    it("throws error if additional property is present in step", () => {
        (0, chai_1.expect)(() => (0, yaml_helper_1.fromYaml)(APP_NAME, `- displayName: test-display-name
  steps:
    - goal: test-goal
      extraStepProperty: property
`)).to.throw(/unexpected property "extraStepProperty"/);
    });
    it("throws error if YAML is invalid", () => {
        (0, chai_1.expect)(() => (0, yaml_helper_1.fromYaml)(APP_NAME, `-
this is not valid YAML`)).to.throw(/at line 2/);
    });
    it("throws error if YAML doesn't contain a top-level array", () => {
        (0, chai_1.expect)(() => (0, yaml_helper_1.fromYaml)(APP_NAME, "not a list")).to.throw(/must contain a list of test cases/);
    });
});
//# sourceMappingURL=yaml_helper.spec.js.map