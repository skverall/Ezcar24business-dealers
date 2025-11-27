import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Header />

      <div className="w-full max-w-none px-4 lg:px-6 xl:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8 text-center">
            Privacy Policy
          </h1>
          
          <div className="glass-effect rounded-2xl p-8 md:p-12 space-y-8">
            <p className="text-muted-foreground text-center">
              Last updated: 13.08.2025
            </p>
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                EZCAR24 ("we", "our", "us") operates as an online car marketplace in the UAE. We value your privacy and are committed to protecting your personal data in accordance with applicable UAE laws and international standards.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Information We Collect</h2>
              <div className="space-y-3 text-muted-foreground">
                <p><strong>Personal Data:</strong> name, email, phone number, location, and any details you provide during registration or when contacting us.</p>
                <p><strong>Vehicle Data:</strong> information about cars you list or inquire about.</p>
                <p><strong>Technical Data:</strong> IP address, browser type, device information, pages visited, cookies.</p>
                <p><strong>Transactional Data:</strong> messages exchanged via our platform, inquiries, or offers.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. How We Use Your Data</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>To provide, operate, and improve our services.</li>
                <li>To verify user identity and prevent fraud.</li>
                <li>To facilitate communication between buyers and sellers.</li>
                <li>To comply with legal obligations in the UAE.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Sharing Your Data</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>We do not sell personal data.</li>
                <li>We may share data with service providers (hosting, payment, analytics) under strict confidentiality.</li>
                <li>We may disclose data if required by UAE law enforcement or court order.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Data Security</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>We use appropriate technical and organizational measures to secure your data.</li>
                <li>However, no method of transmission or storage is 100% secure.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Your Rights</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>You may request access, correction, or deletion of your personal data.</li>
                <li>You can opt out of marketing communications anytime.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Liability Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                We are not responsible for any third-party misuse of data if shared by you directly with other users outside the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Contact</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Email:</strong> aydmax@gmail.com</p>
                <p><strong>Phone:</strong> +971 58 526 3233</p>
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
