import { useEffect, useRef, useState } from 'react'
import { DialRoot, DialTimeline, useDialKit, useDialKitController, useDialTimeline } from 'dialkit'
import 'dialkit/styles.css'
import { RsvpModal } from './components/RsvpModal'
import { RsvpResults } from './components/RsvpResults'

type ItineraryItem = {
  time: string
  title: string
  body: string
}

const CEREMONY_ITINERARY: ItineraryItem[] = [
  {
    time: '2:30pm',
    title: 'Guests arrive and park',
    body: 'Please allow a little extra time to find considerate parking within Stogursey and make your way to the church.',
  },
  {
    time: '2:45pm',
    title: 'Guests seated',
    body: 'Please take your seats in St Andrew’s Church so the ceremony can begin promptly.',
  },
  {
    time: '3:00pm',
    title: 'Wedding ceremony',
    body: 'Stuart and Mandy exchange vows at St Andrew’s Church, with music from soloist Sophia Aira.',
  },
  {
    time: '3:45pm',
    title: 'Confetti and photographs',
    body: 'The ceremony finish is provisional; we’ll confirm this timing when the final order of service is agreed.',
  },
]

const RECEPTION_ITINERARY: ItineraryItem[] = [
  {
    time: '4:00pm',
    title: 'Travel to Greenway Farm',
    body: 'Please allow approximately 20 minutes for the drive. Sunset is around 4:25pm, so the journey will be around dusk.',
  },
  {
    time: '4:30pm',
    title: 'Canapés, drinks and live music',
    body: 'Join us for canapés and drinks on arrival at Greenway Farm, with music from soloist Sophia Aira. This start time is provisional until the ceremony schedule is confirmed.',
  },
  {
    time: '5:00pm',
    title: 'Hot buffet, fun and dancing',
    body: 'Enjoy the hot buffet before the dancing begins. Way Back Wayne will be playing from 7:30pm through to the end of the evening.',
  },
  {
    time: '11:30pm',
    title: 'Evening finishes',
    body: 'The celebrations at Greenway Farm come to a close.',
  },
]

const STAYS = [
  {
    title: 'Cannington House',
    image: '/assets/stay-1.png',
    href: 'https://www.canningtonhouse.co.uk/',
    body: 'A beautifully restored, Grade II listed Georgian house in the centre of Cannington. This intimate B&B has two luxury en-suite rooms, a half-acre walled garden, private parking and EV charging.',
  },
  {
    title: 'Gothelney Farm',
    image: '/assets/stay-2.png',
    href: 'https://www.gothelneyfarmer.co.uk/accommodation',
    body: 'A characterful and cosy stay at the heart of a working agroecological farm in nearby Charlynch. A lovely choice for guests drawn to quiet countryside, local food and a slower pace.',
  },
  {
    title: 'Model Farm',
    image: '/assets/stay-3.png',
    href: 'https://www.modelfarm.com/',
    body: 'A generous Victorian country house near Wembdon, available for groups of 10–21 guests. Eleven bedrooms, ten bathrooms and four acres of gardens make it especially well suited to families sharing.',
  },
  {
    title: 'The Old Vicarage',
    image: '/assets/stay-4.png',
    href: 'https://theoldvicaragebridgwater.com/',
    body: 'An award-winning, dog-friendly hotel in a 15th-century Grade II listed building in central Bridgwater. Its 18 individually styled en-suite rooms are joined by a restaurant, bar and walled garden.',
  },
  {
    title: 'Blackmore Farm',
    image: '/assets/stay-5.png',
    href: 'https://blackmorefarm.co.uk/',
    body: 'A remarkable 15th-century, Grade I listed manor at the foot of the Quantocks. Stay in period rooms or converted barns, then gather for a locally sourced breakfast around the Great Hall’s long oak table.',
  },
  {
    title: 'The Priory',
    image: '/assets/stay-6.png',
    href: 'https://www.booking.com/hotel/gb/the-priory-cannington.en-gb.html',
    body: 'A small, beautifully restored B&B in an 18th-century Grade II listed house. It sits opposite Cannington’s Walled Gardens, with village pubs close by and the Quantock Hills a short drive away.',
  },
  {
    title: 'Gurney Manor Mill',
    image: '/assets/stay-7.png',
    href: 'https://gurneymill.co.uk/',
    body: 'A lovingly restored 15th-century watermill with four en-suite rooms and a boutique holiday cottage. Its stream, waterfall and water-meadow views feel wonderfully rural, yet Cannington is a five-minute walk.',
  },
  {
    title: 'The Bower Inn',
    image: '/assets/stay-8.png',
    href: 'https://butcombe.com/the-bower-inn-somerset/',
    body: 'A relaxed 18th-century pub and hotel on the edge of the Somerset Levels. Fifteen modern-country en-suite rooms, seasonal dining and a large courtyard garden make this an easy all-round option.',
  },
]

const MOBILE_FOOTER_TIMING = {
  botanicalDelay: 100,
  buttonDelay: 520,
  completeDelay: 750,
}

const MOBILE_FOOTER_FLOWERS = ['one', 'two', 'three'] as const

// Set to true to restore the sticky mobile RSVP experiment and its tuning controls.
const MOBILE_FOOTER_EXPERIMENT_ENABLED = false

const ENVELOPE_FIT = {
  paperSeatDepth: 8,
  bottomClipGuard: 4,
}

function Botanical({ variant, className = '' }: { variant: 'wide' | 'tall', className?: string }) {
  return <div aria-hidden="true" className={`botanical botanical--${variant} ${className}`}><img src="/assets/botanical.png" alt="" /></div>
}

function SealHalf({ side }: { side: 'left' | 'right' }) {
  return (
    <span className={`seal-half seal-half--${side}`} aria-hidden="true">
      <span className="wax-seal-art" />
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

function Itinerary({ items }: { items: ItineraryItem[] }) {
  return (
    <div className="itinerary">
      {items.map((item) => (
        <article className="itinerary-row" key={`${item.time}-${item.title}`}>
          <p className="time">{item.time}</p>
          <div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

function VenueSection({ id, title, name, address, copy, image, itinerary, itineraryNote }: { id: string, title: string, name: string, address: string, copy: React.ReactNode, image: string, itinerary?: ItineraryItem[], itineraryNote?: string }) {
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
      {itinerary && <Itinerary items={itinerary} />}
      {itineraryNote && <p className="itinerary-note">{itineraryNote}</p>}
    </section>
  )
}

function MobileFooterCta({ onClick, showFlowers }: { onClick: () => void, showFlowers: boolean }) {
  const endSentinelRef = useRef<HTMLSpanElement>(null)
  const [stage, setStage] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 3 : 0)
  const [atPageEnd, setAtPageEnd] = useState(false)

  /* ─────────────────────────────────────────────────────────
   * MOBILE FOOTER STORYBOARD
   *
   *   0ms   fixed footer waits just below the viewport edge
   * 100ms   three botanical stems fade and rise into place
   * 520ms   translucent RSVP pill quickly fades into place
   * 750ms   composition settles; it yields at the page end
   * ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timers: number[] = []
    timers.push(window.setTimeout(() => setStage(1), MOBILE_FOOTER_TIMING.botanicalDelay))
    timers.push(window.setTimeout(() => setStage(2), MOBILE_FOOTER_TIMING.buttonDelay))
    timers.push(window.setTimeout(() => setStage(3), MOBILE_FOOTER_TIMING.completeDelay))
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  useEffect(() => {
    if (!endSentinelRef.current) return
    const observer = new IntersectionObserver(([entry]) => setAtPageEnd(entry.isIntersecting), {
      rootMargin: '0px 0px 24px',
      threshold: 0,
    })
    observer.observe(endSentinelRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <span ref={endSentinelRef} className="mobile-footer-sentinel" aria-hidden="true" />
      <aside className={`mobile-footer-cta mobile-footer-cta--stage-${stage} ${showFlowers ? '' : 'mobile-footer-cta--without-flowers'} ${atPageEnd ? 'mobile-footer-cta--at-end' : ''}`} aria-label="RSVP shortcut">
        {showFlowers && MOBILE_FOOTER_FLOWERS.map((flower) => <Botanical key={flower} variant="tall" className={`mobile-footer-flora mobile-footer-flora--${flower}`} />)}
        <button type="button" onClick={onClick}>RSVP <span aria-hidden="true">→</span></button>
      </aside>
    </>
  )
}

function WeddingSite({ footerCtaEnabled = false, footerFlowersEnabled = true, mobileHeroRsvp = false }: { footerCtaEnabled?: boolean, footerFlowersEnabled?: boolean, mobileHeroRsvp?: boolean }) {
  const [rsvpOpen, setRsvpOpen] = useState(false)

  return (
    <main className="site-shell">
      <div className="paper-surface">
        <header className={`hero ${mobileHeroRsvp ? 'hero--mobile-rsvp' : ''}`} id="top">
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
            <button className="button button--outline" type="button" onClick={() => setRsvpOpen(true)}>RSVP</button>
          </div>
          <img className="hero-image" src="/assets/hero-photo.png" alt="A hand-drawn country house and bridge" />
        </header>

        <VenueSection
          id="wedding"
          title="The wedding"
          name="St Andrew’s Church"
          address="4 Church St, Stogursey, Bridgwater TA5 1TQ"
          copy={<><p>The ceremony will take place at St Andrew’s Church in the heart of Stogursey. Parking immediately outside the church is very limited, so please allow a little extra time and park considerately within the village. We are also confirming overflow parking at Stogursey Victory Hall on Tower Hill, a short walk from the church.</p><p>Limited accessible parking is available immediately outside the church.</p></>}
          image="/assets/church-photo.png"
          itinerary={CEREMONY_ITINERARY}
        />

        <VenueSection
          id="reception"
          title="The reception"
          name="Greenway Farm"
          address="Skimmerton Lane, Wembdon, TA5 2AX"
          copy={<><p>After the ceremony, celebrations will continue at Greenway Farm in Wembdon. Please allow approximately 20 minutes for the drive from Stogursey. The farm is reached from the A39 via Skimmerton Lane, beside the service station between Bridgwater and Cannington.</p><p>We recommend arranging lifts or pre-booking a taxi in advance.</p></>}
          image="/assets/reception-photo.png"
          itinerary={RECEPTION_ITINERARY}
          itineraryNote="Reception arrival timings remain subject to the final ceremony schedule."
        />

        <section className="stay-section" id="stay">
          <SectionTitle variant="stay">Where to stay</SectionTitle>
          <p className="section-intro">We’ve gathered a few places to stay in and around Cannington and Bridgwater for those who may be travelling, from small country B&amp;Bs to houses made for sharing.</p>
          <div className="stay-grid" aria-label="Recommended accommodation">
            {STAYS.map((stay, index) => (
              <article className="stay-card" key={`${stay.title}-${index}`}>
                <img src={stay.image} alt={`${stay.title} exterior`} />
                <h3>{stay.title}</h3>
                <p>{stay.body}</p>
                <a className="stay-link" href={stay.href} target="_blank" rel="noreferrer">
                  Visit website <span aria-hidden="true">→</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="note-section" aria-labelledby="little-note-title">
          <SectionTitle variant="stay"><span id="little-note-title">A little note</span></SectionTitle>
          <div className="note-grid">
            <article>
              <h3>Photographs</h3>
              <p>Please take photographs! We won’t have an official photographer, so we’d love you to capture plenty of moments throughout the day and send us your favourites afterwards. It would mean so much to see the celebration through your eyes.</p>
            </article>
            <article>
              <h3>No gifts, please</h3>
              <p>Please don’t bring gifts — your presence really is more than enough. We’re simply looking forward to celebrating and sharing the day with you.</p>
            </article>
          </div>
        </section>

        <section className="rsvp-section" id="rsvp">
          <SectionTitle variant="rsvp">RSVP</SectionTitle>
          <p className="section-intro">Please reply using the form below. You can confirm who is attending, share dietary requirements, request a song for the dance floor and leave us a message.</p>
          <button className="button button--solid" type="button" onClick={() => setRsvpOpen(true)}>Reply to our invitation</button>
        </section>
        <footer className="site-credit">made with <span aria-label="love">♥</span> by Joseph and Maddie</footer>
        {footerCtaEnabled && <MobileFooterCta showFlowers={footerFlowersEnabled} onClick={() => setRsvpOpen(true)} />}
      </div>
      {rsvpOpen && <RsvpModal onClose={() => setRsvpOpen(false)} />}
    </main>
  )
}

function AnimationLab({ productionMode = false, mobileHeroRsvp = true, onComplete }: { productionMode?: boolean, mobileHeroRsvp?: boolean, onComplete?: () => void }) {
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
  const envelopeSeatDepth = ENVELOPE_FIT.paperSeatDepth
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
  const paperClipBottom = Math.max(0, viewportHeight - envelopeTop - envelopeHeight + ENVELOPE_FIT.bottomClipGuard) * (1 - paperScale.progress)

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
              <div className="lab-paper-content lab-paper-content--one"><WeddingSite mobileHeroRsvp={mobileHeroRsvp} /></div>
              <i className="lab-fold-shade" style={{ opacity: foldTwo.shade }} />
            </div>
            <div className="lab-paper-face lab-paper-face--back" />
          </div>
          <div className="lab-paper-panel lab-paper-panel--middle">
            <div className="lab-paper-face lab-paper-face--front"><div className="lab-paper-content lab-paper-content--two"><WeddingSite mobileHeroRsvp={mobileHeroRsvp} /></div></div>
          </div>
          <div className="lab-paper-panel lab-paper-panel--bottom" style={{ transform: `rotateX(${foldThree.angle * tuning.foldDepth}deg)` }}>
            <div className="lab-paper-face lab-paper-face--front">
              <div className="lab-paper-content lab-paper-content--three"><WeddingSite mobileHeroRsvp={mobileHeroRsvp} /></div>
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
  const footerController = useDialKitController('Mobile footer', {
    enabled: true,
    flowers: true,
  }, {
    id: 'mobile-footer-cta-v1',
    persist: true,
  })
  const mobileFooterEnabled = MOBILE_FOOTER_EXPERIMENT_ENABLED && footerController.values.enabled

  useEffect(() => {
    document.body.classList.toggle('intro-running', !introFinished)
    return () => document.body.classList.remove('intro-running')
  }, [introFinished])

  return <>
    {introFinished
      ? <WeddingSite footerCtaEnabled={mobileFooterEnabled} footerFlowersEnabled={footerController.values.flowers} mobileHeroRsvp={!mobileFooterEnabled} />
      : <AnimationLab productionMode mobileHeroRsvp={!mobileFooterEnabled} onComplete={() => setIntroFinished(true)} />}
    {introFinished && MOBILE_FOOTER_EXPERIMENT_ENABLED && <>
      <DialRoot position="top-right" defaultOpen={false} productionEnabled />
    </>}
  </>
}

export default function App() {
  const params = new URLSearchParams(window.location.search)
  const isAnimationLab = params.has('animationLab')
  if (params.has('rsvps')) return <RsvpResults />
  return isAnimationLab ? <AnimationLab /> : <WeddingExperience />
}
