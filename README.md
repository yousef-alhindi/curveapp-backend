# Curveapp Backend

The central API server powering the Curve super-app platform. Handles authentication, business logic, and data for all client apps — user mobile, vendor panels, admin panel, and delivery app.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** Firebase (Admin SDK)
- **Cloud Storage:** AWS S3
- **Task Scheduling:** Cron jobs (gym subscription status, offer expiry, meal delivery tracking)
- **Package Manager:** pnpm

## Domain Coverage

7 routers covering: Auth, Users, Restaurants, Grocery, Gym, Supplements, Orders, Cart, Delivery, Offers, Admin

## Getting Started

```bash
pnpm install
pnpm start
```

Requires a `.env` file with Firebase credentials and AWS S3 config.
