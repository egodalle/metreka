# GrowthPulse FastAPI Backend

Multi-store e-commerce analytics API supporting Shopify, Lazada, and Shopee.

## Quick Start

### Local Development

1. **Create virtual environment:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Run the server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

5. **View API docs:**
   Open http://localhost:8000/docs

### Deploy to Google Cloud Run

1. **Build and push container:**
   ```bash
   # Set your project ID
   export PROJECT_ID=your-gcp-project-id
   
   # Build container
   gcloud builds submit --tag gcr.io/$PROJECT_ID/growthpulse-api
   
   # Deploy to Cloud Run
   gcloud run deploy growthpulse-api \
     --image gcr.io/$PROJECT_ID/growthpulse-api \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "SUPABASE_URL=https://kqymzqqqkzuezgkbhexc.supabase.co" \
     --set-secrets "SUPABASE_SERVICE_ROLE_KEY=supabase-service-role:latest,STRIPE_SECRET_KEY=stripe-secret:latest"
   ```

2. **Set secrets in Google Cloud Secret Manager:**
   ```bash
   # Create secrets
   echo -n "your_supabase_service_role_key" | gcloud secrets create supabase-service-role --data-file=-
   echo -n "your_stripe_secret_key" | gcloud secrets create stripe-secret --data-file=-
   
   # Grant access to Cloud Run
   gcloud secrets add-iam-policy-binding supabase-service-role \
     --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

## API Endpoints

### Health
- `GET /health` - Health check

### Dashboard
- `GET /api/v1/dashboard?period=7d&store=shopify` - Full dashboard data

### Store Connections
- `GET /api/v1/stores` - List connected stores
- `POST /api/v1/stores` - Connect new store
- `DELETE /api/v1/stores/{store_id}` - Disconnect store

### Sync
- `POST /api/v1/sync/{store_id}` - Trigger data sync

### Statistics
- `GET /api/v1/stats` - Overall statistics

## Authentication

All endpoints (except health) require a valid Supabase JWT token in the Authorization header:

```
Authorization: Bearer <supabase_access_token>
```

## Store Integration Setup

### Shopify

1. Create a Shopify Partner account
2. Create a custom app or public app
3. Configure OAuth callback URL: `https://your-api.com/api/v1/oauth/shopify/callback`
4. Request these scopes: `read_orders`, `read_products`, `read_customers`

### Lazada

1. Register at Lazada Open Platform
2. Create an application
3. Configure OAuth callback URL: `https://your-api.com/api/v1/oauth/lazada/callback`

### Shopee

1. Register at Shopee Partner Center
2. Create a partner application
3. Configure OAuth callback URL: `https://your-api.com/api/v1/oauth/shopee/callback`

## Database Schema

The backend uses these Supabase tables:
- `profiles` - User profiles
- `subscriptions` - Stripe subscription data
- `store_connections` - Connected store credentials
- `orders` - Synced orders from all platforms
- `products` - Synced products
- `customers` - Synced customers
- `daily_analytics` - Aggregated daily metrics
- `sync_logs` - Sync job history

## Subscription Limits

| Plan    | Stores | Features |
|---------|--------|----------|
| Starter | 1      | Basic analytics, 7-day history |
| Growth  | 3      | Advanced analytics, 30-day history |
| Scale   | ∞      | Full suite, real-time sync |
