# Learning Management API

A backend for organizing the day-to-day work of an educational academy: student and teacher records, subscription plans, lesson schedules and finances.

## What is in the project

- Account registration, sign-in, email verification and password-reset routes.
- Student and teacher management, with subjects and teacher-subject relationships.
- Roles and permissions for access control.
- Subscription plans and subscription requests.
- One-off and recurring lesson schedules, with student and teacher schedule views.
- Currency, calendar and finance modules.
- Redis connections and a BullMQ notification queue.

## Stack

Node.js, Express 5, JavaScript ES modules, Prisma, PostgreSQL, Redis, BullMQ, JWT, Joi and Nodemailer.

## Project structure

- `src/Modules/`: Domain modules, controllers, services and validation.
- `src/Middlewares/`: Authentication, authorization and validation.
- `src/database/`: Prisma connection and database helpers.
- `src/utils/`: Email, tokens, Redis and shared helpers.
- `prisma/`: Schema, migrations and seed scripts.

## Run locally

You need Node.js compatible with Prisma 7, npm, PostgreSQL and Redis. Use a disposable development database, not a production database.

1. Clone this repository and open its directory.
2. Install dependencies with `npm ci`.
3. Create a local `.env` file in the repository root. Configure the variables below with your own development values.
4. Generate the Prisma client with `npx prisma generate`.
5. Apply the checked-in migrations to your development database with `npx prisma migrate deploy`.
6. Start the server with `npm run dev`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL |
| `REDIS_URL` | Redis connection URL |
| `PORT` | HTTP port; defaults to 3000 |
| `SALT` | bcrypt salt rounds |
| `ENCRYPT_KEY` | Application encryption key |
| `JWT_SECRET_ACCESS_ADMIN` | Access-token signing secret |
| `JWT_SECRET_REFRESH_ADMIN` | Refresh-token signing secret |
| `APP_EMAIL` | Gmail sender account for email flows |
| `APP_PASSWORD` | App password for that sender account |
| `FRONTEND_URL` | Frontend URL used by email templates |

Use fresh, local-only signing secrets and an encryption key. Never commit `.env` files or reuse example credentials in a live deployment.

The root endpoint at `http://localhost:3000/` returns a greeting when the default port is used. Main route groups are `/auth`, `/students`, `/teachers`, `/subscription`, `/system`, `/schedules`, `/calendar`, `/finances` and `/transactions/currency`.

Seed scripts are available in `prisma/seeders/`. Review their sample data before running them, and use them only with a disposable development database.

## Scope and status

This repository contains the API, not the student or teacher web interface. Email flows require a configured sender account. Database-backed behavior needs PostgreSQL and Redis running locally.

These setup steps describe the checked-in configuration. A complete database-backed startup and end-to-end test run have not been verified for this README update.
