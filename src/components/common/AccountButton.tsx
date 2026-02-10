import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as Popover from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { getSession, signOut } from "@/api/appwrite";
import { toast } from "sonner";
import { 
  CreditCard, 
  LogOut, 
  ChevronDown,
  Loader2,
  Crown,
  Settings
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AccountButtonProps {
  className?: string;
}

export function AccountButton({ className }: AccountButtonProps) {
  const { subscription, isActive, openCustomerPortal, loading: subscriptionLoading } = useSubscription();
  const [email, setEmail] = useState<string | null>(null);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Load user email on mount and when popover opens
  const loadUserData = async () => {
    if (!email) {
      try {
        const { data } = await getSession();
        if (data?.session?.user?.email) {
          setEmail(data.session.user.email);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error("Failed to load user data:", error);
      }
    }
  };

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const handleLogout = async () => {
    setIsLogoutLoading(true);
    try {
      await signOut();
      toast.success("Erfolgreich abgemeldet");
      navigate("/");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Logout error:", error);
      toast.error("Fehler beim Abmelden");
    } finally {
      setIsLogoutLoading(false);
      setIsOpen(false);
    }
  };

  const handleOpenPortal = async () => {
    if (!subscription || !isActive) {
      toast.error("Kein aktives Abo verfügbar");
      return;
    }

    setIsPortalLoading(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Portal error:", error);
      // Error is already handled by the hook
    } finally {
      setIsPortalLoading(false);
      setIsOpen(false);
    }
  };

  const handleOpenSettings = () => {
    navigate("/settings");
    setIsOpen(false);
  };

  // Get user initial from email
  const getUserInitial = () => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="outline"
          className={cn(
            "gap-2 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-accent/50",
            className
          )}
          onClick={loadUserData}
        >
          <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-medium text-primary">
            {getUserInitial()}
          </div>
          <ChevronDown className="w-4 h-4 opacity-60" />
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 min-w-[240px] p-0 bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg"
          sideOffset={8}
          align="end"
        >
          <div className="p-4">
            {/* User Info */}
            <div className="flex items-center gap-3 pb-3 border-b border-border/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-medium text-primary">
                {getUserInitial()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">
                  {email || "Lade..."}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {subscriptionLoading ? (
                    <Badge variant="secondary" className="text-xs">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Lädt...
                    </Badge>
                  ) : isActive ? (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Pro
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Free
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-3 space-y-1">
              {/* Settings */}
              <button
                onClick={handleOpenSettings}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent/50 transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span>Einstellungen</span>
              </button>

              {/* Customer Portal - only show if user has active subscription */}
              {isActive && (
                <button
                  onClick={handleOpenPortal}
                  disabled={isPortalLoading}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent/50 transition-colors text-left disabled:opacity-50"
                >
                  {isPortalLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span>Abrechnung</span>
                </button>
              )}

              {/* Divider */}
              <div className="my-2 border-t border-border/50" />

              {/* Logout */}
              <button
                onClick={handleLogout}
                disabled={isLogoutLoading}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-left disabled:opacity-50"
              >
                {isLogoutLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                )}
                <span>Logout</span>
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}