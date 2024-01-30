import { RemovalPolicy, Stack, StackProps, aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as efs from 'aws-cdk-lib/aws-efs';

interface EfsStackProps extends StackProps {
  vpc: ec2.Vpc;
}

export class EfsStack extends Stack {

  public readonly efsFileSystemId: string;
  public readonly efsFileSystemArn: string;
  public readonly efsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: EfsStackProps) {
    super(scope, id, props);

    const efsSecurityGroup = new ec2.SecurityGroup(this, 'EfsSecurityGroup', {
      vpc: props.vpc,
    });

    // Allowed VPC CIDR range because EC2 securuity group is not created at this point
    efsSecurityGroup.addIngressRule(ec2.Peer.ipv4(props.vpc.vpcCidrBlock), ec2.Port.tcp(2049), 'Allow NFS traffic from EC2 instances');

    const fileSystem = new efs.FileSystem(this, 'EfsFileSystem', {
      vpc: props.vpc,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      encrypted: true,
      securityGroup: efsSecurityGroup,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.efsFileSystemId = fileSystem.fileSystemId;
    this.efsFileSystemArn = fileSystem.fileSystemArn;
    this.efsSecurityGroup = efsSecurityGroup;
  }
}