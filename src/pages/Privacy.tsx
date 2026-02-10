import { useNavigate } from "react-router-dom";
import { FooterBar } from "@/components/landing/FooterBar";
import { HeaderBar } from "@/components/landing/HeaderBar";

export default function Privacy() {
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
        <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Datenschutz auf einen Blick</h2>
            <h3 className="text-xl font-semibold mt-6 mb-3">Allgemeine Hinweise</h3>
            <p className="mb-4">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, 
              wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert 
              werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text 
              aufgeführten Datenschutzerklärung.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Datenerfassung auf dieser Website</h3>
            <p className="mb-4">
              <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie 
              dem Abschnitt „Hinweis zur verantwortlichen Stelle" in dieser Datenschutzerklärung entnehmen.
            </p>
            <p className="mb-4">
              <strong>Wie erfassen wir Ihre Daten?</strong><br />
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.B. um Daten 
              handeln, die Sie in ein Kontaktformular eingeben oder bei der Registrierung für unseren Service angeben.
            </p>
            <p className="mb-4">
              <strong>Wofür nutzen wir Ihre Daten?</strong><br />
              Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten 
              können zur Analyse Ihres Nutzerverhaltens verwendet werden oder zur Bereitstellung unserer Dienstleistung 
              (Generierung von Social Media Posts aus Newsletter-Inhalten).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Hinweis zur verantwortlichen Stelle</h2>
            <p className="mb-4">
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br />
              <br />
              <strong>Lukas Zangerl</strong><br />
              Stapper Weg 214<br />
              41199 Mönchengladbach<br />
              Deutschland<br />
              <br />
              E-Mail: lukas@zangerlcoachingdynamics.com<br />
              Telefon: +49 151 26718443
            </p>
            <p className="mb-4">
              Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über 
              die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.B. Namen, E-Mail-Adressen o.Ä.) entscheidet.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Speicherdauer</h2>
            <p className="mb-4">
              Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre 
              personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein berechtigtes 
              Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, 
              sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer personenbezogenen Daten haben 
              (z.B. steuer- oder handelsrechtliche Aufbewahrungsfristen); im letztgenannten Fall erfolgt die Löschung nach 
              Fortfall dieser Gründe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Allgemeine Hinweise und Pflichtinformationen</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Datenschutz</h3>
            <p className="mb-4">
              Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre 
              personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzbestimmungen sowie dieser 
              Datenschutzerklärung.
            </p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Hinweis zur Datenweitergabe in die USA</h3>
            <p className="mb-4">
              Auf unserer Website sind unter anderem Tools von Unternehmen mit Sitz in den USA eingebunden. Wenn diese Tools 
              aktiv sind, können Ihre personenbezogenen Daten an die US-Server der jeweiligen Unternehmen weitergegeben werden. 
              Wir weisen darauf hin, dass die USA aus Sicht des europäischen Datenschutzrechts kein sicheres Drittland ist. 
              US-Unternehmen sind dazu verpflichtet, personenbezogene Daten an Sicherheitsbehörden herauszugeben, ohne dass Sie 
              als Betroffener hiergegen gerichtlich vorgehen könnten.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
            <p className="mb-4">
              Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits 
              erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung 
              bleibt vom Widerruf unberührt.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
            <p className="mb-4">
              Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde, 
              insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des 
              mutmaßlichen Verstoßes zu. Das Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder 
              gerichtlicher Rechtsbehelfe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Datenerfassung auf dieser Website</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Server-Log-Dateien</h3>
            <p className="mb-4">
              Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, 
              die Ihr Browser automatisch an uns übermittelt. Dies sind:
            </p>
            <ul className="mb-4 list-disc pl-6">
              <li>Browsertyp und Browserversion</li>
              <li>verwendetes Betriebssystem</li>
              <li>Referrer URL</li>
              <li>Hostname des zugreifenden Rechners</li>
              <li>Uhrzeit der Serveranfrage</li>
              <li>IP-Adresse</li>
            </ul>
            <p className="mb-4">
              Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung dieser Daten 
              erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der 
              technisch fehlerfreien Darstellung und der Optimierung seiner Website – hierzu müssen die Server-Log-Files erfasst werden.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Registrierung auf dieser Website</h3>
            <p className="mb-4">
              Sie können sich auf dieser Website registrieren, um zusätzliche Funktionen der Seite zu nutzen. Die dazu 
              eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des jeweiligen Angebotes oder Dienstes, für den Sie 
              sich registriert haben. Die bei der Registrierung abgefragten Pflichtangaben müssen vollständig angegeben werden. 
              Anderenfalls werden wir die Registrierung ablehnen.
            </p>
            <p className="mb-4">
              Für wichtige Änderungen etwa beim Angebotsumfang oder bei technisch notwendigen Änderungen nutzen wir die bei der 
              Registrierung angegebene E-Mail-Adresse, um Sie auf diesem Wege zu informieren.
            </p>
            <p className="mb-4">
              Die Verarbeitung der bei der Registrierung eingegebenen Daten erfolgt zum Zwecke der Durchführung des durch die 
              Registrierung begründeten Nutzungsverhältnisses und ggf. zur Anbahnung weiterer Verträge (Art. 6 Abs. 1 lit. b DSGVO).
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Newsletter-Verarbeitung</h3>
            <p className="mb-4">
              Unser Service ermöglicht es Ihnen, Newsletter-Inhalte hochzuladen oder einzugeben, um daraus automatisch 
              Social Media Posts zu generieren. Diese Inhalte werden ausschließlich für die Bereitstellung unserer 
              Dienstleistung verwendet und nicht für andere Zwecke gespeichert oder analysiert.
            </p>
            <p className="mb-4">
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO zur Vertragserfüllung. Die generierten 
              Posts werden in Ihrem Benutzerkonto gespeichert, damit Sie diese verwalten und bearbeiten können.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Externe Dienste und Datenübermittlungen</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">Appwrite Cloud</h3>
            <p className="mb-4">
              Wir nutzen Appwrite Cloud für die Authentifizierung, Datenspeicherung und Backend-Services. Appwrite Cloud
              wird in Frankfurt (Deutschland) gehostet und unterliegt der DSGVO. Ihre Registrierungsdaten, generierten
              Posts und Kontoeinstellungen werden sicher in der Appwrite-Datenbank in Frankfurt gespeichert.
            </p>
            <p className="mb-4">
              Die Datenverarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6
              Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem zuverlässigen Service). Da die Daten innerhalb der EU
              (Frankfurt, Deutschland) verarbeitet werden, ist keine Drittlandübermittlung erforderlich.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Stripe (Zahlungsabwicklung)</h3>
            <p className="mb-4">
              Für die Abwicklung von Zahlungen verwenden wir den Zahlungsdienstleister Stripe Inc. mit Sitz in den USA. 
              Bei einer Zahlung werden Ihre Zahlungsdaten (Name, E-Mail-Adresse, Kreditkartendaten) direkt an Stripe 
              übermittelt und dort verarbeitet.
            </p>
            <p className="mb-4">
              Die Datenübermittlung an Stripe erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) 
              und Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung). Stripe ist PCI-DSS zertifiziert und bietet 
              höchste Sicherheitsstandards für Zahlungsdaten.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">OpenRouter (KI-Verarbeitung)</h3>
            <p className="mb-4">
              Zur Generierung von Social Media Posts aus Ihren Newsletter-Inhalten nutzen wir OpenRouter (USA) als 
              KI-Gateway. Die von Ihnen eingegebenen Texte werden zur Verarbeitung an OpenRouter und je nach ausgewähltem 
              Modell an den jeweiligen KI-Anbieter (z. B. OpenAI oder Anthropic) übermittelt.
            </p>
            <p className="mb-4">
              Die Verarbeitung erfolgt ausschließlich zur Bereitstellung der KI-Dienste. Die Übermittlung erfolgt auf 
              Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Vercel (Hosting)</h3>
            <p className="mb-4">
              Diese Website wird auf der Plattform von Vercel Inc. (USA) gehostet. Vercel kann technische Daten wie 
              IP-Adressen, Browser-Informationen und Zugriffsprotokolle erfassen, um den Hosting-Service bereitzustellen 
              und die Performance zu überwachen.
            </p>
            <p className="mb-4">
              Die Datenverarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO aufgrund unseres berechtigten 
              Interesses an einer sicheren und effizienten Bereitstellung unserer Website.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Firecrawl (Premium Content-Extraktion)</h3>
            <p className="mb-4">
              Für Pro-Benutzer bieten wir eine erweiterte URL-Extraktion über den Firecrawl-Service an. Dieser ermöglicht 
              die Extraktion von Inhalten aus Webseiten mit JavaScript-Rendering. Die übermittelten URLs und extrahierten 
              Inhalte werden ausschließlich für Ihre Anfrage verwendet.
            </p>
            <p className="mb-4">
              Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO zur Vertragserfüllung mit Pro-Benutzern.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Jina Reader (Standard Content-Extraktion)</h3>
            <p className="mb-4">
              Für die Standard-URL-Extraktion nutzen wir den Jina Reader Service. Über diesen Service können Inhalte von 
              Webseiten extrahiert werden, um sie als Basis für die Social Media Post-Generierung zu verwenden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Ihre Rechte als betroffene Person</h2>
            <p className="mb-4">
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten 
              personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten 
              zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung 
              jederzeit für die Zukunft widerrufen.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Auskunftsrecht (Art. 15 DSGVO)</h3>
            <p className="mb-4">
              Sie haben das Recht, eine Bestätigung darüber zu verlangen, ob betreffende Daten verarbeitet werden und auf 
              Auskunft über diese Daten sowie auf weitere Informationen und eine Kopie der Daten entsprechend den 
              gesetzlichen Bestimmungen.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Berichtigungsrecht (Art. 16 DSGVO)</h3>
            <p className="mb-4">
              Sie haben entsprechend den gesetzlichen Bestimmungen das Recht, die Vervollständigung der Sie betreffenden 
              Daten oder die Berichtigung der Sie betreffenden unrichtigen Daten zu verlangen.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Löschungsrecht (Art. 17 DSGVO)</h3>
            <p className="mb-4">
              Sie haben das Recht, entsprechend den gesetzlichen Bestimmungen zu verlangen, dass Sie betreffende Daten 
              unverzüglich gelöscht werden, und wir sind entsprechend den gesetzlichen Bestimmungen zur Löschung verpflichtet.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Einschränkung der Verarbeitung (Art. 18 DSGVO)</h3>
            <p className="mb-4">
              Sie haben das Recht, entsprechend den gesetzlichen Bestimmungen die Einschränkung der Verarbeitung der Sie 
              betreffenden Daten zu verlangen.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Datenübertragbarkeit (Art. 20 DSGVO)</h3>
            <p className="mb-4">
              Sie haben das Recht, Sie betreffende Daten, die Sie uns bereitgestellt haben, entsprechend den gesetzlichen 
              Bestimmungen in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten oder deren Übermittlung 
              an einen anderen Verantwortlichen zu fordern.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Widerspruchsrecht (Art. 21 DSGVO)</h3>
            <p className="mb-4">
              Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die 
              Verarbeitung der Sie betreffenden Daten, die aufgrund von Art. 6 Abs. 1 lit. e oder f DSGVO erfolgt, 
              Widerspruch einzulegen; dies gilt auch für ein auf diese Bestimmungen gestütztes Profiling.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. SSL- bzw. TLS-Verschlüsselung</h2>
            <p className="mb-4">
              Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte, wie zum 
              Beispiel Bestellungen oder Anfragen, die Sie an uns als Seitenbetreiber senden, eine SSL- bzw. 
              TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers 
              von „http://" auf „https://" wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
            </p>
            <p className="mb-4">
              Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an uns übermitteln, nicht 
              von Dritten mitgelesen werden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Widerspruch gegen Werbe-E-Mails</h2>
            <p className="mb-4">
              Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur Übersendung von nicht 
              ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit widersprochen. Die Betreiber 
              der Seiten behalten sich ausdrücklich rechtliche Schritte im Falle der unverlangten Zusendung von 
              Werbeinformationen, etwa durch Spam-E-Mails, vor.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Änderungen dieser Datenschutzerklärung</h2>
            <p className="mb-4">
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen 
              Anforderungen entspricht oder um Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen, 
              z.B. bei der Einführung neuer Services. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-muted-foreground">
              Stand: September 2025
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Bei Fragen zum Datenschutz kontaktieren Sie uns unter: lukas@zangerlcoachingdynamics.com
            </p>
          </div>
        </div>
      </main>

      <FooterBar />
    </div>
  );
}
