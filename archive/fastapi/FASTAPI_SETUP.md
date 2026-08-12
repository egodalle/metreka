# FastAPI Backend Setup Guide

This guide explains how to set up your FastAPI backend to work with the StoreFlow UI.

## Required Endpoints

Your FastAPI backend should implement these endpoints:

### Health Check
```
GET /health
Response: { "status": "ok", "database": "connected" }
```

### Dashboard (All-in-one)
```
GET /api/dashboard?period=7d&store=shopify
Response: {
  "kpis": [...],
  "recentOrders": [...],
  "topProducts": [...],
  "revenueTimeline": [...],
  "storeBreakdown": [...]
}
```

### KPIs
```
GET /api/kpis?period=7d&store=shopify
Response: [
  {
    "id": "revenue",
    "name": "Total Revenue",
    "value": 125430.50,
    "previousValue": 98200.00,
    "change": 27.7,
    "changeType": "increase"
  },
  ...
]
```

### Orders
```
GET /api/orders?limit=10&offset=0&store=shopify&status=pending
Response: {
  "orders": [
    {
      "id": "ord_123",
      "orderNumber": "SF-1234",
      "customer": "John Doe",
      "email": "john@example.com",
      "store": "shopify",
      "status": "processing",
      "total": 149.99,
      "items": 3,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    ...
  ],
  "total": 1523
}
```

### Products
```
GET /api/products/top?limit=5&store=shopify&period=7d
Response: [
  {
    "id": "prod_123",
    "name": "Premium Widget",
    "sku": "PWG-001",
    "store": "shopify",
    "revenue": 12500.00,
    "unitsSold": 250,
    "inventory": 45,
    "imageUrl": "https://..."
  },
  ...
]
```

### Revenue Timeline
```
GET /api/revenue/timeline?period=7d&store=shopify
Response: [
  { "date": "2024-01-15", "revenue": 5430.50, "orders": 42 },
  { "date": "2024-01-16", "revenue": 6200.00, "orders": 51 },
  ...
]
```

## FastAPI Example Implementation

```python
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import psycopg2
from datetime import datetime, timedelta

app = FastAPI()

# CORS - Allow Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection (from your dbt/Airbyte pipeline)
def get_db():
    return psycopg2.connect(
        host="localhost",
        database="storeflow",
        user="your_user",
        password="your_password"
    )

@app.get("/health")
def health_check():
    try:
        conn = get_db()
        conn.close()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}

@app.get("/api/kpis")
def get_kpis(
    period: str = Query("7d"),
    store: Optional[str] = None
):
    # Query your dbt-transformed tables
    # Example: SELECT * FROM analytics.kpis WHERE ...
    return [
        {
            "id": "revenue",
            "name": "Total Revenue",
            "value": 125430.50,
            "change": 12.5,
            "changeType": "increase"
        },
        # ... more KPIs
    ]

@app.get("/api/orders")
def get_orders(
    limit: int = Query(10),
    offset: int = Query(0),
    store: Optional[str] = None,
    status: Optional[str] = None
):
    # Query your orders table
    return {
        "orders": [...],
        "total": 1523
    }

# ... implement other endpoints
```

## Environment Variable

Set the API URL in your environment:

```bash
# In your terminal or .env.local (for Vite)
VITE_API_URL=http://localhost:8000
```

## Running

1. Start your FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

2. Start the Vite dev server:
   ```bash
   npm run dev
   ```

3. The UI will connect to your FastAPI backend automatically.
