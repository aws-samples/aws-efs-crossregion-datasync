#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EfsStack } from './stacks/efs-stack';
import { VpcStack } from './stacks/vpc-stack';
import { Ec2Stack } from './stacks/ec2-stack';
import { DataSyncLocationStack } from './stacks/datasync-stack';
import { DataSyncTaskStack } from './stacks/datasync-stack';
import { AwsSolutionsChecks } from 'cdk-nag';
import { Aspects } from 'aws-cdk-lib';

const app = new cdk.App();

const account = app.node.tryGetContext('account') || process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const primaryRegion = { account: account, region: 'us-east-1' };
const secondaryRegion = { account: account, region: 'us-west-1' };

const primaryVPC = new VpcStack(app, `VpcStack-${primaryRegion.region}`, {
    env: primaryRegion
});

const primaryEfs = new EfsStack(app, `EfsStack-${primaryRegion.region}`, {
    env: primaryRegion,
    vpc: primaryVPC.vpc,
});

const primaryEc2 = new Ec2Stack(app, `Ec2Stack-${primaryRegion.region}`, {
    env: primaryRegion,
    vpc: primaryVPC.vpc,
    efsFileSystemId: primaryEfs.efsFileSystemId,
    efsSecurityGroup: primaryEfs.efsSecurityGroup
});

const secondaryVPC = new VpcStack(app, `VpcStack-${secondaryRegion.region}`, {
    env: secondaryRegion
});

const secondaryEfs = new EfsStack(app, `EfsStack-${secondaryRegion.region}`, {
    env: secondaryRegion,
    vpc: secondaryVPC.vpc,
});

const secondaryEc2 = new Ec2Stack(app, `Ec2Stack-${secondaryRegion.region}`, {
    env: secondaryRegion,
    vpc: secondaryVPC.vpc,
    efsFileSystemId: secondaryEfs.efsFileSystemId,
    efsSecurityGroup: secondaryEfs.efsSecurityGroup
});

const primaryDataSyncLocation = new DataSyncLocationStack(app, `DataSyncLocationStack-${primaryRegion.region}`, {
    env: primaryRegion,
    VpcStack: primaryVPC,
    EfsStack: primaryEfs,
    Ec2Stack: primaryEc2,
});

const secondaryDataSyncLocation = new DataSyncLocationStack(app, `DataSyncLocationStack-${secondaryRegion.region}`, {
    env: secondaryRegion,
    VpcStack: secondaryVPC,
    EfsStack: secondaryEfs,
    Ec2Stack: secondaryEc2,
});

new DataSyncTaskStack(app, 'DataSyncTaskStack', {
    env: primaryRegion,
    crossRegionReferences: true,
    sourceLocationArn: primaryDataSyncLocation.LocationArn,
    destinationLocationArn: secondaryDataSyncLocation.LocationArn,
});

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

app.synth();