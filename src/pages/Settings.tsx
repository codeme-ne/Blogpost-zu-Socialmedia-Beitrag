import { useState, useMemo } from "react";
import { useSubscription, Subscription } from "@/hooks/useSubscription";
import { UpgradeButton } from "@/components/common/UpgradeButton";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { env } from "@/lib/env-validation";
import { getStripePlan } from "@/config/app.config";
import { getSavedPostsForExport } from "@/api/appwrite";
import { toast } from "sonner";
import {
  User,
  CreditCard,
  FileText,
  HelpCircle,
  ArrowLeft,
  Mail,
  Shield,
  FileHeart,
  Crown,
  Sparkles
} from "lucide-react";

// Helper function for subscription status display
const getSubscriptionStatusDetails = (subscription: Subscription | null, isPro: boolean) => {
  if (!subscription || !isPro) {
    return {
      text: "Kostenloser Plan",
      description: "Begrenzte Funktionen verfügbar",
      color: "text-muted-foreground",
      bgColor: "bg-muted/30"
    };
  }

  if (subscription.status === 'active') {
    const intervalText = subscription.interval === 'yearly' ? 'Jährlich' : 'Monatlich';
    return {
      text: `Pro ${intervalText}`,
      description: "Alle Premium-Funktionen freigeschaltet",
      color: "text-green-600",
      bgColor: "bg-green-50"
    };
  }

  if (subscription.status === 'trial') {
    return {
      text: "Testversion",
      description: "Deine Testphase ist aktiv",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    };
  }

  if (subscription.status === 'past_due') {
    return {
      text: "Zahlungsrückstand",
      description: "Bitte aktualisiere deine Zahlungsmethode",
      color: "text-red-600",
      bgColor: "bg-red-50"
    };
  }

  if (subscription.status === 'canceled') {
    return {
      text: "Gekündigt",
      description: "Dein Abonnement läuft bald ab",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    };
  }

  return {
    text: subscription.status || "Unbekannt",
    description: "Status wird geladen...",
    color: "text-muted-foreground",
    bgColor: "bg-muted/30"
  };
};

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading, openCustomerPortal } = useSubscription();
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Get email from auth context
  const email = user?.email ?? null;
  const loading = authLoading || subscriptionLoading;

  const isPro = subscription?.is_active || false;

  // Memoize status details to avoid recalculation on every render
  const statusDetails = useMemo(() =>
    getSubscriptionStatusDetails(subscription, isPro),
    [subscription, isPro]
  );

  const planLabel = loading ? "Lädt…" : statusDetails.text;

  // billingPortalUrl removed - Customer Portal now handled via API
  const handleExportData = async () => {
    if (!user) {
      toast.error("Bitte logge dich ein, um deine Daten zu exportieren.");
      return;
    }

    setIsExporting(true);
    try {
      const savedPosts = await getSavedPostsForExport();

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        app: {
          name: "Social Transformer",
          version: env.app.version,
          domain: env.app.domainName,
        },
        user,
        subscription: subscription ?? null,
        saved_posts: savedPosts,
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeEmail = (user.email || "user").replace(/[^a-z0-9._-]/gi, "_");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `social-transformer-export-${safeEmail}-${date}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      toast.success("Export gestartet. Datei wurde heruntergeladen.");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Export failed:", error);
      toast.error("Export fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      {/* Mobile Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 md:hidden">
        <div className="flex items-center justify-between p-4">
          <Link to="/app">
            <Button variant="ghost" size="icon" aria-label="Zurück zum Generator">
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Einstellungen
          </h1>
          <div className="w-10" aria-hidden="true" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Einstellungen
              </h1>
              <p className="text-lg text-muted-foreground">Verwalte dein Konto und deine Präferenzen</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Alle Systeme funktional</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/app">
                <Button variant="outline" className="gap-2 transition-colors" aria-label="Zurück zum Generator">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Zurück zum Generator
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Account Card */}
          <section aria-labelledby="account-heading" className="col-span-1">
            <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10" aria-hidden="true">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle id="account-heading" className="text-lg">Konto</CardTitle>
                    <CardDescription className="text-xs">Persönliche Informationen</CardDescription>
                  </div>
                </div>
              </CardHeader>
            <CardContent className="space-y-4">
              {authLoading ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-48" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* User Profile Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-semibold text-primary">
                      {email ? email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail className="h-4 w-4" aria-hidden="true" />
                        <span>Angemeldeter Account</span>
                      </div>
                      <p className="font-medium truncate text-foreground" role="text" aria-label={`E-Mail-Adresse: ${email ?? "Nicht eingeloggt"}`}>
                        {email ?? "Nicht eingeloggt"}
                      </p>
                    </div>
                  </div>

                </>
              )}
            </CardContent>
            </Card>
          </section>

          {/* Subscription Card */}
          <section aria-labelledby="subscription-heading" className="col-span-1">
            <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10" aria-hidden="true">
                    <CreditCard className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle id="subscription-heading" className="text-lg">Abonnement-Status</CardTitle>
                    <CardDescription className="text-xs">Dein aktueller Plan</CardDescription>
                  </div>
                </div>
              </CardHeader>
            {/* Card Body - Subscription Information */}
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Current Plan Status */}
                  <div className="space-y-3">
                    <div className={cn("p-4 rounded-lg border-2 transition-all", statusDetails.bgColor)}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Aktueller Plan</span>
                        <div className="flex items-center gap-2">
                          {isPro && <Crown className="h-5 w-5 text-yellow-500" />}
                          <span className={cn("font-bold text-lg", statusDetails.color)}>
                            {planLabel}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{statusDetails.description}</p>
                    </div>

                    {/* Pro Subscription Details */}
                    {subscription && isPro && (
                      <div className="space-y-3 p-4 bg-card/50 rounded-lg border border-border/50">
                        <h4 className="text-sm font-medium text-foreground mb-3">Abonnement-Details</h4>
                        <div className="grid gap-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Tarif:</span>
                            <span className="font-medium">
                              {subscription.interval === 'yearly' ? 'Pro Jährlich' : 'Pro Monatlich'}
                            </span>
                          </div>
                          {(() => {
                            // Use config prices as source of truth, database amount as fallback
                            const configPlan = subscription.interval ? getStripePlan(subscription.interval) : null;
                            const displayAmount = configPlan ? configPlan.price : (subscription.amount || 0) / 100;
                            const displayCurrency = configPlan ? configPlan.currency : (subscription.currency || 'EUR');

                            return (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Preis:</span>
                                <span className="font-medium text-foreground">
                                  {new Intl.NumberFormat('de-DE', {
                                    style: 'currency',
                                    currency: displayCurrency.toUpperCase()
                                  }).format(displayAmount)}
                                  {subscription.interval === 'monthly' ? ' / Monat' : ' / Jahr'}
                                </span>
                              </div>
                            );
                          })()}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={cn(
                              "font-medium capitalize",
                              subscription.status === 'active' && "text-green-600",
                              subscription.status === 'trial' && "text-blue-600",
                              subscription.status === 'past_due' && "text-red-600",
                              subscription.status === 'canceled' && "text-orange-600"
                            )}>
                              {subscription.status === 'active' && 'Aktiv'}
                              {subscription.status === 'trial' && 'Testversion'}
                              {subscription.status === 'past_due' && 'Überfällig'}
                              {subscription.status === 'canceled' && 'Gekündigt'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>

            {/* Card Footer - Actions */}
            <div className="px-6 py-4 border-t border-border/50 bg-muted/20 space-y-3">
              {!loading && (
                <>
                  {/* Main Action */}
                  {!isPro ? (
                    <UpgradeButton className="w-full" />
                  ) : (
                    <div className="space-y-3">
                      <Badge className="w-full justify-center bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 py-2 px-4">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Pro Mitgliedschaft aktiv
                      </Badge>

                      {/* Customer Portal Button */}
                      {subscription && (
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            if (isOpeningPortal) return;
                            setIsOpeningPortal(true);
                            try {
                              await openCustomerPortal();
                            } catch (error) {
                              console.error('Portal error:', error);
                            } finally {
                              setIsOpeningPortal(false);
                            }
                          }}
                          disabled={isOpeningPortal}
                          className="w-full gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          {isOpeningPortal ? 'Öffne Portal...' : 'Abonnement verwalten'}
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
          </section>

          {/* Quick Actions Card */}
          <section aria-labelledby="quick-actions-heading" className="col-span-1">
            <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle id="quick-actions-heading" className="text-lg">Schnellzugriff</CardTitle>
                    <CardDescription className="text-xs">Wichtige Funktionen</CardDescription>
                  </div>
                </div>
              </CardHeader>

              {/* Card Body - Quick Actions */}
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="space-y-2">
                      <Link to="/app?expand=saved" className="block group">
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 h-auto py-3 group-hover:border-primary/50 group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
                        >
                          <FileHeart className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" />
                          <div className="text-left">
                            <div className="font-medium">Gespeicherte Posts</div>
                            <div className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">Deine gespeicherten Inhalte</div>
                          </div>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>

            </Card>
          </section>

          {/* Support Card - Full Width */}
          <section aria-labelledby="support-heading" className="col-span-1 md:col-span-2 lg:col-span-3">
          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle id="support-heading" className="text-lg">Support & Rechtliches</CardTitle>
                  <CardDescription className="text-xs">Hilfe und wichtige Dokumente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.open(`mailto:${env.app.supportEmail}`, "_blank", "noopener,noreferrer")}
                  className="gap-2 justify-start"
                >
                  <Mail className="h-4 w-4" />
                  E-Mail Support
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open("/privacy", "_blank", "noopener,noreferrer")}
                  className="gap-2 justify-start"
                >
                  <Shield className="h-4 w-4" />
                  Datenschutz
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open("/imprint", "_blank", "noopener,noreferrer")}
                  className="gap-2 justify-start"
                >
                  <FileText className="h-4 w-4" />
                  Impressum
                </Button>
              </div>
            </CardContent>
          </Card>
          </section>

          {/* Danger Zone - Full Width */}
          <section aria-labelledby="danger-zone-heading" className="col-span-1 md:col-span-2 lg:col-span-3 mt-2">
            <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                    <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle id="danger-zone-heading" className="text-lg text-red-800 dark:text-red-200">
                      Danger Zone
                    </CardTitle>
                    <CardDescription className="text-xs text-red-600 dark:text-red-400">
                      Irreversible actions that affect your account permanently
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              {/* Card Body - Dangerous Actions */}
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Data Export */}
                  <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-foreground">Daten exportieren</h4>
                        <p className="text-xs text-muted-foreground">
                          Lade alle deine gespeicherten Posts und Kontoinformationen herunter
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary/50"
                        onClick={handleExportData}
                        disabled={authLoading || !user || isExporting}
                      >
                        {isExporting ? "Export läuft…" : "Export starten"}
                      </Button>
                    </div>
                  </div>

                  {/* Account Deletion */}
                  <div className="p-4 bg-red-50/50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                          Account löschen
                        </h4>
                        <p className="text-xs text-red-600 dark:text-red-400 max-w-md">
                          Lösche dein Account permanent. Diese Aktion kann nicht rückgängig gemacht werden.
                          Alle deine Daten werden unwiderruflich gelöscht.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        disabled
                      >
                        Account löschen
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Card Footer - Warning */}
              <div className="px-6 py-4 border-t border-red-200 dark:border-red-800 bg-red-100/50 dark:bg-red-900/20">
                <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                  <Shield className="h-3 w-3" />
                  <span>
                    <strong>Hinweis:</strong> Alle Aktionen in diesem Bereich sind permanent und können nicht rückgängig gemacht werden.
                    Exportiere deine Daten vor der Kontolöschung.
                  </span>
                </div>
              </div>
            </Card>
          </section>
        </div>

        {/* Premium Footer */}
        <footer className="mt-8 md:mt-10">
          <div className="border-t border-border/50 pt-8 pb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">ST</span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-foreground">Social Transformer</p>
                  <p className="text-muted-foreground">v{env.app.version}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Status: Operational</span>
                </div>
                <span>© {new Date().getFullYear()} {env.app.domainName}</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
