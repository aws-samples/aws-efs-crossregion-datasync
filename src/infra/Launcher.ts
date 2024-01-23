#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EfsStack } from './stacks/efs-stack';
import { VpcStack } from './stacks/vpc-stack';
import { Ec2Stack } from './stacks/ec2-stack';
import { DataSyncLocation } from './stacks/datasync-stack';
import { DataSyncTask } from './stacks/datasync-stack';
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
    efsFileSystemId: primaryEfs.efsFileSystemId
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
    efsFileSystemId: secondaryEfs.efsFileSystemId
});

const datasyncPrimaryLocation = new DataSyncLocation(app, `DataSyncLocation-${primaryRegion.region}`, {
    env: primaryRegion,
    vpc: primaryVPC.vpc,
    ec2SgId: primaryEc2.ec2SgId,
    dataSyncSubnetId: primaryVPC.dataSyncSubnetId,
    efsFileSystemArn: primaryEfs.efsFileSystemArn
});

const datasyncSecondaryLocation = new DataSyncLocation(app, `DataSyncLocation-${secondaryRegion.region}`, {
    env: secondaryRegion,
    vpc: secondaryVPC.vpc,
    ec2SgId: secondaryEc2.ec2SgId,
    dataSyncSubnetId: secondaryVPC.dataSyncSubnetId,
    efsFileSystemArn: secondaryEfs.efsFileSystemArn
});

new DataSyncTask(app, 'DataSyncTask', {
    env: primaryRegion,
    crossRegionReferences: true,
    primaryDataSyncLocationArn: datasyncPrimaryLocation.EfsLocationArn,
    secondaryDataSyncLocationArn: datasyncSecondaryLocation.EfsLocationArn,
});

datasyncPrimaryLocation.addDependency(primaryEfs)
datasyncSecondaryLocation.addDependency(secondaryEfs)

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

app.synth();
