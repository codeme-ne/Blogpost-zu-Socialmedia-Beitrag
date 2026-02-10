import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ButtonHTMLAttributes, ReactNode, useState, useEffect, useRef } from "react";
import { getCurrentUser } from "@/api/appwrite";
import { cn } from "@/lib/utils";
import { Check, Loader2, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { getDefaultStripePlan } from "@/config/app.config";

// Payment flow timing constants
const PAYMENT_FLOW_TIMINGS = {
  INITIAL_DELAY: 1000, // 1 second delay before starting payment checks
  FIRST_CHECK_DELAY: 5000, // 5 seconds after initial delay
  WINDOW_CHECK_INTERVAL: 2000, // Check every 2 seconds if window is closed
  PAYMENT_TIMEOUT: 120000, // 2 minutes total timeout
  TOAST_LOADING_DURATION: 2000, // 2 seconds for status check toast
  REDIRECT_TOAST_DURATION: 5000, // 5 seconds for redirect loading toast
  SUCCESS_TOAST_DURATION: 7000, // 7 seconds for success toast
} as const;

interface UpgradeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  feature?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showBadge?: boolean;
}

export function UpgradeButton({
  children,
  feature = 'Pro',
  className,
  variant = 'default',
  size = 'default',
  showBadge = true,
  onClick,
  ...props
}: UpgradeButtonProps) {
  const { loading, isActive, refreshSubscription } = useSubscription();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);

  // Refs to track timers for cleanup
  const timersRef = useRef<{
    initialDelay?: ReturnType<typeof setTimeout>;
    checkInterval?: ReturnType<typeof setTimeout>;
    cleanupTimeout?: ReturnType<typeof setTimeout>;
    windowCheckInterval?: ReturnType<typeof setInterval>;
  }>({});

  // Cleanup function for timers
  const cleanupTimers = () => {
    if (timersRef.current.initialDelay) clearTimeout(timersRef.current.initialDelay);
    if (timersRef.current.checkInterval) clearTimeout(timersRef.current.checkInterval);
    if (timersRef.current.cleanupTimeout) clearTimeout(timersRef.current.cleanupTimeout);
    if (timersRef.current.windowCheckInterval) clearInterval(timersRef.current.windowCheckInterval);
    timersRef.current = {};
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanupTimers;
  }, []);

  // Payment window monitoring effect
  useEffect(() => {
    if (!paymentWindow) return;

    const checkPayment = () => {
      refreshSubscription();
      toast.loading('Prüfe Zahlungsstatus...', {
        id: 'payment-check',
        duration: PAYMENT_FLOW_TIMINGS.TOAST_LOADING_DURATION
      });
    };

    // Initial delay before starting checks
    timersRef.current.initialDelay = setTimeout(() => {
      // First check after configured delay
      timersRef.current.checkInterval = setTimeout(checkPayment, PAYMENT_FLOW_TIMINGS.FIRST_CHECK_DELAY);

      // Monitor window closure
      timersRef.current.windowCheckInterval = setInterval(() => {
        if (paymentWindow.closed) {
          cleanupTimers();
          checkPayment();
          toast.dismiss('payment-check');
          setPaymentWindow(null);
        }
      }, PAYMENT_FLOW_TIMINGS.WINDOW_CHECK_INTERVAL);

      // Clean up after timeout period
      timersRef.current.cleanupTimeout = setTimeout(() => {
        cleanupTimers();
        toast.dismiss('payment-check');
        setPaymentWindow(null);
      }, PAYMENT_FLOW_TIMINGS.PAYMENT_TIMEOUT);
    }, PAYMENT_FLOW_TIMINGS.INITIAL_DELAY);

    // Cleanup function for this effect
    return () => {
      cleanupTimers();
      toast.dismiss('payment-check');
    };
  }, [paymentWindow, refreshSubscription]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError(null);

    const defaultPlan = getDefaultStripePlan();
    const baseLink = defaultPlan?.paymentLink;
    if (!baseLink) {
      const errorMsg = 'Zahlungslink nicht verfügbar. Bitte kontaktiere den Support.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsRedirecting(true);
    const toastId = toast.loading('Zahlungsseite wird geöffnet...', {
      duration: PAYMENT_FLOW_TIMINGS.REDIRECT_TOAST_DURATION
    });

    try {
      // Enrich payment link with user context (helps webhook link user quickly)
      const url = new URL(baseLink);
      const user = await getCurrentUser();

      if (user?.id) url.searchParams.set('client_reference_id', user.id);
      if (user?.email) url.searchParams.set('prefilled_email', user.email);

      // Open payment page
      const newPaymentWindow = window.open(url.toString(), '_blank', 'noopener,noreferrer');

      if (!newPaymentWindow) {
        const errorMsg = 'Popup wurde blockiert. Bitte aktiviere Popups für diese Website und versuche es erneut.';
        setError(errorMsg);
        toast.error(errorMsg, { id: toastId });
        setIsRedirecting(false);
        return;
      }

      toast.success('Zahlungsseite geöffnet! Kehre nach der Zahlung zu dieser Seite zurück.', {
        id: toastId,
        duration: PAYMENT_FLOW_TIMINGS.SUCCESS_TOAST_DURATION
      });

      // Focus the payment window and set it in state to trigger monitoring
      newPaymentWindow.focus();
      setPaymentWindow(newPaymentWindow);

    } catch (error) {
      console.error('Payment redirect error:', error);
      const errorMsg = 'Fehler beim Öffnen der Zahlungsseite. Bitte versuche es erneut.';
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
      setIsRedirecting(false);
    }

    // Call original onClick if provided
    if (onClick) {
      onClick(e);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={cn('relative', className)}
        disabled
        {...props}
      >
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Lade Abo-Status...
      </Button>
    );
  }

  // Show redirecting state
  if (isRedirecting) {
    return (
      <div className="space-y-2">
        <Button
          variant={variant}
          size={size}
          className={cn('relative bg-primary/80 w-full', className)}
          disabled
          {...props}
        >
          <ExternalLink className="w-4 h-4 mr-2 animate-pulse" />
          Zahlungsseite wird geöffnet...
        </Button>
        {error && (
          <div role="alert" className="text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
            {error}
          </div>
        )}
      </div>
    );
  }

  // If user already has active subscription, show success state
  if (isActive) {
    return (
      <Button 
        variant="outline"
        size={size} 
        className={cn('relative border-green-200 bg-green-50 text-green-700 hover:bg-green-100', className)}
        disabled
        {...props}
      >
        <Check className="w-4 h-4 mr-2" />
        {children || 'Pro Aktiv'}
        {showBadge && (
          <Badge className="ml-2 bg-green-600 text-white">
            ✓
          </Badge>
        )}
      </Button>
    );
  }

  // Default upgrade button
  return (
    <div className="space-y-2">
      <Button
        variant={variant}
        size={size}
        className={cn('relative group overflow-hidden w-full', className)}
        onClick={handleClick}
        disabled={isRedirecting}
        {...props}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span>{children || `Upgrade zu ${feature}`}</span>
          {showBadge && (
            <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-sm">
              {feature}
            </Badge>
          )}
        </div>

        {/* Enhanced hover effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Button>

      {error && (
        <div role="alert" className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
          <div className="flex items-start gap-2">
            <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}