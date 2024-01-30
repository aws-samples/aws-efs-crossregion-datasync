import { Stack, StackProps, aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NagSuppressions } from 'cdk-nag';

interface Ec2StackProps extends StackProps {
    vpc: ec2.Vpc;
    efsFileSystemId: string;
    efsSecurityGroup: ec2.SecurityGroup;
}

export class Ec2Stack extends Stack {

    public readonly ec2SgId: string;

    constructor(scope: Construct, id: string, props: Ec2StackProps) {
        super(scope, id, props);

        const role = new iam.Role(this, 'InstanceRole', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonElasticFileSystemClientReadWriteAccess')
            ]
        });
        NagSuppressions.addResourceSuppressions(role, [{ id: 'AwsSolutions-IAM4', reason: 'AWS managed policies acceptable here' }])

        const instance = new ec2.Instance(this, 'EfsInstance', {
            vpc: props.vpc,
            instanceType: new ec2.InstanceType('t3.micro'),
            machineImage: ec2.MachineImage.latestAmazonLinux2(),
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            role: role,
            securityGroup: props.efsSecurityGroup
        });

        this.ec2SgId = instance.connections.securityGroups[0].securityGroupId;

        NagSuppressions.addResourceSuppressions(instance, [{ id: 'AwsSolutions-EC26', reason: 'Suppress AwsSolutions-EC26 for EfsInstance' }])
        NagSuppressions.addResourceSuppressions(instance, [{ id: 'AwsSolutions-EC28', reason: 'Suppress AwsSolutions-EC28 for EfsInstance' }])
        NagSuppressions.addResourceSuppressions(instance, [{ id: 'AwsSolutions-EC29', reason: 'Suppress AwsSolutions-EC29 for EfsInstance' }])

        // User data for mounting EFS
        const mountCommand = `sudo mkdir /mnt/efs && sudo mount -t efs -o tls ${props.efsFileSystemId}:/ /mnt/efs`;
        instance.userData.addCommands('yum install -y amazon-efs-utils',
            'yum install -y amazon-ssm-agent',
            'systemctl start amazon-ssm-agent',
            'systemctl enable amazon-ssm-agent',
            mountCommand);
    }
}