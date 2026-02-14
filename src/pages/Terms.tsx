import { Layout } from "@/components/layout/Layout";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { GlowOrb } from "@/components/effects/GlowOrb";
import { FileText } from "lucide-react";

const Terms = () => {
  return (
    <Layout>
      <section className="pt-32 pb-24 relative min-h-screen">
        <GlowOrb size="xl" className="top-20 right-0 translate-x-1/2" />
        <GlowOrb size="lg" color="amber" className="bottom-40 left-0 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative max-w-4xl">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
                Termini di <span className="gradient-text">Servizio</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Ultimo aggiornamento: 7 Febbraio 2026
              </p>
            </div>
          </ScrollReveal>

          <div className="glass-card rounded-2xl p-8 md:p-12 space-y-8">
            <ScrollReveal delay={100}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">1. Accettazione dei Termini</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Utilizzando il sito web LegoChris e i relativi servizi, accetti di essere vincolato da questi Termini di Servizio. Se non accetti questi termini, non utilizzare i nostri servizi.
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">2. Descrizione del Servizio</h2>
                <p className="text-muted-foreground leading-relaxed">
                  LegoChris è una piattaforma di contenuti dedicata a Super Mario e Nintendo, che offre let's play, mod, sfide e contenuti originali. I nostri servizi includono:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-3">
                  <li>Accesso a video e contenuti esclusivi</li>
                  <li>Community Discord e interazioni social</li>
                  <li>Shop per merchandise e prodotti digitali</li>
                  <li>Newsletter e aggiornamenti</li>
                </ul>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">3. Registrazione Account</h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <p>Per utilizzare alcune funzionalità, devi creare un account. Accetti di:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Fornire informazioni accurate e aggiornate</li>
                    <li>Mantenere la sicurezza della tua password</li>
                    <li>Notificarci immediatamente di qualsiasi uso non autorizzato</li>
                    <li>Essere responsabile di tutte le attività del tuo account</li>
                    <li>Avere almeno 13 anni di età</li>
                  </ul>
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={250}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">4. Codice di Condotta</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Ti impegni a NON:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Violare leggi o regolamenti applicabili</li>
                  <li>Pubblicare contenuti offensivi, diffamatori o illegali</li>
                  <li>Molestare, minacciare o intimidire altri utenti</li>
                  <li>Impersonare altre persone o entità</li>
                  <li>Distribuire spam o contenuti non richiesti</li>
                  <li>Tentare di accedere senza autorizzazione ai nostri sistemi</li>
                  <li>Utilizzare bot o sistemi automatizzati non autorizzati</li>
                </ul>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">5. Proprietà Intellettuale</h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <p>
                    Tutti i contenuti su LegoChris, inclusi testo, grafica, loghi, video e software, sono di proprietà di LegoChris o dei suoi licenzianti e sono protetti da diritti d'autore e altre leggi sulla proprietà intellettuale.
                  </p>
                  <p>
                    <strong className="text-foreground">Marchi Nintendo:</strong> Super Mario, Nintendo e tutti i relativi marchi sono di proprietà di Nintendo Co., Ltd. LegoChris è un fan site non ufficiale e non è affiliato con Nintendo.
                  </p>
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={350}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">6. Acquisti e Pagamenti</h2>
                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <p>Quando effettui un acquisto:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>I prezzi sono indicati in Euro e possono variare</li>
                    <li>I pagamenti sono processati tramite fornitori terzi sicuri</li>
                    <li>Gli ordini sono soggetti a disponibilità</li>
                    <li>Ci riserviamo il diritto di rifiutare o annullare ordini</li>
                  </ul>
                </div>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">7. Rimborsi e Cancellazioni</h2>
                <p className="text-muted-foreground leading-relaxed">
                  I prodotti digitali generalmente non sono rimborsabili dopo l'acquisto. Per i prodotti fisici, hai 14 giorni dal ricevimento per richiedere un reso. Contattaci per assistenza su rimborsi specifici.
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={450}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">8. Integrazione Discord</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Collegando il tuo account Discord, autorizzi LegoChris ad accedere alle informazioni di base del tuo profilo Discord e a sincronizzare i ruoli in base alla tua iscrizione. L'uso di Discord è soggetto anche ai Termini di Servizio di Discord.
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={500}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">9. Limitazione di Responsabilità</h2>
                <p className="text-muted-foreground leading-relaxed">
                  LegoChris e i suoi servizi sono forniti "così come sono". Non garantiamo che i servizi siano ininterrotti o privi di errori. Nella misura massima consentita dalla legge, non siamo responsabili per danni indiretti, incidentali o consequenziali derivanti dall'uso dei nostri servizi.
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={550}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">10. Indennizzo</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Accetti di indennizzare e tenere indenne LegoChris da qualsiasi reclamo, perdita o danno derivante dal tuo uso dei servizi o dalla violazione di questi Termini.
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={600}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">11. Modifiche ai Termini</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ci riserviamo il diritto di modificare questi Termini in qualsiasi momento. Le modifiche entreranno in vigore quando pubblicate. L'uso continuato dei servizi dopo le modifiche costituisce accettazione dei nuovi Termini.
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={650}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">12. Risoluzione</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Possiamo sospendere o terminare il tuo account in qualsiasi momento per violazione di questi Termini o per qualsiasi altro motivo a nostra esclusiva discrezione, con o senza preavviso.
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={700}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">13. Legge Applicabile</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Questi Termini sono regolati dalle leggi italiane ed europee. Qualsiasi controversia sarà soggetta alla giurisdizione esclusiva dei tribunali italiani.
                </p>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={750}>
              <section>
                <h2 className="font-display text-2xl font-bold mb-4">14. Contatti</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Per domande sui Termini di Servizio, contattaci:
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

export default Terms;
