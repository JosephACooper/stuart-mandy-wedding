import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase, supabaseConfigured } from '../lib/supabase'

type Attending = '' | 'yes' | 'no'
type Status = 'idle' | 'submitting' | 'success' | 'error'
type FieldName = 'guestName' | 'attending' | 'partySize' | 'guestNames' | 'dietaryRequirements' | 'songRequest' | 'message'

export function RsvpModal({ onClose }: { onClose: () => void }) {
  const [guestName, setGuestName] = useState('')
  const [attending, setAttending] = useState<Attending>('')
  const [partySize, setPartySize] = useState(1)
  const [guestNames, setGuestNames] = useState('')
  const [dietaryRequirements, setDietaryRequirements] = useState('')
  const [songRequest, setSongRequest] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({})

  const panelRef = useRef<HTMLElement>(null)
  const guestNameRef = useRef<HTMLInputElement>(null)
  const attendingRef = useRef<HTMLInputElement>(null)
  const partySizeRef = useRef<HTMLInputElement>(null)
  const guestNamesRef = useRef<HTMLTextAreaElement>(null)
  const dietaryRequirementsRef = useRef<HTMLTextAreaElement>(null)
  const songRequestRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    document.body.classList.add('rsvp-modal-open')
    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusTimer = window.setTimeout(() => guestNameRef.current?.focus(), 40)

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button, input, textarea, [href], [tabindex]:not([tabindex="-1"])'))
        .filter((element) => !element.hasAttribute('disabled'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.body.classList.remove('rsvp-modal-open')
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [onClose])

  const fieldRefs: Record<FieldName, React.RefObject<HTMLElement | null>> = {
    guestName: guestNameRef,
    attending: attendingRef,
    partySize: partySizeRef,
    guestNames: guestNamesRef,
    dietaryRequirements: dietaryRequirementsRef,
    songRequest: songRequestRef,
    message: messageRef,
  }

  function validate() {
    const errors: Partial<Record<FieldName, string>> = {}
    if (!guestName.trim()) errors.guestName = 'Please enter your name.'
    else if (guestName.trim().length > 200) errors.guestName = 'That name is a little too long.'
    if (!attending) errors.attending = 'Please let us know if you can make it.'
    if (attending === 'yes' && (!Number.isInteger(partySize) || partySize < 1 || partySize > 10)) errors.partySize = 'Enter a number between 1 and 10.'
    if (guestNames.length > 500) errors.guestNames = 'Please keep this under 500 characters.'
    if (dietaryRequirements.length > 1000) errors.dietaryRequirements = 'Please keep this under 1000 characters.'
    if (songRequest.length > 300) errors.songRequest = 'Please keep this under 300 characters.'
    if (message.length > 2000) errors.message = 'Please keep this under 2000 characters.'
    return errors
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      const firstInvalid = (Object.keys(fieldRefs) as FieldName[]).find((field) => errors[field])
      if (firstInvalid) fieldRefs[firstInvalid].current?.focus()
      return
    }
    setFieldErrors({})

    if (website.trim()) {
      setStatus('success')
      return
    }
    if (!supabaseConfigured) {
      setStatus('error')
      setErrorMessage('RSVP submissions are connected on the live site. Add the Vercel Supabase environment variables to .env.local to test submissions locally.')
      return
    }

    setStatus('submitting')
    setErrorMessage('')
    const { error } = await supabase.from('rsvps').insert({
      guest_name: guestName.trim(),
      attending: attending === 'yes',
      party_size: attending === 'yes' ? partySize : 1,
      guest_names: attending === 'yes' && guestNames.trim() ? guestNames.trim() : null,
      dietary_requirements: attending === 'yes' && dietaryRequirements.trim() ? dietaryRequirements.trim() : null,
      song_request: attending === 'yes' && songRequest.trim() ? songRequest.trim() : null,
      message: message.trim() ? message.trim() : null,
    })

    if (error) {
      setStatus('error')
      setErrorMessage('Something went wrong sending your RSVP. Please try again.')
      return
    }
    setStatus('success')
  }

  return createPortal(
    <div className="rsvp-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={panelRef} className="rsvp-modal" role="dialog" aria-modal="true" aria-labelledby="rsvp-modal-title">
        <button className="rsvp-modal__close" type="button" onClick={onClose} aria-label="Close RSVP form">×</button>
        <div className="rsvp-modal__ornament" aria-hidden="true">
          <span className="rsvp-modal__sprig rsvp-modal__sprig--left"><i><img src="/assets/floral-divider.png" alt="" /></i></span>
          <span className="rsvp-modal__dot" />
          <span className="rsvp-modal__sprig rsvp-modal__sprig--right"><i><img src="/assets/floral-divider.png" alt="" /></i></span>
        </div>

        {status === 'success' ? (
          <div className="rsvp-modal__success">
            <p className="rsvp-modal__eyebrow">Stuart &amp; Mandy</p>
            <h2 id="rsvp-modal-title">Thank you, {guestName.trim() || 'friend'}!</h2>
            <p>{attending === 'yes' ? 'We can’t wait to celebrate with you.' : 'Thank you for letting us know — you’ll be missed.'}</p>
            <button className="button button--solid" type="button" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <p className="rsvp-modal__eyebrow">Stuart &amp; Mandy</p>
            <h2 id="rsvp-modal-title">Will you join us?</h2>

            <form className="rsvp-form" onSubmit={handleSubmit} noValidate>
              <label className="rsvp-honeypot" aria-hidden="true">
                Website
                <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
              </label>

              <label className="rsvp-field rsvp-field--full">
                <span>Your name</span>
                <input ref={guestNameRef} type="text" autoComplete="name" value={guestName} onChange={(event) => setGuestName(event.target.value)} aria-invalid={Boolean(fieldErrors.guestName)} />
                {fieldErrors.guestName && <small className="rsvp-field__error">{fieldErrors.guestName}</small>}
              </label>

              <fieldset className="rsvp-choice">
                <legend>Will you be joining us?</legend>
                <label><input ref={attendingRef} type="radio" name="attendance" checked={attending === 'yes'} onChange={() => setAttending('yes')} /><span>Joyfully attending</span></label>
                <label><input type="radio" name="attendance" checked={attending === 'no'} onChange={() => setAttending('no')} /><span>Sadly can’t make it</span></label>
                {fieldErrors.attending && <small className="rsvp-field__error rsvp-field__error--choice">{fieldErrors.attending}</small>}
              </fieldset>

              {attending === 'yes' && <>
                <label className="rsvp-field">
                  <span>Number in your party</span>
                  <input ref={partySizeRef} type="number" min={1} max={10} value={partySize} onChange={(event) => setPartySize(Number(event.target.value))} aria-invalid={Boolean(fieldErrors.partySize)} />
                  {fieldErrors.partySize && <small className="rsvp-field__error">{fieldErrors.partySize}</small>}
                </label>
                <label className="rsvp-field">
                  <span>Names of guests joining you</span>
                  <textarea ref={guestNamesRef} rows={2} value={guestNames} onChange={(event) => setGuestNames(event.target.value)} placeholder="Please include everyone in your party" />
                  {fieldErrors.guestNames && <small className="rsvp-field__error">{fieldErrors.guestNames}</small>}
                </label>
                <label className="rsvp-field">
                  <span>Dietary requirements <i>Optional</i></span>
                  <textarea ref={dietaryRequirementsRef} rows={2} value={dietaryRequirements} onChange={(event) => setDietaryRequirements(event.target.value)} placeholder="Allergies or dietary requirements" />
                  {fieldErrors.dietaryRequirements && <small className="rsvp-field__error">{fieldErrors.dietaryRequirements}</small>}
                </label>
                <label className="rsvp-field">
                  <span>Song request <i>Optional</i></span>
                  <input ref={songRequestRef} type="text" value={songRequest} onChange={(event) => setSongRequest(event.target.value)} placeholder="A song to bring you to the dance floor" />
                  {fieldErrors.songRequest && <small className="rsvp-field__error">{fieldErrors.songRequest}</small>}
                </label>
              </>}

              {attending && (
                <label className="rsvp-field rsvp-field--full">
                  <span>A message for Stuart &amp; Mandy <i>Optional</i></span>
                  <textarea ref={messageRef} rows={2} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Anything else you’d like us to know" />
                  {fieldErrors.message && <small className="rsvp-field__error">{fieldErrors.message}</small>}
                </label>
              )}

              <div className="rsvp-form__footer">
                <p className={status === 'error' ? 'rsvp-form__error' : ''} aria-live="polite">
                  {status === 'error' ? errorMessage : 'Your RSVP will be sent securely to Stuart and Mandy.'}
                </p>
                <button className="button button--solid" type="submit" disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Sending…' : 'Send RSVP'} <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>,
    document.body,
  )
}
