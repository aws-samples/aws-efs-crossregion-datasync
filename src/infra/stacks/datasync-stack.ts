import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_datasync as datasync } from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';

interface DataSyncLocationProps extends StackProps {
    vpc: ec2.Vpc;
    ec2SgId: string
    efsFileSystemArn: string;
    dataSyncSubnetId: string;
}

interface DataSyncTaskPros extends StackProps {
    primaryDataSyncLocationArn: string;
    secondaryDataSyncLocationArn: string;
}

export class DataSyncLocation extends Stack {

    public readonly EfsLocationArn: string;

    constructor(scope: Construct, id: string, props: DataSyncLocationProps) {
        super(scope, id, props);

        const datasyncSg = new ec2.SecurityGroup(this, 'DataSyncSg', {
            vpc: props.vpc,
        });

        datasyncSg.addIngressRule(ec2.Peer.securityGroupId(props.ec2SgId), ec2.Port.tcp(2049), 'Allow NFS from EC2 instance');

        const dataSyncSgId = datasyncSg.securityGroupId

        const EfsLocation = new datasync.CfnLocationEFS(this, 'EfsLocation', {
            efsFilesystemArn: props.efsFileSystemArn,
            inTransitEncryption: 'TLS1_2',
            ec2Config: {
                securityGroupArns: [`arn:aws:ec2:${Stack.of(this).region}:${Stack.of(this).account}:security-group/${dataSyncSgId}`],
                subnetArn: `arn:aws:ec2:${Stack.of(this).region}:${Stack.of(this).account}:subnet/${props.dataSyncSubnetId}`,
            },
        });

        this.EfsLocationArn = EfsLocation.attrLocationArn
    }
}

export class DataSyncTask extends Stack {
    constructor(scope: Construct, id: string, props: DataSyncTaskPros) {
        super(scope, id, props);

        const dataSyncTaskLg = new logs.LogGroup(this, 'DataSyncLogGroup', {
            removalPolicy: RemovalPolicy.DESTROY,
            retention: logs.RetentionDays.ONE_WEEK,
        });

        const dataSyncTask = new datasync.CfnTask(this, 'DataSyncTask', {
            sourceLocationArn: props.primaryDataSyncLocationArn,
            destinationLocationArn: props.secondaryDataSyncLocationArn,
            cloudWatchLogGroupArn: dataSyncTaskLg.logGroupArn,
            options: {
                logLevel: 'BASIC',
            },
        });
    }
}