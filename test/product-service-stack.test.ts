import { App } from "aws-cdk-lib"
import { ProductServiceStack } from "../lib/productServiceStack"
import { Match, Template } from "aws-cdk-lib/assertions"

describe('ProductService stack test', () => {
  let productServiceStackTemplate: Template;

  beforeAll(() => {
    const testApp = new App({ outdir: 'cdk.out' });
    const productServiceStack = new ProductServiceStack(testApp, 'ProductServiceStack')
    productServiceStackTemplate = Template.fromStack(productServiceStack);
  })


  test('Stack has getProductList lambda', () => {
    productServiceStackTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'getProductsList.handler',
    });
  })

  test('Stack has getProductsById lambda', () => {
    productServiceStackTemplate.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'getProductsById.handler',
    });
  })

  test('REST API should has GET /products endpoint', () => {
    productServiceStackTemplate.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: "products",
      RestApiId: Match.objectEquals({
        Ref: Match.stringLikeRegexp("ShopAPI") 
      })
    })
  })

  test('REST API should has GET /products/{productId} endpoint', () => {
    productServiceStackTemplate.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: "{productId}",
      ParentId: Match.objectEquals({
        Ref: Match.stringLikeRegexp("ShopAPIproducts")
      }),
      RestApiId: Match.objectEquals({
        Ref: Match.stringLikeRegexp("ShopAPI") 
      })
    })
  })

  test.only('foo', () => {
    const lambda = productServiceStackTemplate.findResources('AWS::Lambda::Function')

    console.log(lambda)
  })
})
