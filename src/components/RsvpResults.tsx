import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured, type Rsvp } from '../lib/supabase'

const STORAGE_KEY = 'rsvp-passcode'

type Phase = 'locked' | 'checking' | 'unlocked'

export function RsvpResults() {
  const [passcode, setPasscode] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')
  const [phase, setPhase] = useState<Phase>(() => (localStorage.getItem(STORAGE_KEY) ? 'checking' : 'locked'))
  const [error, setError] = useState('')
  const [rsvps, setRsvps] = useState<Rsvp[]>([])

  useEffect(() => {
    if (phase === 'checking') void attempt(passcode, true)
    // The stored passphrase should only be checked once when this screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function attempt(code: string, automatic = false) {
    if (!supabaseConfigured) {
      setPhase('locked')
      setError('The RSVP results are available on the deployed site; local Supabase environment variables are not configured.')
      return
    }

    setPhase('checking')
    setError('')
    const { data, error: requestError } = await supabase.rpc('get_rsvp_results', { p_passcode: code })
    if (requestError || !data?.ok) {
      if (automatic) localStorage.removeItem(STORAGE_KEY)
      setPhase('locked')
      setError(data?.reason === 'rate_limited' ? 'Too many attempts — please wait a few minutes and try again.' : 'That passphrase isn’t right. Please check it and try again.')
      return
    }

    localStorage.setItem(STORAGE_KEY, code)
    setRsvps(data.rows ?? [])
    setPhase('unlocked')
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!passcode.trim()) {
      setError('Please enter the passphrase.')
      return
    }
    void attempt(passcode.trim())
  }

  function forgetPasscode() {
    localStorage.removeItem(STORAGE_KEY)
    setPasscode('')
    setRsvps([])
    setError('')
    setPhase('locked')
  }

  if (phase !== 'unlocked') return (
    <main className="rsvp-results paper-surface">
      <section className="rsvp-results__gate">
        <h1>RSVP responses</h1>
        <p>Enter the passphrase to view who is coming.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="rsvp-passcode">Passphrase</label>
          <input id="rsvp-passcode" type="password" autoComplete="off" value={passcode} onChange={(event) => setPasscode(event.target.value)} disabled={phase === 'checking'} />
          {error && <p className="rsvp-form__error">{error}</p>}
          <button className="button button--solid" type="submit" disabled={phase === 'checking'}>{phase === 'checking' ? 'Checking…' : 'View RSVPs'}</button>
        </form>
      </section>
    </main>
  )

  const attending = rsvps.filter((rsvp) => rsvp.attending)
  const notAttending = rsvps.length - attending.length
  const totalGuests = attending.reduce((total, rsvp) => total + rsvp.party_size, 0)

  return (
    <main className="rsvp-results paper-surface">
      <div className="rsvp-results__inner">
        <h1>RSVP responses</h1>
        <div className="rsvp-results__summary">
          <div className="rsvp-results__stat"><strong>{rsvps.length}</strong><span>{rsvps.length === 1 ? 'response' : 'responses'}</span></div>
          <div className="rsvp-results__stat"><strong>{attending.length}</strong><span>attending</span></div>
          <div className="rsvp-results__stat"><strong>{notAttending}</strong><span>not attending</span></div>
          <div className="rsvp-results__stat"><strong>{totalGuests}</strong><span>total guests</span></div>
        </div>

        {rsvps.length === 0 ? <p className="rsvp-results__empty">No RSVPs yet — check back soon.</p> : (
          <ul className="rsvp-results__list">
            {rsvps.map((rsvp) => <li key={rsvp.id} className="rsvp-results__card">
              <div className="rsvp-results__card-head">
                <h2>{rsvp.guest_name}</h2>
                <span className={`rsvp-results__badge ${rsvp.attending ? 'rsvp-results__badge--yes' : 'rsvp-results__badge--no'}`}>{rsvp.attending ? 'Attending' : 'Not attending'}</span>
              </div>
              {rsvp.attending && <p><strong>Party of {rsvp.party_size}</strong>{rsvp.guest_names ? ` — ${rsvp.guest_names}` : ''}</p>}
              {rsvp.dietary_requirements && <p>Dietary: {rsvp.dietary_requirements}</p>}
              {rsvp.song_request && <p>Song request: {rsvp.song_request}</p>}
              {rsvp.message && <p className="rsvp-results__message">“{rsvp.message}”</p>}
              <p className="rsvp-results__date">{new Date(rsvp.created_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </li>)}
          </ul>
        )}

        <button type="button" className="rsvp-results__forget" onClick={forgetPasscode}>Forget passphrase</button>
      </div>
    </main>
  )
}
