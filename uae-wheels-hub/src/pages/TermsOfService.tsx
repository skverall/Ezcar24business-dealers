import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Header />

      <div className="w-full max-w-none px-4 lg:px-6 xl:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8 text-center">
            Terms of Service
          </h1>

          <div className="glass-effect rounded-2xl p-8 md:p-12 space-y-8">
            <p className="text-muted-foreground text-center">
              Last updated: 04.12.2025
            </p>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using EZCAR24 (the “Service”), you agree to these Terms and our Privacy & Cookie Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Eligibility & Accounts</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>You must be at least 18 years old.</li>
                <li>You may use the Service as a guest or by creating an account; if you create an account, you must provide accurate information and keep credentials secure.</li>
                <li>You are responsible for all activity under your account or device.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Services & Marketplace Role</h2>
              <p className="text-muted-foreground leading-relaxed">
                EZCAR24 operates as an online marketplace. We do not own, inspect, certify, or guarantee vehicles or listings. Transactions and communications are solely between buyers and sellers, who remain responsible for their decisions and due diligence.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. User Content & License</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>You retain ownership of the content you submit (listings, photos, messages).</li>
                <li>You grant EZCAR24 a worldwide, non-exclusive, royalty-free license to host, display, and share your content to operate the Service.</li>
                <li>Do not post content you lack rights to or that violates law or third-party rights.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Prohibited Activities</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Providing false or misleading information or misrepresenting vehicles, prices, or history.</li>
                <li>Posting unlawful, harmful, hateful, infringing, or fraudulent content.</li>
                <li>Spamming, scraping, reverse engineering, interfering with security, or attempting to circumvent platform controls.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Subscriptions & In-App Purchases</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Subscriptions and in-app purchases are billed through Apple using your Apple ID. EZCAR24 does not collect or store payment details.</li>
                <li>Auto-renew: Subscriptions renew automatically unless cancelled at least 24 hours before the current period ends. Apple may charge up to 24 hours before renewal.</li>
                <li>Manage/cancel: Go to iOS Settings &gt; Apple ID &gt; Subscriptions. Deleting the app or closing your account does not cancel a subscription.</li>
                <li>Trials: If a free trial is offered, the plan converts to paid unless cancelled at least 24 hours before the trial ends.</li>
                <li>Price changes: Apple may notify you per App Store rules; continued use after the effective date constitutes acceptance.</li>
                <li>Restore purchases: Use “Restore Purchases” in the app with the same Apple ID.</li>
                <li>Refunds: Refund requests are handled by Apple under App Store policies; EZCAR24 cannot issue App Store refunds directly.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Safety; No Vehicle Guarantees</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>We do not verify vehicle condition, ownership, title, mileage, or accident history.</li>
                <li>Always inspect vehicles, verify documents, and comply with applicable laws before transacting.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Third-Party Links & Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We are not responsible for third-party websites, services, or content accessed through links in the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may suspend or terminate access for violations of these Terms or to comply with law. You may stop using the Service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">10. Disclaimers</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is provided “as is” and “as available” without warranties of any kind, to the fullest extent permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">11. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the fullest extent permitted by law, EZCAR24 is not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill. Our total liability for any claim is limited to the amount you paid to EZCAR24 for the Service in the 3 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">12. Indemnity</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify and hold harmless EZCAR24 from claims arising out of your content, your use of the Service, or your violation of these Terms or applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">13. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these Terms. Continued use after updates means you accept the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">14. Governing Law & Jurisdiction</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms are governed by the laws of the United Arab Emirates. Courts of Dubai have exclusive jurisdiction unless applicable law mandates otherwise.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">15. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                Questions or concerns: <a className="text-luxury font-semibold" href="mailto:support@ezcar24.com">support@ezcar24.com</a>
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
