export type Product = {
  id: string;
  title: string;
  price: number;
  description: string; 
}

export type StockItem = {
  product_id: string;
  count: number;
}

export type AvailableProduct = Product & Pick<StockItem, 'count'>;

export type CreateProductBody = Omit<Product, 'id'> & Pick<StockItem, 'count'>;
