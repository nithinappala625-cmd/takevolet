"use client";

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-36 pb-20 min-h-screen bg-white text-gray-800">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none space-y-6">
          <p><strong>Effective Date: June 2026</strong></p>
          <p>Welcome to Takevolet. Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your information when you use the Takevolet website and mobile application.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">1. About Takevolet</h2>
          <p>Takevolet is a bachelor-focused accommodation platform that helps users find rooms, flatmates, room vacancies, and accommodation opportunities.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">2. Information We Collect</h2>
          <h3 className="text-xl font-semibold mt-4">Personal Information</h3>
          <p>When you create an account or use our services, we may collect:</p>
          <ul className="list-disc pl-6">
            <li>Full Name</li>
            <li>Mobile Number</li>
            <li>Email Address</li>
            <li>Profile Information</li>
            <li>Location Information</li>
            <li>Gender (if provided)</li>
            <li>Room Preferences</li>
            <li>Flatmate Preferences</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">Property Information</h3>
          <p>When posting room listings:</p>
          <ul className="list-disc pl-6">
            <li>Room Details</li>
            <li>Property Photos</li>
            <li>Location Information</li>
            <li>Rent Information</li>
            <li>Owner Contact Information</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">KYC Information</h3>
          <p>For verification purposes, we may collect:</p>
          <ul className="list-disc pl-6">
            <li>Aadhaar Card Images</li>
            <li>Identity Verification Documents</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">Device Information</h3>
          <p>We may automatically collect:</p>
          <ul className="list-disc pl-6">
            <li>Device Type</li>
            <li>Operating System</li>
            <li>App Version</li>
            <li>IP Address</li>
            <li>Usage Analytics</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6">
            <li>Create and manage user accounts</li>
            <li>Match users with suitable rooms and flatmates</li>
            <li>Display room listings</li>
            <li>Process payments</li>
            <li>Improve platform functionality</li>
            <li>Prevent fraud and misuse</li>
            <li>Provide customer support</li>
            <li>Send important notifications</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">4. Payments</h2>
          <p>Payments on Takevolet are processed through trusted third-party payment providers such as Razorpay. Takevolet does not store your card details, banking credentials, or UPI PINs.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">5. Location Access</h2>
          <p>If permission is granted, we may access your location to show nearby rooms, improve room recommendations, and provide location-based services. You can disable location access anytime through device settings.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">6. Storage of Information</h2>
          <p>User information may be stored securely using trusted cloud infrastructure and database providers. We take reasonable measures to protect data from unauthorized access, disclosure, or misuse.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">7. Sharing of Information</h2>
          <p>We do not sell user data. Information may be shared only:</p>
          <ul className="list-disc pl-6">
            <li>Between room seekers and room owners when necessary</li>
            <li>With payment providers</li>
            <li>With legal authorities when required by law</li>
            <li>With service providers supporting platform operations</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">8. Notifications</h2>
          <p>Takevolet may send Account Notifications, Room Match Alerts, Flatmate Match Alerts, Listing Updates, and Service Announcements. Users may manage notification preferences through device settings.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">9. User Responsibilities</h2>
          <p>Users are responsible for providing accurate information, maintaining account security, using the platform legally, and respecting other users&apos; privacy.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">10. Data Deletion</h2>
          <p>Users may request account deletion by contacting us. Upon request, we will make reasonable efforts to remove personal information except where retention is required by law or for legitimate business purposes.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">11. Children&apos;s Privacy</h2>
          <p>Takevolet is intended for users aged 18 years and above. We do not knowingly collect information from children.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">12. Third-Party Services</h2>
          <p>Takevolet may use third-party services including Supabase, Razorpay, OneSignal, and Google Services. These providers may process information according to their own privacy policies.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">13. Changes to Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. Updated versions will be posted on our website and application.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">14. Contact Us</h2>
          <p>For privacy-related questions or requests:</p>
          <ul className="list-none">
            <li><strong>Takevolet</strong></li>
            <li>Founder: Nithin Patel</li>
            <li>Website: https://takevolet.online</li>
            <li>Email: support@takevolet.online</li>
            <li>Phone: +91 79819 94870</li>
          </ul>
          
          <p className="mt-8 italic">By using Takevolet, you agree to this Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
}
