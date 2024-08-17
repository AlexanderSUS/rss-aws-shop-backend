import { ProductServiceTable } from "../product-service/enums";

process.env.LOCAL_DB_HOST = 'http://localhost:8000';
process.env.AWS_REGION = 'us-east-1';
process.env.PRODUCT_TABLE_NAME = ProductServiceTable.product;
process.env.STOCK_TABLE_NAME = ProductServiceTable.stock;
process.env.BUCKET = 'mybucket';
