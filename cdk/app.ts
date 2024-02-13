import * as cdk from "aws-cdk-lib";
import * as rawConfig from "./config.json";
import { InfrastructurePipelineStack } from "./stacks/infrastructure-pipeline";
import { SharedResourceStage, SharedResourceStageProps } from "./stages/shared-resource";

const app = new cdk.App();

const config = rawConfig as Config;

new InfrastructurePipelineStack(app, `${config.resourcePrefix}-Pipeline`, {
    coreInfraRepoName: config.coreInfraRepoName,
    infrastructurePipelineStage: SharedResourceStage,
    stageProps: {
        createUserPool: config.createUserPool,
        createUserPoolDomain: config.createUserPoolDomain,
        resourcePrefix: config.resourcePrefix,
        userPoolDomainPrefix: config.userPoolDomainPrefix,
    } as SharedResourceStageProps,
    resourcePrefix: config.resourcePrefix,
    servicesRepoName: config.servicesRepoName,
    userPoolDomainPrefix: config.userPoolDomainPrefix,
    environmentAccounts: config.environmentAccounts,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});

export interface Config {
    resourcePrefix: string;
    createUserPool: boolean;
    createUserPoolDomain?: boolean;
    userPoolDomainPrefix?: string;
    servicesRepoName: string;
    coreInfraRepoName: string;
    environmentAccounts: Environment[] | [];
    infraCodeSource: string;
    infraCodeStarConnectionARN: string;
    infraGithubUserName: string;
    infraGithubRepoName: string;
}

export interface Environment {
    accountSsmKey: string;
    accountName: string;
}
