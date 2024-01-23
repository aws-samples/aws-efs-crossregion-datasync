import { RemovalPolicy, Stack, StackProps, aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class VpcStack extends Stack {
    public readonly vpc: ec2.Vpc;
    public readonly dataSyncSubnetId: string;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.vpc = new ec2.Vpc(this, 'Vpc', {
            enableDnsHostnames: true,
            enableDnsSupport: true,
        });

        const privateSubnet = this.vpc.privateSubnets[0];

        this.dataSyncSubnetId = privateSubnet.subnetId

        const flowLogsLogGroup = new logs.LogGroup(this, 'VpcFlowsLogGroup', {
            removalPolicy: RemovalPolicy.DESTROY
        });

        const flowlogsRole = new iam.Role(this, 'VpcFlowLogsIamRole', {
            assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com')
        });

        new ec2.FlowLog(this, 'VpcFlowLog', {
            resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
            destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogsLogGroup, flowlogsRole)
        });
    }
}