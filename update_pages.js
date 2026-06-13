const url = 'https://vwcqovrbvhztpkultqjl.supabase.co/rest/v1/pages';
const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Y3FvdnJidmh6dHBrdWx0cWpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyMDYwOCwiZXhwIjoyMDkzMzk2NjA4fQ.5OKsvAVnHSqhk_wsddohOgbsNhJS1u2oOC1UXWseLn8';

const pages = [
  {
    slug: 'about-us',
    title: 'About Us',
    content: `# Welcome to Takevolet (RoomRelay)\n\nTakevolet is India's most trusted, zero-brokerage platform designed exclusively for tenants, property owners, and flatmates in Hyderabad. Our platform completely eliminates the need for middleman brokers, saving you thousands of rupees while providing a secure, transparent, and direct connection.\n\n## Our Mission\nOur mission is to democratize real estate and rental accommodations by fostering direct connections between seekers and owners/current tenants. We envision a world where finding a home is as easy, affordable, and transparent as ordering food online.\n\n## How Our Escrow Reward System Works\n1. **Post a Listing**: Current tenants or owners can post their rooms or flats with real, verified photographs and transparent pricing.\n2. **Unlock Details**: Seekers pay a nominal platform fee of ₹15 to instantly unlock the direct contact details of the poster. No hidden charges.\n3. **Visit & Finalize**: Seekers communicate directly with the poster, visit the property, and finalize the agreement.\n4. **Handover Commission**: Once the handover is successfully confirmed, the Room Poster is rewarded with a ₹1,000 commission directly from Takevolet as a token of appreciation for providing a verified listing.\n\n## Why Choose Takevolet?\n- **100% Brokerage Free**: You only pay for what you see.\n- **Aadhaar Verified Users**: Every user on our platform is KYC verified using advanced ML-Kit OCR technology to ensure maximum safety and trust.\n- **Direct Contact**: No middleman interference. Talk directly to the decision-makers.\n- **Serving Hyderabad**: Currently operational in 15+ major tech and residential hubs in Hyderabad including Madhapur, Gachibowli, and Kondapur.\n\n**Company Name**: Takevolet Technologies\n**Founder**: Nithin Pappala\n**Headquarters**: Hyderabad, Telangana, India\n\nJoin us in revolutionizing the rental ecosystem in India!`
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `# Privacy Policy\n\n**Last Updated: June 2026**\n\nTakevolet Technologies ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Takevolet mobile application and website.\n\n## 1. Information We Collect\n- **Personal Data**: Name, email address, phone number, and gender.\n- **KYC Information**: Aadhaar card images, Date of Birth, and extracted Aadhaar numbers. This is mandatory for users wishing to post listings and receive commissions. This data is processed securely and is never shared publicly.\n- **Payment Information**: We use Razorpay to process payments. We do not store your credit card or UPI PIN details on our servers.\n- **Device Data**: IP address, device type, operating system, and app usage metrics to improve your experience.\n\n## 2. How We Use Your Information\n- To create and manage your account.\n- To verify your identity (KYC) to prevent fraud and ensure a safe community.\n- To facilitate direct communication between room seekers and posters.\n- To process transactions, including contact unlock fees (₹15) and handover commissions (₹1,000).\n- To comply with legal and regulatory obligations under Indian Law.\n\n## 3. Data Sharing and Disclosure\nWe do not sell your personal data. We may share your information only with:\n- **Service Providers**: Payment processors (Razorpay), cloud hosting (Supabase), and SMS gateways for OTPs.\n- **Other Users**: Your phone number is only revealed to a seeker AFTER they have successfully paid the ₹15 unlock fee. Your Aadhaar details are NEVER shared with other users.\n- **Legal Authorities**: If required by law, subpoena, or governmental request.\n\n## 4. Data Retention and Deletion\nWe retain your personal data only as long as your account is active or as needed to provide you services. **Data Deletion Policy (Google Play Store Requirement)**: You may request the complete deletion of your account and associated data at any time by navigating to the Profile section and selecting 'Delete Account', or by emailing support@takevolet.online. Upon request, all personal data, including Aadhaar records, will be permanently erased within 7 days, unless retention is required for legal disputes.\n\n## 5. Security of Your Data\nWe use administrative, technical, and physical security measures, including Supabase Row Level Security (RLS) and encrypted buckets, to help protect your personal information. While we have taken reasonable steps, please be aware that no security measures are perfect.\n\n## 6. Contact Us\nIf you have questions or comments about this Privacy Policy, please contact us at:\n**Email**: privacy@takevolet.online\n**Address**: Takevolet Technologies, Hyderabad, Telangana, India`
  },
  {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    content: `# Terms of Service\n\n**Last Updated: June 2026**\n\nWelcome to Takevolet. By accessing or using our mobile application or website, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.\n\n## 1. Description of Service\nTakevolet is a digital marketplace connecting room seekers with current tenants/owners and buyers with sellers. We act solely as a facilitator and are not a real estate agent, broker, or property manager.\n\n## 2. User Eligibility and KYC\nYou must be at least 18 years old to use Takevolet. To post a listing or claim a handover commission, you must complete the KYC process by uploading a valid Indian Aadhaar Card. You certify that all information provided is accurate and belongs to you. Fraudulent uploads will result in an immediate lifetime ban.\n\n## 3. Financial Transactions\n- **Unlock Fees**: Seekers must pay a non-refundable ₹15 fee to view the contact details of a listing poster.\n- **Handover Commissions**: Posters are eligible for a ₹1,000 commission once a room handover is successfully confirmed. Takevolet reserves the right to verify the physical handover before releasing the funds via UPI.\n- **Payment Gateway**: All transactions are securely processed via Razorpay. Takevolet is not liable for failures originating from the user's bank or UPI app.\n\n## 4. User Conduct\nYou agree NOT to:\n- Post fake, misleading, or duplicate listings.\n- Demand brokerage fees from seekers (Takevolet is strictly a zero-brokerage platform).\n- Use the platform for illegal activities, harassment, or discrimination.\n- Attempt to bypass the payment system by sharing phone numbers in descriptions or images.\n\n## 5. Intellectual Property\nAll content, logos, and graphics on the app are the property of Takevolet Technologies. You may not reproduce or distribute them without written permission.\n\n## 6. Limitation of Liability\nTakevolet does not guarantee the accuracy of listings, the condition of properties, or the behavior of users. You agree to physically verify properties and exercise standard safety precautions before making any large payments (like rent advances) to other users. Takevolet shall not be held liable for any financial losses, damages, or disputes arising between users.\n\n## 7. Governing Law\nThese terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana.\n\n## 8. Contact Information\nFor any legal or service inquiries, contact us at legal@takevolet.online.`
  },
  {
    slug: 'refund-policy',
    title: 'Refund Policy',
    content: `# Cancellation and Refund Policy\n\nTakevolet Technologies strictly adheres to a fair and transparent refund policy for all transactions made on our platform.\n\n## 1. Contact Unlock Fee (₹15)\n- **Non-Refundable Condition**: Once the ₹15 payment is successful and the poster's contact details are revealed to you, the fee is considered consumed and is **strictly non-refundable**. We have delivered the service of connecting you.\n- **Refundable Condition**: If you pay the fee, but due to a technical glitch the contact details are NOT revealed, or the app crashes resulting in a failed state despite money being deducted, you are eligible for a 100% refund.\n- **Unavailable Properties**: If you unlock a contact and discover the property was already rented out, you may report the listing. Our team will verify, and if proven true, we will issue a ₹15 refund to your original payment method.\n\n## 2. Handover Commissions (₹1,000)\nCommissions earned by posters are disbursed to their provided UPI ID/Bank Account within 3-5 business days after handover verification. Once disbursed, these funds cannot be reversed or refunded to the platform unless fraud is detected.\n\n## 3. Processing Times\nAll approved refunds will be processed via Razorpay and credited back to your original payment method (UPI/Card/Netbanking) within **5 to 7 business days**.\n\n## 4. How to Request a Refund\nTo request a refund, please send an email to **support@takevolet.online** within 48 hours of the transaction. You must include:\n1. Your registered phone number/email.\n2. The Razorpay Payment ID (e.g., pay_XXXXXX).\n3. A brief reason for the refund request.\n\nLate requests beyond the 48-hour window will not be entertained.`
  },
  {
    slug: 'articles',
    title: 'Articles & Blog',
    content: `# Takevolet Blog & Real Estate Insights\n\nWelcome to the Takevolet Knowledge Hub! We are dedicated to making your renting experience as seamless as possible.\n\n## Upcoming Topics this Month:\n\n### 1. The Ultimate Guide to Renting in Hyderabad Without a Broker\nLearn the exact strategies to find premium 1BHK, 2BHK, and PG accommodations in IT corridors like Madhapur and Gachibowli without paying a single rupee in brokerage.\n\n### 2. How to Spot Fake Rental Listings\nOur experts break down the red flags of online rental scams. Learn how to verify property ownership and why Takevolet's Aadhaar KYC system protects you.\n\n### 3. Splitting Expenses: The Flatmate Survival Guide\nSharing a flat? We cover the best apps and methodologies for splitting groceries, electricity bills, and rent harmoniously.\n\n### 4. Moving Checklist for Tech Professionals\nA comprehensive PDF checklist covering everything from booking packers and movers to setting up your WiFi before day one.\n\n*Check back soon! Our editorial team is finalizing these articles for publication.*`
  },
  {
    slug: 'partners',
    title: 'Our Partners',
    content: `# Takevolet Partner Network\n\nWe collaborate with verified business partners, property management companies, and corporate housing solutions to bring the highest quality inventory to our seekers.\n\n## Why Partner With Us?\n- **Massive Reach**: Access thousands of active seekers looking for homes in Hyderabad's premium locations every day.\n- **Verified Leads**: Every seeker who unlocks your contact has paid a platform fee, ensuring 100% genuine intent. No more spam calls.\n- **Zero Listing Fees**: Uploading your inventory is completely free. We only succeed when you succeed.\n- **Dedicated Account Manager**: Enterprise partners receive a dedicated relationship manager and bulk-upload tools.\n\n## Partnership Tiers\n1. **Individual Owners**: Best for landlords with 1-3 properties.\n2. **Property Managers**: Ideal for those managing 5+ properties or PG hostels. Includes priority customer support.\n3. **Corporate Alliances**: Custom integrations and API access for massive scale.\n\n## How to Apply\nIf you represent a property management firm and wish to join the Takevolet Partner Network, please send your company profile and portfolio size to **partners@takevolet.online**. Our enterprise team will contact you within 24 hours.`
  },
  {
    slug: 'contact-us',
    title: 'Contact Us',
    content: `# Get in Touch with Takevolet\n\nWe are here to help! Whether you have a question about a listing, need help with a payment, or want to report an issue, our dedicated support team is available.\n\n## Customer Support\n- **Email**: support@takevolet.online\n- **Phone**: +91 79819 94870\n- **Hours**: Monday to Saturday, 9:00 AM - 7:00 PM IST\n\n## Corporate Office\n**Takevolet Technologies**\nTech Park Avenue, Madhapur\nHyderabad, Telangana, 500081\nIndia\n\n## Social Media\nFollow us for the latest updates, new feature announcements, and exclusive flat-hunting tips:\n- **Instagram**: @takevolet.in\n- **Twitter/X**: @TakevoletHQ\n- **LinkedIn**: Takevolet Technologies\n\n*For escalations, please email our grievance officer at grievance@takevolet.online with your ticket number.*\n`
  }
];

async function updatePages() {
  for (const p of pages) {
    const res = await fetch(url + '?slug=eq.' + p.slug, {
      method: 'PATCH',
      headers: {
        'apikey': apikey,
        'Authorization': 'Bearer ' + apikey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ title: p.title, content: p.content })
    });
    const data = await res.json();
    if (data.length === 0) {
      // Not found, insert
      await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': apikey,
          'Authorization': 'Bearer ' + apikey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(p)
      });
      console.log('Inserted ' + p.slug);
    } else {
      console.log('Updated ' + p.slug);
    }
  }
}

// Delete the old 'about' slug so we only have 'about-us'
fetch(url + '?slug=eq.about', {
  method: 'DELETE',
  headers: {
    'apikey': apikey,
    'Authorization': 'Bearer ' + apikey,
  }
}).then(() => {
  console.log('Deleted old about slug');
  updatePages();
});
