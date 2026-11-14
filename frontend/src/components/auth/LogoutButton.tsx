import { useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

/**
 * No explicit navigation after logout: clearing the auth context flips
 * `isAuthenticated` to false, and the surrounding `ProtectedRoute` redirects
 * to /login on its next render.
 */
function LogoutButton() {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("Logged out successfully");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
      <LogOut className="size-4" />
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  );
}

export { LogoutButton };
