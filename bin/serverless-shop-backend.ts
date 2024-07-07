#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductServiceStack } from '../lib/productServiceStack';
import { ImportServiceStack } from '../lib/importServiceStack';

const app = new cdk.App();
const importService = new ImportServiceStack(app, 'ImportServiceStack', {})

const productService = new ProductServiceStack(app, 'ProductServiceStack', {
  importFileParserFunction: importService.importFileParserFunction,
});

importService.importFileParserFunction.addEnvironment('QUEUE_URL', productService.queueUrl)