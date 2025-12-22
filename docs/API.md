# API Reference

Base URL (dev): `http://localhost:8080/api`

## GET /hello
- **Description**: Returns a static greeting.
- **Response 200**
```json
{ "text": "Hello, World!" }
```

## POST /greet
- **Description**: Returns a personalized greeting.
- **Request Body**
```json
{ "name": "홍길동" }
```
- **Responses**
  - `200 OK`
    ```json
    { "text": "안녕하세요, 홍길동!" }
    ```
  - `400 Bad Request`
    ```json
    { "text": "이름을 입력해주세요." }
    ```

## CORS & Methods
- CORS allows all origins with `Content-Type` header; `OPTIONS` preflight is supported.
- Unsupported methods return `405 Method Not Allowed` with a JSON message.

## Frontend Consumption
- Default base: `http://localhost:8080/api`.
- Override with environment variable in `front/.env`:
  ```env
  REACT_APP_API_BASE=http://localhost:8080/api
  ```
