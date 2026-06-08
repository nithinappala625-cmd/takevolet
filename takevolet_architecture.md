# Takevolet (RoomRelay) - Comprehensive Architecture & Data Report

## Executive Summary
Takevolet (also referred to as RoomRelay) is a Next.js 15 based web application designed for room rentals, flatmate finding, and property handovers. It connects "Seekers" with "Posters" (room owners/current tenants) and includes a unique monetization model:
- **Contact/Address Unlocks:** Seekers pay ₹500 via Razorpay to unlock the full address and express interest in a room.
- **Handover Confirmation:** When a handover is confirmed, the poster receives ₹1,000 as a reward, while the platform retains ₹500.
- **Media Uploads:** Cloudinary is used for uploading images and videos of rooms.
- **Authentication:** Supabase Auth and NextAuth.js.
- **Database:** PostgreSQL hosted on Supabase, with Prisma ORM for some local structures and raw Supabase SQL for advanced features like Row Level Security (RLS).

This document serves as the complete blueprint for rebuilding the backend and frontend API in Flutter.

---

## 1. Database Schema (Supabase PostgreSQL)

The database heavily utilizes Supabase features including UUIDs, Row Level Security (RLS), and Storage buckets.

### `profiles` (User Profiles)
- **id**: UUID (Primary Key, references auth.users)
- **full_name, email, phone, whatsapp**: Text (User contact details)
- **owner_name, owner_phone**: Text (If listed by someone else)
- **avatar_url**: Text (Profile picture URL)
- **location, colony, house_no**: Text (Address details. `house_no` is private)
- **profession, gender, dob**: Text
- **members_count**: Int (Default 1)
- **aadhaar_url, aadhaar_back_url**: Text (KYC Documents, stored securely)
- **is_verified**: Boolean (Default false)
- **Timestamps**: `created_at`, `updated_at`

### `rooms` (Property Listings)
- **id**: UUID (Primary Key)
- **user_id**: UUID (References profiles.id)
- **title, description**: Text
- **rent**: Int (Monthly rent)
- **advance**: Int (Security deposit)
- **location, colony**: Text
- **house_no**: Text (Hidden until payment is made)
- **full_address**: Text (Revealed after ₹500 payment)
- **leaving_date**: Date
- **tenant_type**: Text ('bachelor' or 'family')
- **members_allowed, current_members**: Int
- **gender_preference**: Text (Default 'Any')
- **furnishing**: Text (e.g., 'Semi-Furnished')
- **parking**: Text (Default 'None')
- **amenities, furniture, items**: Text[] (Arrays of strings)
- **has_items**: Boolean
- **commission**: Int (Default 1000)
- **images, videos**: Text[] (Cloudinary / Supabase storage URLs)
- **is_available, is_rented_out**: Boolean
- **enquiries, contact_unlocks, earnings**: Int (Analytics and monetization stats)
- **Timestamps**: `created_at`, `updated_at`

### `interests` (Address Unlocks - ₹500)
- **id**: UUID
- **room_id**: UUID (References rooms)
- **seeker_id, poster_id**: UUID (References profiles)
- **room_title, poster_name, seeker_name**: Text
- **platform_fee**: Int (Default 500)
- **razorpay_order_id, razorpay_payment_id**: Text
- **payment_status**: Text ('pending', 'paid', 'failed')
- **full_address**: Text (Revealed after payment)
- **handover_confirmed**: Boolean
- **paid_at, created_at**: Timestamptz

### `handovers` (Confirmed Deals - ₹1,000 to poster)
- **id**: UUID
- **interest_id, room_id, seeker_id, poster_id**: UUID
- **room_title, seeker_name, poster_name**: Text
- **poster_amount**: Int (Default 1000)
- **platform_amount**: Int (Default 500)
- **razorpay_order_id, razorpay_payment_id**: Text
- **payment_status**: Text ('pending')
- **poster_paid_out**: Boolean (Has the poster received their money?)
- **confirmed_at**: Timestamptz

### `earnings` & `payouts` (Wallet & Withdrawals)
- **earnings**: Tracks user earnings (`room_commission`, `contact_unlock`, `item_sale`). Contains `amount`, `status`, `description`.
- **payouts**: Tracks withdrawal requests (`method`: 'upi' | 'bank', `amount`, `upi_id`, `bank_account`, `status`).

### `flatmates`
- **id**: Text (Primary Key)
- **user_id**: UUID
- **title, description, location, colony**: Text
- **rent_share, advance_share**: Int
- **vacancy_count**: Int
- **profession_pref, gender_pref**: Text
- **lifestyle_habits, images, videos**: Text[]
- **is_available**: Boolean

---

## 2. Storage Buckets (Supabase / Cloudinary)

1. **`room-media`**: Public bucket for room images and videos (Max 50MB per file).
2. **`kyc-docs`**: Private bucket for Aadhaar and identity verification (Max 10MB per file).
3. **Cloudinary Integration**: Also used heavily via `/api/upload` for fast media delivery, fallback to Unsplash placeholders if not configured.

---

## 3. Backend API Routes (Next.js App Router)

The following routes must be recreated in your Flutter backend (e.g., Node.js/Express, Dart Frog, or directly via Supabase Flutter SDK).

### 1. `GET /api/admin/data`
- **Purpose**: Fetches administrative dashboard data.

### 2. `GET, POST /api/auth/[...nextauth]`
- **Purpose**: Handles user authentication, sessions, and OAuth providers (NextAuth integration).
- **Flutter Equivalent**: Use `supabase_flutter` for native authentication (Email/OTP, Google Sign-in).

### 3. `GET, POST /api/contacts`
- **Purpose**: Likely handles user inquiries or support contact forms.

### 4. `POST /api/interest/unlock`
- **Purpose**: Initiates the process for a Seeker to unlock a room's contact/address.
- **Payload**: `{ roomId, seekerId }`
- **Action**: Creates a Razorpay order for ₹500 and creates a pending record in the `interests` table.

### 5. `POST /api/payment/create-order`
- **Purpose**: General endpoint to generate a Razorpay Order ID.
- **Payload**: `{ amount, currency, receipt }`
- **Response**: `{ orderId, amount }`

### 6. `POST /api/payment/verify`
- **Purpose**: Verifies Razorpay signature after frontend payment success.
- **Payload**: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
- **Action**: If valid, updates `payment_status` to 'paid' in the respective table (`interests` or `contact_unlocks`).

### 7. `POST /api/payment/webhook`
- **Purpose**: Server-to-server webhook from Razorpay to handle asynchronous payment confirmations.

### 8. `POST /api/payout/request`
- **Purpose**: Allows users (Posters) to request a withdrawal of their earnings.
- **Payload**: `{ amount, method ('upi'/'bank'), upi_id, bank_details }`
- **Action**: Inserts a row into the `payouts` table with status 'pending'.

### 9. `GET, POST /api/rooms`
- **GET**: Fetches a paginated, filtered list of rooms.
  - **Query Params**: `location`, `budget`, `members`, `furnishing`, `gender`, `parking`, `page`, `limit`.
- **POST**: Creates a new room listing.
  - **Payload**: `FormData` containing `title`, `rent`, `advance`, `location`, `colony`, `leavingDate`, `media` (files).
  - **Action**: Uploads media to Cloudinary, inserts room data into `rooms` table.

### 10. `GET, PUT, DELETE /api/rooms/[id]`
- **GET**: Fetches details for a specific room by ID, joining with the `profiles` table to get the poster's details.
- **PUT**: Updates room fields (e.g., marking as unavailable or rented out).
- **DELETE**: Removes the room listing.

### 11. `POST /api/upload`
- **Purpose**: Uploads media files directly to Cloudinary.
- **Payload**: `FormData` containing `file` and `folder`.
- **Response**: `{ urls: ["https://res.cloudinary.com/..."], success: true }`

---

## 4. Flutter Implementation Strategy (What We Have Built)

When migrating this architecture to **Flutter**, you should structure your app as follows:

1. **Authentication Layer**: 
   - Replace NextAuth with **Supabase Flutter Auth**. Use OTP or Magic Links for phone/email verification.
   - Implement an Auth wrapper to ensure users complete their `profiles` (KYC, Aadhaar) before posting a room.

2. **Data Layer (Supabase SDK)**:
   - You don't necessarily need a custom Node.js backend for most GET/PUT/DELETE operations. You can directly query the Supabase PostgreSQL database using the `supabase_flutter` package.
   - The Row Level Security (RLS) policies defined in `supabase_schema.sql` will automatically secure data access (e.g., users can only edit their own rooms).

3. **Payment Gateway**:
   - Use the **Razorpay Flutter** package.
   - **Order Creation**: You still need a secure backend function (Cloud Function or Supabase Edge Function) to create Razorpay orders to avoid exposing your API secret on the client.
   - **Verification**: Use Supabase Edge Functions for `/payment/verify` and `/payment/webhook` to securely update the database upon successful payment.

4. **Media Uploads**:
   - Use the `image_picker` and `video_player` packages in Flutter.
   - Upload directly to Supabase Storage (`room-media` bucket) using the Supabase SDK, or keep the Cloudinary integration by using a Cloudinary upload API via `http` package.

5. **Core User Flows Built**:
   - **Seeker Flow**: Browse Rooms -> Filter by Rent/Location -> View Details (Address hidden) -> Pay ₹500 via Razorpay -> Unlock Address -> Confirm Handover.
   - **Poster Flow**: Complete KYC -> Upload Room Details & Media -> View Enquiries/Interests -> Wait for Handover Confirmation -> Request Payout of Earnings (₹1000).

## Summary
The "Takevolet" platform is a fully-fledged real estate marketplace with built-in escrow-like monetization and identity verification. Its reliance on Supabase makes it extremely straightforward to port to Flutter, provided the database schema, RLS policies, and Razorpay webhook flows are correctly maintained.
