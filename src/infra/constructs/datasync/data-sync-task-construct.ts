import { Construct } from 'constructs';
import { CfnTask } from 'aws-cdk-lib/aws-datasync';

export interface DataSyncTaskProps {
    sourceLocationArn: string;
    destinationLocationArn: string;
}

export class DataSyncTaskConstruct extends Construct {
    constructor(scope: Construct, id: string, props: DataSyncTaskProps) {
        super(scope, id);

        new CfnTask(this, 'DataSyncTask', {
            sourceLocationArn: props.sourceLocationArn,
            destinationLocationArn: props.destinationLocationArn,
        });
    }
}