/// <reference types="@types/jest" />

import * as cdk from "aws-cdk-lib";
import { Stack, StageProps } from "aws-cdk-lib";
import { Capture, Template } from "aws-cdk-lib/assertions";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { Environment } from "../../../cdk/app";
import { InfrastructurePipelineStack, InfrastructurePipelineStage } from "../../../cdk/stacks/infrastructure-pipeline";

jest.mock("aws-cdk-lib/aws-ssm");

ssm.StringParameter.valueFromLookup = jest.fn();

class TestInfrastructureStack extends Stack {
    constructor(scope: Construct, id: string, props: StageProps) {
        super(scope, id, props);
        //    Declare resources
    }
}

class TestInfrastructurePipelineStage extends InfrastructurePipelineStage {
    constructor(scope: Construct, id: string, props: StageProps) {
        super(scope, id, props);
        new TestInfrastructureStack(this, "TestInfraStack", {});
    }
}

test("InfrastructurePipeline works with CodeCommit", () => {
    (ssm.StringParameter.valueFromLookup as jest.Mock)
        .mockReturnValueOnce("betaAccount")
        .mockReturnValueOnce("gammaAccount")
        .mockReturnValueOnce("prodAccount");

    const app = new cdk.App();

    const pipelineStack = new InfrastructurePipelineStack(app, "InfrastructurePipeline", {
        coreInfraRepoName: "edk-core-infrastructure",
        infrastructurePipelineStage: TestInfrastructurePipelineStage,
        servicesRepoName: "edk-services",
        stageProps: {
            createUserPool: true,
            resourcePrefix: "test",
        },
        env: {
            account: "test-account",
            region: "us-west-2",
        },
        environmentAccounts: [
            {
                accountName: "dev1",
                accountSsmKey: "/account/dev1",
            } as Environment,
        ],
        resourcePrefix: "test",
        infraCodeSource: "CodeCommit",
        infraGithubUserName: "test-user",
        infraGithubRepoName: "test-repo",
        infraCodeStarConnectionARN: "test-connection-arn",
    });

    const template = Template.fromStack(pipelineStack);
    template.resourceCountIs("AWS::CodePipeline::Pipeline", 1);
});

test("InfrastructurePipeline works with GitHub", () => {
    (ssm.StringParameter.valueFromLookup as jest.Mock)
        .mockReturnValueOnce("betaAccount")
        .mockReturnValueOnce("gammaAccount")
        .mockReturnValueOnce("prodAccount");

    const app = new cdk.App();

    const pipelineStack = new InfrastructurePipelineStack(app, "InfrastructurePipeline", {
        coreInfraRepoName: "edk-core-infrastructure",
        infrastructurePipelineStage: TestInfrastructurePipelineStage,
        servicesRepoName: "edk-services",
        stageProps: {
            createUserPool: true,
            resourcePrefix: "test",
        },
        env: {
            account: "test-account",
            region: "us-west-2",
        },
        environmentAccounts: [
            {
                accountName: "dev1",
                accountSsmKey: "/account/dev1",
            } as Environment,
        ],
        resourcePrefix: "test",
        infraCodeSource: "GitHub",
        infraGithubUserName: "test-user",
        infraGithubRepoName: "test-repo",
        infraCodeStarConnectionARN: "test-connection-arn",
    });

    const template = Template.fromStack(pipelineStack);
    template.resourceCountIs("AWS::CodePipeline::Pipeline", 1);
});

test("InfrastructurePipeline should add deployment stages to pipeline", () => {
    (ssm.StringParameter.valueFromLookup as jest.Mock)
        .mockReturnValueOnce("betaAccount")
        .mockReturnValueOnce("gammaAccount")
        .mockReturnValueOnce("prodAccount");

    const app = new cdk.App();

    const pipelineStack = new InfrastructurePipelineStack(app, "InfrastructurePipeline", {
        coreInfraRepoName: "edk-core-infrastructure",
        infrastructurePipelineStage: TestInfrastructurePipelineStage,
        servicesRepoName: "edk-services",
        stageProps: { createUserPool: true, resourcePrefix: "test" },
        env: {
            account: "test-account",
            region: "us-west-2",
        },
        environmentAccounts: [
            {
                accountName: "dev1",
                accountSsmKey: "/account/dev1",
            } as Environment,
        ],
        resourcePrefix: "test",
        infraCodeSource: "CodeCommit",
        infraGithubUserName: "test-user",
        infraGithubRepoName: "test-repo",
        infraCodeStarConnectionARN: "test-connection-arn",
    });

    const template = Template.fromStack(pipelineStack);
    const stagesCapture = new Capture();
    template.hasResourceProperties("AWS::CodePipeline::Pipeline", {
        Stages: stagesCapture,
    });

    const stagesResult = stagesCapture.asArray();
    expect(stagesResult[0].Name).toBe("Source");
    expect(stagesResult[1].Name).toBe("Build");
    expect(stagesResult[2].Name).toBe("Review");
    expect(stagesResult[3].Name).toBe("UpdatePipeline");
    expect(stagesResult[4].Name).toBe("dev1");

    expect((ssm.StringParameter.valueFromLookup as jest.Mock).mock.calls.length).toBe(1);

    expect((ssm.StringParameter.valueFromLookup as jest.Mock).mock.calls[0][1]).toBe(`/account/dev1`);
});
