import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { join } from 'path';
import { config } from 'dotenv';
config();

export class CartStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'CartServiceVPC', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          name: 'IsolatedSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Allow Lambda access to RDS',
      allowAllOutbound: true,
    });

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc,
        description: 'Lambda security group',
        allowAllOutbound: true,
      },
    );

    rdsSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda access to RDS',
    );

    const rdsInstance = new rds.DatabaseInstance(this, 'CartServiceRDS', {
      databaseName: process.env.DB_NAME,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [rdsSecurityGroup],
      credentials: rds.Credentials.fromPassword(
        process.env.DB_USER!,
        cdk.SecretValue.unsafePlainText(process.env.DB_PASSWORD!),
      ),
      backupRetention: cdk.Duration.days(0),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      allocatedStorage: 20,
      multiAz: false,
      storageEncrypted: false,
      publiclyAccessible: false,
    });

    const lambdaFunction = new NodejsFunction(this, 'nestJsLambdaFunction', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset(join(__dirname, '..', '..', 'app.zip')),
      handler: 'dist/src/main.handler',
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      environment: {
        DATABASE_URL: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${rdsInstance.instanceEndpoint.hostname}:${rdsInstance.instanceEndpoint.port}/${process.env.DB_NAME}`,
      },
    });

    const api = new apigateway.RestApi(this, 'NestApi', {
      restApiName: 'Nest.js Service',
      description: 'This service serves a Nest.js application.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const getLambdaIntegration = new apigateway.LambdaIntegration(
      lambdaFunction,
    );

    api.root.addMethod('ANY', getLambdaIntegration);
    api.root.addProxy({
      defaultIntegration: getLambdaIntegration,
      anyMethod: true,
    });
  }
}
