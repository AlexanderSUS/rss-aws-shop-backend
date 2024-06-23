import { randomUUID } from 'crypto';
import { CreateProductBody } from '../product-service/types';

export function createCreateProductBody(): CreateProductBody {
  const uuid = randomUUID();

  return {
    title: `Product ${uuid}`,
    description: `Product ${uuid} description`,
    price: 100,
    count: 10
  }
}