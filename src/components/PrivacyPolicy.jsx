import Navbar from "./Navbar";
import Footer from "./Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          
          <div className="prose prose-invert max-w-none space-y-8">
            <div className="text-lg leading-relaxed text-gray-300">
              <p>
                At NUvisa, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard the personal data you provide when using our website www.nuvisa.co.uk, and related services ("Services").
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">1. Who We Are</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  NUvisa ("we", "our", "us") is a UK-based technology platform providing online visa-assistance and travel-document support services.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  We operate under NUvisa trading name (Registered number: 13081681 Jexens Ltd) registered in England and Wales.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  For all privacy-related queries, contact us at: <strong>support@nuvisa.co.uk</strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">2. Information We Collect</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  We collect personal and non-personal data necessary to deliver our visa-assistance services. This may include:
                </p>
                
                <div>
                  <h3 className="text-xl font-medium mb-2 text-green-300">a. Personal Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    <li>Full name, date of birth, nationality</li>
                    <li>Passport details</li>
                    <li>Contact details (email, phone, address)</li>
                    <li>Visa-related information and travel history</li>
                    <li>Payment information (handled securely via Stripe)</li>
                    <li>Uploaded documents (e.g., ID, proof of address, travel bookings)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2 text-green-300">b. Automatically Collected Information</h3>
                  <p className="text-gray-300 leading-relaxed mb-2">
                    When you use our website or app, we may collect:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    <li>IP address and device type</li>
                    <li>Browser type and operating system</li>
                    <li>Pages visited and time spent on our platform</li>
                    <li>Cookies and analytics identifiers (via tools like Google Analytics)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">3. How We Use Your Information</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">We use your information to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>Process and manage your visa-assistance requests</li>
                  <li>Communicate with you about your application</li>
                  <li>Facilitate secure payments and refunds</li>
                  <li>Improve our services and user experience</li>
                  <li>Prevent fraud, ensure security, and comply with legal obligations</li>
                  <li>Provide customer support and respond to enquiries</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  We only use your data for legitimate business purposes and never sell your information.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">4. Payment Processing</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Payments made through our website are processed securely by Stripe, our trusted payment provider.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  We do not store or have access to your full card details — these are handled in accordance with Stripe's Privacy and PCI-DSS security standards.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  You can review Stripe's policy here: <a href="https://stripe.com/gb/privacy" className="text-blue-400 hover:text-blue-300 underline">https://stripe.com/gb/privacy</a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">5. Data Sharing and Disclosure</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  We may share limited data only when necessary to deliver our services, for example:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>With embassies, visa centres (e.g., VFS, TLScontact) to process applications</li>
                  <li>With service providers such as payment processors, hosting partners, and verification providers when required by law or regulatory authorities.</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  All third parties are bound by confidentiality and data-protection agreements.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">6. Data Retention</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">We retain personal information only for as long as necessary to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>Fulfil the purpose it was collected for, or</li>
                  <li>Comply with legal and regulatory requirements</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  Typically, visa-related data is retained for 12–24 months after completion of service, unless longer retention is legally required.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">7. Your Rights</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Under the UK General Data Protection Regulation (UK GDPR), you have the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>Access your personal data</li>
                  <li>Request correction or deletion</li>
                  <li>Restrict or object to processing</li>
                  <li>Withdraw consent at any time</li>
                  <li>Request data portability</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  To exercise these rights, contact support@nuvisa.co.uk. We may require identity verification before processing your request.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">8. Data Security</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  We implement appropriate technical and organisational safeguards, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>SSL/TLS encryption</li>
                  <li>Secure document storage and limited access</li>
                  <li>Regular system monitoring and audits</li>
                  <li>Staff confidentiality and data-protection training</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">9. Children's Privacy</h2>
              <p className="text-gray-300 leading-relaxed">
                Our services are not directed to individuals under 18. If we become aware that we have collected personal data from a minor without consent, we will delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">10. International Data Transfers</h2>
              <p className="text-gray-300 leading-relaxed">
                If your data is transferred outside the UK or EEA (for example, to processing partners), we ensure that appropriate safeguards — such as standard contractual clauses — are in place to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">11. Changes to This Policy</h2>
              <p className="text-gray-300 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">12. Contact Us</h2>
              <div className="space-y-2 text-gray-300">
                <p>If you have any questions, concerns, or complaints regarding this Privacy Policy, please contact us at:</p>
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

export default PrivacyPolicy;
