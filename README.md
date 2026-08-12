# Metreka

i want you to build me this new project with the detailed plan below:

🚀 E-Commerce Analytics Platform MVP
"DataPulse" - Turn Your Store Data Into Sales Growth
Mission: Empower e-commerce businesses with enterprise-grade analytics at a fraction of the cost

📊 Executive Summary
Product: End-to-end e-commerce analytics platform

Target Market: Small-to-medium e-commerce businesses ($500K - $50M ARR)

Tech Stack: Airbyte OSS → Google BigQuery → DBT → Metabase/Power BI

MVP Timeline: 4 Weeks (Aggressive)

Delivery Model: Platform-as-a-Service with monthly subscription

🎯 MVP Target Completion
| Milestone | Target Date | Status |

|-----------|-------------|--------|

| Phase 1: Infrastructure | Week 1 | ⏳ |

| Phase 2: Data Pipelines | Week 2 | ⏳ |

| Phase 3: Transformations | Week 3 | ⏳ |

| Phase 4: Dashboards | Week 4 | ⏳ |

| 🎉 MVP LAUNCH | Day 28 | 🎯 |

🛒 Supported E-Commerce Platforms (Top 5)
| Platform | Market Share | Airbyte Connector | Priority |

|----------|--------------|-------------------|----------|

| Shopify | 29% | ✅ Native | P0 |

| WooCommerce | 23% | ✅ Native | P0 |

| Amazon Seller Central | 22% | ✅ Native | P1 |

| BigCommerce | 3% | ✅ Native | P1 |

| Magento/Adobe Commerce | 2% | ✅ Native | P2 |

Bonus Integrations (Week 5+):

Google Analytics 4

Facebook/Meta Ads

Google Ads

Stripe/PayPal

Klaviyo/Mailchimp

📅 DETAILED 4-WEEK SPRINT PLAN
══════════════════════════════════════════
🔧 WEEK 1: INFRASTRUCTURE SETUP
══════════════════════════════════════════
Goal: Production-ready infrastructure in 7 days

Day 1-2: Cloud Infrastructure
 Set up GCP project with proper IAM

 Configure BigQuery datasets:

raw_shopify

raw_woocommerce

raw_amazon

raw_bigcommerce

raw_magento

staging

marts

analytics

 Set up Cloud Storage for data lake backup

 Configure VPC and networking

 Set up billing alerts and quotas

Day 3-4: Airbyte OSS Deployment
 Deploy Airbyte on GCP Compute Engine (or GKE for scale)

 Configure Airbyte workspace

 Set up authentication and security

 Create destination connector to BigQuery

 Test connectivity and permissions

 Document deployment process

Day 5-6: DBT Environment
 Initialize DBT project structure

 Configure profiles.yml for BigQuery

 Set up DBT Cloud account (or self-hosted)

 Create CI/CD pipeline (GitHub Actions)

 Configure DBT documentation site

 Set up testing framework

Day 7: Dashboard Infrastructure
 Deploy Metabase (Docker/Cloud)

 Configure BigQuery connection

 Set up user authentication

 Create organization structure

 Design dashboard templates

Week 1 Deliverables:

✅ Airbyte running and connected to BigQuery

✅ DBT project initialized with CI/CD

✅ Metabase deployed and connected

✅ All infrastructure documented

══════════════════════════════════════════
🔌 WEEK 2: DATA PIPELINE DEVELOPMENT
══════════════════════════════════════════
Goal: All 5 e-commerce connectors live and syncing

Day 8-9: Shopify Pipeline
 Configure Shopify source connector

 Define sync streams:

Orders

Products

Customers

Inventory

Transactions

Fulfillments

Refunds

Collections

 Set incremental sync (daily)

 Test full sync and validate data

 Document schema mappings

Day 10: WooCommerce Pipeline
 Configure WooCommerce source connector

 Define sync streams:

Orders

Products

Customers

Coupons

Product Categories

Product Variations

 Test and validate

Day 11: Amazon Seller Central Pipeline
 Configure Amazon source connector

 Define sync streams:

Orders

Order Items

Inventory (FBA & FBM)

Financial Events

Returns

 Handle API rate limits

 Test and validate

Day 12: BigCommerce Pipeline
 Configure BigCommerce source connector

 Define sync streams:

Orders

Products

Customers

Brands

Categories

 Test and validate

Day 13: Magento Pipeline
 Configure Magento source connector

 Define sync streams:

Orders

Products

Customers

Categories

Inventory

 Test and validate

Day 14: Pipeline Orchestration
 Set up sync schedules (daily/hourly)

 Configure alerting for failures

 Create pipeline monitoring dashboard

 Document all connectors and schemas

Week 2 Deliverables:

✅ All 5 platform connectors configured

✅ Data flowing to BigQuery raw layer

✅ Sync schedules established

✅ Alerting configured

══════════════════════════════════════════
🔄 WEEK 3: DBT TRANSFORMATIONS
══════════════════════════════════════════
Goal: Complete data model with business-ready metrics

Day 15-16: Staging Models
Create staging models for data cleaning and normalization:


models/

├── staging/

│   ├── shopify/

│   │   ├── stg_shopify__orders.sql

│   │   ├── stg_shopify__order_lines.sql

│   │   ├── stg_shopify__products.sql

│   │   ├── stg_shopify__customers.sql

│   │   ├── stg_shopify__refunds.sql

│   │   └── stg_shopify__inventory.sql

│   ├── woocommerce/

│   │   └── [similar structure]

│   ├── amazon/

│   │   └── [similar structure]

│   ├── bigcommerce/

│   │   └── [similar structure]

│   └── magento/

│       └── [similar structure]

Staging Layer Tasks:

 Rename columns to consistent naming convention

 Cast data types appropriately

 Handle NULL values

 Parse JSON fields

 Standardize timestamps to UTC

 Add source platform identifier

Day 17-18: Intermediate Models
Create unified data models across platforms:


models/

├── intermediate/

│   ├── int_orders_unified.sql

│   ├── int_order_lines_unified.sql

│   ├── int_products_unified.sql

│   ├── int_customers_unified.sql

│   ├── int_inventory_unified.sql

│   └── int_refunds_unified.sql

Intermediate Layer Tasks:

 Union all platform data into unified models

 Map platform-specific fields to standard schema

 Create surrogate keys

 Build dimensional relationships

Day 19-20: Mart Models (Business Logic)
Create analytics-ready data marts:


models/

├── marts/

│   ├── core/

│   │   ├── dim_customers.sql

│   │   ├── dim_products.sql

│   │   ├── dim_dates.sql

│   │   └── fct_orders.sql

│   ├── sales/

│   │   ├── sales_daily.sql

│   │   ├── sales_by_product.sql

│   │   ├── sales_by_customer.sql

│   │   └── sales_by_channel.sql

│   ├── customers/

│   │   ├── customer_lifetime_value.sql

│   │   ├── customer_cohorts.sql

│   │   ├── customer_rfm.sql

│   │   └── customer_segments.sql

│   ├── products/

│   │   ├── product_performance.sql

│   │   ├── inventory_health.sql

│   │   └── product_velocity.sql

│   └── marketing/

│       ├── conversion_funnel.sql

│       ├── acquisition_channels.sql

│       └── campaign_performance.sql

Day 21: Testing & Documentation
 Add DBT tests for all models:

Uniqueness tests

Not null tests

Referential integrity

Accepted values

 Write model documentation

 Generate DBT docs site

 Performance optimization (clustering, partitioning)

Week 3 Deliverables:

✅ Complete DBT project with 50+ models

✅ All tests passing

✅ Documentation generated

✅ Data lineage visible

══════════════════════════════════════════
📈 WEEK 4: DASHBOARD DEVELOPMENT
══════════════════════════════════════════
Goal: Production-ready dashboard suite

Day 22-23: Executive Dashboard
"Command Center" - CEO/Founder View

| KPI | Description | Visual |

|-----|-------------|--------|

| Total Revenue | Sum of all sales | Big Number + Trend |

| Orders Today | Real-time order count | Big Number |

| Avg Order Value | Revenue / Orders | Big Number + Trend |

| Conversion Rate | Orders / Sessions | Gauge |

| Revenue by Channel | Platform breakdown | Pie Chart |

| Revenue Trend | Daily/Weekly/Monthly | Line Chart |

| Top Products | Best sellers | Bar Chart |

| Geographic Distribution | Sales by region | Map |

Day 24: Sales Performance Dashboard
"Sales Engine" - Sales Manager View

| KPI | Description | Visual |

|-----|-------------|--------|

| Gross Revenue | Total sales | Big Number |

| Net Revenue | After refunds/discounts | Big Number |

| Refund Rate | Refunds / Orders | Gauge |

| Discount Usage | Discount amount / Revenue | Bar Chart |

| Sales by Hour | Peak selling times | Heatmap |

| Sales by Day of Week | Best days | Bar Chart |

| Product Category Performance | Category breakdown | Treemap |

| Sales Velocity | Units sold per day | Line Chart |

| Revenue Growth Rate | MoM, YoY | Trend Line |

| Average Selling Price | By product category | Bar Chart |

Day 25: Customer Analytics Dashboard
"Customer Intelligence" - Marketing View

| KPI | Description | Visual |

|-----|-------------|--------|

| Total Customers | Unique customers | Big Number |

| New vs Returning | Customer breakdown | Donut Chart |

| Customer Lifetime Value (CLV) | Predicted revenue | Distribution |

| Customer Acquisition Cost | Marketing spend / New customers | Big Number |

| RFM Segments | Recency, Frequency, Monetary | Heatmap |

| Cohort Retention | Retention by signup month | Cohort Chart |

| Top Customers | By revenue | Table |

| Customer Geography | Location distribution | Map |

| Purchase Frequency | Orders per customer | Histogram |

| Time Between Purchases | Average days | Big Number |

Day 26: Product & Inventory Dashboard
"Product Pulse" - Operations View

| KPI | Description | Visual |

|-----|-------------|--------|

| Active Products | Count of products | Big Number |

| Inventory Value | Stock * Cost | Big Number |

| Stock Turnover | COGS / Avg Inventory | Gauge |

| Days of Inventory | Current stock / Daily sales | Big Number |

| Low Stock Alerts | Products below threshold | Alert Table |

| Dead Stock | Products with no sales | Table |

| Best Sellers | Top 10 by revenue | Bar Chart |

| Worst Performers | Bottom 10 | Bar Chart |

| Product Views vs Sales | Conversion by product | Scatter Plot |

| Category Performance | Revenue by category | Treemap |

| Variant Analysis | Size/Color performance | Heatmap |

Day 27: Operational Dashboard
"Fulfillment Tracker" - Ops Manager View

| KPI | Description | Visual |

|-----|-------------|--------|

| Orders Pending | Unfulfilled orders | Big Number |

| Fulfillment Rate | Fulfilled / Total | Gauge |

| Average Fulfillment Time | Order to ship | Big Number |

| Shipping Costs | Total and per order | Trend Line |

| Return Rate | Returns / Orders | Gauge |

| Return Reasons | Breakdown | Pie Chart |

| Cancellation Rate | Cancelled / Total | Gauge |

Day 28: Polish & Launch
 Mobile responsiveness check

 Performance optimization

 User acceptance testing

 Create demo environment

 Record demo video

 Prepare launch materials

Week 4 Deliverables:

✅ 5 complete dashboards

✅ 50+ KPIs visualized

✅ Mobile-responsive design

✅ Demo environment ready

✅ MVP COMPLETE 🎉

📊 COMPLETE KPI REFERENCE
Sales & Revenue KPIs
| Metric | Formula | Target |

|--------|---------|--------|

| Gross Revenue | SUM(order_total) | Track trend |

| Net Revenue | Gross - Refunds - Discounts | Track trend |

| Average Order Value (AOV) | Revenue / Orders | Industry avg: $50-200 |

| Revenue per Visitor | Revenue / Sessions | Optimize |

| Gross Margin | (Revenue - COGS) / Revenue | >50% |

| Revenue Growth Rate | (Current - Previous) / Previous | >10% MoM |

Customer KPIs
| Metric | Formula | Target |

|--------|---------|--------|

| Customer Lifetime Value (CLV) | Avg Order Value × Purchase Frequency × Customer Lifespan | Maximize |

| Customer Acquisition Cost (CAC) | Marketing Spend / New Customers | CLV:CAC > 3:1 |

| Repeat Purchase Rate | Returning Customers / Total Customers | >25% |

| Churn Rate | Lost Customers / Total Customers | <5% monthly |

| Net Promoter Score | Promoters - Detractors | >50 |

Product KPIs
| Metric | Formula | Target |

|--------|---------|--------|

| Inventory Turnover | COGS / Average Inventory | 4-6x/year |

| Sell-Through Rate | Units Sold / Units Received | >80% |

| Stock-Out Rate | Out-of-stock SKUs / Total SKUs | <5% |

| Dead Stock Rate | No-sale SKUs / Total SKUs | <10% |

Operational KPIs
| Metric | Formula | Target |

|--------|---------|--------|

| Order Fulfillment Time | Ship Date - Order Date | <24 hours |

| Return Rate | Returns / Orders | <10% |

| Perfect Order Rate | Orders without issues / Total Orders | >95% |

💰 PRICING MODEL
Subscription Tiers
| Tier | Monthly Orders | Price/Month | Includes |

|------|----------------|-------------|----------|

| Starter | Up to 500 | $497 | 1 platform, 3 dashboards |

| Growth | Up to 2,500 | $997 | 2 platforms, 5 dashboards |

| Scale | Up to 10,000 | $1,997 | 3 platforms, all dashboards |

| Enterprise | Unlimited | $3,997+ | All platforms, custom dashboards |

One-Time Setup Fees
| Service | Price |

|---------|-------|

| Standard Setup | $2,500 |

| Premium Setup (includes training) | $5,000 |

| Custom Integration | $7,500+ |

Add-Ons
| Add-On | Price/Month |

|--------|-------------|

| Additional Platform | $297 |

| Google Analytics Integration | $197 |

| Ad Platform Integration | $297 |

| Custom Dashboard | $497 |

| Dedicated Support | $497 |

| Custom DBT Models | $997 |

Revenue Projections (Year 1)
| Month | Clients | MRR | ARR Run Rate |

|-------|---------|-----|--------------|

| Month 3 | 5 | $4,985 | $59,820 |

| Month 6 | 15 | $14,955 | $179,460 |

| Month 9 | 30 | $29,910 | $358,920 |

| Month 12 | 50 | $49,850 | $598,200 |

🏗️ TECHNICAL ARCHITECTURE

┌─────────────────────────────────────────────────────────────────────────┐

│                        DATA SOURCES (E-Commerce)                        │

├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────┤

│   Shopify   │ WooCommerce │   Amazon    │ BigCommerce │     Magento     │

└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴────────┬────────┘

       │             │             │             │               │

       └─────────────┴──────┬──────┴─────────────┴───────────────┘

                            │

                            ▼

                ┌───────────────────────┐

                │    AIRBYTE OSS        │

                │   (Data Extraction)   │

                │  • Incremental Sync   │

                │  • Schema Detection   │

                │  • Error Handling     │

                └───────────┬───────────┘

                            │

                            ▼

                ┌───────────────────────┐

                │   GOOGLE BIGQUERY     │

                │    (Data Lake)        │

                │  ┌─────────────────┐  │

                │  │   RAW LAYER     │  │

                │  │ raw_shopify     │  │

                │  │ raw_woocommerce │  │

                │  │ raw_amazon      │  │

                │  └────────┬────────┘  │

                │           │           │

                │           ▼           │

                │  ┌─────────────────┐  │

                │  │ STAGING LAYER   │  │

                │  │ stg_*           │  │

                │  └────────┬────────┘  │

                │           │           │

                │           ▼           │

                │  ┌─────────────────┐  │

                │  │  MARTS LAYER    │  │

                │  │ dim_*, fct_*    │  │

                │  └────────┬────────┘  │

                └───────────┼───────────┘

                            │

                            ▼

                ┌───────────────────────┐

                │       DBT CLOUD       │

                │   (Transformations)   │

                │  • 50+ Models         │

                │  • Testing            │

                │  • Documentation      │

                │  • Scheduling         │

                └───────────┬───────────┘

                            │

                            ▼

                ┌───────────────────────┐

                │   METABASE / POWER BI │

                │    (Visualization)    │

                │  • 5 Dashboards       │

                │  • 50+ KPIs           │

                │  • Alerts             │

                │  • Scheduled Reports  │

                └───────────────────────┘

🚀 GO-TO-MARKET STRATEGY
Week 5-8: Soft Launch
Beta Users: Onboard 3-5 clients at 50% discount

Feedback Loop: Weekly calls, rapid iteration

Case Studies: Document results and testimonials

Content: Daily LinkedIn posts about the build

LinkedIn Content Calendar (Launch Week)
| Day | Post Type | Topic |

|-----|-----------|-------|

| Mon | Announcement | "I built an e-commerce analytics platform in 4 weeks" |

| Tue | Technical | "How I unified 5 e-commerce platforms into one dashboard" |

| Wed | Behind-the-scenes | "Day-by-day breakdown of building an MVP" |

| Thu | Value Prop | "The 10 KPIs every e-commerce business should track" |

| Fri | Social Proof | "First beta client results: 23% increase in AOV" |

| Sat | Personal | "Why I left full-time to build this" |

| Sun | CTA | "Looking for 5 beta users - apply here" |

Ideal Customer Profile (ICP)
Revenue: $500K - $10M annually

Team Size: 2-20 employees

Pain Points:

No dedicated data person

Spreadsheet-based reporting

Can't afford enterprise analytics ($10k+/month)

Making decisions on gut feeling

Platforms: Primarily Shopify or WooCommerce

Industries: Fashion, beauty, home goods, supplements

Acquisition Channels
LinkedIn: Organic content + DMs

Shopify App Store: Partner listing

E-commerce communities: eCommerceFuel, r/shopify

Referrals: 20% commission for first 3 months

Cold outreach: Target Shopify stores with traffic but no analytics

📋 RESOURCE REQUIREMENTS
Infrastructure Costs (Monthly)
| Service | Cost |

|---------|------|

| GCP Compute (Airbyte) | $150-300 |

| BigQuery | $50-200 (scales with data) |

| DBT Cloud | $100 (Team plan) |

| Metabase Cloud | $85 (Starter) |

| Domain + Hosting | $20 |

| Total | ~$400-700/month |

Tools Needed
 GCP Account with billing

 GitHub repository

 Airbyte OSS (self-hosted)

 DBT Cloud account

 Metabase instance

 Shopify Partner account (for demo store)

 WooCommerce test site

✅ MVP SUCCESS CRITERIA
| Criteria | Target | Measurement |

|----------|--------|-------------|

| Data freshness | <24 hours | Sync completion time |

| Dashboard load time | <3 seconds | Page load metrics |

| Data accuracy | >99% | Reconciliation vs source |

| Uptime | 99.5% | Monitoring |

| Onboarding time | <1 week | Time to first dashboard |

| Client satisfaction | >4.5/5 | NPS survey |

🎯 POST-MVP ROADMAP
Month 2: Enhancements
 Add Google Analytics 4 integration

 Add advertising platform integrations (Meta, Google)

 Build email marketing integrations (Klaviyo)

 Create automated alerting system

Month 3: Scale
 Multi-tenant architecture

 Self-service onboarding portal

 White-label option for agencies

Month 4-6: Product Expansion
 Predictive analytics (demand forecasting)

 Anomaly detection

 AI-powered recommendations

 Mobile app

📣 LINKEDIN ANNOUNCEMENT (Ready to Post)
🚀 I'm building an E-Commerce Analytics Platform in 4 weeks. Here's my plan:

After 4+ years as a data engineer working with e-commerce businesses, I noticed a pattern:

→ Enterprise analytics tools cost $10-50k/month

→ Small e-commerce brands can't afford them

→ They make decisions based on gut feeling

→ They're leaving money on the table

So I'm building the solution.

A complete analytics platform for e-commerce brands:

✅ Connects to Shopify, WooCommerce, Amazon, BigCommerce, Magento

✅ Unified dashboards across all your sales channels

✅ 50+ KPIs to track sales, customers, products, and operations

✅ Starting at $497/month (not $10k+)

Tech Stack:

• Airbyte OSS (data extraction)

• Google BigQuery (data warehouse)

• DBT (transformations)

• Metabase (dashboards)

The 4-Week Sprint:

Week 1: Infrastructure ⚡

Week 2: Data Pipelines 🔌

Week 3: DBT Transformations 🔄

Week 4: Dashboard Suite 📊

I'll be documenting the entire journey here.

Looking for 5 beta testers who want:

→ 50% off lifetime pricing

→ Direct input on features

→ Enterprise analytics at startup prices

Comment "ANALYTICS" or DM me if you're interested.

Let's build. 🛠️

#ecommerce #dataengineering #analytics #startup #buildinpublic

📞 CONTACT & NEXT STEPS
Ready to transform your e-commerce data into growth?

📧 Email: [your email]

🔗 LinkedIn: [your profile]

🌐 Website: [your website]

📅 Book a call: [calendly link]

Document Version: 1.0

Created: December 2024

Last Updated: December 2024

## Deployment (Vercel — no Lovable)

Metreka is a standard Vite + React app. Host on [Vercel](https://vercel.com) (or any static host).

**Production URL**: https://metreka-zvhr.vercel.app

### One-time setup

1. Import `egodalle/metreka` in Vercel → Framework: **Vite** → Build: `npm run build` → Output: `dist`
2. Set environment variables:
   - `VITE_SUPABASE_URL` = `https://wwxhmxrsrqlirjfbmnsk.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your Supabase anon/publishable key
   - `VITE_APP_URL` = `https://metreka-zvhr.vercel.app` (or your domain)
3. Supabase Dashboard → **Authentication → URL Configuration**:
   - Site URL: your production URL
   - Redirect URLs: `{production}/auth/callback`, `{production}/oauth/callback`, plus `http://localhost:8080/...` for local dev
4. `npx supabase secrets set APP_URL=https://metreka-zvhr.vercel.app` (for Paddle checkout redirects)

### Deploy

Every push to `main` deploys automatically if Vercel is connected to GitHub. Or manually:

```bash
npx vercel --prod
```

Backend (Supabase edge functions) deploy separately:

```bash
npx supabase functions deploy store-connect sync-store-data
```

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
