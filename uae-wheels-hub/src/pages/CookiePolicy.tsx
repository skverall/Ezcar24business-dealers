import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useScrollToTop } from "@/hooks/useScrollToTop";

const CookiePolicy = () => {
  const scrollToTop = useScrollToTop();

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Header />

      <div className="w-full max-w-none px-4 lg:px-6 xl:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8 text-center">
            Cookie Policy
          </h1>
          
          <div className="glass-effect rounded-2xl p-8 md:p-12 space-y-8">
            <p className="text-muted-foreground text-center">
              Last updated: 13.08.2025
            </p>
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. What Are Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better browsing experience and allow certain features to function properly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Essential Cookies</h3>
                  <p className="text-muted-foreground">These cookies are necessary for the website to function properly. They enable basic features like page navigation and access to secure areas.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Analytics Cookies</h3>
                  <p className="text-muted-foreground">These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Functional Cookies</h3>
                  <p className="text-muted-foreground">These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Marketing Cookies</h3>
                  <p className="text-muted-foreground">These cookies are used to track visitors across websites to display relevant and engaging advertisements.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. How We Use Cookies</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>To remember your login status and preferences</li>
                <li>To analyze website traffic and user behavior</li>
                <li>To improve our services and user experience</li>
                <li>To provide personalized content and advertisements</li>
                <li>To ensure website security and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You can control and manage cookies in various ways:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Browser Settings: Most browsers allow you to view, delete, and block cookies</li>
                <li>Opt-out Tools: You can use industry opt-out tools for marketing cookies</li>
                <li>Website Settings: Some cookies can be managed through our website preferences</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Please note that disabling certain cookies may affect the functionality of our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may use third-party services that place cookies on your device. These include analytics providers, advertising networks, and social media platforms. Each third party has their own privacy and cookie policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about our use of cookies, please contact us:
              </p>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Email:</strong> aydmax@gmail.com</p>
                <p><strong>Phone:</strong> +971 58 526 3233</p>
              </div>
            </section>

            {/* Кнопка "Наверх" */}
            <div className="flex justify-center pt-8">
              <button
                type="button"
                onClick={() => scrollToTop({ smooth: true })}
                className="px-6 py-3 bg-luxury text-white rounded-lg hover:bg-luxury/90 transition-colors duration-200 font-medium"
              >
                ↑ Наверх
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CookiePolicy;
