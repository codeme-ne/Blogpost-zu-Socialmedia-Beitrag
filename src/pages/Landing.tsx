import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, onAuthStateChange } from "@/api/appwrite";
import HowItWorks from "@/components/graphics/HowItWorks";
import { DecorativeBackground } from "@/components/landing/DecorativeBackground";
import { HeaderBar } from "@/components/landing/HeaderBar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { PricingSection } from "@/components/landing/PricingSection";
import { FooterBar } from "@/components/landing/FooterBar";
import { CTASection } from "@/components/landing/CTASection";
import { FAQSection } from "@/components/landing/FAQSection";

export default function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    // Auto-redirect if already logged in
    getCurrentUser().then((user) => {
      if (user) navigate("/app", { replace: true });
      else setChecking(false);
    });
    const { data: sub } = onAuthStateChange((_event, session) => {
      if (session) navigate("/app", { replace: true });
    });

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => {
      sub?.subscription?.unsubscribe?.();
      clearTimeout(timer);
    };
  }, [navigate]);


  if (checking) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden relative">
  <DecorativeBackground />

      <div className="relative z-10 container mx-auto px-4 py-4 md:py-8 flex flex-col min-h-screen">
    <HeaderBar isVisible={isVisible} onSignup={() => navigate("/signup")} />

        {/* Main content with staggered animations */}
        <main className="flex flex-col items-stretch py-6 md:py-8 lg:py-16">
          <div className="max-w-6xl w-full grid lg:grid-cols-2 items-start gap-10 lg:gap-16 mx-auto">
            {/* Left column: Marketing content with entrance animations */}
            <div className="space-y-8 flex flex-col justify-start">
      <HeroSection isVisible={isVisible} onSignup={() => navigate("/signup")} />
            </div>

            {/* Right column: Demo Video */}
            <div className="flex flex-col justify-start">
              <div className={`self-start mt-6 lg:mt-0 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} order-first lg:order-none`}>
                {/* Demo Video with GIF-like behavior */}
                <div className="w-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/5 to-accent/5">
                  {videoError ? (
                    <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                      <div className="text-center p-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Demo Video</h3>
                        <p className="text-sm text-muted-foreground">
                          Sieh dir an, wie Social Transformer<br />
                          Newsletter in virale Posts verwandelt
                        </p>
                      </div>
                    </div>
                  ) : (
                    <video
                      className="w-full h-auto"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      onError={() => setVideoError(true)}
                    >
                      <source src="https://pw-bunny.b-cdn.net/Linkedin-Posts-Landing/First%20SaSS.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Features grid below the hero+graphic section */}
          <div id="features" className="max-w-6xl w-full mx-auto mt-10 lg:mt-14">
            <div className="lg:hidden">
              <FeaturesGrid isVisible={isVisible} variant="mobile" />
            </div>
            <div className="hidden lg:block">
              <FeaturesGrid isVisible={isVisible} variant="desktop" />
            </div>
          </div>
        </main>
      </div>

      {/* How It Works Section - außerhalb des Containers für vollen Hintergrund */}
      <HowItWorks />

      {/* Pricing Section - außerhalb des Containers für vollen Hintergrund */}
      <PricingSection />

      {/* CTA Section - new section before footer */}
      <CTASection />

      {/* FAQ Section - new section before footer */}
      <FAQSection />

      {/* Footer Section - außerhalb des Containers für vollen Hintergrund */}
      <FooterBar />
    </div>
  );
}
