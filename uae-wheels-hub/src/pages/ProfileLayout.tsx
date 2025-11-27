import { NavLink, Outlet } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

const TabLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "px-4 py-2 text-sm font-medium rounded-md border transition-colors",
        isActive
          ? "bg-luxury text-luxury-foreground border-luxury shadow"
          : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
      )
    }
    end
  >
    {children}
  </NavLink>
);

export default function ProfileLayout() {
  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden flex flex-col">
      <Header />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-6 xl:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your account and listings</p>
        </div>

        {/* Tabs as NavLinks */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <TabLink to="/profile">Profile Settings</TabLink>
            <TabLink to="/profile/my-listings">My Listings</TabLink>
            <TabLink to="/profile/drafts">Drafts</TabLink>
            <TabLink to="/profile/favorites">Favorites</TabLink>
            <TabLink to="/profile/activity">Activity</TabLink>
          </div>
        </div>

        {/* Nested pages */}
        <Outlet />
      </div>

      <Footer />
    </div>
  );
}

