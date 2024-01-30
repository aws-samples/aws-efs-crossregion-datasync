// datasync-location-stack.ts
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs'
import { VpcStack } from './vpc-stack';
import { EfsStack } from './efs-stack';
import { Ec2Stack } from './ec2-stack';
import { DataSyncLocationConstruct } from '../constructs/datasync/data-sync-location-construct';
import { DataSyncTaskConstruct } from '../constructs/datasync/data-sync-task-construct';

interface DataSyncLocationStackProps extends StackProps {
    VpcStack: VpcStack;
    EfsStack: EfsStack;
    Ec2Stack: Ec2Stack;
}

export class DataSyncLocationStack extends Stack {
    public readonly LocationArn: string;

    constructor(scope: Construct, id: string, props: DataSyncLocationStackProps) {
        super(scope, id, props);

        const Location = new DataSyncLocationConstruct(this, 'DataSyncLocation', {
            vpc: props.VpcStack.vpc,
            ec2SgId: props.Ec2Stack.ec2SgId,
            efsFileSystemArn: props.EfsStack.efsFileSystemArn,
            dataSyncSubnetId: props.VpcStack.dataSyncSubnetId
        });

        this.LocationArn = Location.dataSyncLocationArn;
    }
}

interface DataSyncTaskStackProps extends StackProps {
    sourceLocationArn: string;
    destinationLocationArn: string;
}

export class DataSyncTaskStack extends Stack {
    constructor(scope: Construct, id: string, props: DataSyncTaskStackProps) {
        super(scope, id, props);

        new DataSyncTaskConstruct(this, 'DataSyncTask', {
            sourceLocationArn: props.sourceLocationArn,
            destinationLocationArn: props.destinationLocationArn,
        });
    }
}