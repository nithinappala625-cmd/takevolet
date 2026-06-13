const SUPABASE_URL = 'https://vwcqovrbvhztpkultqjl.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Y3FvdnJidmh6dHBrdWx0cWpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyMDYwOCwiZXhwIjoyMDkzMzk2NjA4fQ.5OKsvAVnHSqhk_wsddohOgbsNhJS1u2oOC1UXWseLn8';

const pages = [
  {
    slug: 'about-us',
    title: 'About Us',
    content: `# About Takevolet

**Takevolet** is India's first zero-brokerage room discovery platform, built to eliminate the middleman and connect tenants directly with room owners and current occupants.

## Our Mission

We believe finding a home should be simple, transparent, and free from exploitative brokerage fees. Traditional brokers in Indian cities charge 1–2 months' rent as commission — often for nothing more than sharing a phone number. We set out to change that.

## How Takevolet Works

Takevolet operates on a unique **Reward-Based Listing Model**:

- **For Room Posters:** List your room for free with real photos, rent details, and amenities. When a seeker successfully moves in through your listing, you earn a **₹1,000 commission** — paid directly to you.
- **For Room Seekers:** Browse hundreds of verified listings across Hyderabad and Bangalore. Pay just **₹15** to unlock the poster's contact details and connect directly — no broker, no middleman.

## What Makes Us Different

- **Zero Brokerage** — We never charge brokerage. Ever.
- **Direct Contact** — Speak directly with the person who knows the room best.
- **Verified Listings** — Every poster completes Aadhaar KYC verification.
- **Transparent Pricing** — Rent, deposit, amenities, and photos are displayed upfront.
- **Secure Payments** — All transactions are processed through Razorpay with bank-grade encryption.

## Our Coverage

We currently serve **15+ localities** across Hyderabad including Madhapur, Gachibowli, Kondapur, Miyapur, Kukatpally, HITEC City, Ameerpet, SR Nagar, Begumpet, Secunderabad, and more. We have also launched operations in **Bangalore**.

## The Team

Takevolet is proudly built by **Takevolet Technologies**, founded by **Nithin Pappala** in Hyderabad, India. Our team of engineers, designers, and real estate enthusiasts is dedicated to making renting fairer for everyone.

## Contact

- **Email:** support@takevolet.online
- **Phone:** +91 79819 94870
- **Website:** [takevolet.online](https://takevolet.online)

---

*Takevolet Technologies — Making Renting Fair.*`
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `# Privacy Policy

**Effective Date:** 1 January 2026
**Last Updated:** 1 June 2026

Takevolet Technologies ("Takevolet", "we", "us", or "our") operates the Takevolet mobile application and the website takevolet.online. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.

## 1. Information We Collect

### 1.1 Personal Information
When you register for an account, we collect:
- Full name
- Mobile phone number
- Email address
- Date of birth
- Gender

### 1.2 Identity Verification (KYC)
To post rooms and earn commissions, users must complete identity verification. We collect:
- **Aadhaar card image** (front side only)
- Name and date of birth extracted via on-device OCR

**Important:** Aadhaar OCR processing happens entirely on your device using Google ML Kit. Your Aadhaar image is stored in a **private, encrypted Supabase storage bucket** accessible only to you and our verification team.

### 1.3 Location Data
With your permission, we collect your device's location to show nearby room listings and personalise search results. You may revoke location access at any time through your device settings.

### 1.4 Device & Usage Data
We automatically collect:
- Device model and operating system version
- App version
- Crash logs and performance data
- Pages viewed and features used

### 1.5 Payment Information
Payment processing is handled entirely by **Razorpay**. We do not store your credit card, debit card, or UPI details on our servers. We retain only the transaction ID and payment status for record-keeping.

## 2. How We Use Your Information

We use your data to:
- Create and manage your account
- Display room listings and search results
- Process payments for contact unlocks and visitor passes
- Verify user identity through Aadhaar KYC
- Send transactional notifications (payment receipts, unlock confirmations)
- Improve our platform and fix bugs
- Prevent fraud and enforce our Terms of Service

## 3. Data Sharing

We do **not** sell, rent, or trade your personal information to third parties. We share data only with:
- **Razorpay** — for payment processing
- **Supabase** — for database hosting and authentication (servers located in Mumbai, India)
- **OneSignal** — for push notifications (device tokens only)
- **Law Enforcement** — if required by applicable Indian law

## 4. Data Security

We implement industry-standard security measures:
- All data is transmitted over **HTTPS/TLS 1.3**
- Supabase **Row Level Security (RLS)** ensures users can only access their own data
- Aadhaar images are stored in **private encrypted buckets**
- Admin access requires multi-factor authentication

## 5. Data Retention

- Account data is retained as long as your account is active
- Payment records are retained for **7 years** as per Indian tax regulations
- Upon account deletion, personal data is permanently removed within **30 days**

## 6. Your Rights

Under applicable Indian data protection laws, you have the right to:
- **Access** your personal data
- **Correct** inaccurate information
- **Delete** your account and associated data
- **Withdraw consent** for location or notification permissions

To exercise these rights, email us at **privacy@takevolet.online**.

## 7. Children's Privacy

Takevolet is not intended for individuals under the age of 18. We do not knowingly collect data from minors.

## 8. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or via email.

## 9. Contact Us

If you have questions or concerns about this Privacy Policy:

- **Email:** privacy@takevolet.online
- **Phone:** +91 79819 94870
- **Address:** Hyderabad, Telangana, India

---

*© 2026 Takevolet Technologies. All rights reserved.*`
  },
  {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    content: `# Terms of Service

**Effective Date:** 1 January 2026
**Last Updated:** 1 June 2026

Welcome to Takevolet. By downloading, installing, or using the Takevolet mobile application or website ("Platform"), you agree to these Terms of Service ("Terms"). Please read them carefully.

## 1. Definitions

- **"Platform"** refers to the Takevolet mobile app and website (takevolet.online).
- **"Poster"** refers to a user who lists a room, flatmate request, or marketplace item.
- **"Seeker"** refers to a user who browses listings and unlocks contacts.
- **"Handover"** refers to the confirmed move-in of a seeker into a listed room.

## 2. Eligibility

You must be at least **18 years of age** and legally competent to enter into a binding agreement to use this Platform. By using Takevolet, you represent that you meet these requirements.

## 3. Account Registration

- You must provide accurate, complete, and current information during registration.
- You are responsible for maintaining the confidentiality of your account credentials.
- You must not create multiple accounts or impersonate another person.

## 4. KYC Verification

To post rooms and earn commissions, you must complete Aadhaar-based identity verification. The name and date of birth on your uploaded Aadhaar document must match the details you provide during registration.

## 5. Listing Guidelines

Posters must:
- Provide **truthful and accurate** room details (rent, location, amenities, photos)
- Upload **real photographs** of the property (stock images are not permitted)
- Not list rooms that are unavailable, already rented, or non-existent
- Respond promptly to seeker enquiries

## 6. Payments & Pricing

### 6.1 Contact Unlock Fee
Seekers pay a one-time fee of **₹15** to unlock a poster's contact details for a specific listing. This fee is non-refundable once the contact is successfully delivered, except as described in our Refund Policy.

### 6.2 Contact Plans
We offer bundled contact plans for frequent seekers:
- **Single Contact** — ₹15 (1 contact)
- **Starter Pack** — ₹55 (10 contacts)
- **Growth Pack** — ₹105 (50 contacts)
- **Unlimited Pack** — ₹200 (unlimited contacts)

### 6.3 Visitor Pass
Seekers may purchase a **Visitor Pass** (₹299–₹499 based on rent) for premium room visit coordination.

### 6.4 Handover Commission
Upon a confirmed successful room handover, the poster earns a **₹1,000 commission**, credited to their registered bank account or UPI.

## 7. Prohibited Activities

You must not:
- Post false, misleading, or fraudulent listings
- Use the Platform to harass, abuse, or threaten other users
- Attempt to bypass the payment system or share unlocked contact details with others
- Scrape, crawl, or extract data from the Platform
- Reverse-engineer or modify the Platform

## 8. Intellectual Property

All content, designs, logos, and code on the Platform are the property of Takevolet Technologies and are protected under Indian copyright and trademark laws.

## 9. Limitation of Liability

- Takevolet acts as a **marketplace** connecting posters and seekers. We do not own, manage, or guarantee the condition of any listed property.
- We are not responsible for disputes between posters and seekers.
- Our total liability shall not exceed the amount you have paid to us in the preceding 12 months.

## 10. Termination

We reserve the right to suspend or terminate your account if you:
- Violate any of these Terms
- Post fraudulent or misleading content
- Engage in abusive behaviour toward other users

## 11. Governing Law

These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana.

## 12. Changes to Terms

We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the revised Terms.

## 13. Contact

For questions about these Terms, contact us at **support@takevolet.online**.

---

*© 2026 Takevolet Technologies. All rights reserved.*`
  },
  {
    slug: 'refund-policy',
    title: 'Refund Policy',
    content: `# Refund & Cancellation Policy

**Effective Date:** 1 January 2026
**Last Updated:** 1 June 2026

At Takevolet, we strive to provide a seamless experience. This policy outlines the conditions under which refunds may be issued.

## 1. Contact Unlock Fee (₹15)

### Eligible for Refund
- The room was **already rented out** before you unlocked the contact.
- The poster's **contact information is invalid** or non-functional (disconnected number, wrong number).
- A **technical error** on our platform prevented you from viewing the unlocked contact.

### Not Eligible for Refund
- The contact was successfully delivered and the number is active — even if the room does not meet your expectations.
- You changed your mind after unlocking the contact.
- The poster did not respond to your call/message (this is outside our control).

## 2. Contact Plans (Starter, Growth, Unlimited)

- Contact plan purchases are **non-refundable** once activated.
- Unused contacts within a plan **do not expire** and remain available for future use.

## 3. Visitor Pass (₹299–₹499)

- Refunds are available if the visit could not be completed due to a **platform error** or if the room was **already rented** before the scheduled visit.
- Refunds are **not available** if you cancel the visit voluntarily.

## 4. Handover Commissions

- Commissions earned by posters are **non-refundable** once the handover has been confirmed by the seeker.

## 5. How to Request a Refund

1. Open the Takevolet app or website.
2. Navigate to **Contact Us** or email us at **support@takevolet.online**.
3. Include your **payment ID**, **room listing details**, and **reason for the refund request**.
4. Our team will review your request within **24–48 hours**.

## 6. Refund Processing

- Approved refunds are processed within **5–7 business days**.
- Refunds are credited to your **original payment method** (bank account, UPI, or card).
- You will receive a confirmation email once the refund has been processed.

## 7. Disputes

If you are unsatisfied with a refund decision, you may escalate by contacting us at **support@takevolet.online** with the subject line "Refund Escalation". We will respond within 72 hours.

---

*© 2026 Takevolet Technologies. All rights reserved.*`
  },
  {
    slug: 'articles',
    title: 'Articles & Blog',
    content: `# Takevolet Blog

Stay informed with the latest tips, guides, and news from the Takevolet team.

---

## 🏠 How to Find the Best Bachelor Room in Hyderabad

Finding a room as a bachelor in Hyderabad can be challenging. Here are our top tips:

1. **Start with popular IT corridors** — Madhapur, Gachibowli, Kondapur, and HITEC City have the highest availability of bachelor-friendly rooms.
2. **Check furnishing status** — Fully-furnished rooms save you the hassle and cost of buying furniture.
3. **Visit before committing** — Always visit the property in person. Use Takevolet's Visitor Pass for a coordinated visit experience.
4. **Verify the poster** — On Takevolet, all posters are KYC-verified with Aadhaar, so you know you are dealing with a real person.
5. **Compare prices** — Browse multiple listings in the same area to understand fair market rent.

---

## 💰 Why Zero-Brokerage Matters

Traditional brokers in Hyderabad charge **1–2 months' rent** as commission. For a room costing ₹12,000/month, that's ₹12,000–₹24,000 paid upfront — just for a phone number.

With Takevolet, you pay just **₹15** to unlock the contact directly. That's a saving of over **₹11,985** on every single room.

Our model rewards the people who actually help — the current tenants or owners who list the room. They earn **₹1,000** when you successfully move in.

---

## 📋 Moving Checklist for IT Professionals

Relocating to Hyderabad for a new job? Here's your checklist:

- ✅ Set a budget (rent + deposit + 2 months' expenses)
- ✅ Research localities close to your office
- ✅ Browse rooms on Takevolet and shortlist 5–10 options
- ✅ Schedule visits using Visitor Pass
- ✅ Check water supply, electricity backup, and internet connectivity
- ✅ Read the rental agreement carefully before signing
- ✅ Set up a local bank account and utility connections

---

## 🗺️ Area Guide: Madhapur

Madhapur is one of Hyderabad's most sought-after areas for IT professionals:

- **Avg. Rent:** ₹8,000–₹15,000 for a single room
- **Connectivity:** Close to HITEC City, Jubilee Hills, and Banjara Hills
- **Amenities:** Numerous restaurants, gyms, supermarkets, and hospitals
- **Best For:** Software engineers, startups, young professionals

---

*More articles coming soon. Have a topic suggestion? Email us at content@takevolet.online.*`
  },
  {
    slug: 'partners',
    title: 'Our Partners',
    content: `# Takevolet Partner Network

Takevolet works with a growing network of verified partners to bring more genuine listings and better services to our users.

## Become a Takevolet Partner

We invite **property owners, PG operators, co-living spaces, and real estate agents** to join our partner network.

### Partner Benefits

- **Priority Listing Visibility** — Your rooms appear at the top of search results with a "Verified Partner" badge.
- **Dedicated Dashboard** — Manage all your listings, track views, and monitor leads from a single dashboard.
- **Bulk Listing Tools** — Upload multiple rooms at once with our streamlined bulk listing feature.
- **Analytics & Insights** — Track how many seekers view, save, and unlock your listings.
- **Partner Badge** — A verified partner badge builds trust and increases unlock rates by up to 40%.
- **Priority Support** — Get a dedicated account manager and priority customer support.

## Current Partner Categories

### 🏢 PG & Co-Living Operators
If you operate a paying guest accommodation or co-living space, list your beds and rooms on Takevolet to reach thousands of verified seekers.

### 🏠 Independent Property Owners
Own multiple rental properties? Our bulk listing and analytics tools help you manage all your properties in one place.

### 🤝 Real Estate Consultants
Licensed real estate consultants can join our network to reach a wider audience while maintaining transparency.

## How to Apply

1. **Email** us at **partners@takevolet.online** with your business details.
2. Our team will review your application within **48 hours**.
3. Once approved, you will receive access to the Partner Dashboard.

## Contact

- **Email:** partners@takevolet.online
- **Phone:** +91 79819 94870
- **Website:** [takevolet.online](https://takevolet.online)

---

*© 2026 Takevolet Technologies. All rights reserved.*`
  },
  {
    slug: 'contact-us',
    title: 'Contact Us',
    content: `# Contact Us

We are here to help. Whether you have a question, feedback, or need support, reach out to us through any of the channels below.

## Customer Support

- **Email:** support@takevolet.online
- **Phone:** +91 79819 94870
- **Hours:** Monday to Saturday, 10:00 AM – 7:00 PM IST

## Business Enquiries

- **Partnerships:** partners@takevolet.online
- **Advertising:** ads@takevolet.online
- **Press & Media:** press@takevolet.online

## Report an Issue

If you encounter a bug, fraudulent listing, or any safety concern:

1. Open the app and go to **Settings → Report a Problem**.
2. Or email us at **support@takevolet.online** with:
   - Your registered phone number
   - A description of the issue
   - Screenshots (if applicable)

We respond to all support requests within **24 hours**.

## Office Address

**Takevolet Technologies**
Hyderabad, Telangana 500081
India

## Social Media

Follow us for updates, tips, and community stories:

- **Instagram:** @takevolet
- **Twitter:** @takevolet
- **LinkedIn:** Takevolet Technologies

---

*We value your feedback. Every message helps us build a better platform.*`
  },
  {
    slug: 'shipping-policy',
    title: 'Shipping & Delivery Policy',
    content: `# Shipping & Delivery Policy

**Effective Date:** 1 January 2026

Takevolet is a **digital platform** that provides room discovery, flatmate matching, and marketplace services. We do not sell or ship physical products.

## Digital Services Delivery

All services on Takevolet are delivered **instantly and digitally**:

### Contact Unlocks
- When you purchase a contact unlock (₹15), the poster's phone number is **instantly displayed** on your screen.
- The contact details are also saved in your **"Unlocked Contacts"** section for future reference.

### Contact Plans
- Bundled contact plans (Starter, Growth, Unlimited) are **activated immediately** upon successful payment.
- Your plan balance is visible in your profile.

### Visitor Pass
- Visitor pass details are delivered via **in-app notification** and **SMS** within minutes of purchase.

## No Physical Shipping

As a digital-only platform, Takevolet does not:
- Ship or deliver physical goods
- Handle logistics for marketplace items (buyer and seller coordinate directly)
- Provide moving or relocation services

## Marketplace Items

Items listed on our marketplace (furniture, electronics, etc.) are sold directly between users. Takevolet facilitates the connection but does **not handle shipping, delivery, or logistics** for marketplace transactions.

## Service Availability

Our digital services are available **24/7** across India wherever internet connectivity is available.

## Contact

For delivery or service-related queries, email us at **support@takevolet.online**.

---

*© 2026 Takevolet Technologies. All rights reserved.*`
  }
];

async function upsertPage(page) {
  // First try to delete existing record
  await fetch(`${SUPABASE_URL}/rest/v1/pages?slug=eq.${page.slug}`, {
    method: 'DELETE',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    }
  });

  // Then insert fresh
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pages`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      slug: page.slug,
      title: page.title,
      content: page.content,
    })
  });

  const data = await res.json();
  if (res.ok) {
    console.log(`✅ ${page.slug} — inserted successfully`);
  } else {
    console.error(`❌ ${page.slug} — ERROR:`, JSON.stringify(data));
  }
}

(async () => {
  console.log('🚀 Updating all 8 pages with professional Play Store content...\n');
  for (const page of pages) {
    await upsertPage(page);
  }
  console.log('\n✅ All 8 pages updated successfully!');
})();
