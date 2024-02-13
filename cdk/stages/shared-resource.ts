import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { InfrastructurePipelineStage } from "../stacks/infrastructure-pipeline";
import { SharedResourceStack, SharedResourceStackProps } from "../stacks/shared-resource";

export interface SharedResourceStageProps extends cdk.StageProps {
    createUserPool: boolean;
    createUserPoolDomain?: boolean;
    resourcePrefix: string;
    userPoolDomainPrefix?: string;
}
export class SharedResourceStage extends InfrastructurePipelineStage {
    constructor(scope: Construct, id: string, props: SharedResourceStageProps) {
        super(scope, id, props);
        const resourceProps = {
            createUserPool: props.createUserPool,
            createUserPoolDomain: props.createUserPoolDomain,
            resourcePrefix: props.resourcePrefix,
            userPoolDomainPrefix: props.userPoolDomainPrefix,
        } as SharedResourceStackProps;
        new SharedResourceStack(this, `${props.resourcePrefix}-SharedResourceStack`, resourceProps);
    }
}
