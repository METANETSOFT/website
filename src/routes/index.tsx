import { createFileRoute } from '@tanstack/react-router'
import { BrainCircuit, Terminal, Smartphone } from 'lucide-react'
import { useT } from '../i18n/react'
import { Nav, Footer, ParticleCanvas } from '../components/site'
import { CvSection } from '../components/cv-section'
import { ContactForm } from '../components/contact-form'

export const Route = createFileRoute('/')({
  component: Home,
})

function lines(text: string) {
  return text.split('\n')
}

function Home() {
  const t = useT()
  return (
    <div className="bg-background text-on-background">
      <Nav />
      <ParticleCanvas />
      <main className="relative z-10 pt-16">
        {/* Hero */}
        <section className="relative min-h-[921px] flex flex-col justify-center px-8 md:px-24 grid-pattern overflow-hidden">
          <div className="relative z-10 max-w-5xl">
            <div className="flex items-center gap-4 mb-6">
              <span className="w-12 h-px bg-tertiary" />
              <span className="mono-label text-tertiary text-sm">{t('hero.statusLabel')}</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-headline font-bold leading-tight tracking-tighter mb-4">
              {t('hero.titleLine1')} <span className="text-primary">{t('hero.titleLine2')}</span>
            </h1>
            <div className="md:grid md:grid-cols-12 gap-8 items-start">
              <h2 className="col-span-7 text-2xl md:text-4xl font-headline font-light text-on-surface-variant leading-snug tracking-tight mb-8">
                {t('hero.subtitle')}
              </h2>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mt-8">
              <a className="px-10 py-5 bg-transparent border border-outline/30 text-primary font-headline font-bold uppercase tracking-widest hover:bg-surface-container transition-all text-center" href="#portfolio">
                {t('hero.ctaPrimary')}
              </a>
            </div>
          </div>
          <div className="absolute bottom-12 left-24 hidden md:flex items-center gap-12 text-[10px] mono-label text-outline">
            <div>{t('hero.latLabel')}</div>
            <div>{t('hero.lonLabel')}</div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-tertiary animate-pulse" />
              {t('hero.uptimeLabel')}
            </div>
          </div>
        </section>

        {/* About / Architecture */}
        <section id="architecture" className="py-32 px-8 md:px-24 bg-surface">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
            <div className="col-span-12 md:col-span-5">
              <h3 className="mono-label text-tertiary mb-4">{t('about.sectionIndex')}</h3>
              <h2 className="text-5xl font-headline font-bold tracking-tighter leading-none mb-8">
                {lines(t('about.title')).map((l, i) => (
                  <span key={i} className={i > 0 ? 'text-on-surface-variant' : undefined}>
                    {i > 0 ? <br /> : null}
                    {l}
                  </span>
                ))}
              </h2>
            </div>
            <div className="col-span-12 md:col-span-7 space-y-6">
              <p className="text-xl text-on-surface-variant leading-relaxed font-light">{t('about.bodyLead')}</p>
              <p className="text-lg text-outline leading-relaxed">{t('about.bodyExtended')}</p>
              <p className="text-lg text-outline leading-relaxed">{t('about.bodyMethodology')}</p>
              <div className="grid grid-cols-2 gap-4 pt-8">
                <div className="p-6 bg-surface-container-low border-l-2 border-tertiary">
                  <div className="text-3xl font-headline font-bold text-primary">{t('about.uptimeValue')}</div>
                  <div className="mono-label text-[10px] text-outline">{t('about.uptimeMetric')}</div>
                </div>
                <div className="p-6 bg-surface-container-low border-l-2 border-tertiary">
                  <div className="text-3xl font-headline font-bold text-primary">{t('about.latencyValue')}</div>
                  <div className="mono-label text-[10px] text-outline">{t('about.latencyMetric')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-32 px-8 md:px-24 bg-surface-container-low">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <h3 className="mono-label text-tertiary mb-4">{t('services.sectionIndex')}</h3>
              <h2 className="text-5xl font-headline font-bold tracking-tighter">{t('services.title')}</h2>
            </div>
            <p className="max-w-xs text-outline text-sm mono-label">{t('services.lead')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            {([
              { icon: BrainCircuit, k: 'ai' },
              { icon: Terminal, k: 'web' },
              { icon: Smartphone, k: 'mobile' },
            ] as const).map(({ icon: Icon, k }) => (
              <div key={k} className="group relative bg-surface p-10 hover:bg-surface-container-high transition-colors duration-500 min-h-[450px] flex flex-col justify-between">
                <div>
                  <Icon className="w-9 h-9 text-tertiary mb-8" strokeWidth={1.5} />
                  <h4 className="text-2xl font-headline font-bold mb-4">{t(`services.${k}.title`)}</h4>
                  <p className="text-on-surface-variant leading-relaxed">{t(`services.${k}.description`)}</p>
                </div>
                <ul className="mt-8 text-xs mono-label text-outline space-y-2">
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-tertiary" /> {t(`services.${k}.bullet1`)}</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 bg-tertiary" /> {t(`services.${k}.bullet2`)}</li>
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Portfolio */}
        <section id="portfolio" className="py-32 px-8 md:px-24">
          <h3 className="mono-label text-tertiary mb-12">{t('portfolio.sectionIndex')}</h3>
          <div className="space-y-32">
            {([
              { k: 'neuralCore', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1hXnW7HrdXE8sqWXY6Q5WiTUyRFWJg94l_36szMh6x2TLNPPVG991LmhsPphDNfKljisI2eK84zcwT5qLLFgZmu32Wmf3f4-RSQ5CRkisimBai7jUDxTgNW2kEhxZ9ZtKg-fcoHi6JFYo2IOwm6xU3Ktf6owER29T0b6chjxxEFqopj5PSuM5-24mnKDoxMdcXfzcpS5eYSt8A-0IlScu10UoPuD5Yo68cwtGPmhIAcdVzx4gC_FD-Htt39JReC77mUWjcUl9B3mn', flip: false },
              { k: 'skyScale', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1s7pwqo4hmWA-klbLHtgijAERXLv4z2lLRgaQmyMjiQ4pKXxzfAqmJpMXSCq7cXfWPuAJvxW_alPuRDFcNBMr0DN7qqOhRQDIsTiRr9Ad137lD66yM9QTrvwSGlX9NjpmkrhYQHZ3uqFxNRzrv9b1ncFj9fqLaZhRtlyV8YgY-onpWbo93vinNOkKYtVgxwcCfZA9crZ_6qTxJrVwCGAlZiDlIAFB7C2xXpt8JRsHUfjZ7KP5WnqqiHYhNmsU6M-Vh-VxFKVPm-Km', flip: true },
              { k: 'enterpriseFlux', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJa_VHCElVaVw_R168IeQpFoF-Aflj5qtVZps9m68A-33H-LC6R0ew_Coc-z8ciSlP4mqaK9BgV-Xt0bzESblfo9PH_bLdv9OGKFYiBjMcxwjfMdfjLkMzoDzpFf_OlSnocmd0t670tuC9656FIOEJmIaIEdvggN6d_MsB1aBXTNzXgViIiPfo-6vOHjxrvHxQfH_BmFj3rRbKuLh9Q-vccpRsbCTRiHUsfURo-pF59SEmpM_kqlwky1QZc07p-mku2l6VkG9QRtt3', flip: false },
            ] as const).map(({ k, img, flip }) => (
              <div key={k} className="md:grid md:grid-cols-12 gap-12 items-center">
                <div className={`col-span-7 relative group overflow-hidden ${flip ? 'order-1 md:order-2' : ''}`}>
                  <img alt={t(`portfolio.${k}.title`)} loading="lazy" className="w-full aspect-video object-cover grayscale hover:grayscale-0 transition-all duration-700" src={img} />
                  <div className="absolute inset-0 bg-surface/40 group-hover:bg-transparent transition-all" />
                </div>
                <div className={`col-span-5 pt-8 md:pt-0 ${flip ? 'order-2 md:order-1 text-right md:text-left' : ''}`}>
                  <div className="text-tertiary text-xs mono-label mb-2">{t(`portfolio.${k}.meta`)}</div>
                  <h4 className="text-4xl font-headline font-bold mb-4">{t(`portfolio.${k}.title`)}</h4>
                  <p className="text-on-surface-variant mb-6">{t(`portfolio.${k}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-32 pt-16 border-t border-outline/20 text-center">
            <h3 className="mono-label text-tertiary mb-12">{t('partners.label')}</h3>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale">
              {[
                ['KCTEK', 'https://www.linkedin.com/company/kctek/'],
                ['AKESKI', 'https://www.linkedin.com/company/akeski/'],
                ['RISE TECHNOLOGIES', 'https://www.linkedin.com/company/riseconsultingtr/'],
                ['ARPIES TECH', 'https://www.linkedin.com/company/arpiesyazilim/'],
                ['MILAN GAZ', 'https://www.linkedin.com/company/milangaz/'],
                ['OHSHIFT', 'https://www.linkedin.com/company/ohshift/'],
              ].map(([name, href]) => (
                <a key={name} className="font-headline text-2xl font-bold tracking-widest text-on-surface no-underline hover:text-tertiary transition-colors duration-300" href={href} target="_blank" rel="noreferrer">{name}</a>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-32 px-8 md:px-24 bg-surface">
          <div className="max-w-4xl mx-auto">
            <h3 className="mono-label text-tertiary mb-4">{t('contact.sectionIndex')}</h3>
            <h2 className="text-5xl font-headline font-bold tracking-tighter mb-12">{t('contact.title')}</h2>
            <ContactForm />
          </div>
        </section>

        {/* Send Us Your CV */}
        <CvSection />

        {/* Vision & Mission */}
        <section id="values" className="py-32 px-8 md:px-24 bg-surface border-t border-outline/10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
            <div className="col-span-12 md:col-span-5">
              <h3 className="mono-label text-tertiary mb-4">{t('vm.sectionIndex')}</h3>
              <h2 className="text-5xl font-headline font-bold tracking-tighter leading-none mb-8">
                {lines(t('vm.title')).map((l, i) => (
                  <span key={i} className={i > 0 ? 'text-on-surface-variant' : undefined}>
                    {i > 0 ? <br /> : null}
                    {l}
                  </span>
                ))}
              </h2>
            </div>
            <div className="col-span-12 md:col-span-7 grid grid-cols-1 gap-8">
              <div className="p-8 bg-surface-container-low border-l-2 border-tertiary hover:bg-surface-container transition-colors duration-300">
                <div className="mono-label text-xs text-tertiary mb-4">{t('vm.visionLabel')}</div>
                <p className="text-xl text-on-surface-variant leading-relaxed font-light">{t('vm.visionBody')}</p>
              </div>
              <div className="p-8 bg-surface-container-low border-l-2 border-tertiary hover:bg-surface-container transition-colors duration-300">
                <div className="mono-label text-xs text-tertiary mb-4">{t('vm.missionLabel')}</div>
                <p className="text-xl text-on-surface-variant leading-relaxed font-light">{t('vm.missionBody')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-8 md:px-24 bg-surface-container-highest flex flex-col items-center text-center">
          <h2 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter mb-8 max-w-4xl">{t('cta.title')}</h2>
          <p className="text-on-surface-variant text-xl mb-12 max-w-2xl">{t('cta.body')}</p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
