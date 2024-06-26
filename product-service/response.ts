export const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
  'Access-Control-Max-Age': 2592000,
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json',
}   

export function apiSuccessResponse(payload?: Record<string, any>) {
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(payload),
  }
}

export function apiCreateResponse() {
  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({ message: 'Success' })
  }
}

export function apiNotFoundError(message = 'Not found') {
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ message }),
  }
}

export function apiBadRequestError(message = 'Bad request') {
  return {
    statusCode: 400,
    headers,
    body: JSON.stringify({ message }),
  }
}

export function apiInternalServerError(message = 'Internal server error') {
  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({ message }),
  }
}

