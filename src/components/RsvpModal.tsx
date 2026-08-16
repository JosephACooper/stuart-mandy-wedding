import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

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

  const panelRef = useRef<HTMLDivElement>(null)
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
    guestNameRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('button, input, textarea, [href], [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.hasAttribute('disabled'))
      if (focusable.length === 0) return
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
      document.body.classList.remove('rsvp-modal-open')
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function validate() {
    const errors: Partial<Record<FieldName, string>> = {}
    const trimmedName = guestName.trim()
    if (!trimmedName) errors.guestName = 'Please enter your name.'
    else if (trimmedName.length > 200) errors.guestName = 'That name is a little too long.'
    if (attending !== 'yes' && attending !== 'no') errors.attending = 'Please let us know if you can make it.'
    if (attending === 'yes' && (!Number.isInteger(partySize) || partySize < 1 || partySize > 10)) {
      errors.partySize = 'Enter a number between 1 and 10.'
    }
    if (guestNames.length > 500) errors.guestNames = 'Please keep this under 500 characters.'
    if (dietaryRequirements.length > 1000) errors.dietaryRequirements = 'Please keep this under 1000 characters.'
    if (songRequest.length > 300) errors.songRequest = 'Please keep this under 300 characters.'
    if (message.length > 2000) errors.message = 'Please keep this under 2000 characters.'
    return errors
  }

  const fieldRefsByName: Record<FieldName, React.RefObject<HTMLElement | null>> = {
    guestName: guestNameRef,
    attending: attendingRef,
    partySize: partySizeRef,
    guestNames: guestNamesRef,
    dietaryRequirements: dietaryRequirementsRef,
    songRequest: songRequestRef,
    message: messageRef,
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      const firstInvalid = (Object.keys(fieldRefsByName) as FieldName[]).find((field) => errors[field])
      if (firstInvalid) fieldRefsByName[firstInvalid].current?.focus()
      return
    }
    setFieldErrors({})

    if (website.trim()) {
      // Honeypot tripped — pretend to succeed, skip the network call.
      setStatus('success')
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
    <div className="rsvp-modal" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div
        ref={panelRef}
        className="rsvp-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rsvp-modal-title"
      >
        <button type="button" className="rsvp-modal__close" onClick={onClose} aria-label="Close">×</button>

        {status === 'success' ? (
          <div className="rsvp-modal__success">
            <h2 id="rsvp-modal-title">Thank you, {guestName.trim() || 'friend'}!</h2>
            <p>{attending === 'yes' ? 'We can\'t wait to celebrate with you.' : 'Thanks for letting us know — you\'ll be missed.'}</p>
            <button type="button" className="button button--solid" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form className="rsvp-modal__form" onSubmit={handleSubmit} noValidate>
            <h2 id="rsvp-modal-title">RSVP</h2>

            <div className="rsvp-modal__honeypot" aria-hidden="true">
              <label htmlFor="rsvp-website">Leave this field blank</label>
              <input
                id="rsvp-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="rsvp-modal__field">
              <label htmlFor="rsvp-name">Your name</label>
              <input
                id="rsvp-name"
                ref={guestNameRef}
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                aria-invalid={Boolean(fieldErrors.guestName)}
                aria-describedby={fieldErrors.guestName ? 'rsvp-name-error' : undefined}
              />
              {fieldErrors.guestName && <p className="rsvp-modal__error" id="rsvp-name-error">{fieldErrors.guestName}</p>}
            </div>

            <fieldset className="rsvp-modal__field">
              <legend>Will you be joining us?</legend>
              <div className="rsvp-modal__radio-group">
                <label>
                  <input
                    ref={attendingRef}
                    type="radio"
                    name="attending"
                    value="yes"
                    checked={attending === 'yes'}
                    onChange={() => setAttending('yes')}
                  />
                  Joyfully attending
                </label>
                <label>
                  <input
                    type="radio"
                    name="attending"
                    value="no"
                    checked={attending === 'no'}
                    onChange={() => setAttending('no')}
                  />
                  Sadly can't make it
                </label>
              </div>
              {fieldErrors.attending && <p className="rsvp-modal__error">{fieldErrors.attending}</p>}
            </fieldset>

            {attending === 'yes' && (
              <>
                <div className="rsvp-modal__field">
                  <label htmlFor="rsvp-party-size">Number in your party (including you)</label>
                  <input
                    id="rsvp-party-size"
                    ref={partySizeRef}
                    type="number"
                    min={1}
                    max={10}
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    aria-invalid={Boolean(fieldErrors.partySize)}
                    aria-describedby={fieldErrors.partySize ? 'rsvp-party-size-error' : undefined}
                  />
                  {fieldErrors.partySize && <p className="rsvp-modal__error" id="rsvp-party-size-error">{fieldErrors.partySize}</p>}
                </div>

                <div className="rsvp-modal__field">
                  <label htmlFor="rsvp-guest-names">Names of the guests joining you</label>
                  <textarea
                    id="rsvp-guest-names"
                    ref={guestNamesRef}
                    rows={2}
                    value={guestNames}
                    onChange={(e) => setGuestNames(e.target.value)}
                  />
                  {fieldErrors.guestNames && <p className="rsvp-modal__error">{fieldErrors.guestNames}</p>}
                </div>

                <div className="rsvp-modal__field">
                  <label htmlFor="rsvp-dietary">Dietary requirements or allergies</label>
                  <textarea
                    id="rsvp-dietary"
                    ref={dietaryRequirementsRef}
                    rows={2}
                    value={dietaryRequirements}
                    onChange={(e) => setDietaryRequirements(e.target.value)}
                  />
                  {fieldErrors.dietaryRequirements && <p className="rsvp-modal__error">{fieldErrors.dietaryRequirements}</p>}
                </div>

                <div className="rsvp-modal__field">
                  <label htmlFor="rsvp-song">A song to bring you to the dance floor</label>
                  <input
                    id="rsvp-song"
                    ref={songRequestRef}
                    type="text"
                    value={songRequest}
                    onChange={(e) => setSongRequest(e.target.value)}
                  />
                  {fieldErrors.songRequest && <p className="rsvp-modal__error">{fieldErrors.songRequest}</p>}
                </div>
              </>
            )}

            <div className="rsvp-modal__field">
              <label htmlFor="rsvp-message">A message for Stuart &amp; Mandy (optional)</label>
              <textarea
                id="rsvp-message"
                ref={messageRef}
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {fieldErrors.message && <p className="rsvp-modal__error">{fieldErrors.message}</p>}
            </div>

            {status === 'error' && <p className="rsvp-modal__error rsvp-modal__error--form">{errorMessage}</p>}

            <div className="rsvp-modal__actions">
              <button type="submit" className="button button--solid" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Sending…' : 'Send RSVP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
