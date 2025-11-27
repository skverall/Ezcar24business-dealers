import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Header />

      <div className="w-full max-w-none px-4 lg:px-6 xl:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8 text-center">
            Terms of Service
          </h1>
          
          <div className="glass-effect rounded-2xl p-8 md:p-12 space-y-8">
            <p className="text-muted-foreground text-center">
              Last updated: 13.08.2025
            </p>
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing EZCAR24, you agree to these Terms and our Privacy & Cookie Policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We operate as an online marketplace only. We do not own, inspect, or guarantee any vehicle listed. All transactions are solely between buyers and sellers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. User Obligations</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>You must be at least 18 years old.</li>
                <li>You must provide accurate and truthful information.</li>
                <li>You are solely responsible for your listings, messages, and actions.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Prohibited Activities</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Posting fraudulent, misleading, or illegal content.</li>
                <li>Infringing intellectual property rights.</li>
                <li>Using our platform for spam, scams, or harassment.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Limitation of Liability</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>We do not verify the condition, legality, or ownership of listed vehicles.</li>
                <li>We are not responsible for disputes, damages, or losses arising from transactions between users.</li>
                <li>We are not liable for service interruptions or technical errors.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify and hold harmless EZCAR24 from any claims, damages, or expenses arising from your use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may suspend or delete your account if you breach these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Governing Law & Jurisdiction</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms are governed by the laws of the United Arab Emirates. Any dispute shall be resolved exclusively in UAE courts.
              </p>
            </section>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default TermsOfService;
