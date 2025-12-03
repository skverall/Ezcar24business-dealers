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
              Effective Date: December 03, 2025
            </p>
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ezcar24 ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website <code>www.ezcar24.com</code> and use our mobile application (the "App"). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use the App.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Collection of Your Information</h2>
              <p className="text-muted-foreground mb-4">We may collect information about you in a variety of ways. The information we may collect via the App includes:</p>
              <div className="space-y-3 text-muted-foreground">
                <p><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information, such as your age, gender, hometown, and interests, that you voluntarily give to us when you register with the App or when you choose to participate in various activities related to the App, such as online chat and message boards.</p>
                <p><strong>Derivative Data:</strong> Information our servers automatically collect when you access the App, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the App.</p>
                <p><strong>Financial Data:</strong> Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services from the App.</p>
                <p><strong>Mobile Device Data:</strong> Device information, such as your mobile device ID, model, and manufacturer, and information about the location of your device, if you access the App from a mobile device.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Use of Your Information</h2>
              <p className="text-muted-foreground mb-4">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the App to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Create and manage your account.</li>
                <li>Process your transactions and send you related information, including purchase confirmations and invoices.</li>
                <li>Email you regarding your account or order.</li>
                <li>Fulfill and manage purchases, orders, payments, and other transactions performed via the App.</li>
                <li>Generate a personal profile about you to make future visits to the App more personalized.</li>
                <li>Increase the efficiency and operation of the App.</li>
                <li>Monitor and analyze usage and trends to improve your experience with the App.</li>
                <li>Notify you of updates to the App.</li>
                <li>Offer new products, services, mobile applications, and/or recommendations to you.</li>
                <li>Perform other business activities as needed.</li>
                <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
                <li>Request feedback and contact you about your use of the App.</li>
                <li>Resolve disputes and troubleshoot problems.</li>
                <li>Respond to product and customer service requests.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Disclosure of Your Information</h2>
              <p className="text-muted-foreground mb-4">We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
                <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.</li>
                <li><strong>Marketing Communications:</strong> With your consent, or with an opportunity for you to withdraw consent, we may share your information with third parties for marketing purposes, as permitted by law.</li>
                <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Security of Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Policy for Children</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Your Rights and Account Deletion</h2>
              <p className="text-muted-foreground mb-4">
                You have the right to request access to the personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. You may also have the right to object to, or request that we restrict, certain processing.
              </p>
              <div className="space-y-3 text-muted-foreground">
                <p><strong>Account Deletion:</strong> You may delete your account at any time by going to your account settings within the App or by contacting us using the contact information provided below. Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, some information may be retained in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our Terms of Use and/or comply with legal requirements.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground mb-4">If you have questions or comments about this Privacy Policy, please contact us at:</p>
              <div className="space-y-2 text-muted-foreground">
                <p className="font-semibold">Ezcar24</p>
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
