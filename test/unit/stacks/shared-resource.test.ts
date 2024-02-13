/// <reference types="@types/jest" />

import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { SharedResourceStack, SharedResourceStackProps } from "../../../cdk/stacks/shared-resource";

describe("SharedResources", () => {
    let stack: Stack;

    beforeEach(() => {
        stack = new Stack(new App(), "Stack");
    });
    test("Shared Resources with Cognito", () => {
        // WHEN
        const props = {
            createUserPool: true,
            createUserPoolDomain: true,
            userPoolDomainPrefix: "test",
            resourcePrefix: "core",
            userPool: "test.aws.dev",
            userPoolClient: "prefix",
            userPoolDomain: "core-infrastructure-shared-user-pool",
            env: { account: "1234567", region: "us-east-1" },
        } as SharedResourceStackProps;
        const sharedResourceStack = new SharedResourceStack(stack, "TestSharedResourceStack", props);
        const template = Template.fromStack(sharedResourceStack);

        template.resourcePropertiesCountIs(
            "AWS::Cognito::UserPool",
            {
                UsernameAttributes: ["email"],
            },
            1
        );
        template.resourceCountIs("AWS::Cognito::UserPoolClient", 1);
        template.resourceCountIs("AWS::SSM::Parameter", 1);
        template.resourcePropertiesCountIs(
            "AWS::Cognito::UserPoolDomain",
            {
                Domain: `${props.userPoolDomainPrefix}`,
            },
            1
        );
    });
});
