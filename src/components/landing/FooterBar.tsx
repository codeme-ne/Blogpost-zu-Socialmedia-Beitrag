import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useNavigate, useLocation } from "react-router-dom";
import { MakerFooter } from "./MakerFooter";

export function FooterBar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const scrollToSection = (sectionId: string) => {
    // If we're already on the landing page, just scroll
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Navigate to landing page first, then scroll to section
      navigate('/');
      // Wait for navigation and page load, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300); // Give enough time for page to load
    }
  };

  const navigateToTop = (path: string) => {
    navigate(path);
    // Nach Navigation zum Seitenanfang scrollen
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <footer className="relative py-12 sm:py-16 md:py-20 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
      <div className="relative max-w-6xl mx-auto px-4 z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Brand Column */}
          <div className="sm:col-span-2 md:col-span-2 space-y-4">
            <Logo 
              className="w-8 h-8 sm:w-10 sm:h-10 shadow-md rounded-xl" 
              showText={true} 
              textClassName="text-lg sm:text-xl font-bold"
            />
            <p className="text-sm text-muted-foreground max-w-md">
              Verwandle Newsletter in virale Social-Media-Posts mit präzise optimierten 
              OpenRouter Prompts. Entwickelt und getestet für 
              maximale Qualität und Konsistenz.
            </p>
            <div className="flex gap-3">
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white relative z-20"
                onClick={() => navigate('/signup')}
              >
                Jetzt starten →
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="relative z-20"
                onClick={() => window.open(import.meta.env.VITE_STRIPE_PAYMENT_LINK_YEARLY, '_blank')}
              >
                Jahresabo
              </Button>
            </div>
          </div>

          {/* Product Column */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Produkt</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate('/signup')}
                  className="text-sm hover:text-primary transition-colors text-left block w-full cursor-pointer relative z-20"
                >
                  Generator ausprobieren
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="text-sm hover:text-primary transition-colors text-left block w-full cursor-pointer relative z-20"
                >
                  Preise
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('features')}
                  className="text-sm hover:text-primary transition-colors text-left block w-full cursor-pointer relative z-20"
                >
                  Features
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-sm hover:text-primary transition-colors text-left block w-full cursor-pointer relative z-20"
                >
                  So funktioniert's
                </button>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:lukas@zangerlcoachingdynamics.com" className="text-sm hover:text-primary transition-colors relative z-20 inline-block">
                  Kontakt
                </a>
              </li>
              <li>
                <button 
                  onClick={() => navigateToTop('/privacy')}
                  className="text-sm hover:text-primary transition-colors text-left block w-full cursor-pointer relative z-20"
                >
                  Datenschutz
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateToTop('/terms')}
                  className="text-sm hover:text-primary transition-colors text-left block w-full cursor-pointer relative z-20"
                >
                  AGB
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateToTop('/imprint')}
                  className="text-sm hover:text-primary transition-colors text-left block w-full cursor-pointer relative z-20"
                >
                  Impressum
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-8 mb-8">
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>SSL verschlüsselt</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>Sichere Zahlung via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>4.9/5 Bewertung</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <span>14 Tage Geld-zurück</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            © 2025 Social Transformer • Made with ❤️ in Germany
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by OpenRouter AI • Content-Extraktion mit Jina & Firecrawl • Newsletter zu Social Media in Sekunden
          </p>
        </div>

        {/* Maker Footer - Cross-links to other projects */}
        <MakerFooter />
      </div>
    </footer>
  );
}
