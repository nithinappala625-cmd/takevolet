# Takevolet 🏠

> Zero-brokerage bachelor room handover platform for Hyderabad.

Bachelors leaving their rooms post here. Bachelors searching for rooms find them here. Direct contact, earn commission, zero brokerage.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Vanilla CSS + CSS Variables |
| **Database** | Supabase PostgreSQL |
| **Auth** | Supabase Auth (Google OAuth + Email/OTP) |
| **Storage** | Supabase Storage (room media + KYC docs) |
| **Payments** | Razorpay |
| **Animations** | Framer Motion |
| **Deployment** | Vercel (bom1 region — Mumbai) |

---

## ⚙️ Local Development

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/takevolet.git
cd takevolet
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env.local
# Fill in your values in .env.local
```

### 4. Run the Supabase schema
- Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
- Run the contents of `supabase_schema.sql`

### 5. Start the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Schema

Tables created by `supabase_schema.sql`:

| Table | Purpose |
|---|---|
| `profiles` | User KYC data (phone, area, house no, Aadhaar) |
| `rooms` | Room listings with media URLs |
| `interests` | Contact-unlock payments (₹500 platform fee) |
| `handovers` | Confirmed handovers (₹1,000 commission to poster) |
| `earnings` | Per-user earnings ledger |
| `payouts` | Payout requests and processing status |

---

## 🔐 Environment Variables

See `.env.example` for all required variables. Key ones:

```env
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY=         # Supabase service role (server-side only)
RAZORPAY_KEY_ID=                   # Razorpay key ID
RAZORPAY_KEY_SECRET=               # Razorpay secret (server-side only)
ADMIN_PASSWORD=                    # Admin dashboard password
NEXT_PUBLIC_APP_URL=               # Your production URL
```

---

## 🚢 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/takevolet)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain
5. Add your Vercel domain to Supabase Auth → **URL Configuration → Redirect URLs**

---

## 👨‍💼 Admin Dashboard

Access at `/admin` with the `ADMIN_PASSWORD` env variable.

Features:
- **Overview** — revenue stats, recent activity
- **Users** — all registered profiles with KYC status
- **Rooms** — all posted listings
- **Interests** — contact unlock payments
- **Handovers** — confirmed handover records
- **Payouts** — approve/reject payout requests

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard
│   ├── api/                # API routes
│   ├── auth/               # Auth pages + callback
│   ├── dashboard/          # User dashboard
│   ├── post/room/          # Post a room form
│   ├── profile/complete/   # Mandatory profile registration
│   └── rooms/              # Room listings + detail
├── components/             # Shared UI components
│   ├── Navbar.tsx
│   └── NavbarWrapper.tsx
├── data/                   # Static data (mock rooms, locations)
├── hooks/                  # Custom React hooks (useUser)
└── lib/                    # Core libraries
    ├── db.ts               # All Supabase DB operations
    ├── supabase.ts         # Supabase client
    └── userStore.ts        # Legacy local store (deprecated)
```

---

## 📄 License

© 2026 Takevolet Technologies — Hyderabad, Telangana, India. All rights reserved.
