#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CartStack } from '../lib/cart-stack';

const app = new cdk.App();
new CartStack(app, 'CartStack');
