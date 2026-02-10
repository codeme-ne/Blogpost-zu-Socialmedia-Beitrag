import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Auth } from "@/components/common/Auth";
import { getCurrentUser, onAuthStateChange } from "@/api/appwrite";
import { HeaderBarSignUp } from "@/components/landing/HeaderBarSignUp";

export default function SignUp() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Auto-redirect if already logged in
    getCurrentUser().then((user) => {
      if (user) navigate("/app", { replace: true });
      else setChecking(false);
    });
  const { data: sub } = onAuthStateChange(async (_event, session) => {
      if (session) {
        navigate("/app", { replace: true });
      }
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, [navigate]);

  if (checking) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute -left-40 -top-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col min-h-screen">
        {/* Header */}
        <HeaderBarSignUp isVisible={!checking} onBack={() => navigate("/")} />

        {/* Main content */}
        <main className="flex-grow flex flex-col items-center justify-center py-12">
          <div className="max-w-md w-full mx-auto">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-0 shadow-xl overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 z-0" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-2xl">Kostenlos testen</CardTitle>
                <CardDescription>
                  Melde dich an und verwandle deine Newsletter sofort in Social Media Content.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <Auth />
                <p className="text-xs text-muted-foreground mt-4">
                  Mit der Registrierung stimmst du zu, dass wir deine E-Mail zur Anmeldung verwenden.
                </p>
            </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center text-sm text-muted-foreground border-t border-slate-200 dark:border-slate-800 mt-12">
          <p>© 2025 Social Transformer • Newsletter zu Social Media Posts</p>
        </footer>
      </div>
    </div>
  );
}