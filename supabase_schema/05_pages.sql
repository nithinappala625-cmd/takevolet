-- Create pages table for dynamic static pages (About Us, Privacy Policy, etc)
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS Policies
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Allow public read access to pages
CREATE POLICY "Public read access for pages"
ON public.pages FOR SELECT
USING (true);

-- Allow authenticated users (admin) to modify pages
CREATE POLICY "Enable insert for authenticated users only"
ON public.pages FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only"
ON public.pages FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only"
ON public.pages FOR DELETE
TO authenticated
USING (true);

-- Initial Data
INSERT INTO public.pages (slug, title, content) VALUES
('about', 'About Us', 'Takevolet (RoomRelay) is the ultimate platform to find rooms, flatmates, and buy/sell items — all without paying brokerage.

Our Mission
Eliminate middleman brokers and connect seekers directly with current tenants/owners using a secure escrow reward system.

How It Works
• Posters list their rooms with real photos, rent details, and amenities
• Seekers browse listings and pay a small fee (₹15) to unlock contact details
• After a successful room handover, the poster earns a ₹1,000 commission

Why Takevolet?
• Zero brokerage — no middlemen
• Direct contact between seekers and posters
• Verified listings with real photographs
• Transparent pricing and amenities
• Serving 15+ areas in Hyderabad

Built by Nithin Pappala, proudly made in Hyderabad, India.

Contact: support@takevolet.online
Phone: +91 79819 94870'),
('privacy-policy', 'Privacy Policy', 'Your privacy is critically important to us. Takevolet respects your privacy regarding any information we may collect while operating our application.

1. Information Collection
We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means.

2. Data Usage
We use the information we collect to provide, maintain, and improve our services. We never sell your personal data to third parties.

3. Security
We protect your data using Supabase Row Level Security and industry-standard encryption. Your Aadhaar documents are stored in private, encrypted storage buckets.

4. Cookies & Analytics
Our website uses cookies for authentication and analytics purposes only.

5. Your Rights
You can request deletion of your account and all associated data at any time by contacting our support team.

6. Contact
For privacy concerns, email us at privacy@takevolet.online'),
('terms-of-service', 'Terms of Service', 'By accessing or using the Takevolet platform, you agree to be bound by these Terms.

1. Eligibility
You must be at least 18 years old to use our services.

2. Usage
You must not misuse our services. Post only genuine room listings with accurate information and real photographs.

3. Payments
All contact unlock payments (₹15) are processed via Razorpay and are subject to our refund policy. Handover commission (₹1,000) is paid to the room poster upon successful handover confirmation.

4. Verification
Users must complete KYC verification (Aadhaar upload) to post rooms and earn commissions.

5. Prohibited Activities
Posting fake listings, impersonating other users, or attempting to bypass the payment system is strictly prohibited.

6. Termination
We may suspend your account if you violate these terms.

7. Limitation of Liability
Takevolet acts as a marketplace and does not guarantee the condition of any listed property.

8. Contact
For questions about these terms, contact us at support@takevolet.online'),
('refund-policy', 'Refund Policy', 'Takevolet Refund Policy:

1. Contact Unlock Fee (₹15)
If you pay to unlock a contact and the property was already rented out prior to your payment, you are eligible for a 100% refund.

2. Eligibility
Refund requests must be submitted within 48 hours of the payment.

3. Processing Time
Approved refunds are processed within 5-7 business days to your original payment method.

4. Non-Refundable
If the room is still available at the time of unlock, the fee is non-refundable as the service was successfully delivered.

5. Handover Commissions
Commissions are earned by posters and are non-refundable once the handover is confirmed by the seeker.

6. How to Request
Contact our support team at support@takevolet.online with your payment ID and reason for refund.'),
('articles', 'Articles & Blog', 'Coming Soon: Real Estate Insights & Tips!

We are working on bringing you valuable content about:

• How to find the best bachelor rooms in Hyderabad
• Tips for negotiating rent without a broker
• Area guides: Madhapur, Gachibowli, Kondapur & more
• Roommate etiquette and living tips
• Moving checklist for IT professionals

Stay tuned for updates!'),
('partners', 'Our Partners', 'Takevolet Partner Network

We work with verified brokers and partner agencies to bring you more genuine listings.

Benefits of becoming a partner:
• Priority listing visibility
• Dedicated account manager
• Bulk listing tools
• Analytics dashboard
• Partner badge on listings

Interested in becoming a verified broker or partner agency? Contact us at partners@takevolet.online or call +91 79819 94870.')
ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, title = EXCLUDED.title;
