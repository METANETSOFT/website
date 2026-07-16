import { useEffect, useRef } from 'react'
import { useT, useLocale } from '../i18n/react'
import { SUPPORTED_LOCALES, LOCALE_CONFIGS } from '../i18n/locales'
import { LOCALE_COOKIE } from '../i18n/detect'
import type { LocaleCode } from '../i18n/types'

export function LocaleSwitcher() {
  const locale = useLocale()
  return (
    <div className="hidden lg:flex items-center pr-6 mr-2">
      <label className="relative flex items-center gap-2 bg-surface-container-high border border-outline-variant/40 px-3 py-1.5 cursor-pointer hover:border-tertiary transition-colors duration-300">
        <span className="font-headline text-[11px] font-bold uppercase tracking-widest text-tertiary">
          {locale.toUpperCase()}
        </span>
        <span className="text-tertiary text-xs leading-none">▾</span>
        <select
          aria-label="Language"
          defaultValue={locale}
          onChange={(e) => {
            const next = e.target.value
            document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
            window.location.reload()
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {SUPPORTED_LOCALES.map((code: LocaleCode) => (
            <option key={code} value={code}>
              {LOCALE_CONFIGS[code]?.nativeName ?? code}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export function Nav() {
  const t = useT()
  return (
    <nav className="exact-shell-nav fixed top-0 w-full z-50 bg-[#191919]/70 backdrop-blur-md">
      <div className="exact-shell-nav__inner flex justify-between items-center px-8 py-4 max-w-full mx-auto">
        <div className="text-xl font-bold tracking-tighter text-on-surface font-headline">
          METANETSOFT
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <a className="font-headline uppercase tracking-tighter text-outline hover:text-tertiary transition-colors duration-300" href="#architecture">{t('nav.about')}</a>
          <a className="font-headline uppercase tracking-tighter text-outline hover:text-tertiary transition-colors duration-300" href="#architecture">{t('nav.services')}</a>
          <a className="font-headline uppercase tracking-tighter text-outline hover:text-tertiary transition-colors duration-300" href="#portfolio">{t('nav.projects')}</a>
        </div>
        <div className="exact-shell-nav__actions flex items-center gap-6">
          <LocaleSwitcher />
          <a className="px-6 py-2 bg-primary text-on-primary font-headline font-bold uppercase tracking-tighter hover:scale-95 duration-200 transition-transform inline-block" href="#contact">
            {t('nav.contact')}
          </a>
        </div>
      </div>
    </nav>
  )
}

export function Footer() {
  const t = useT()
  const link =
    "font-headline text-xs tracking-widest text-outline hover:text-on-surface transition-opacity"
  return (
    <footer className="w-full border-t border-outline-variant/15 bg-surface-container-low">
      <div className="footer-inner flex flex-col md:flex-row justify-between items-center px-12 py-16 w-full">
        <div className="mb-8 md:mb-0 text-center md:text-left">
          <div className="text-lg font-black text-on-surface font-headline mb-2">{t('footer.brand')}</div>
          <p className="font-headline text-xs tracking-widest text-outline">{t('footer.tagline')}</p>
        </div>
        <div className="footer-links flex gap-8">
          <a className={link} href="#">{t('footer.privacy')}</a>
          <a className={link} href="#">{t('footer.terms')}</a>
          <a className={link} href="https://www.linkedin.com/company/122004088/" target="_blank" rel="noreferrer">{t('footer.linkedin')}</a>
          <a className={link} href="https://github.com/METANETSOFT" target="_blank" rel="noreferrer">{t('footer.github')}</a>
        </div>
      </div>
    </footer>
  )
}

export function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const mouse = { x: -9999, y: -9999 }
    let particles: { x: number; y: number; size: number; vx: number; vy: number }[] = []
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    function init() {
      canvas!.width = document.documentElement.clientWidth || window.innerWidth
      canvas!.height = window.visualViewport?.height || window.innerHeight
      particles = Array.from({ length: 90 }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        size: Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      }))
    }
    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas!.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas!.height) p.vy *= -1
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        if (dx * dx + dy * dy < 150 * 150) {
          p.x -= dx * 0.01
          p.y -= dy * 0.01
        }
        ctx!.fillStyle = '#00deec'
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fill()
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 100) {
            ctx!.strokeStyle = `rgba(0, 222, 236, ${1 - d / 100})`
            ctx!.lineWidth = 0.5
            ctx!.beginPath()
            ctx!.moveTo(a.x, a.y)
            ctx!.lineTo(b.x, b.y)
            ctx!.stroke()
          }
        }
      }
      raf = requestAnimationFrame(animate)
    }
    init()
    animate()
    window.addEventListener('resize', init)
    window.addEventListener('mousemove', onMove)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', init)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])
  return (
    <canvas
      ref={ref}
      className="fixed inset-0 pointer-events-none z-0 opacity-40"
      aria-hidden="true"
    />
  )
}
