import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { Shield } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <Layout>
      <section className="pt-32 pb-24 relative min-h-screen">
        <GlowOrb size="xl" className="top-20 right-0 translate-x-1/2" />
        <GlowOrb size="lg" color="amber" className="bottom-40 left-0 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative max-w-4xl">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
                Privacy <span className="gradient-text">Policy</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Ultimo aggiornamento: 7 Febbraio 2026
              </p>
            </div>
          </ScrollReveal>

          <div className="glass-card rounded-2xl p-8 md:p-12 space-y-8">
            <ScrollReveal delay={100}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">1. Introduzione</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Benvenuto su LegoChris. La tua privacy è importante per noi. Questa Privacy Policy spiega come raccogliamo, utilizziamo, condividiamo e proteggiamo le tue informazioni personali quando utilizzi il nostro sito web e i nostri servizi.
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">2. Informazioni che Raccogliamo</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">2.1 Informazioni fornite da te</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Nome e indirizzo email quando ti registri</li>
                      <li>Informazioni del profilo e preferenze</li>
                      <li>Messaggi e comunicazioni con noi</li>
                      <li>Informazioni di pagamento (tramite processori terzi sicuri)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">2.2 Informazioni raccolte automaticamente</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Indirizzo IP e informazioni sul dispositivo</li>
                      <li>Cookie e tecnologie simili</li>
                      <li>Dati di utilizzo e navigazione</li>
                      <li>Informazioni su browser e sistema operativo</li>
                    </ul>
                  </div>
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">3. Come Utilizziamo le Tue Informazioni</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Utilizziamo le tue informazioni per:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Fornire e migliorare i nostri servizi</li>
                  <li>Personalizzare la tua esperienza</li>
                  <li>Comunicare con te riguardo aggiornamenti e offerte</li>
                  <li>Processare transazioni e ordini</li>
                  <li>Garantire la sicurezza e prevenire frodi</li>
                  <li>Rispettare obblighi legali</li>
                </ul>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={250}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">4. Condivisione delle Informazioni</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Non vendiamo le tue informazioni personali. Possiamo condividerle con:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong className="text-foreground">Fornitori di servizi:</strong> per elaborazione pagamenti, hosting e analytics</li>
                  <li><strong className="text-foreground">Partner Discord:</strong> se colleghi il tuo account Discord</li>
                  <li><strong className="text-foreground">Autorità legali:</strong> quando richiesto dalla legge</li>
                </ul>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">5. Cookie e Tecnologie di Tracciamento</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Utilizziamo cookie e tecnologie simili per migliorare la tua esperienza, analizzare il traffico del sito e personalizzare i contenuti. Puoi gestire le preferenze dei cookie nelle impostazioni del tuo browser.
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={350}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">6. Sicurezza dei Dati</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Implementiamo misure di sicurezza tecniche e organizzative appropriate per proteggere le tue informazioni personali da accesso non autorizzato, alterazione, divulgazione o distruzione. Tuttavia, nessun metodo di trasmissione su Internet è completamente sicuro.
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">7. I Tuoi Diritti</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  In conformità con il GDPR, hai diritto a:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Accedere ai tuoi dati personali</li>
                  <li>Correggere dati inesatti</li>
                  <li>Richiedere la cancellazione dei tuoi dati</li>
                  <li>Opporti al trattamento dei tuoi dati</li>
                  <li>Richiedere la portabilità dei dati</li>
                  <li>Revocare il consenso in qualsiasi momento</li>
                </ul>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={450}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">8. Conservazione dei Dati</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Conserviamo le tue informazioni personali solo per il tempo necessario agli scopi per cui sono state raccolte, o come richiesto dalla legge.
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={500}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">9. Privacy dei Minori</h2>
                <p className="text-muted-foreground leading-relaxed">
                  I nostri servizi non sono destinati a minori di 13 anni. Non raccogliamo consapevolmente informazioni personali da bambini sotto i 13 anni. Se veniamo a conoscenza di aver raccolto tali dati, li cancelleremo prontamente.
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={550}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">10. Modifiche a Questa Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Potremmo aggiornare questa Privacy Policy periodicamente. Ti avviseremo di eventuali modifiche pubblicando la nuova policy su questa pagina e aggiornando la data di "Ultimo aggiornamento".
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={600}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">11. Contattaci</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Se hai domande su questa Privacy Policy o sulle nostre pratiche di privacy, contattaci a:
                </p>
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-foreground">
                    <strong>Email:</strong> <a href="mailto:info.legochris@gmail.com" className="text-primary hover:underline">info.legochris@gmail.com</a>
                  </p>
                </div>
              </section>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PrivacyPolicy;
