
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const isIOSDevice = () => {
  if (typeof navigator === "undefined") return false;
  // Improved check for iOS (including iPadOS 13+ which reports as Mac)
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

export default function AcceptInvite() {
  const location = useLocation();
  const [autoTried, setAutoTried] = useState(false);

  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("token") ?? "";
  }, [location.search]);

  const appLink = useMemo(() => {
    const base = "com.ezcar24.business://accept-invite";
    if (!token) return base;
    return `${base}?token=${encodeURIComponent(token)}`;
  }, [token]);

  useEffect(() => {
    if (!token || !isIOSDevice() || autoTried) return;
    const timer = window.setTimeout(() => {
      window.location.href = appLink;
      setAutoTried(true);
    }, 1000); // Increased timeout significantly to allow page render
    return () => window.clearTimeout(timer);
  }, [token, appLink, autoTried]);

  return (
    <main style={{ 
      padding: 32, 
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", 
      textAlign: "center", 
      marginTop: "10vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      maxWidth: 600,
      margin: "10vh auto"
    }}>
      <h1 className="text-2xl font-bold mb-4" style={{ fontSize: "2rem", marginBottom: "1rem" }}>You've been invited!</h1>
      
      {token ? (
        <>
          <p className="text-muted-foreground mb-6" style={{ color: "#666", marginBottom: "2rem", fontSize: "1.1rem" }}>
            Tap the button below to open the Ezcar24 Business app and accept your invitation.
          </p>
          
          <a
            href={appLink}
            style={{
              display: "inline-block",
              padding: "16px 32px",
              background: "#16a34a", // Green-600
              color: "#ffffff",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: "1.1rem",
              textDecoration: "none",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              marginBottom: "2rem"
            }}
          >
            Open Ezcar24 Business
          </a>

          <div style={{ borderTop: "1px solid #eee", paddingTop: "2rem", width: "100%" }}>
            <p className="text-muted-foreground" style={{ color: "#888", marginBottom: "1rem" }}>
              Don't have the app yet?
            </p>
            <a 
              href="https://apps.apple.com/app/ezcar24-business/id6670789725" // Updated ID from App Store likely needed
              style={{ color: "#2563eb", textDecoration: "underline", fontWeight: 500 }}
            >
              Download on the App Store
            </a>
          </div>
        </>
      ) : (
        <div style={{ padding: "2rem", background: "#fef2f2", color: "#991b1b", borderRadius: 8 }}>
          <p>
            Missing invite token. Please verify you used the correct link from your email.
          </p>
        </div>
      )}
    </main>
  );
}
