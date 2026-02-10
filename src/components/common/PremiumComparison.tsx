import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Check,
  X,
  Sparkles,
  Zap,
  Infinity as InfinityIcon,
  Shield,
  TrendingUp,
  Users,
  Clock,
  Globe,
  Download,
  BarChart3
} from 'lucide-react';
import type { ReactNode } from 'react';

interface PremiumComparisonProps {
  currentPlan?: 'free' | 'pro';
  onUpgradeClick?: () => void;
  className?: string;
  showMonthlyPrice?: boolean;
}

interface FeatureItem {
  name: string;
  free: string | boolean | ReactNode;
  pro: string | boolean | ReactNode;
  icon?: ReactNode;
  highlight?: boolean;
}

export function PremiumComparison({
  currentPlan = 'free',
  onUpgradeClick,
  className,
  showMonthlyPrice = true,
}: PremiumComparisonProps) {
  const features: FeatureItem[] = [
    {
      name: 'Posts pro Tag',
      free: '3 Posts',
      pro: <span className="flex items-center gap-1"><InfinityIcon className="h-4 w-4" /> Unbegrenzt</span>,
      icon: <Sparkles className="h-4 w-4" />,
      highlight: true,
    },
    {
      name: 'Premium URL-Extraktion',
      free: false,
      pro: '20/Monat',
      icon: <Zap className="h-4 w-4" />,
    },
    {
      name: 'Standard URL-Import',
      free: true,
      pro: true,
      icon: <Globe className="h-4 w-4" />,
    },
    {
      name: 'Alle Plattformen',
      free: true,
      pro: true,
      icon: <Users className="h-4 w-4" />,
    },
    {
      name: 'Post-Regenerierung',
      free: '3x pro Post',
      pro: 'Unbegrenzt',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      name: 'Gespeicherte Posts',
      free: '10 Posts',
      pro: 'Unbegrenzt',
      icon: <Download className="h-4 w-4" />,
    },
    {
      name: 'Prioritäts-Support',
      free: false,
      pro: true,
      icon: <Shield className="h-4 w-4" />,
    },
    {
      name: 'Analytics & Insights',
      free: false,
      pro: 'Coming Soon',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      name: 'API-Zugang',
      free: false,
      pro: 'Coming Soon',
      icon: <Clock className="h-4 w-4" />,
    },
  ];

  const renderFeatureValue = (value: string | boolean | ReactNode) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground/50" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Wähle deinen Plan</h2>
        <p className="text-muted-foreground">
          Starte kostenlos oder hole dir unbegrenzten Zugang
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Free Plan */}
        <Card className={cn(
          "relative",
          currentPlan === 'free' && "border-primary"
        )}>
          {currentPlan === 'free' && (
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
              Aktueller Plan
            </Badge>
          )}
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Free</span>
              <span className="text-2xl font-bold">0€</span>
            </CardTitle>
            <CardDescription>
              Perfekt zum Ausprobieren
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {features.slice(0, 5).map((feature) => (
                <li key={feature.name} className="flex items-start gap-3">
                  <div className="mt-0.5">{feature.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{feature.name}</p>
                    <div className="mt-0.5">
                      {renderFeatureValue(feature.free)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {currentPlan === 'free' && (
              <Button variant="outline" className="w-full" disabled>
                Aktueller Plan
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className={cn(
          "relative border-2",
          currentPlan === 'pro' ? "border-primary" : "border-primary/50"
        )}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
            {currentPlan === 'pro' ? (
              <Badge>Aktueller Plan</Badge>
            ) : (
              <Badge variant="default" className="bg-gradient-to-r from-primary to-accent">
                Empfohlen
              </Badge>
            )}
          </div>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                Pro
                <Sparkles className="h-5 w-5 text-primary" />
              </span>
              <div className="text-right">
                {showMonthlyPrice ? (
                  <>
                    <span className="text-2xl font-bold">19€</span>
                    <span className="text-sm text-muted-foreground">/Monat</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold">197€</span>
                    <span className="text-sm text-muted-foreground">/Jahr</span>
                    <Badge variant="secondary" className="ml-2">-20%</Badge>
                  </>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Unbegrenzte Posts & Premium-Features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              {features.map((feature) => (
                <li
                  key={feature.name}
                  className={cn(
                    "flex items-start gap-3",
                    feature.highlight && "font-medium"
                  )}
                >
                  <div className="mt-0.5">{feature.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm">{feature.name}</p>
                    <div className="mt-0.5">
                      {renderFeatureValue(feature.pro)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {currentPlan === 'pro' ? (
              <Button variant="outline" className="w-full" disabled>
                Aktueller Plan
              </Button>
            ) : (
              <Button
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                onClick={onUpgradeClick}
              >
                Jetzt upgraden
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>SSL-verschlüsselt</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Jederzeit kündbar</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>2000+ zufriedene Nutzer</span>
        </div>
      </div>

      {/* FAQ Teaser */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <h3 className="font-semibold">Noch Fragen?</h3>
            <p className="text-sm text-muted-foreground">
              Teste Pro 7 Tage kostenlos und überzeuge dich selbst
            </p>
            <Button variant="link" className="text-primary">
              Mehr erfahren →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}