#!/bin/bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d @- <<EOF | jq
{
  "email": "demo@outlook.com",
  "password": "DemoPass123!"
}
EOF