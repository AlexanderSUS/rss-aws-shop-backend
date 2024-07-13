#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductServiceStack } from '../lib/productServiceStack';
import { ImportServiceStack } from '../lib/importServiceStack';
import { AuthorizationServiceStack } from '../lib/authorizationServiceStack';
import 'dotenv/config';

if (!process.env.GITHUB_ACCOUNT_LOGIN || !process.env.AUTH_PASSWORD) {
  throw new Error('Provide GITHUB_ACCOUNT_LOGIN and AUTH_PASSWORD in .env file');
}

const app = new cdk.App();

new AuthorizationServiceStack(app, 'AuthServiceStack', {});

const importService = new ImportServiceStack(app, 'ImportServiceStack', {});

const productService = new ProductServiceStack(app, 'ProductServiceStack', {
  importFileParserFunction: importService.importFileParserFunction,
});

importService.importFileParserFunction.addEnvironment('QUEUE_URL', productService.queueUrl);