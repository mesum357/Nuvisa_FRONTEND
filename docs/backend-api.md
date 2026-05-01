# NuVisa Backend API Documentation

This document describes the backend APIs used by the `New-NUvisa` frontend, including:

- Core backend endpoints configured via `NEXT_PUBLIC_API_URL`
- Internal Next.js API routes in this repository (`src/pages/api/*`)
- Dynamic data models and content sources from Prisma
- Request/response examples based on actual handler and service code

## 1) Architecture Overview

NuVisa frontend consumes data from three backend layers:

1. Core backend (`NEXT_PUBLIC_API_URL`)
- Handles auth, visa applications, payments, coupon, gift cards, uploads, and visa catalog/order actions.
- Endpoint constants live in `src/enums/backendApi.enums.ts`.

2. Admin backend (`NEXT_PUBLIC_ADMIN_API_URL` or fallback `https://nuvisa-admin.vercel.app`)
- Serves CMS-like dynamic content such as FAQ, header, footer, expert section, comparison section, appointment text, etc.
- Accessed either directly from frontend services or via internal proxy API routes.

3. Internal API routes (`src/pages/api/*`)
- Proxy/caching layer to admin backend.
- Specialized runtime handlers (e.g., student verification flow, passport extraction).

---

## 2) Environment Variables

The following vars are used by backend integrations:

- `NEXT_PUBLIC_API_URL`: base URL for core backend APIs.
- `NEXT_PUBLIC_ADMIN_API_URL`: base URL for Nuvisa Admin APIs.
- `NEXT_PUBLIC_ADMIN_URL`: fallback admin URL in some proxy routes.
- `NEXTAUTH_URL`: used to build student email verification callback URL.
- `VERIFY_RETURN_HOSTS`: optional comma-separated list of allowed callback hosts for student verification redirect.
- `MINDEE_API_KEY`: API key for passport OCR extraction route.
- `MINDEE_MODEL_ID`: custom Mindee model ID.
- `SENDGRID_API_KEY`: sends student verification email when configured.
- `SENDGRID_FROM`: sender address for verification emails.
- `HEADER_CONTENT_TTL_MS`: optional cache TTL for `/api/header-content` route.

Fallback behavior:

- Admin API fallback defaults to `https://nuvisa-admin.vercel.app` when admin URL is missing or blocked (localhost in production).
- Student verification email route can return a `debugUrl` in development if SendGrid key is not set.

---

## 3) Core Backend Endpoints (`NEXT_PUBLIC_API_URL`)

Source: `src/enums/backendApi.enums.ts` and service wrappers in `src/api/*`.

### 3.1 Authentication

Base: `<NEXT_PUBLIC_API_URL>`

- `POST /auth/login`
- `POST /auth/verify-otp`
- `POST /auth/register`
- `PUT /auth/update-user`
- `PUT /auth/reset-password`
- `PUT /auth/recover-password`
- `POST /auth/forget-password`
- `PUT /auth/update-status`

#### Example: Login

Request:

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret"
}
```

Response (typical):

```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

### 3.2 Visa Application Lifecycle

- `GET /visa-application`
- `POST /visa-application/create`
- `GET /visa-application/getApplicationById?id=<applicationId>`
- `POST /visa-application/archive`
- `POST /visa-application/unarchive`
- `PATCH /visa-application/update`
- `DELETE /visa-application/delete`

Headers (secured endpoints):

- `Authorization: Bearer <token>`

#### Example: Create or Update Application

Request:

```http
POST /visa-application/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "visaTypeId": "schengen_tourist",
  "arrivalDate": "2026-06-10",
  "departureDate": "2026-06-20",
  "numberOfTravellers": 2,
  "travelersData": [
    {
      "firstName": "Ali",
      "lastName": "Irfan"
    }
  ],
  "orderId": "SMV_ORDER_12345"
}
```

Response (shape consumed by frontend status resolvers):

```json
{
  "success": true,
  "data": {
    "results": {
      "application": {
        "id": "app_uuid",
        "orderId": "SMV_ORDER_12345",
        "applicationStatus": "submitted",
        "createdAt": "2026-04-05T10:30:00.000Z",
        "updatedAt": "2026-04-05T10:30:00.000Z",
        "appointment": {
          "preference1": {
            "city": "London",
            "dateRange": "10/06/2026 - 20/06/2026",
            "slot": "Morning"
          }
        }
      }
    }
  }
}
```

### 3.3 Visa Catalog and SMV Order

- `GET /visa/check`
- `GET /visa/types?country=<country>`
- `GET /visa/countries`
- `POST /visa/order`

#### Example: Create Visa Order

Request:

```http
POST /visa/order
Content-Type: application/json

{
  "visa_type_id": "123",
  "travel_start_date": "06/10/2026",
  "travel_end_date": "06/20/2026",
  "no_of_travelers": 2
}
```

Response (as handled by frontend):

```json
{
  "status": {
    "data": {
      "success": true,
      "data": {
        "order_id": "ORD_ABC123"
      }
    }
  }
}
```

### 3.4 Payments

- `POST /stripe_payment/session`
- `POST /stripe_payment/payment-intent`
- `POST /stripe_payment/confirm`
- `POST /stripe_payment/session-metadata`

#### Example: Create Payment Intent

Request:

```http
POST /stripe_payment/payment-intent
Content-Type: application/json

{
  "amount": 12900,
  "currency": "gbp",
  "applicationId": "app_uuid"
}
```

Response (representative):

```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_..._secret_...",
    "paymentIntentId": "pi_..."
  }
}
```

### 3.5 Coupons

- `POST /coupon/validate`
- `GET /coupon/available`
- `POST /coupon/apply`
- `POST /coupon/remove`
- `POST /coupon/verify-student`

#### Example: Validate Coupon

Request:

```http
POST /coupon/validate
Content-Type: application/json

{
  "code": "STUDENT10"
}
```

Success response (expected by UI):

```json
{
  "valid": true,
  "discount": 10,
  "description": "Student Discount",
  "message": "Student discount applied successfully"
}
```

Failure response:

```json
{
  "valid": false,
  "message": "Invalid coupon code. Please check and try again."
}
```

### 3.6 Gift Cards

- `POST /gift-card/validate`
- `POST /gift-card/redeem`

#### Example: Redeem Gift Card

Request:

```http
POST /gift-card/redeem
Content-Type: application/json

{
  "code": "GC-2026-ABCD",
  "email": "user@example.com"
}
```

Response (representative):

```json
{
  "success": true,
  "data": {
    "amount": 25,
    "currency": "GBP",
    "remainingBalance": 0
  }
}
```

### 3.7 File Upload

Endpoint used by frontend upload helpers:

- `POST /upload` (multipart/form-data, field name `file`)
- `DELETE /upload` with JSON body `{ "fileUrl": "..." }`

#### Example: Upload File

Request:

```http
POST /upload
Content-Type: multipart/form-data

file=<binary>
```

Response (representative):

```json
{
  "success": true,
  "url": "https://cdn.example.com/uploads/passport.jpg",
  "fileName": "passport.jpg"
}
```

---

## 4) Internal Next.js API Routes (`src/pages/api`)

These routes are hosted by this Next.js app and are callable as `/api/...` from frontend.

### 4.1 Content and CMS Proxy Routes

#### `GET /api/comparison-section?path=active&country=<optional>`

- Forwards to admin API `/api/comparison-section`.
- Query params:
  - `path` (default: `active`)
  - `country` (optional)

Success response:

```json
{
  "success": true,
  "data": [
    {
      "id": "comparison_id",
      "title": "Travel Agency vs NUvisa",
      "countryName": "France",
      "leftSideItems": ["Manual docs"],
      "rightSideItems": ["Auto guidance"]
    }
  ]
}
```

Error response:

```json
{
  "error": "Failed to fetch comparison section"
}
```

#### `GET /api/expert-section?path=active`

- Proxies admin endpoint `/api/expert-section`.

#### `GET /api/faqs?category=<optional>`

- Proxies admin endpoint `/api/public/faqs`.

#### `GET /api/footer-content?section=<optional>`

- Proxies admin endpoint `/api/public/footer-content`.

#### `GET /api/header-content?section=<optional>`

- Proxies admin endpoint `/api/public/header-content`.
- Includes in-memory cache with TTL (default 5 minutes).
- Sends `Cache-Control: public, max-age=60, stale-while-revalidate=120`.

#### `GET /api/visa-pricing`

- Tries multiple backend/admin endpoints in sequence:
  - `/visa_pricing`
  - `/visa-pricing`
  - `/api/visa_pricing`
  - `/api/visa-pricing`
  - `/api/public/visa_pricing`
  - `/api/public/visa-pricing`
- Returns first successful response.

Failure response:

```json
{
  "error": "Failed to fetch visa pricing",
  "status": 404,
  "details": "Network error"
}
```

### 4.2 Popup Content and Submissions

#### `GET /api/popup-content`

- Reads from Prisma model `PopupContent` and related `PopupQuestion`.
- Auto-seeds default popup content if missing.

Success response:

```json
{
  "success": true,
  "data": {
    "id": "current",
    "mainHeading": "❤️ NEW CUSTOMER OFFER - £129 fee for your first visa",
    "subHeading": "Auto-booking appointment",
    "offerPrice": "£129",
    "originalPrice": "£100",
    "continueButtonText": "Continue",
    "questions": [
      {
        "text": "Status in United Kingdom",
        "type": "OPTIONS",
        "options": ["UK BRP", "UK ILR", "UK BRC", "UK Citizen"],
        "order": 0
      }
    ]
  }
}
```

#### `POST /api/popup-submissions`

- Proxies request body to admin endpoint `/api/popup-submissions`.

Request:

```json
{
  "phone": "+44XXXXXXXXX",
  "uk_status": "UK BRP",
  "schengen_refused": "No",
  "journey_purpose": "Tourism",
  "dynamicAnswers": {
    "q1": "answer"
  }
}
```

### 4.3 Student Verification APIs

#### `POST /api/student/send-verification`

- Validates educational email domain.
- Generates short-lived verification token (in-memory).
- Sends email with SendGrid, or returns `debugUrl` in dev mode.

Request:

```json
{
  "email": "student@university.edu",
  "returnTo": "https://your-site.com/get-the-visa"
}
```

Success response (production mail mode):

```json
{
  "ok": true,
  "message": "Verification email sent successfully. Please check your inbox."
}
```

Success response (dev mode):

```json
{
  "ok": true,
  "debugUrl": "http://localhost:3000/api/student/verify-email?token=...",
  "message": "Development mode: Use the debugUrl to verify (do not return tokens in production)"
}
```

Validation errors:

```json
{
  "error": "Please use your educational institution email address (.edu, .ac.uk, etc.)"
}
```

#### `GET /api/student/verify-email?token=<token>&returnTo=<optional>`

- Verifies token, marks email as verified in memory store, and returns HTML success page.
- Sets localStorage key `nuvisa.verifiedStudentEmail` in browser script.
- Auto closes popup or redirects to `returnTo`/`/get-the-visa`.

#### `POST /api/student/verify`

- Checks verified email in memory map.

Request:

```json
{
  "email": "student@university.edu"
}
```

Success response:

```json
{
  "verified": true,
  "verifiedAt": 1775308800000
}
```

### 4.4 Passport OCR Extraction

#### `POST /api/extract-passport`

- Multipart upload route (`formidable` with body parser disabled).
- Requires form field `file`.
- Sends image to Mindee custom model and maps response to normalized passport fields.

Request:

- `Content-Type: multipart/form-data`
- `file`: passport image/PDF

Success response:

```json
{
  "raw": { "...": "full mindee payload" },
  "extractedFields": {
    "firstName": "ALI",
    "lastName": "IRFAN",
    "passportNumber": "A1234567",
    "dateOfBirth": "1995-01-01",
    "sex": "Male",
    "passportIssueDate": "2021-01-01",
    "passportExpiryDate": "2031-01-01",
    "placeOfBirth": "Lahore",
    "nationality": "PAK",
    "issuingCountry": "PAK",
    "mrzLine1": "P<PAKIRFAN<<ALI<<<<<<<<<<<<<<<<<<<<",
    "mrzLine2": "A1234567<PAK9501011M3101012<<<<<<<<"
  },
  "simpleFields": {
    "given_names": "ALI",
    "surnames": "IRFAN"
  }
}
```

Error response:

```json
{
  "error": "No file with the name 'file' was uploaded."
}
```

---

## 5) Dynamic Data Models (Prisma)

Source: `prisma/schema.prisma`.

The following tables drive dynamic CMS and runtime data used by frontend APIs:

- `AppointmentText`: country-level appointment messaging and image.
- `FAQ`: dynamic FAQ list, category, ordering, and active state.
- `ComparisonSection`: country-aware comparison blocks and matrix data.
- `HeaderContent`: top navigation/banner dynamic text and links.
- `FooterContent`: footer links, social, and company content.
- `HeroContent`: hero heading/description/action content.
- `KlarnaContent`: Klarna section values and labels.
- `ProcessContent`: process steps and labels.
- `SliderContent`: slider banners, counters, and notes.
- `PopupContent` + `PopupQuestion`: popup offer metadata and dynamic multi-step questions.
- `RecommendedSection`: card-based recommendation content.
- `userAccount`: popup submission user account capture (`dynamicAnswers` JSON).

Application workflow models:

- `User`
- `Application`
- `Document`
- `ApplicationComment`
- `ApplicationStatusHistory`
- `AppointmentSlot`
- `SystemStats`

Operational/admin models:

- `Admin`
- `AdminRole`
- `Notification`
- `ActivityLog`
- `EmailTemplate`

---

## 6) Application Status Mapping (Frontend Derived)

`src/api/applicationStatus.ts` transforms backend status into richer UI states:

Raw statuses and derived outputs commonly used by UI:

- `submitted` -> stage `Submitted`, progress `25`
- `under_review`/`processing` -> stage `Under review`, progress `50`
- appointment preference present -> `appointment_booked`, progress `75`
- `at_embassy` stage detected -> `at_embassy`, progress `90`
- `approved` -> `Approved`, progress `100`
- `rejected` -> `Rejected`, progress `100`

Derived payload shape returned by helper:

```json
{
  "success": true,
  "data": {
    "id": "app_uuid",
    "status": "appointment_booked",
    "submittedAt": "2026-04-05T10:30:00.000Z",
    "estimatedProcessingTime": "3 working hours",
    "orderId": "12345",
    "formattedApplicationId": "AI00001234",
    "formattedOrderId": "ORD012345",
    "currentStage": "Appointment Booked",
    "progress": 75,
    "nextSteps": ["Attend appointment", "Documents submission at embassy"],
    "statusHistory": [
      {
        "status": "appointment_booked",
        "timestamp": "2026-04-05T11:00:00.000Z",
        "description": "Your visa appointment has been booked"
      }
    ],
    "appointment": {
      "preference1": {
        "city": "London",
        "dateRange": "10/06/2026 - 20/06/2026",
        "slot": "Morning"
      },
      "preference2": {
        "city": "Manchester",
        "dateRange": "22/06/2026 - 26/06/2026",
        "slot": "Afternoon"
      }
    }
  }
}
```

---

## 7) Error Handling Conventions

Common patterns seen across services/routes:

- `405` for unsupported methods in Next API handlers.
- `500` for internal proxy/processing failures.
- `502` in `/api/visa-pricing` when all upstream endpoints fail.
- For application create/update in `apigateway`, error response is returned directly for UI-level handling.
- Unauthorized responses with message `UnauthorizedException` trigger logout helper.

Representative error payloads:

```json
{ "error": "Method not allowed" }
```

```json
{ "error": "Failed to fetch FAQs" }
```

```json
{ "success": false, "error": "Application not found" }
```

---

## 8) Operational Notes

- Student verification tokens and verified-email state are in-memory maps; restarting server clears them.
- Header content route includes per-instance memory cache.
- Some APIs are environment-sensitive and avoid localhost admin URLs in production.
- Coupon module has local fallback validation for specific hardcoded codes (`STUDENT10`, `SAVE10`, `GROUP20`, `WELCOME15`) when upstream validation fails.

---

## 9) Quick Endpoint Index

### Core backend (`NEXT_PUBLIC_API_URL`)

- Auth: `/auth/*`
- Visa application: `/visa-application/*`
- Visa catalog/order: `/visa/*`
- Payment: `/stripe_payment/*`
- Coupon: `/coupon/*`
- Gift card: `/gift-card/*`
- Upload: `/upload`

### Internal Next API (`/api/*`)

- Content: `/api/comparison-section`, `/api/expert-section`, `/api/faqs`, `/api/footer-content`, `/api/header-content`, `/api/visa-pricing`
- Popup: `/api/popup-content`, `/api/popup-submissions`
- Student verify: `/api/student/send-verification`, `/api/student/verify-email`, `/api/student/verify`
- OCR: `/api/extract-passport`

---

## 10) Suggested Validation Checklist

Use this checklist for QA/UAT:

- Verify all env vars resolve correct backend/admin hosts.
- Confirm auth-protected endpoints include bearer token.
- Validate create/update application handles both success and structured error responses.
- Confirm `/api/header-content` cache TTL behavior under repeated calls.
- Test student verification in both SendGrid and dev debug mode.
- Test passport extraction with valid and invalid file uploads.
- Verify fallback paths for visa pricing and coupons when upstream is unavailable.
