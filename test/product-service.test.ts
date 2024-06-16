import { APIGatewayEvent } from 'aws-lambda';
import { handler as getProductsById } from '../product-service/getProductsById'
import { handler as getProductList } from '../product-service/getProductsList'
import { mockApiGatewayEvent } from './mock-api-gateway-event';

const MOCKED_PRODUCTS_LENGTH = 3;

const TEST_PRODUCT = {
  id: '1',
  name: 'Product 1',
  price: 100,
}

describe('getProductsById', () => {
  test('should return 200 status code on existent id', async() => {
    const res = await getProductsById(
    {
        ...mockApiGatewayEvent as unknown as  APIGatewayEvent, 
        pathParameters: { id: TEST_PRODUCT.id} 
      }, 
    );

    expect(res.statusCode).toBe(200);
    expect(res.headers).toEqual({ "Content-Type": "application/json" });

    const body = JSON.parse(res.body);
    expect(body).toEqual(TEST_PRODUCT)
  })

  test('should return proper product object', async () => {
    const res = await getProductsById(
    {
        ...mockApiGatewayEvent as unknown as  APIGatewayEvent, 
        pathParameters: { id: TEST_PRODUCT.id} 
      }, 
    );

    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('id', TEST_PRODUCT.id);
    expect(body).toHaveProperty('name', TEST_PRODUCT.name);
    expect(body).toHaveProperty('price', TEST_PRODUCT.price);
  });

  test('should return 404 status code if product not found', async() => {
    const res = await getProductsById(
    {
        ...mockApiGatewayEvent as unknown as  APIGatewayEvent, 
        pathParameters: { id: '5' } 
      }, 
    );

    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(404);
    expect(res.headers).toEqual({ "Content-Type": "application/json" });
    expect(body).toHaveProperty('message', 'Product not found');
  })
})

describe('getProductsList', () => {
  test('should return 200 status code on success response', async () => {
    const res = await getProductList(mockApiGatewayEvent as unknown as APIGatewayEvent);

    expect(res.statusCode).toBe(200);
  });

  test('should return list of products on success response', async () => {
    const res = await getProductList(mockApiGatewayEvent as unknown as APIGatewayEvent);

    const products = JSON.parse(res.body);

    expect(products).toHaveLength(MOCKED_PRODUCTS_LENGTH);
  });
})