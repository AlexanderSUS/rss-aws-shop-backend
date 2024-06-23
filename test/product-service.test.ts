import { APIGatewayEvent } from 'aws-lambda';
import { handler as getProductById } from '../product-service/getProductById';
import { handler as getProductList } from '../product-service/getProductsList';
import { handler as createProduct } from '../product-service/createProduct';
import { mockApiGatewayEvent } from './mock-api-gateway-event';
import { createStockTable } from './create-stock-table';
import { createProductTable } from './create-product-table';
import { DeleteTableCommand, DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { seedProducts } from './seed-products';
import { AvailableProduct, CreateProductBody } from '../product-service/types';
import { randomUUID } from 'crypto';
import { createCreateProductBody } from './create-create-product-body';
import { ProductServiceTable } from '../product-service/enums';
import { headers } from '../product-service/response';
import { clientConfig } from '../product-service/clientConfig';

const PRODUCTS_LENGTH = 10;

const client = new DynamoDBClient({
  endpoint: process.env.DB_HOST,
  region: 'us-east-1'
});

beforeEach(async () => {
  await createProductTable(client);
  await createStockTable(client);
});

afterEach(async () => {
  jest.restoreAllMocks();

  await client.send(new DeleteTableCommand({
    TableName: ProductServiceTable.product
  }))

  await client.send(new DeleteTableCommand({
    TableName: ProductServiceTable.stock
  }))
})

 describe('getProductById', () => {
  let products: AvailableProduct[];

  beforeEach(async () => {
    [products] = await seedProducts(client);
  })

  test('should return 200 status code on existent id', async() => {
    const res = await getProductById(
    {
        ...mockApiGatewayEvent as unknown as  APIGatewayEvent, 
        pathParameters: { productId: products[0].id} 
      }, 
    );

    expect(res.statusCode).toBe(200);
    expect(res.headers).toEqual(headers);
  })

  test('should return proper product object', async () => {
    const [expectedProduct] = products;

    const res = await getProductById(
    {
        ...mockApiGatewayEvent as unknown as  APIGatewayEvent, 
        pathParameters: { productId: expectedProduct.id } 
      }, 
    );

    const product = JSON.parse(res.body);

    expect(Object.keys(product)).toHaveLength(5)

    expect(product).toHaveProperty('id', expectedProduct.id);
    expect(product).toHaveProperty('title', expectedProduct.title);
    expect(product).toHaveProperty('description', expectedProduct.description);
    expect(product).toHaveProperty('price', expectedProduct.price);
    expect(product).toHaveProperty('count', expectedProduct.count)
  });

  test('should return 404 status code if product not found', async() => {
    const res = await getProductById(
    {
        ...mockApiGatewayEvent as unknown as  APIGatewayEvent, 
        pathParameters: { productId: randomUUID() } 
      }, 
    );

    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(404);
    expect(res.headers).toEqual(headers);
    expect(body).toHaveProperty('message', 'Product not found');
  });


  // TODO check with empty database
  test('should return 400 status code on invalid id', async() => {
    const res = await getProductById({
        ...mockApiGatewayEvent as unknown as  APIGatewayEvent, 
        pathParameters: { productId: 'foo'} 
      }, 
    );

    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(400);
    expect(res.headers).toEqual(headers);
    expect(body).toHaveProperty('message', 'Invalid product id');
  })

  test('should return 500 statusCode if database connection is broken', async () => {
    jest.replaceProperty(clientConfig, 'endpoint', undefined)
    
    const res = await getProductById({
        ...mockApiGatewayEvent as unknown as  APIGatewayEvent, 
        pathParameters: { productId: 'ad6c058b-749a-4ddc-93cf-15b262efd2a2'} 
      }, 
    );

    expect(res.statusCode).toBe(500);
  })
})

describe('getProductsList', () => {
  test('should return 200 status code on success response', async () => {
    await seedProducts(client);

    const res = await getProductList({} as unknown as APIGatewayEvent);

    expect(res.statusCode).toBe(200);
  });

  test('should return list of products on success response', async () => {
    await seedProducts(client);

    const res = await getProductList({} as unknown as APIGatewayEvent);

    const products = JSON.parse(res.body);

    expect(products).toHaveLength(PRODUCTS_LENGTH);
  });

  test('should return products with proper fields', async () => {
    await seedProducts(client);

    const res = await getProductList({} as unknown as APIGatewayEvent);

    const [item] = JSON.parse(res.body);

    expect(Object.keys(item)).toHaveLength(5)
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('title');
    expect(item).toHaveProperty('description');
    expect(item).toHaveProperty('price');
    expect(item).toHaveProperty('count');
  });

  test('should return empty array if there are no products', async () => {
    const res = await getProductList({} as unknown as APIGatewayEvent);

    const products = JSON.parse(res.body);

    expect(products).toHaveLength(0);
  });

  test('should return 500 statusCode if database connection is broken', async () => {
    jest.replaceProperty(clientConfig, 'endpoint', undefined)
    
    const res = await getProductList({} as unknown as APIGatewayEvent);

    expect(res.statusCode).toBe(500);
  })
})

describe('createProduct', () => {
  test('should return 201 status code on success', async () => {
    const res = await createProduct({
        ...mockApiGatewayEvent as unknown as  APIGatewayEvent, 
        body: JSON.stringify(createCreateProductBody())
    })

    expect(res.statusCode).toBe(201)
  });

  test(`should create item in ${ProductServiceTable.product} table`, async () => {
    await createProduct({
        ...mockApiGatewayEvent as unknown as  APIGatewayEvent, 
        body: JSON.stringify(createCreateProductBody())
    })

    const command = new ScanCommand({
      TableName: ProductServiceTable.product,
    });

    const response = await client.send(command);

    expect(response.Count).toBe(1);
    expect(response.Items).toHaveLength(1)
  })

  test(`should create item in ${ProductServiceTable.stock} table`, async () => {
    await createProduct({
        ...mockApiGatewayEvent as unknown as  APIGatewayEvent, 
        body: JSON.stringify(createCreateProductBody())
    })

    const command = new ScanCommand({
      TableName: ProductServiceTable.stock,
    });

    const response = await client.send(command);

    expect(response.Count).toBe(1);
    expect(response.Items).toHaveLength(1)
  })

  test.each([
    ['title was not provided', (p: Partial<CreateProductBody>) => delete p.title],
    ['title is not a string', (p: Partial<CreateProductBody>) => p.title = 5 as unknown as string],
    ['price was not provided', (p: Partial<CreateProductBody>) => delete p.price],
    ['price is not a positive value', (p: Partial<CreateProductBody>) => p.price = -10],
    ['descriptions is not a string', (p: Partial<CreateProductBody>) => p.description = null as unknown as string],
    ['count was not provided', (p: Partial<CreateProductBody>) => delete p.count],
    ['count less than 0', (p: Partial<CreateProductBody>) => p.count = -10],
    ['count is not integer number', (p: Partial<CreateProductBody>) => p.count = 1.03],
  ])('should return 400 error if %s', async (condition, mutateFn) => {
    const product = createCreateProductBody()
    mutateFn(product)

    const res = await createProduct({
        ...mockApiGatewayEvent as unknown as  APIGatewayEvent, 
        body: JSON.stringify(product)
    })

    expect(res.statusCode).toBe(400)
  })

  test('should return 500 statusCode if database connection is broken', async () => {
    jest.replaceProperty(clientConfig, 'endpoint', undefined)
    
    const res = await createProduct({
        ...mockApiGatewayEvent as unknown as  APIGatewayEvent, 
        body: JSON.stringify(createCreateProductBody())
    })

    expect(res.statusCode).toBe(500);
  })
})
