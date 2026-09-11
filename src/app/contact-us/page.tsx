"use client";

export default function ContactUsPage() {
  return (
    <div className="pt-36 pb-20 min-h-screen bg-white text-gray-800">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Contact Us</h1>
        
        <div className="prose prose-lg max-w-none space-y-6">
          <p>Thank you for contacting Takevolet. For support, room-related assistance, payment issues, account help, or business inquiries, please reach out to us.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">General Support</h2>
          <ul className="list-none">
            <li>Website: https://takevolet.online</li>
            <li>Email: support@takevolet.online</li>
            <li>Phone: +91 79819 94870</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Business Hours</h2>
          <p>Monday – Saturday<br />10:00 AM – 7:00 PM IST</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">About Takevolet</h2>
          <p>Takevolet is a bachelor-focused accommodation platform helping users discover:</p>
          <ul className="list-disc pl-6">
            <li>Bachelor Rooms</li>
            <li>Flatmates</li>
            <li>Replacement Flatmates</li>
            <li>Room Vacancies</li>
            <li>PG Accommodation</li>
            <li>Furnished Rooms</li>
            <li>Couple-Friendly Rooms</li>
          </ul>

          <p className="mt-6">Currently serving Hyderabad, Bangalore, Pune, Mumbai, Delhi, and Chennai with plans for future expansion.</p>
          <p><strong>Founder:</strong> Nithin Patel</p>
        </div>
      </div>
    </div>
  );
}
