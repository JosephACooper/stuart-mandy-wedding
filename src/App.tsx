import { useEffect, useState } from 'react'
import { DialRoot, DialTimeline, useDialKit, useDialTimeline } from 'dialkit'
import 'dialkit/styles.css'
import { RsvpModal } from './components/RsvpModal'
import { RsvpResults } from './components/RsvpResults'

const ITINERARY = [
  {
    time: '2pm',
    title: 'Guests arrive',
    body: 'Phasellus accumsan neque viverra ut sem aliquam purus rhoncus, morbi. Ut in eget leo dui nunc. Tortor viverra magna dignissim sit. Libero eu euismod risus, mauris etiam ut morbi amet in. Tortor duis dignissim adipiscing sem.',
  },
  {
    time: '2:45pm',
    title: 'Guests seated',
    body: 'Phasellus accumsan neque viverra ut sem aliquam purus rhoncus, morbi. Ut in eget leo dui nunc. Tortor viverra magna dignissim sit. Libero eu euismod risus, mauris etiam ut morbi amet in. Tortor duis dignissim adipiscing sem.',
  },
  {
    time: '3pm',
    title: 'Wedding ceremony begins',
    body: 'Phasellus accumsan neque viverra ut sem aliquam purus rhoncus, morbi. Ut in eget leo dui nunc. Tortor viverra magna dignissim sit. Libero eu euismod risus, mauris etiam ut morbi amet in. Tortor duis dignissim adipiscing sem.',
    extraTitle: 'Item Title',
  },
]

const STAYS = [
  { title: 'Cannington House', image: '/assets/stay-1.png', body: 'Feugiat pretium egestas enim blandit purus euismod. Feugiat magna aliquam lectus lectus eu amet. Eros, accumsan purus enim nascetur quam diam felis, fringilla varius.' },
  { title: 'Gothelney Farm', image: '/assets/stay-2.png', body: 'Nec laoreet tristique orci viverra sed aliquam. Amet odio ornare fermentum amet adipiscing malesuada turpis diam augue. Eget enim ultrices etiam nibh at porta.' },
  { title: 'Model Farm', image: '/assets/stay-3.png', body: 'Cras rhoncus malesuada eget vitae eleifend. Sodales purus et aliquam diam, nascetur at habitant. A, vel, donec at commodo eu non ac interdum.' },
  { title: 'The Old Vicarage', image: '/assets/stay-4.png', body: 'Feugiat pretium egestas enim blandit purus euismod. Feugiat magna aliquam lectus lectus eu amet. Eros, accumsan purus enim nascetur quam diam felis, fringilla varius.' },
  { title: 'Blackmore Farm', image: '/assets/stay-5.png', body: 'Nec laoreet tristique orci viverra sed aliquam. Amet odio ornare fermentum amet adipiscing malesuada turpis diam augue. Eget enim ultrices etiam nibh at porta.' },
  { title: 'The Priory', image: '/assets/stay-6.png', body: 'Cras rhoncus malesuada eget vitae eleifend. Sodales purus et aliquam diam, nascetur at habitant. A, vel, donec at commodo eu non ac interdum.' },
  { title: 'Gurney Manor Mill', image: '/assets/stay-7.png', body: 'Feugiat pretium egestas enim blandit purus euismod. Feugiat magna aliquam lectus lectus eu amet. Eros, accumsan purus enim nascetur quam diam felis, fringilla varius.' },
  { title: 'Blackmore Farm', image: '/assets/stay-8.png', body: 'Nec laoreet tristique orci viverra sed aliquam. Amet odio ornare fermentum amet adipiscing malesuada turpis diam augue. Eget enim ultrices etiam nibh at porta.' },
]

function Botanical({ variant, className = '' }: { variant: 'wide' | 'tall', className?: string }) {
  return <div aria-hidden="true" className={`botanical botanical--${variant} ${className}`}><img src="/assets/botanical.png" alt="" /></div>
}

function SealHalf({ side }: { side: 'left' | 'right' }) {
  return (
    <span className={`seal-half seal-half--${side}`} aria-hidden="true">
      <img src="/assets/wax-seal.png" alt="" />
    </span>
  )
}

function SectionTitle({ children, variant = 'stay' }: { children: React.ReactNode, variant?: 'large' | 'stay' | 'rsvp' }) {
  return (
    <div className={`section-title section-title--${variant}`}>
      <span className="floral-line floral-line--left" aria-hidden="true"><i className="floral-art"><img src="/assets/floral-divider.png" alt="" /></i></span>
      <h2>{children}</h2>
      <span className="floral-line floral-line--right" aria-hidden="true"><i className="floral-art"><img src="/assets/floral-divider.png" alt="" /></i></span>
    </div>
  )
}

function Itinerary() {
  return (
    <div className="itinerary">
      {ITINERARY.map((item) => (
        <article className="itinerary-row" key={item.time}>
          <p className="time">{item.time}</p>
          <div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            {item.extraTitle && <><h3>{item.extraTitle}</h3><p>{item.body}</p></>}
          </div>
        </article>
      ))}
    </div>
  )
}

function VenueSection({ id, title, name, address, copy, image }: { id: string, title: string, name: string, address: string, copy: React.ReactNode, image: string }) {
  return (
    <section id={id} className="venue-section">
      <SectionTitle variant="large">{title}</SectionTitle>
      <div className="venue">
        <div className="venue-copy">
          <h3>{name}</h3>
          <p className="address">{address}</p>
          <div className="venue-notes">{copy}</div>
        </div>
        <img className="venue-image" src={image} alt="" />
      </div>
      <Itinerary />
    </section>
  )
}

function WeddingSite() {
  const [rsvpOpen, setRsvpOpen] = useState(false)
  return (
    <main className="site-shell">
      <div className="paper-surface">
        <header className="hero" id="top">
          <nav aria-label="Wedding navigation">
            <a href="#wedding">Wedding</a>
            <a href="#reception">Reception</a>
            <a className="logo-link" href="#top" aria-label="Back to top"><img src="/assets/logo.svg" alt="Stuart and Mandy" /></a>
            <a href="#stay">Where to stay</a>
            <a href="#rsvp">RSVP</a>
          </nav>
          <div className="hero-copy">
            <p className="eyebrow">Please join us to celebrate the wedding of</p>
            <h1>Stuart &amp; Mandy</h1>
            <p className="date">Saturday, 14th November</p>
            <p className="location">Stogursey, Somerset</p>
            <a className="button button--outline" href="#rsvp">RSVP</a>
          </div>
          <img className="hero-image" src="/assets/hero-photo.png" alt="A hand-drawn country house and bridge" />
        </header>

        <VenueSection
          id="wedding"
          title="The wedding"
          name="St Andrews Church"
          address="4 Church St, Stogursey, Bridgwater TA5 1TQ"
          copy={<><p>The wedding will take place at...</p><p>Parking can be found...</p></>}
          image="/assets/church-photo.png"
        />

        <VenueSection
          id="reception"
          title="The reception"
          name="Greenway farm"
          address="Skimmerton Ln, Wembdon, Bridgwater, TA5 2AX"
          copy={<p>Lorem ipsum...</p>}
          image="/assets/reception-photo.png"
        />

        <section className="stay-section" id="stay">
          <SectionTitle variant="stay">Where to stay</SectionTitle>
          <p className="section-intro">Phasellus accumsan neque viverra ut sem aliquam purus rhoncus, morbi. Ut in eget leo dui nunc. Tortor viverra magna dignissim sit. Libero eu euismod risus, mauris etiam ut morbi amet in. Tortor duis dignissim adipiscing sem.</p>
          <div className="stay-grid">
            {STAYS.map((stay, index) => (
              <article className="stay-card" key={`${stay.title}-${index}`}>
                <img src={stay.image} alt="" />
                <h3>{stay.title}</h3>
                <p>{stay.body}</p>
                <a className="button button--outline" href="#rsvp">Button</a>
              </article>
            ))}
          </div>
        </section>

        <section className="rsvp-section" id="rsvp">
          <SectionTitle variant="rsvp">RSVP</SectionTitle>
          <p className="section-intro">Phasellus accumsan neque viverra ut sem aliquam purus rhoncus, morbi. Ut in eget leo dui nunc. Tortor viverra magna dignissim sit. Libero eu euismod risus, mauris etiam ut morbi amet in. Tortor duis dignissim adipiscing sem.</p>
          <button type="button" className="button button--solid" onClick={() => setRsvpOpen(true)}>RSVP here</button>
        </section>
      </div>
      {rsvpOpen && <RsvpModal onClose={() => setRsvpOpen(false)} />}
    </main>
  )
}

function AnimationLab({ productionMode = false, onComplete }: { productionMode?: boolean, onComplete?: () => void }) {
  const cleanMode = productionMode || new URLSearchParams(window.location.search).has('clean')
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  const viewportWidth = viewport.width
  const viewportHeight = viewport.height

  useEffect(() => {
    const updateViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])
  const envelopeWidth = viewportWidth <= 900
    ? Math.min(viewportWidth * .84, 551)
    : Math.min(viewportWidth * .58, 551)
  const envelopePaperWidth = envelopeWidth * 1208 / 1280
  const nestedCardScale = Math.min(envelopePaperWidth / viewportWidth, 1)
  const titleFontSize = viewportWidth <= 900
    ? Math.min(46, Math.max(36, viewportWidth * .095))
    : Math.min(72, Math.max(48, viewportWidth * .047))
  const titleHeight = titleFontSize * 1.18
  const envelopeHeight = envelopeWidth * 903 / 1280
  const envelopeTop = viewportHeight / 2 - (titleHeight + 16 + envelopeHeight) / 2 + titleHeight + 16
  const envelopePaperTop = envelopeTop + envelopeHeight * 20 / 903
  const envelopeSeatDepth = 8
  const foldTopHeight = Math.max(viewportHeight * .2, 150)
  const foldMiddleHeight = Math.max(viewportHeight * .4, envelopeHeight * .8 / nestedCardScale)
  const foldBottomHeight = Math.max(viewportHeight * .4, 240)
  const foldBottomOffset = foldTopHeight + foldMiddleHeight
  const nestedPaperY = (envelopePaperTop + envelopeSeatDepth - nestedCardScale * foldTopHeight) / viewportHeight * 100

  /* ─────────────────────────────────────────────────────────
   * ANIMATION STORYBOARD
   *
   *  620ms   wax seal separates and falls away
   *  920ms   envelope flap opens around its top hinge
   * 1240ms   middle paper panel rises from the envelope
   * 1550ms   top panel unfolds upward from the middle panel
   * 1950ms   paper begins expanding toward fullscreen
   * 2150ms   bottom panel unfolds downward from the middle panel
   * 2450ms   envelope exits beneath the expanding paper
   * ───────────────────────────────────────────────────────── */
  const timeline = useDialTimeline('Invitation opening', {
    duration: 4.4,
    title: {
      at: .7,
      duration: .65,
      from: { opacity: 1, y: 0 },
      to: { opacity: 0, y: -18 },
      transition: { type: 'easing', duration: .65, ease: [.22, .72, .18, 1] },
    },
    seal: {
      at: .62,
      duration: .72,
      from: { split: 0, y: 0, scale: 1, opacity: 1 },
      to: { split: 16, y: 14, scale: .94, opacity: 0 },
      transition: { type: 'spring', visualDuration: .68, bounce: .12 },
    },
    flap: {
      at: .92,
      duration: 1.05,
      from: { scaleY: 1 },
      to: { scaleY: -1 },
      transition: { type: 'spring', visualDuration: .96, bounce: .06 },
    },
    paperFrame: {
      at: 1.24,
      duration: 2.35,
      from: { progress: 0 },
      to: { progress: 1 },
      transition: { type: 'spring', visualDuration: 2.25, bounce: .045 },
    },
    paperScale: {
      at: 2.25,
      duration: 1.54,
      from: { progress: 0 },
      to: { progress: 1 },
      transition: { type: 'spring', visualDuration: 1.48, bounce: .04 },
    },
    foldTwo: {
      at: 1.55,
      duration: 1.5,
      from: { angle: -178, shade: .24 },
      to: { angle: 0, shade: 0 },
      transition: { type: 'spring', visualDuration: 1.42, bounce: .075 },
    },
    foldThree: {
      at: 2.15,
      duration: 1.48,
      from: { angle: 178, shade: .22 },
      to: { angle: 0, shade: 0 },
      transition: { type: 'spring', visualDuration: 1.4, bounce: .07 },
    },
    envelope: {
      at: 2.15,
      duration: 1.32,
      from: { y: 0, rotate: 0 },
      to: { y: 1700, rotate: .8 },
      transition: { type: 'spring', visualDuration: 1.25, bounce: .02 },
    },
  }, { id: productionMode ? 'invitation-opening-production-v1' : 'invitation-opening-3d-v15', persist: !productionMode })

  useEffect(() => {
    if (!productionMode || !onComplete) return
    const finish = window.setTimeout(onComplete, 4400)
    return () => window.clearTimeout(finish)
  }, [onComplete, productionMode])

  const tuning = useDialKit('Paper physics', {
    perspective: [1800, 700, 3000, 50],
    foldDepth: [1, .6, 1.2, .01],
    paperShadow: [28, 0, 70, 1],
    replay: { type: 'action', label: 'Replay opening' },
    pause: { type: 'action', label: 'Pause' },
  }, {
    id: 'invitation-paper-physics',
    persist: true,
    onAction: (action) => {
      if (action === 'replay') timeline.replay()
      if (action === 'pause') timeline.pause()
    },
  })

  const paper = timeline.paperFrame.current
  const paperScale = timeline.paperScale.current
  const foldTwo = timeline.foldTwo.current
  const foldThree = timeline.foldThree.current
  const seal = timeline.seal.current
  const flap = timeline.flap.current
  const envelope = timeline.envelope.current
  const title = timeline.title.current
  const currentPaperY = nestedPaperY * (1 - paper.progress)
  const currentPaperScale = nestedCardScale + (1 - nestedCardScale) * paperScale.progress
  const paperClipBottom = Math.max(0, viewportHeight - envelopeTop - envelopeHeight) * (1 - paperScale.progress)

  return (
    <div className="animation-lab" style={{ '--lab-perspective': `${tuning.perspective}px`, '--lab-shadow': `${tuning.paperShadow}px` } as React.CSSProperties}>
      <div className="lab-splash" aria-hidden="true">
        <Botanical variant="wide" className="splash-flora splash-flora--left" />
        <Botanical variant="wide" className="splash-flora splash-flora--right" />
        <Botanical variant="tall" className="splash-flora splash-flora--top" />
        <Botanical variant="tall" className="splash-flora splash-flora--bottom" />
      </div>

      <div className="lab-paper-stage" style={{ perspective: `${tuning.perspective}px`, clipPath: `inset(0 0 ${paperClipBottom}px 0)` }} aria-hidden="true">
        <div
          className="lab-paper-rig"
          style={{
            '--lab-fold-top': `${foldTopHeight}px`,
            '--lab-fold-middle': `${foldMiddleHeight}px`,
            '--lab-fold-bottom': `${foldBottomHeight}px`,
            '--lab-middle-offset': `${-foldTopHeight}px`,
            '--lab-bottom-offset': `${-foldBottomOffset}px`,
            transform: `translateY(${currentPaperY}vh) scale(${currentPaperScale})`,
          } as React.CSSProperties}
        >
          <div className="lab-paper-panel lab-paper-panel--top" style={{ transform: `rotateX(${foldTwo.angle * tuning.foldDepth}deg)` }}>
            <div className="lab-paper-face lab-paper-face--front">
              <div className="lab-paper-content lab-paper-content--one"><WeddingSite /></div>
              <i className="lab-fold-shade" style={{ opacity: foldTwo.shade }} />
            </div>
            <div className="lab-paper-face lab-paper-face--back" />
          </div>
          <div className="lab-paper-panel lab-paper-panel--middle">
            <div className="lab-paper-face lab-paper-face--front"><div className="lab-paper-content lab-paper-content--two"><WeddingSite /></div></div>
          </div>
          <div className="lab-paper-panel lab-paper-panel--bottom" style={{ transform: `rotateX(${foldThree.angle * tuning.foldDepth}deg)` }}>
            <div className="lab-paper-face lab-paper-face--front">
              <div className="lab-paper-content lab-paper-content--three"><WeddingSite /></div>
              <i className="lab-fold-shade" style={{ opacity: foldThree.shade }} />
            </div>
            <div className="lab-paper-face lab-paper-face--back" />
          </div>
        </div>
      </div>

      <div className="lab-envelope-overlay lab-envelope-overlay--back" aria-hidden="true">
        <div className="splash-center">
          <h1 style={{ visibility: 'hidden' }}>Save the date</h1>
          <div className="envelope-scene">
            <div className="envelope-layered" style={{ transform: `translateY(${envelope.y}px) rotate(${envelope.rotate}deg)` }}>
              <div className="code-envelope code-envelope--back">
                <div className="code-envelope-liner" />
                <div
                  className="code-envelope-flap code-envelope-flap--open"
                  style={{
                    opacity: flap.scaleY < 0 ? 1 : 0,
                    transform: `scaleY(${Math.min(0, flap.scaleY)})`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lab-envelope-overlay lab-envelope-overlay--front" aria-hidden="true">
        <div className="splash-center">
          <h1 style={{ opacity: title.opacity, transform: `translateY(${title.y}px)` }}>Save the date</h1>
          <div className="envelope-scene">
            <div className="envelope-layered" style={{ transform: `translateY(${envelope.y}px) rotate(${envelope.rotate}deg)` }}>
              <div className="code-envelope code-envelope--front">
                <div
                  className="code-envelope-flap code-envelope-flap--closed"
                  style={{
                    opacity: flap.scaleY >= 0 ? 1 : 0,
                    transform: `scaleY(${Math.max(0, flap.scaleY)})`,
                  }}
                />
                <div className="code-envelope-pocket"><i className="code-envelope-texture" /></div>
              </div>
              <div className="seal" style={{ opacity: seal.opacity, transform: `translate(${seal.split * -.5}px, ${seal.y}px) scale(${seal.scale})` }}>
                <span className="seal-motion seal-motion--left" style={{ transform: `translateX(${-seal.split}px)` }}><SealHalf side="left" /></span>
                <span className="seal-motion seal-motion--right" style={{ transform: `translateX(${seal.split}px)` }}><SealHalf side="right" /></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!cleanMode && <>
        <div className="lab-note">
          <strong>Animation lab</strong>
          <span>Scrub the timeline, resize clips and edit their curves. Settings persist locally.</span>
          <a href="/">Back to site</a>
        </div>
        <DialRoot position="top-right" />
        <DialTimeline />
      </>}
    </div>
  )
}

function WeddingExperience() {
  const [introFinished, setIntroFinished] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    document.body.classList.toggle('intro-running', !introFinished)
    return () => document.body.classList.remove('intro-running')
  }, [introFinished])

  return introFinished
    ? <WeddingSite />
    : <AnimationLab productionMode onComplete={() => setIntroFinished(true)} />
}

export default function App() {
  const params = new URLSearchParams(window.location.search)
  const isAnimationLab = params.has('animationLab')
  const isRsvpResults = params.has('rsvps')
  if (isRsvpResults) return <RsvpResults />
  return isAnimationLab ? <AnimationLab /> : <WeddingExperience />
}
