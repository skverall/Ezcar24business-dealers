import Header from "@/components/Header";
import Footer from "@/components/Footer";

const DeleteAccount = () => {
  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <Header />

      <div className="w-full max-w-none px-4 lg:px-6 xl:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8 text-center">
            Delete Account & Data
          </h1>

          <div className="glass-effect rounded-2xl p-8 md:p-12 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Request Account Deletion
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                To delete your account and all associated data, please send an email to:
              </p>
              <p className="text-center mt-6 mb-6">
                <a
                  href="mailto:aydmaxx@gmail.com?subject=Delete%20My%20Account"
                  className="text-xl font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  aydmaxx@gmail.com
                </a>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Include <strong>"Delete My Account"</strong> in the subject line and the email address registered to your account in the body.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                What Happens Next
              </h2>
              <ul className="list-disc list-inside space-y-3 text-muted-foreground">
                <li>Your request will be processed within <strong>30 days</strong>.</li>
                <li>All personal data, vehicle records, client information, photos, and financial data associated with your account will be <strong>permanently deleted</strong>.</li>
                <li>Your login credentials will be removed and you will no longer be able to access the app.</li>
                <li>Any shared business data where you are the sole owner will also be removed.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Data Retention
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Some anonymized, non-personal data may be retained for analytics purposes. This data cannot be used to identify you personally.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DeleteAccount;
