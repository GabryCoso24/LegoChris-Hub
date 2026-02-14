import { Layout } from "@/components/layout/Layout";
import { ParticleBackground } from "@/components/effects/ParticleBackground";
import { ScrollReveal } from "@/components/effects/ScrollReveal";
import { Cookie } from "lucide-react";

export default function CookiePolicy() {
  return (
    <Layout>
      <ParticleBackground />
      <div className="container mx-auto px-4 pt-40 pb-12 max-w-4xl">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Cookie className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-display font-bold">Cookie Policy</h1>
          </div>
        </ScrollReveal>

        <div className="prose prose-invert max-w-none space-y-8">
          <ScrollReveal delay={100}>
            <section>
              <p className="text-foreground/70 text-lg">
                Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <section>
              <h2 className="text-2xl font-semibold mb-4">Cosa sono i Cookie</h2>
              <p className="text-foreground/70 leading-relaxed">
                I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo quando visiti un sito web. 
                Utilizziamo i cookie per migliorare la tua esperienza di navigazione, analizzare il traffico del sito e 
                personalizzare i contenuti.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <section>
              <h2 className="text-2xl font-semibold mb-4">Tipi di Cookie Utilizzati</h2>
              
              <div className="space-y-6 mt-6">
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-xl font-semibold mb-3 text-primary">Cookie Essenziali</h3>
                  <p className="text-foreground/70">
                    Questi cookie sono necessari per il funzionamento del sito web e non possono essere disattivati. 
                    Includono cookie per la gestione della sessione, l'autenticazione e la sicurezza.
                  </p>
                  <ul className="list-disc list-inside mt-3 text-foreground/70 space-y-1">
                    <li>Autenticazione utente</li>
                    <li>Gestione carrello acquisti</li>
                    <li>Preferenze di sicurezza</li>
                  </ul>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-xl font-semibold mb-3 text-primary">Cookie Analitici</h3>
                  <p className="text-foreground/70">
                    Utilizziamo cookie analitici per comprendere come i visitatori interagiscono con il sito, 
                    quali pagine visitano e come possiamo migliorare l'esperienza utente.
                  </p>
                  <ul className="list-disc list-inside mt-3 text-foreground/70 space-y-1">
                    <li>Google Analytics (se implementato)</li>
                    <li>Analisi del comportamento di navigazione</li>
                    <li>Statistiche di utilizzo</li>
                  </ul>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-xl font-semibold mb-3 text-primary">Cookie di Preferenza</h3>
                  <p className="text-foreground/70">
                    Questi cookie permettono al sito di ricordare le tue scelte (come il tema scuro/chiaro, 
                    la lingua preferita) per offrirti un'esperienza più personalizzata.
                  </p>
                  <ul className="list-disc list-inside mt-3 text-foreground/70 space-y-1">
                    <li>Preferenze tema</li>
                    <li>Impostazioni lingua</li>
                    <li>Scelte di consenso cookie</li>
                  </ul>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <h3 className="text-xl font-semibold mb-3 text-primary">Cookie di Marketing</h3>
                  <p className="text-foreground/70">
                    Questi cookie vengono utilizzati per mostrare annunci più pertinenti ai tuoi interessi. 
                    Possono anche essere utilizzati per limitare il numero di volte che vedi un annuncio.
                  </p>
                  <ul className="list-disc list-inside mt-3 text-foreground/70 space-y-1">
                    <li>Pubblicità personalizzata</li>
                    <li>Remarketing</li>
                    <li>Tracciamento conversioni</li>
                  </ul>
                </div>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={250}>
            <section>
              <h2 className="text-2xl font-semibold mb-4">Cookie di Terze Parti</h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                Alcuni cookie sono impostati da servizi di terze parti che appaiono sulle nostre pagine. 
                Questi includono:
              </p>
              <ul className="list-disc list-inside text-foreground/70 space-y-2">
                <li><strong>Stripe:</strong> Per l'elaborazione sicura dei pagamenti</li>
                <li><strong>YouTube:</strong> Per la visualizzazione di video incorporati</li>
                <li><strong>Discord:</strong> Per l'integrazione con la community</li>
              </ul>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <section>
              <h2 className="text-2xl font-semibold mb-4">Gestione dei Cookie</h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                Puoi gestire le tue preferenze sui cookie in qualsiasi momento attraverso il banner dei cookie 
                che appare alla tua prima visita. Inoltre, puoi controllare e/o eliminare i cookie come desideri 
                attraverso le impostazioni del tuo browser.
              </p>
              
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg mt-4">
                <p className="text-sm text-foreground/80">
                  <strong>Nota:</strong> La disattivazione di alcuni cookie potrebbe influire sulla funzionalità 
                  del sito e sulla tua esperienza utente. I cookie essenziali non possono essere disattivati 
                  in quanto necessari per il funzionamento del sito.
                </p>
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={350}>
            <section>
              <h2 className="text-2xl font-semibold mb-4">Come Disabilitare i Cookie</h2>
              <p className="text-foreground/70 leading-relaxed mb-4">
                Puoi bloccare i cookie modificando le impostazioni del tuo browser. Ecco le guide per i browser più comuni:
              </p>
              <ul className="list-disc list-inside text-foreground/70 space-y-2">
                <li><strong>Google Chrome:</strong> Impostazioni → Privacy e sicurezza → Cookie</li>
                <li><strong>Firefox:</strong> Impostazioni → Privacy e sicurezza → Cookie e dati dei siti web</li>
                <li><strong>Safari:</strong> Preferenze → Privacy → Gestisci i dati dei siti web</li>
                <li><strong>Microsoft Edge:</strong> Impostazioni → Cookie e autorizzazioni sito</li>
              </ul>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <section>
              <h2 className="text-2xl font-semibold mb-4">Durata dei Cookie</h2>
              <p className="text-foreground/70 leading-relaxed">
                I cookie che utilizziamo hanno diverse durate:
              </p>
              <ul className="list-disc list-inside text-foreground/70 space-y-2 mt-3">
                <li><strong>Cookie di sessione:</strong> Scadono quando chiudi il browser</li>
                <li><strong>Cookie persistenti:</strong> Rimangono sul tuo dispositivo per un periodo predefinito (max 12 mesi)</li>
              </ul>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={450}>
            <section>
              <h2 className="text-2xl font-semibold mb-4">Aggiornamenti a questa Policy</h2>
              <p className="text-foreground/70 leading-relaxed">
                Potremmo aggiornare periodicamente questa Cookie Policy per riflettere cambiamenti nelle nostre pratiche 
                o per altri motivi operativi, legali o normativi. Ti consigliamo di rivedere questa pagina 
                periodicamente per essere sempre informato.
              </p>
            </section>
          </ScrollReveal>

          <ScrollReveal delay={500}>
            <section>
              <h2 className="text-2xl font-semibold mb-4">Contatti</h2>
              <p className="text-foreground/70 leading-relaxed">
                Per qualsiasi domanda riguardo questa Cookie Policy o alle nostre pratiche sui cookie, 
                puoi contattarci attraverso la nostra{" "}
                <a href="/contact" className="text-primary hover:underline">
                  pagina di contatto
                </a>
                .
              </p>
            </section>
          </ScrollReveal>
        </div>
      </div>
    </Layout>
  );
}
