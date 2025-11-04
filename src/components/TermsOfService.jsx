import Navbar from "./Navbar";
import Footer from "./Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          
          <div className="prose prose-invert max-w-none space-y-8">
            <div className="text-lg leading-relaxed text-gray-300">
              <p>
                Welcome to NUvisa ("we", "our", "us"). These Terms of Service ("Terms") govern your access to and use of our website www.nuvisa.co.uk, and related services (collectively, the "Service").
              </p>
              <p>
                By using our Service, you agree to be bound by these Terms. If you do not agree, please do not use NUvisa.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">1. About NUvisa</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>NUvisa provides technology-based visa-assistance and document-preparation services. We help users prepare, verify, and book visa applications through online forms and document support.</li>
                <li>We are not affiliated with any embassy, consulate, or government authority, and we do not make visa decisions.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">2. Use of Our Services</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>You must be at least 18 years old or have legal guardian consent to use our platform.</li>
                <li>You agree to provide accurate, complete, and current information when using our services.</li>
                <li>You are responsible for maintaining the confidentiality of your account details and any actions under your account.</li>
                <li>NUvisa reserves the right to refuse service or terminate accounts that violate these Terms or involve fraudulent or abusive activity.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">3. Service Scope</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">Our services include:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>Visa document assistance and guidance</li>
                  <li>Appointment booking and tracking</li>
                  <li>Draft flight and hotel reservations (as per embassy requirements)</li>
                  <li>Application form review and submission guidance</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  We do not guarantee visa approval, as final decisions are made by the respective embassy or consulate.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">4. Payments and Fees</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>All payments for NUvisa services must be made via the payment methods available on our platform (e.g. debit/credit card/Apple/Google Pay).</li>
                <li>Prices are displayed in GBP (£) and include applicable service charges and taxes where relevant.</li>
                <li>Once an order is placed, it will be processed as per your selected service.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">5. Refunds</h2>
              <p className="text-gray-300 leading-relaxed">
                Refunds are handled in accordance with our Refund Policy. Please review the policy before making any purchase. NUvisa reserves the right to determine eligibility for refunds in accordance with the stated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">6. Cancellations</h2>
              <p className="text-gray-300 leading-relaxed">
                Cancellations may be requested only before processing begins. Once document are under review the service is considered in process and cannot be cancelled.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">7. Third-Party Services</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>NUvisa may use third-party vendors (e.g., VFS Global, TLScontact, airlines, hotels, Stripe, etc.) to deliver certain parts of the service.</li>
                <li>We are not responsible for the performance, delays, or errors of these third-party providers. You agree to comply with their respective terms and policies where applicable.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">8. Limitation of Liability</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  To the maximum extent permitted by law, NUvisa, its affiliates, and employees shall not be liable for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>Any indirect, incidental, or consequential damages;</li>
                  <li>Embassy delays or refusals;</li>
                  <li>User-provided errors in information or documentation;</li>
                  <li>Losses resulting from third-party actions or service interruptions.</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  In all cases, NUvisa's total liability shall not exceed the amount paid by you for the specific service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">9. Intellectual Property</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>All content on NUvisa's website — including text, graphics, logos, and software — is owned by NUvisa or its licensors.</li>
                <li>You may not copy, reproduce, or redistribute any material without prior written consent.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">10. Privacy</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>We handle personal data in accordance with our Privacy Policy.</li>
                <li>By using NUvisa, you consent to the collection and use of your data as described there.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">11. Changes to Terms</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>NUvisa reserves the right to update or modify these Terms at any time.</li>
                <li>Changes will be posted on this page with an update. Continued use of the Service means you accept the revised Terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">12. Governing Law</h2>
              <p className="text-gray-300 leading-relaxed">
                These Terms are governed by the laws of England and Wales. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">13. Contact Us</h2>
              <div className="space-y-2 text-gray-300">
                <p>If you have any questions about these Terms, please contact us at:</p>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p><strong>Email:</strong> support@nuvisa.co.uk</p>
                  <p><strong>Website:</strong> www.nuvisa.co.uk</p>
                  <p><strong>Registered Office:</strong> 2 Brunel Way, The Future Works, Slough, Greater London, England, SL1 1FQ</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default TermsOfService;
