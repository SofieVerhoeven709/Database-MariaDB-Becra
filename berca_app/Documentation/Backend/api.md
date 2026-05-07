# API Documentation

## API Structure

API routes are located in:

```txt
src/app/api/
```

---

# Example Endpoint

## GET /api/departments

### Response

```json
[
  {
    "id": 1,
    "name": "HR"
  }
]
```

---

## Error Codes

| Code | Meaning |
|---|---|
| 401 | Unauthorized |
| 404 | Not found |
| 500 | Internal server error |

---

## Rules

- Validate all input
- Sanitize SQL-related input
- Return consistent responses
- Use proper HTTP status codes
```