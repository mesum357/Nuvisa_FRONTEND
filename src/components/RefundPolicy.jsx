import Navbar from "./Navbar";
import Footer from "./Footer";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Refund Policy
          </h1>
          
          <div className="prose prose-invert max-w-none space-y-8">
            <div className="text-lg leading-relaxed text-gray-300">
              <p>
                At NUvisa, we aim to provide a transparent and reliable visa-assistance experience for all our users. Please read this policy carefully before making any purchase.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">1. General Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                NUvisa operates as a visa-assistance and document-preparation service. We help users prepare, review, and submit visa applications but do not make any decisions on visa approvals or rejections — these decisions are made solely by the relevant embassy or consulate.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">2. Refund Eligibility</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2 text-green-300">Refunds may be considered under the following circumstances:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    <li>Duplicate payment due to a technical issue.</li>
                    <li>Payment charged but service not initiated (e.g., no documentation review or appointment processed).</li>
                    <li>Incorrect amount charged.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-2 text-red-300">Refunds are not available in the following cases:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    <li>The visa application has already been under review.</li>
                    <li>The application was rejected by the embassy or consulate.</li>
                    <li>The delay was caused by external parties (embassy, appointment centre, etc.)</li>
                    <li>Customer fails to provide required documents or information within reasonable time.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">3. Refund Requests</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  To request a refund, please email support@nuvisa.co.uk with:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>Full name</li>
                  <li>Order or reference number</li>
                  <li>Payment receipt</li>
                  <li>Reason for refund request</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  Our team will acknowledge your request within 24 business hours and review it within 3-4 business days.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">4. Refund Method</h2>
              <p className="text-gray-300 leading-relaxed">
                If approved, the refund will be processed to your original payment method within 5–7 business days depending on your bank or payment provider.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">5. Cancellations</h2>
              <p className="text-gray-300 leading-relaxed">
                If you wish to cancel your order before processing has begun, please contact us immediately at support@nuvisa.co.uk. Once our team has started document review the service is deemed in progress and cannot be cancelled.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-blue-300">6. Contact</h2>
              <div className="space-y-2 text-gray-300">
                <p>For any questions about this Refund Policy or related issues, you can reach us at:</p>
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p><strong>Email:</strong> support@nuvisa.co.uk</p>
                  <p><strong>Website:</strong> www.nuvisa.co.uk</p>
                  <p><strong>Registered office:</strong> 2 Brunel Way, The Future Works, Slough, Greater London, England, SL1 1FQ</p>
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

export default RefundPolicy;
