import { useNavigate } from "react-router-dom";
import { FooterBar } from "@/components/landing/FooterBar";
import { HeaderBar } from "@/components/landing/HeaderBar";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="container mx-auto px-4">
        <HeaderBar 
          isVisible={true}
          onSignup={() => navigate('/')}
        />
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Anbieter</h2>
            <p className="mb-4">
              Social Transformer<br />
              Lukas Zangerl<br />
              Stapper Weg 214<br />
              41199 Mönchengladbach<br />
              Deutschland
            </p>
            <p className="mb-4">
              E-Mail: lukas@zangerlcoachingdynamics.com<br />
              Telefon: +49 151 26718443<br />
              Website: social-transformer.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 1 Geltungsbereich</h2>
            <p className="mb-4">
              (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") gelten für alle Verträge zwischen 
              Lukas Zangerl, handelnd unter "Social Transformer" (nachfolgend "Anbieter") und dem Kunden über die Nutzung der Social Transformer 
              Plattform und zugehörigen Dienstleistungen.
            </p>
            <p className="mb-4">
              (2) Abweichende, entgegenstehende oder ergänzende AGB des Kunden werden nur dann und insoweit 
              Vertragsbestandteil, als der Anbieter ihrer Geltung ausdrücklich zugestimmt hat.
            </p>
            <p className="mb-4">
              (3) Diese AGB gelten in ihrer zum Zeitpunkt der Bestellung gültigen Fassung.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 2 Vertragsgegenstand</h2>
            <p className="mb-4">
              (1) Der Anbieter stellt dem Kunden eine webbasierte Software-as-a-Service (SaaS) Lösung zur 
              Verfügung, die es ermöglicht, Newsletter und Blog-Inhalte mit Hilfe von Künstlicher Intelligenz (OpenRouter AI) 
              in Social Media Posts für verschiedene Plattformen (LinkedIn, X/Twitter, Instagram) umzuwandeln.
            </p>
            <p className="mb-4">
              (2) Die Plattform bietet sowohl kostenlose Basis-Funktionen als auch Premium-Features für zahlende Nutzer, 
              einschließlich erweiterte Content-Extraktion mittels Firecrawl-API.
            </p>
            <p className="mb-4">
              (3) Der genaue Funktionsumfang ergibt sich aus der aktuellen Leistungsbeschreibung auf der Website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 3 Vertragsschluss</h2>
            <p className="mb-4">
              (1) Die Darstellung der Produkte auf unserer Website stellt kein rechtlich bindendes Angebot, 
              sondern eine Aufforderung zur Bestellung dar.
            </p>
            <p className="mb-4">
              (2) Durch die Registrierung und Auswahl eines Tarifs gibt der Kunde ein verbindliches Angebot 
              zum Abschluss eines Nutzungsvertrags ab.
            </p>
            <p className="mb-4">
              (3) Der Vertrag kommt durch die Annahme des Angebots durch den Anbieter zustande, welche durch 
              die Freischaltung des Zugangs erfolgt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 4 Preise und Zahlungsbedingungen</h2>
            <p className="mb-4">
              (1) Es gelten die zum Zeitpunkt der Bestellung auf der Website angegebenen Preise. Alle Preise 
              verstehen sich inklusive der gesetzlichen Mehrwertsteuer.
            </p>
            <p className="mb-4">
              (2) Die Zahlung erfolgt über den Zahlungsdienstleister Stripe. Der Kunde ermächtigt den Anbieter, 
              die fälligen Beträge über Stripe einzuziehen.
            </p>
            <p className="mb-4">
              (3) Bei Zahlungsverzug ist der Anbieter berechtigt, den Zugang zur Plattform zu sperren.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 5 Lifetime Deal</h2>
            <p className="mb-4">
              (1) Der "Lifetime Deal" gewährt dem Kunden gegen eine einmalige Zahlung von 99 € ein zeitlich 
              unbegrenztes Nutzungsrecht an der Plattform.
            </p>
            <p className="mb-4">
              (2) Das Lifetime Deal gilt ausschließlich für die zum Zeitpunkt des Kaufs verfügbaren Funktionen. 
              Zukünftige Premium-Features können zusätzliche Kosten verursachen.
            </p>
            <p className="mb-4">
              (3) Das Lifetime Deal ist nicht übertragbar und gilt nur für den ursprünglichen Käufer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 6 Nutzungsrechte</h2>
            <p className="mb-4">
              (1) Der Kunde erhält ein nicht ausschließliches, nicht übertragbares Nutzungsrecht an der 
              Software für die Dauer des Vertragsverhältnisses.
            </p>
            <p className="mb-4">
              (2) Eine Weitergabe der Zugangsdaten an Dritte ist untersagt.
            </p>
            <p className="mb-4">
              (3) Der Kunde ist verpflichtet, die Plattform nur für rechtmäßige Zwecke zu nutzen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 7 Verfügbarkeit</h2>
            <p className="mb-4">
              (1) Der Anbieter bemüht sich um eine möglichst unterbrechungsfreie Verfügbarkeit der Plattform. 
              Eine Verfügbarkeit von 100% wird jedoch nicht garantiert.
            </p>
            <p className="mb-4">
              (2) Wartungsarbeiten werden, soweit möglich, im Voraus angekündigt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 8 Haftung</h2>
            <p className="mb-4">
              (1) Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach Maßgabe 
              des Produkthaftungsgesetzes.
            </p>
            <p className="mb-4">
              (2) Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten 
              und begrenzt auf den vertragstypischen, vorhersehbaren Schaden.
            </p>
            <p className="mb-4">
              (3) Die Haftung für Datenverlust ist auf den typischen Wiederherstellungsaufwand beschränkt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 9 Datenschutz</h2>
            <p className="mb-4">
              (1) Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung.
            </p>
            <p className="mb-4">
              (2) Der Kunde verpflichtet sich, nur solche Inhalte zu verarbeiten, für die er die erforderlichen 
              Rechte besitzt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 10 KI-generierte Inhalte und Verantwortlichkeiten</h2>
            <p className="mb-4">
              (1) Die Plattform nutzt Künstliche Intelligenz über OpenRouter zur Generierung von Social Media Inhalten.
            </p>
            <p className="mb-4">
              (2) Der Kunde ist verpflichtet, alle generierten Inhalte vor Veröffentlichung zu prüfen und trägt die 
              Verantwortung für die Richtigkeit, Rechtmäßigkeit und Angemessenheit der veröffentlichten Inhalte.
            </p>
            <p className="mb-4">
              (3) Der Anbieter übernimmt keine Haftung für die Qualität, Richtigkeit oder rechtliche Unbedenklichkeit 
              der KI-generierten Inhalte.
            </p>
            <p className="mb-4">
              (4) Der Kunde verpflichtet sich, keine rechtswidrigen, beleidigenden, diskriminierenden oder 
              urheberrechtsverletzenden Inhalte über die Plattform zu generieren oder zu verbreiten.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 11 Premium-Features und Nutzungslimits</h2>
            <p className="mb-4">
              (1) Zahlende Kunden erhalten Zugang zu Premium-Features, einschließlich erweiterte Content-Extraktion 
              mittels Firecrawl-API.
            </p>
            <p className="mb-4">
              (2) Die Premium-Content-Extraktion ist auf 20 Anfragen pro Monat und Nutzer begrenzt. 
              Das Kontingent wird monatlich zurückgesetzt.
            </p>
            <p className="mb-4">
              (3) Bei Überschreitung der Limits werden automatisch die kostenlosen Basis-Features verwendet.
            </p>
            <p className="mb-4">
              (4) Der Anbieter behält sich vor, Nutzungslimits anzupassen, um die Serviceverfügbarkeit 
              für alle Nutzer zu gewährleisten.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 12 Meldeverfahren und Content-Moderation</h2>
            <p className="mb-4">
              (1) Nutzer können rechtswidrige oder gegen diese AGB verstoßende Inhalte über die bereitgestellten 
              Kontaktmöglichkeiten melden.
            </p>
            <p className="mb-4">
              (2) Meldungen werden unverzüglich geprüft. Bei begründeten Meldungen werden entsprechende Inhalte 
              entfernt und der betroffene Nutzer informiert.
            </p>
            <p className="mb-4">
              (3) Bei schwerwiegenden oder wiederholten Verstößen kann der Zugang zur Plattform gesperrt werden.
            </p>
            <p className="mb-4">
              (4) Gegen Moderationsentscheidungen kann innerhalb von 14 Tagen Widerspruch eingelegt werden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 13 Vertragslaufzeit und Kündigung</h2>
            <p className="mb-4">
              (1) Der Vertrag läuft auf unbestimmte Zeit.
            </p>
            <p className="mb-4">
              (2) Monatliche Abonnements können mit einer Frist von 14 Tagen zum Monatsende gekündigt werden.
            </p>
            <p className="mb-4">
              (3) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
            </p>
            <p className="mb-4">
              (4) Lifetime Deals sind von der ordentlichen Kündigung ausgeschlossen, können aber aus wichtigem 
              Grund gekündigt werden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 14 Widerrufsrecht</h2>
            <p className="mb-4">
              (1) Verbrauchern steht ein Widerrufsrecht nach Maßgabe der gesetzlichen Bestimmungen zu.
            </p>
            <p className="mb-4">
              (2) Das Widerrufsrecht beträgt 14 Tage ab Vertragsschluss.
            </p>
            <p className="mb-4">
              (3) Bei digitalen Inhalten erlischt das Widerrufsrecht, wenn der Kunde der sofortigen 
              Vertragsausführung zugestimmt hat.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 15 Änderungen der AGB</h2>
            <p className="mb-4">
              (1) Der Anbieter behält sich vor, diese AGB zu ändern, wenn dies zur Anpassung an 
              geänderte Rechtslage oder technische Gegebenheiten erforderlich ist.
            </p>
            <p className="mb-4">
              (2) Wesentliche Änderungen werden dem Kunden mindestens 30 Tage vor Inkrafttreten 
              in klarer und verständlicher Form per E-Mail mitgeteilt.
            </p>
            <p className="mb-4">
              (3) Widerspricht der Kunde den Änderungen nicht innerhalb von 30 Tagen nach Zugang 
              der Mitteilung, gelten diese als akzeptiert. Der Kunde wird in der Mitteilung auf 
              diese Folge hingewiesen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 16 Barrierefreiheit</h2>
            <p className="mb-4">
              (1) Der Anbieter ist bestrebt, die Plattform barrierearm zu gestalten und kontinuierlich 
              zu verbessern.
            </p>
            <p className="mb-4">
              (2) Bei Problemen mit der Barrierefreiheit können sich Nutzer über die angegebenen 
              Kontaktdaten an den Anbieter wenden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">§ 17 Schlussbestimmungen</h2>
            <p className="mb-4">
              (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
            </p>
            <p className="mb-4">
              (2) Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist, soweit gesetzlich zulässig, 
              Mönchengladbach.
            </p>
            <p className="mb-4">
              (3) Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen 
              unberührt. Die unwirksame Bestimmung ist durch eine wirksame zu ersetzen, die dem wirtschaftlichen 
              Zweck der unwirksamen Bestimmung am nächsten kommt.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-muted-foreground">
              Stand: September 2025<br />
              Version 2.0 - DDG-konform
            </p>
          </div>
        </div>
      </main>

      <FooterBar />
    </div>
  );
}
