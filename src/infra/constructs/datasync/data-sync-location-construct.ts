import { Construct } from 'constructs';
import { StackProps, Stack } from 'aws-cdk-lib';
import { SecurityGroup, IVpc, Peer, Port } from 'aws-cdk-lib/aws-ec2';
import { CfnLocationEFS } from 'aws-cdk-lib/aws-datasync';

export interface DataSyncLocationProps extends StackProps {
    vpc: IVpc;
    ec2SgId: string;
    efsFileSystemArn: string;
    dataSyncSubnetId: string;
}

export class DataSyncLocationConstruct extends Construct {
    public readonly dataSyncLocationArn: string;

    constructor(scope: Construct, id: string, props: DataSyncLocationProps) {
        super(scope, id);

        const sgName = `DataSyncSg${id}`;
        const efsLocationName = `EfsLocation${id}`;

        const datasyncSg = new SecurityGroup(this, sgName, {
            vpc: props.vpc,
        });
        datasyncSg.addIngressRule(Peer.securityGroupId(props.ec2SgId), Port.tcp(2049), 'Allow NFS from EC2 instance');

        const dataSyncSgId = datasyncSg.securityGroupId;

        const location = new CfnLocationEFS(this, efsLocationName, {
            efsFilesystemArn: props.efsFileSystemArn,
            inTransitEncryption: 'TLS1_2',
            ec2Config: {
                securityGroupArns: [`arn:aws:ec2:${Stack.of(this).region}:${Stack.of(this).account}:security-group/${dataSyncSgId}`],
                subnetArn: `arn:aws:ec2:${Stack.of(this).region}:${Stack.of(this).account}:subnet/${props.dataSyncSubnetId}`,
            },
        });

        this.dataSyncLocationArn = location.attrLocationArn;
    }
}