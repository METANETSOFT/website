import type { TranslationDict } from '../types';

export const de: TranslationDict = {
  common: {
    loading: 'Laden...',
    error: 'Ein Fehler ist aufgetreten',
    retry: 'Wiederholen',
    close: 'Schließen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    search: 'Suchen',
    noResults: 'Keine Ergebnisse',
  },

  meta: {
    appName: 'Metanetsoft',
    pageTitle: 'Metanetsoft | Digitale Architekten der Zukunft',
    pageDescription: 'Technische Beratung mit Fokus auf KI, Web-Engineering, mobile Apps, skalierbare Architektur und digitale Transformation.',
  },

  header: {
    brand: 'METANETSOFT',
    languageLabel: 'Sprache',
    languageSelect: 'Sprache auswählen',
  },

  nav: {
    about: 'Über uns',
    services: 'Dienstleistungen',
    projects: 'Projekte',
    contact: 'Kontakt',
    appointment: 'Termin Buchen',
  },

  hero: {
    statusLabel: 'System bereit: Verbindung wird hergestellt',
    titleLine1: 'Unsere Arbeit',
    titleLine2: 'ist einfach.',
    subtitle: 'Wir integrieren uns in Ihr Team oder liefern Ihre Projekte mit technischer Exzellenz.',
    ctaPrimary: 'Portfolio ansehen',
    latLabel: 'LAT: 40.7128° N',
    lonLabel: 'LON: 74.0060° W',
    uptimeLabel: 'VERFÜGBARKEIT: %99.998',
  },

  about: {
    sectionIndex: '01 // Architektur',
    title: 'Digitale Architekten\nder Zukunft',
    bodyLead: 'Metanetsoft ist eine leistungsstarke technische Beratung. Wir bauen nicht nur Software; wir entwerfen skalierbare und widerstandsfähige digitale Grundlagen.',
    bodyExtended: 'Von frühen KI-Integrationen bis zu komplexen Enterprise-Systemen verbinden wir Vision und Ausführung mit struktureller Klarheit und Engineering-Disziplin.',
    bodyMethodology: 'Unsere Methodik ist im technischen Brutalismus verwurzelt: rohe Leistung, strukturelle Integrität und unerschütterliche Sicherheit.',
    uptimeValue: '99.9%',
    uptimeMetric: 'SYSTEMVERFÜGBARKEIT',
    latencyValue: '< 50ms',
    latencyMetric: 'GLOBALE ZUGRIFFSGESCHWINDIGKEIT',
    description: 'Wir sind ein führendes Technologieunternehmen, das innovative Lösungen entwickelt, die Unternehmen und Gemeinschaften weltweit transformieren.',
  },

  services: {
    sectionIndex: '02 // Kernfähigkeiten',
    title: 'Strategische Ausführung',
    lead: 'Modulare Lösungen für hochverfügbare Umgebungen.',
    ai: {
      title: 'KI und intelligente Automatisierung',
      description: 'Wir setzen LLMs, Computer Vision und prädiktive Analytik ein, um Entscheidungsworkflows zu automatisieren und Daten in autonomen Vorsprung zu verwandeln.',
      bullet1: 'Benutzerdefiniertes LLM-Fine-Tuning',
      bullet2: 'Prädiktive Logik-Engines',
    },
    web: {
      title: 'Webdesign, Engineering und SEO',
      description: 'Wir kombinieren ästhetisches Produktdesign mit Hochleistungs-Engineering auf Basis von React, Next.js und modernen Websystemen.',
      bullet1: 'Modernes UI/UX-Design',
      bullet2: 'Technisches SEO und Leistungsoptimierung',
    },
    mobile: {
      title: 'Mobile App-Entwicklung',
      description: 'Native und plattformübergreifende mobile Erlebnisse für Zuverlässigkeit, Geschwindigkeit und hochpräzise Interaktion.',
      bullet1: 'Swift / Kotlin-Expertise',
      bullet2: 'Echtzeit-Biometrie-Synchronisierung',
    },
    consulting: 'Beratung',
    development: 'Entwicklung',
    support: 'Support',
    training: 'Schulung',
  },

  portfolio: {
    sectionIndex: '03 // Machbarkeitsnachweis',
    neuralCore: {
      meta: 'KI-Architekturoptimierung // 2024',
      title: 'NEUGESTALTUNG VON NEURAL CORE',
      description: 'Fortgeschrittene KI-Kern-Optimierung, die Latenz um 40 % reduziert und autonome Entscheidungszyklen in den Millisekundenbereich bringt.',
    },
    skyScale: {
      meta: 'Cloud-Infrastruktur-Skalierbarkeit // 2024',
      title: 'SKY-SCALE-PROJEKT',
      description: 'Elastische Cloud-Architektur für globales Traffic-Management und Millionen Anfragen pro Sekunde ohne Ausfall.',
    },
    enterpriseFlux: {
      meta: 'Digitale Unternehmenstransformation // 2023',
      title: 'ENTERPRISE FLUX',
      description: 'Software-Ökosystem zur Modernisierung von Unternehmens-Workflows und Automatisierung geschäftskritischer Abläufe von Ende zu Ende.',
    },
  },

  partners: {
    label: '04 // Referenzen und Geschäftspartner',
  },

  contact: {
    sectionIndex: '05 // Kontakt',
    title: 'Mit System verbinden',
    nameLabel: 'NAME',
    namePlaceholder: 'Ihr Name...',
    emailLabel: 'E-MAIL',
    emailPlaceholder: 'Ihre E-Mail...',
    messageLabel: 'NACHRICHT',
    messagePlaceholder: 'Ihr Beratungsinhalt...',
    submit: 'PROTOKOLL INITIIEREN',
    queueing: 'Übertragung wird in die Warteschlange gestellt...',
    queued: 'Übertragung in Warteschlange gestellt. Verarbeitung läuft im Hintergrund.',
    queuedWithPosition: 'Übertragung in Warteschlange gestellt. Position: {position}.',
    processing: 'Warteschlange akzeptiert. Übertragung wird zugestellt...',
    processingDelayed: 'Übertragung ist noch in Warteschlange. Verarbeitung läuft im Hintergrund weiter.',
    sending: 'Übertragung läuft...',
    success: 'Übertragung abgeschlossen.',
    error: 'Übertragung fehlgeschlagen.',
    errorRequired: 'Bitte alle Felder ausfüllen, bevor Sie das Protokoll starten.',
    errorInvalid: 'Gesendete Daten sind ungültig.',
    errorQueueFull: 'Warteschlange ist voll. Bitte in Kürze erneut versuchen.',
    errorQueueLost: 'Warteschlangenstatus konnte nicht geprüft werden.',
    errorRateLimited: 'Zu viele Versuche. Bitte warten und erneut versuchen.',
    errorAuth: 'Authentifizierung am Mailserver fehlgeschlagen.',
    errorTls: 'Sichere Mailverbindung konnte nicht aufgebaut werden.',
    errorTimeout: 'Zeitüberschreitung beim Mailserver.',
    errorUnavailable: 'Maildienst ist derzeit nicht verfügbar.',
    errorServer: 'Mailübertragung fehlgeschlagen.',
    formName: 'Name',
    formEmail: 'E-Mail',
    formMessage: 'Nachricht',
    send: 'Nachricht senden',
    sent: 'Nachricht erfolgreich gesendet',
    lead: 'Bereit, Ihr Projekt zu bauen?',
    emailAlt: 'Alternativ können Sie uns unter info@metanetsoft.com eine E-Mail senden.',
  },

  vm: {
    sectionIndex: '01.1 // Ziele und Werte',
    title: 'Vision\nMission',
    visionLabel: '[ UNSERE VISION ]',
    visionBody: 'Die Grenzen der Technologie erweitern und globale Standards für digitale Architektur setzen, um eine innovative und transformative Führungsrolle in der Technologieberatung einzunehmen.',
    missionLabel: '[ UNSERE MISSION ]',
    missionBody: 'Unseren Kunden technische Exzellenz und strategische Tiefe liefern, indem wir komplexe digitale Probleme in einfache, skalierbare und nachhaltige Lösungen übersetzen.',
  },

  cta: {
    title: 'Bereit, Ihr Projekt zu bauen?',
    body: 'Unser Team ist bereit, sich in Ihren Workflow zu integrieren. Lassen Sie uns über Ihre technische Roadmap sprechen.',
  },

  footer: {
    brand: 'METANETSOFT',
    tagline: '© 2024 METANETSOFT. WIR BAUEN DIE ZUKUNFT.',
    privacy: 'Datenschutzrichtlinie',
    terms: 'Nutzungsbedingungen',
    linkedin: 'LinkedIn',
    github: 'GitHub',
  },

  home: {
    welcome: 'Willkommen',
    heroTitle: 'Zukunft gemeinsam gestalten',
    heroSubtitle: 'Innovative Lösungen für eine vernetzte Welt',
  },

  language: {
    title: 'Sprache',
    select: 'Sprache auswählen',
    changed: 'Sprache geändert',
  },

  apply: {
    title: 'Jetzt bewerben',
    subtitle: 'Werden Sie Teil unseres Teams',
    cta: 'Bewerbung einreichen',
    name: 'Vollständiger Name',
    email: 'E-Mail-Adresse',
    phone: 'Telefonnummer',
    position: 'Position',
    message: 'Anschreiben',
    submitted: 'Bewerbung erfolgreich eingereicht',
    failed: 'Einreichung fehlgeschlagen. Bitte erneut versuchen.',
  },
};
