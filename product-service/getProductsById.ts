import { APIGatewayEvent } from "aws-lambda";
type APIGatewayEventWithPathParams = APIGatewayEvent & { pathParameters: { id: string }};

export const handler = async (event:  APIGatewayEventWithPathParams) => {
  const mockProducts = [
    { id: "1", name: "Product 1", price: 100 },
    { id: "2", name: "Product 2", price: 200 },
    { id: "3", name: "Product 3", price: 300 }
  ];

  const { id } = event.pathParameters;

  const product = mockProducts.find((item) => item.id === id)

  if (product === undefined)  {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Product not found"
      }),
    };
  }
  
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product), 
  };
};