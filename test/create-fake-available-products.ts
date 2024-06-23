import { randomUUID } from 'crypto';
import { AvailableProduct } from "../product-service/types";

export function createFakeAvailableProducts(length = 10): AvailableProduct[] {
  return Array(length).fill(null).map((_, i) => ({
    id: randomUUID(),
    title: `Product ${i}`,
    description:  `Product ${i} description`,
    price: i * 100 ,
    count: i
  }))
}

