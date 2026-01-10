
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const isIOSDevice = () => {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/i.test(navigator.userAgent);
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
    }, 500);
    return () => window.clearTimeout(timer);
  }, [token, appLink, autoTried]);

  return (
    <main style={{ padding: 32, fontFamily: "system-ui", textAlign: "center", marginTop: "10vh" }}>
      <h1 className="text-2xl font-bold mb-4">Invite</h1>
      {token ? (
        <>
          <p className="text-muted-foreground mb-6">
            Tap the button below to open the Ezcar24 Business app.
          </p>
          <a
            href={appLink}
            style={{
              display: "inline-block",
              padding: "10px 18px",
              background: "#16a34a",
              color: "#ffffff",
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Open in App
          </a>
          <p className="text-muted-foreground mt-6">
            If the app doesn’t open, make sure you installed the latest version and try again in Safari.
          </p>
        </>
      ) : (
        <p className="text-muted-foreground">
          Missing invite token. Please use the invite link you received.
        </p>
      )}
    </main>
  );
}
