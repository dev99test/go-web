# API Reference

Base URL (dev): `http://localhost:8080/api`

## GET /hello
Returns a static greeting.

**Response 200**
```json
{ "text": "Hello, World!" }
```

## POST /greet
Returns a personalized greeting.

**Request Body**
```json
{ "name": "홍길동" }
```

**Responses**
- `200 OK`
  ```json
  { "text": "안녕하세요, 홍길동!" }
  ```
- `400 Bad Request`
  ```json
  { "text": "이름을 입력해주세요." }
  ```
