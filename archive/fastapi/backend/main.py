"""
GrowthPulse FastAPI Backend
Multi-store e-commerce analytics API supporting Shopify, Lazada, and Shopee

Run with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, Depends, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from enum import Enum
import os
import httpx
from contextlib import asynccontextmanager

# Database connection (PostgreSQL via Supabase)
from supabase import create_client, Client

# ============================================
# Configuration
# ============================================

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://wwxhmxrsrqlirjfbmnsk.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Store platform API configurations
SHOPIFY_API_VERSION = "2024-01"
LAZADA_API_URL = "https://api.lazada.com/rest"
SHOPEE_API_URL = "https://partner.shopeemobile.com/api/v2"


def get_supabase() -> Client:
    """Get Supabase client with service role for backend operations"""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle"""
    print("🚀 GrowthPulse API starting...")
    yield
    print("👋 GrowthPulse API shutting down...")


app = FastAPI(
    title="GrowthPulse API",
    description="Multi-store e-commerce analytics backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8080",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Enums & Models
# ============================================

class StorePlatform(str, Enum):
    SHOPIFY = "shopify"
    LAZADA = "lazada"
    SHOPEE = "shopee"
    TIKTOK = "tiktok"
    AMAZON = "amazon"


class StoreConnectionCreate(BaseModel):
    platform: StorePlatform
    store_name: str
    store_url: Optional[str] = None
    access_token: str
    refresh_token: Optional[str] = None
    shop_id: Optional[str] = None


class StoreConnection(BaseModel):
    id: str
    user_id: str
    platform: StorePlatform
    store_name: str
    store_url: Optional[str]
    is_active: bool
    last_sync_at: Optional[datetime]
    sync_status: str
    created_at: datetime


class KPI(BaseModel):
    id: str
    name: str
    value: float
    previous_value: Optional[float] = None
    change: Optional[float] = None
    change_type: Optional[str] = None  # "increase" or "decrease"


class Order(BaseModel):
    id: str
    order_number: str
    customer_name: Optional[str]
    customer_email: Optional[str]
    platform: StorePlatform
    status: str
    total_amount: float
    items_count: int
    order_date: datetime


class Product(BaseModel):
    id: str
    title: str
    sku: Optional[str]
    platform: StorePlatform
    price: float
    inventory_quantity: int
    image_url: Optional[str]


class DailySummary(BaseModel):
    date: str
    revenue: float
    orders_count: int
    avg_order_value: float


class DashboardData(BaseModel):
    kpis: List[KPI]
    recent_orders: List[Order]
    top_products: List[Product]
    revenue_timeline: List[DailySummary]
    store_breakdown: List[dict]


# ============================================
# Authentication Dependency
# ============================================

async def get_current_user(authorization: str = Header(...)):
    """Verify JWT token and return user"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    supabase = get_supabase()
    
    try:
        # Verify the token with Supabase
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


# ============================================
# Health & System Endpoints
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        supabase = get_supabase()
        # Simple query to verify database connection
        supabase.table("profiles").select("id").limit(1).execute()
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected",
        }
    except Exception as e:
        return {
            "status": "degraded",
            "timestamp": datetime.utcnow().isoformat(),
            "database": f"error: {str(e)}",
        }


# ============================================
# Store Connection Endpoints
# ============================================

@app.get("/api/v1/stores", response_model=List[StoreConnection])
async def list_store_connections(user=Depends(get_current_user)):
    """List all store connections for the current user"""
    supabase = get_supabase()
    result = supabase.table("store_connections")\
        .select("*")\
        .eq("user_id", user.id)\
        .eq("is_active", True)\
        .execute()
    return result.data


@app.post("/api/v1/stores", response_model=StoreConnection)
async def create_store_connection(
    store: StoreConnectionCreate,
    user=Depends(get_current_user)
):
    """Create a new store connection"""
    supabase = get_supabase()
    
    # Check subscription store limit
    sub_result = supabase.table("subscriptions")\
        .select("plan_name")\
        .eq("user_id", user.id)\
        .eq("status", "active")\
        .single()\
        .execute()
    
    store_limits = {"starter": 1, "growth": 3, "scale": -1}
    current_plan = sub_result.data.get("plan_name", "free") if sub_result.data else "free"
    limit = store_limits.get(current_plan, 0)
    
    if limit != -1:
        count_result = supabase.table("store_connections")\
            .select("id", count="exact")\
            .eq("user_id", user.id)\
            .eq("is_active", True)\
            .execute()
        
        if count_result.count >= limit:
            raise HTTPException(
                status_code=403,
                detail=f"Store limit reached. Your {current_plan} plan allows {limit} store(s). Upgrade to add more."
            )
    
    # Create the connection
    result = supabase.table("store_connections").insert({
        "user_id": user.id,
        "platform": store.platform.value,
        "store_name": store.store_name,
        "store_url": store.store_url,
        "access_token": store.access_token,  # Should be encrypted in production
        "refresh_token": store.refresh_token,
        "shop_id": store.shop_id,
        "sync_status": "pending",
    }).execute()
    
    return result.data[0]


@app.delete("/api/v1/stores/{store_id}")
async def delete_store_connection(store_id: str, user=Depends(get_current_user)):
    """Soft delete a store connection"""
    supabase = get_supabase()
    result = supabase.table("store_connections")\
        .update({"is_active": False})\
        .eq("id", store_id)\
        .eq("user_id", user.id)\
        .execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Store connection not found")
    
    return {"message": "Store connection removed"}


# ============================================
# Dashboard & Analytics Endpoints
# ============================================

@app.get("/api/v1/dashboard", response_model=DashboardData)
async def get_dashboard(
    period: str = Query("7d", regex="^(7d|30d|90d|1y)$"),
    store: Optional[str] = None,
    user=Depends(get_current_user)
):
    """Get complete dashboard data"""
    supabase = get_supabase()
    
    # Calculate date range
    days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
    days = days_map.get(period, 7)
    start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
    
    # Build base query filters
    base_filter = {"user_id": user.id}
    if store:
        base_filter["platform"] = store
    
    # Fetch orders
    orders_query = supabase.table("orders")\
        .select("*")\
        .eq("user_id", user.id)\
        .gte("order_date", start_date)\
        .order("order_date", desc=True)
    
    if store:
        orders_query = orders_query.eq("platform", store)
    
    orders_result = orders_query.limit(100).execute()
    orders = orders_result.data or []
    
    # Calculate KPIs
    total_revenue = sum(o.get("total_amount", 0) for o in orders)
    total_orders = len(orders)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    # Previous period for comparison
    prev_start = (datetime.utcnow() - timedelta(days=days * 2)).isoformat()
    prev_end = start_date
    
    prev_orders_query = supabase.table("orders")\
        .select("total_amount")\
        .eq("user_id", user.id)\
        .gte("order_date", prev_start)\
        .lt("order_date", prev_end)
    
    if store:
        prev_orders_query = prev_orders_query.eq("platform", store)
    
    prev_orders_result = prev_orders_query.execute()
    prev_orders = prev_orders_result.data or []
    prev_revenue = sum(o.get("total_amount", 0) for o in prev_orders)
    
    revenue_change = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
    
    kpis = [
        KPI(
            id="revenue",
            name="Total Revenue",
            value=total_revenue,
            previous_value=prev_revenue,
            change=round(revenue_change, 2),
            change_type="increase" if revenue_change >= 0 else "decrease"
        ),
        KPI(
            id="orders",
            name="Total Orders",
            value=total_orders,
            previous_value=len(prev_orders),
            change=round(((total_orders - len(prev_orders)) / len(prev_orders) * 100) if prev_orders else 0, 2),
            change_type="increase" if total_orders >= len(prev_orders) else "decrease"
        ),
        KPI(
            id="aov",
            name="Avg Order Value",
            value=round(avg_order_value, 2),
            change_type="neutral"
        ),
    ]
    
    # Top products
    products_result = supabase.table("products")\
        .select("*")\
        .eq("user_id", user.id)\
        .order("inventory_quantity", desc=True)\
        .limit(5)\
        .execute()
    
    top_products = [
        Product(
            id=p["id"],
            title=p["title"],
            sku=p.get("sku"),
            platform=p["platform"],
            price=p.get("price", 0),
            inventory_quantity=p.get("inventory_quantity", 0),
            image_url=p.get("image_url")
        )
        for p in (products_result.data or [])
    ]
    
    # Recent orders
    recent_orders = [
        Order(
            id=o["id"],
            order_number=o.get("order_number", o["platform_order_id"]),
            customer_name=o.get("customer_name"),
            customer_email=o.get("customer_email"),
            platform=o["platform"],
            status=o.get("status", "unknown"),
            total_amount=o.get("total_amount", 0),
            items_count=o.get("items_count", 0),
            order_date=o["order_date"]
        )
        for o in orders[:10]
    ]
    
    # Daily revenue timeline
    daily_analytics = supabase.table("daily_analytics")\
        .select("*")\
        .eq("user_id", user.id)\
        .gte("date", start_date[:10])\
        .order("date", desc=False)\
        .execute()
    
    revenue_timeline = [
        DailySummary(
            date=d["date"],
            revenue=d.get("revenue", 0),
            orders_count=d.get("orders_count", 0),
            avg_order_value=d.get("average_order_value", 0)
        )
        for d in (daily_analytics.data or [])
    ]
    
    # Store breakdown
    store_breakdown = []
    stores = supabase.table("store_connections")\
        .select("platform")\
        .eq("user_id", user.id)\
        .eq("is_active", True)\
        .execute()
    
    for s in (stores.data or []):
        platform = s["platform"]
        platform_orders = [o for o in orders if o.get("platform") == platform]
        store_breakdown.append({
            "platform": platform,
            "revenue": sum(o.get("total_amount", 0) for o in platform_orders),
            "orders": len(platform_orders),
        })
    
    return DashboardData(
        kpis=kpis,
        recent_orders=recent_orders,
        top_products=top_products,
        revenue_timeline=revenue_timeline,
        store_breakdown=store_breakdown
    )


@app.get("/api/v1/stats")
async def get_stats(user=Depends(get_current_user)):
    """Get overall statistics from synced data tables"""
    supabase = get_supabase()
    
    # Get connected platforms
    stores = supabase.table("store_connections")\
        .select("platform")\
        .eq("user_id", user.id)\
        .eq("is_active", True)\
        .execute()
    
    platforms = [s["platform"] for s in (stores.data or [])]
    
    if not platforms:
        return {
            "success": True,
            "data": {
                "overview": {
                    "total_records": 0,
                    "total_orders": 0,
                    "total_revenue": 0,
                    "total_products": 0,
                    "total_customers": 0,
                    "avg_order_value": 0,
                    "earliest_order": "",
                    "latest_order": "",
                    "platforms": 0,
                },
                "by_source": [],
            }
        }
    
    # Get orders from synced_orders table
    orders = supabase.table("synced_orders")\
        .select("platform, total_amount, order_date, quantity")\
        .eq("user_id", user.id)\
        .in_("platform", platforms)\
        .execute()
    
    # Get products count
    products = supabase.table("synced_products")\
        .select("id", count="exact")\
        .eq("user_id", user.id)\
        .in_("platform", platforms)\
        .execute()
    
    # Get customers count
    customers = supabase.table("synced_customers")\
        .select("id", count="exact")\
        .eq("user_id", user.id)\
        .in_("platform", platforms)\
        .execute()
    
    order_data = orders.data or []
    total_revenue = sum(float(o.get("total_amount", 0) or 0) for o in order_data)
    unique_order_keys = {
        f"{o.get('platform')}:{o.get('external_order_id')}"
        for o in order_data
        if o.get("external_order_id")
    }
    total_orders = len(unique_order_keys)
    
    # Get date range
    dates = [o["order_date"] for o in order_data if o.get("order_date")]
    dates.sort()
    
    # Group by platform
    by_source = []
    for platform in platforms:
        platform_orders = [o for o in order_data if o.get("platform") == platform]
        platform_order_keys = {
            f"{o.get('platform')}:{o.get('external_order_id')}"
            for o in platform_orders
            if o.get("external_order_id")
        }
        by_source.append({
            "source": platform,
            "orders": len(platform_order_keys),
            "revenue": sum(float(o.get("total_amount", 0) or 0) for o in platform_orders),
        })
    
    return {
        "success": True,
        "data": {
            "overview": {
                "total_records": total_orders,
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "total_products": products.count or 0,
                "total_customers": customers.count or 0,
                "avg_order_value": total_revenue / total_orders if total_orders > 0 else 0,
                "earliest_order": dates[0] if dates else "",
                "latest_order": dates[-1] if dates else "",
                "platforms": len(platforms),
            },
            "by_source": by_source,
        }
    }


@app.get("/api/v1/sales/summary")
async def get_sales_summary(
    group_by: str = Query("source", regex="^(source|day|month|status)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user=Depends(get_current_user)
):
    """Get sales summary grouped by dimension from synced data"""
    supabase = get_supabase()
    
    # Get connected platforms
    stores = supabase.table("store_connections")\
        .select("platform")\
        .eq("user_id", user.id)\
        .eq("is_active", True)\
        .execute()
    
    platforms = [s["platform"] for s in (stores.data or [])]
    
    if not platforms:
        return {"success": True, "group_by": group_by, "data": []}
    
    # Build query
    query = supabase.table("synced_orders")\
        .select("platform, order_date, total_amount, quantity, order_status")\
        .eq("user_id", user.id)\
        .in_("platform", platforms)
    
    if start_date:
        query = query.gte("order_date", start_date)
    if end_date:
        query = query.lte("order_date", end_date)
    
    orders = query.execute()
    order_data = orders.data or []
    
    # Group by dimension
    grouped: dict[str, dict] = {}
    for order in order_data:
        if group_by == "source":
            key = order.get("platform", "unknown")
        elif group_by == "day":
            key = (order.get("order_date") or "")[:10]
        elif group_by == "month":
            key = (order.get("order_date") or "")[:7]
        elif group_by == "status":
            key = order.get("order_status", "unknown")
        else:
            key = "unknown"

        if key not in grouped:
            grouped[key] = {"order_keys": set(), "units": 0, "sales": 0, "dates": []}

        order_key = f"{order.get('platform')}:{order.get('external_order_id')}"
        if order.get("external_order_id"):
            grouped[key]["order_keys"].add(order_key)
        grouped[key]["units"] += order.get("quantity", 0) or 0
        grouped[key]["sales"] += float(order.get("total_amount", 0) or 0)
        if order.get("order_date"):
            grouped[key]["dates"].append(order["order_date"])
    
    # Format response
    data = []
    for dimension, stats in grouped.items():
        if dimension and dimension != "unknown":
            stats["dates"].sort()
            order_count = len(stats["order_keys"])
            data.append({
                "dimension": dimension,
                "total_orders": order_count,
                "total_units": stats["units"],
                "total_sales": stats["sales"],
                "avg_order_value": stats["sales"] / order_count if order_count > 0 else 0,
                "earliest_order": stats["dates"][0] if stats["dates"] else "",
                "latest_order": stats["dates"][-1] if stats["dates"] else "",
            })
    
    # Sort by dimension
    data.sort(key=lambda x: x["dimension"])
    
    return {"success": True, "group_by": group_by, "data": data}


@app.get("/api/v1/sales")
async def get_sales(
    source: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    order_status: Optional[str] = None,
    limit: int = Query(100, le=1000),
    offset: int = Query(0),
    user=Depends(get_current_user)
):
    """Get sales records from synced data with filters"""
    supabase = get_supabase()
    
    # Get connected platforms
    stores = supabase.table("store_connections")\
        .select("platform")\
        .eq("user_id", user.id)\
        .eq("is_active", True)\
        .execute()
    
    platforms = [s["platform"] for s in (stores.data or [])]
    
    if not platforms:
        return {
            "success": True,
            "data": [],
            "metadata": {"total": 0, "limit": limit, "offset": offset, "count": 0}
        }
    
    # Build query
    query = supabase.table("synced_orders")\
        .select("*", count="exact")\
        .eq("user_id", user.id)
    
    if source:
        query = query.eq("platform", source)
    else:
        query = query.in_("platform", platforms)
    
    if start_date:
        query = query.gte("order_date", start_date)
    if end_date:
        query = query.lte("order_date", end_date)
    if order_status:
        query = query.eq("order_status", order_status)
    
    query = query.order("order_date", desc=True).range(offset, offset + limit - 1)
    
    result = query.execute()
    order_data = result.data or []
    
    # Transform to SalesRecord format
    sales_records = [
        {
            "source": o["platform"],
            "order_id": o["external_order_id"],
            "order_date": o["order_date"],
            "customer_id": o.get("customer_id"),
            "customer_name": o.get("customer_name"),
            "customer_email": o.get("customer_email"),
            "product_id": o.get("product_id"),
            "product_name": o.get("product_name"),
            "quantity": o.get("quantity"),
            "unit_price": float(o.get("unit_price", 0) or 0),
            "total_amount": float(o.get("total_amount", 0) or 0),
            "currency": o.get("currency"),
            "order_status": o.get("order_status"),
            "payment_method": o.get("payment_status"),
            "shipping_address": None,
            "created_at": o.get("created_at"),
            "updated_at": o.get("updated_at"),
        }
        for o in order_data
    ]
    
    return {
        "success": True,
        "data": sales_records,
        "metadata": {
            "total": result.count or 0,
            "limit": limit,
            "offset": offset,
            "count": len(sales_records),
        }
    }


# ============================================
# Platform-Specific Sync Endpoints
# ============================================

@app.post("/api/v1/sync/{store_id}")
async def trigger_sync(store_id: str, user=Depends(get_current_user)):
    """Trigger a sync for a specific store"""
    supabase = get_supabase()
    
    # Get store connection
    store = supabase.table("store_connections")\
        .select("*")\
        .eq("id", store_id)\
        .eq("user_id", user.id)\
        .single()\
        .execute()
    
    if not store.data:
        raise HTTPException(status_code=404, detail="Store connection not found")
    
    platform = store.data["platform"]
    
    # Create sync log entry
    sync_log = supabase.table("sync_logs").insert({
        "store_connection_id": store_id,
        "user_id": user.id,
        "sync_type": "full",
        "status": "started",
    }).execute()
    
    # Update store sync status
    supabase.table("store_connections")\
        .update({"sync_status": "syncing"})\
        .eq("id", store_id)\
        .execute()
    
    try:
        if platform == "shopify":
            await sync_shopify_store(store.data, user.id, supabase)
        elif platform == "lazada":
            await sync_lazada_store(store.data, user.id, supabase)
        elif platform == "shopee":
            await sync_shopee_store(store.data, user.id, supabase)
        
        # Update sync log
        supabase.table("sync_logs")\
            .update({
                "status": "completed",
                "completed_at": datetime.utcnow().isoformat()
            })\
            .eq("id", sync_log.data[0]["id"])\
            .execute()
        
        supabase.table("store_connections")\
            .update({
                "sync_status": "completed",
                "last_sync_at": datetime.utcnow().isoformat()
            })\
            .eq("id", store_id)\
            .execute()
        
        return {"message": "Sync completed successfully"}
        
    except Exception as e:
        supabase.table("sync_logs")\
            .update({
                "status": "failed",
                "error_message": str(e),
                "completed_at": datetime.utcnow().isoformat()
            })\
            .eq("id", sync_log.data[0]["id"])\
            .execute()
        
        supabase.table("store_connections")\
            .update({"sync_status": "failed"})\
            .eq("id", store_id)\
            .execute()
        
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


# ============================================
# Platform Sync Functions
# ============================================

async def sync_shopify_store(store: dict, user_id: str, supabase: Client):
    """Sync data from Shopify store"""
    access_token = store["access_token"]
    store_url = store["store_url"]  # e.g., "mystore.myshopify.com"
    
    headers = {
        "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json",
    }
    
    async with httpx.AsyncClient() as client:
        # Fetch orders
        orders_url = f"https://{store_url}/admin/api/{SHOPIFY_API_VERSION}/orders.json?status=any&limit=250"
        orders_response = await client.get(orders_url, headers=headers)
        orders_response.raise_for_status()
        orders_data = orders_response.json().get("orders", [])
        
        for order in orders_data:
            supabase.table("orders").upsert({
                "store_connection_id": store["id"],
                "user_id": user_id,
                "platform": "shopify",
                "platform_order_id": str(order["id"]),
                "order_number": order.get("name", order.get("order_number")),
                "customer_name": order.get("customer", {}).get("first_name", "") + " " + order.get("customer", {}).get("last_name", ""),
                "customer_email": order.get("customer", {}).get("email"),
                "status": order.get("financial_status", "unknown"),
                "subtotal": float(order.get("subtotal_price", 0)),
                "shipping_total": float(order.get("total_shipping_price_set", {}).get("shop_money", {}).get("amount", 0)),
                "tax_total": float(order.get("total_tax", 0)),
                "discount_total": float(order.get("total_discounts", 0)),
                "total_amount": float(order.get("total_price", 0)),
                "currency": order.get("currency", "USD"),
                "items_count": len(order.get("line_items", [])),
                "order_date": order.get("created_at"),
            }, on_conflict="store_connection_id,platform_order_id").execute()
        
        # Fetch products
        products_url = f"https://{store_url}/admin/api/{SHOPIFY_API_VERSION}/products.json?limit=250"
        products_response = await client.get(products_url, headers=headers)
        products_response.raise_for_status()
        products_data = products_response.json().get("products", [])
        
        for product in products_data:
            variant = product.get("variants", [{}])[0]
            supabase.table("products").upsert({
                "store_connection_id": store["id"],
                "user_id": user_id,
                "platform": "shopify",
                "platform_product_id": str(product["id"]),
                "title": product.get("title"),
                "description": product.get("body_html"),
                "vendor": product.get("vendor"),
                "product_type": product.get("product_type"),
                "status": product.get("status", "active"),
                "price": float(variant.get("price", 0)),
                "compare_at_price": float(variant.get("compare_at_price") or 0),
                "sku": variant.get("sku"),
                "inventory_quantity": variant.get("inventory_quantity", 0),
                "image_url": product.get("images", [{}])[0].get("src") if product.get("images") else None,
                "tags": product.get("tags", "").split(", ") if product.get("tags") else [],
            }, on_conflict="store_connection_id,platform_product_id").execute()
        
        # Fetch customers
        customers_url = f"https://{store_url}/admin/api/{SHOPIFY_API_VERSION}/customers.json?limit=250"
        customers_response = await client.get(customers_url, headers=headers)
        customers_response.raise_for_status()
        customers_data = customers_response.json().get("customers", [])
        
        for customer in customers_data:
            supabase.table("customers").upsert({
                "store_connection_id": store["id"],
                "user_id": user_id,
                "platform": "shopify",
                "platform_customer_id": str(customer["id"]),
                "email": customer.get("email"),
                "first_name": customer.get("first_name"),
                "last_name": customer.get("last_name"),
                "phone": customer.get("phone"),
                "orders_count": customer.get("orders_count", 0),
                "total_spent": float(customer.get("total_spent", 0)),
                "tags": customer.get("tags", "").split(", ") if customer.get("tags") else [],
            }, on_conflict="store_connection_id,platform_customer_id").execute()


async def sync_lazada_store(store: dict, user_id: str, supabase: Client):
    """Sync data from Lazada store"""
    access_token = store["access_token"]
    
    # Lazada API requires signature generation - simplified example
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    
    async with httpx.AsyncClient() as client:
        # Fetch orders from Lazada
        # Note: Lazada API requires specific signature and timestamp
        orders_url = f"{LAZADA_API_URL}/orders/get"
        params = {
            "access_token": access_token,
            "created_after": (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%S+00:00"),
        }
        
        try:
            orders_response = await client.get(orders_url, params=params)
            orders_response.raise_for_status()
            result = orders_response.json()
            
            for order in result.get("data", {}).get("orders", []):
                supabase.table("orders").upsert({
                    "store_connection_id": store["id"],
                    "user_id": user_id,
                    "platform": "lazada",
                    "platform_order_id": str(order["order_id"]),
                    "order_number": order.get("order_number"),
                    "customer_name": order.get("customer_first_name", "") + " " + order.get("customer_last_name", ""),
                    "status": order.get("statuses", ["unknown"])[0] if order.get("statuses") else "unknown",
                    "total_amount": float(order.get("price", 0)),
                    "currency": order.get("currency", "USD"),
                    "items_count": order.get("items_count", 1),
                    "order_date": order.get("created_at"),
                }, on_conflict="store_connection_id,platform_order_id").execute()
        except Exception as e:
            print(f"Lazada sync error: {e}")
            raise


async def sync_shopee_store(store: dict, user_id: str, supabase: Client):
    """Sync data from Shopee store"""
    access_token = store["access_token"]
    shop_id = store.get("shop_id")
    
    if not shop_id:
        raise ValueError("Shop ID is required for Shopee sync")
    
    # Shopee API requires partner key and signature
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    
    async with httpx.AsyncClient() as client:
        # Fetch orders from Shopee
        orders_url = f"{SHOPEE_API_URL}/order/get_order_list"
        params = {
            "shop_id": shop_id,
            "access_token": access_token,
            "time_range_field": "create_time",
            "time_from": int((datetime.utcnow() - timedelta(days=30)).timestamp()),
            "time_to": int(datetime.utcnow().timestamp()),
            "page_size": 100,
        }
        
        try:
            orders_response = await client.get(orders_url, params=params)
            orders_response.raise_for_status()
            result = orders_response.json()
            
            for order in result.get("response", {}).get("order_list", []):
                supabase.table("orders").upsert({
                    "store_connection_id": store["id"],
                    "user_id": user_id,
                    "platform": "shopee",
                    "platform_order_id": order["order_sn"],
                    "order_number": order["order_sn"],
                    "status": order.get("order_status", "unknown"),
                    "total_amount": float(order.get("total_amount", 0)),
                    "currency": order.get("currency", "USD"),
                    "items_count": len(order.get("item_list", [])),
                    "order_date": datetime.fromtimestamp(order.get("create_time", 0)).isoformat(),
                }, on_conflict="store_connection_id,platform_order_id").execute()
        except Exception as e:
            print(f"Shopee sync error: {e}")
            raise


# ============================================
# OAuth Callback Endpoints
# ============================================

@app.get("/api/v1/oauth/shopify/callback")
async def shopify_oauth_callback(
    shop: str,
    code: str,
    state: str,
):
    """Handle Shopify OAuth callback"""
    # In production, exchange code for access token
    # and store in database
    return {"message": "Shopify OAuth callback received", "shop": shop}


@app.get("/api/v1/oauth/lazada/callback")
async def lazada_oauth_callback(code: str):
    """Handle Lazada OAuth callback"""
    return {"message": "Lazada OAuth callback received"}


@app.get("/api/v1/oauth/shopee/callback")
async def shopee_oauth_callback(code: str, shop_id: str):
    """Handle Shopee OAuth callback"""
    return {"message": "Shopee OAuth callback received", "shop_id": shop_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
