import { RemovalPolicy, Stack, StackProps, aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as efs from 'aws-cdk-lib/aws-efs';

interface EfsStackProps extends StackProps {
  vpc: ec2.Vpc;
}

export class EfsStack extends Stack {

  public readonly efsFileSystemId: string;
  public readonly efsFileSystemArn: string;

  constructor(scope: Construct, id: string, props: EfsStackProps) {
    super(scope, id, props);

    const efsFileSystemSg = new ec2.SecurityGroup(this, 'EfsFileSystemSg', {
      vpc: props.vpc,
    });

    efsFileSystemSg.addIngressRule(ec2.Peer.ipv4(props.vpc.vpcCidrBlock), ec2.Port.tcp(2049), 'Allow NFS to EC2 instance');

    const efsFileSystem = new efs.FileSystem(this, "Efs", {
      vpc: props.vpc,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS,
      removalPolicy: RemovalPolicy.DESTROY,
      securityGroup: efsFileSystemSg,
      allowAnonymousAccess: true,
    });
    this.efsFileSystemId = efsFileSystem.fileSystemId
    this.efsFileSystemArn = efsFileSystem.fileSystemArn
  }
}
