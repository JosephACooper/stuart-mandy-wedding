import { useEffect, useState } from 'react'
import { supabase, type Rsvp } from '../lib/supabase'

const STORAGE_KEY = 'rsvp-passcode'

type Phase = 'locked' | 'checking' | 'unlocked'

export function RsvpResults() {
  const [passcode, setPasscode] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')
  const [phase, setPhase] = useState<Phase>(() => (localStorage.getItem(STORAGE_KEY) ? 'checking' : 'locked'))
  const [error, setError] = useState('')
  const [rsvps, setRsvps] = useState<Rsvp[]>([])

  useEffect(() => {
    if (phase === 'checking') attempt(passcode, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function attempt(code: string, isAutoAttempt = false) {
    setPhase('checking')
    setError('')
    const { data, error: rpcError } = await supabase.rpc('get_rsvp_results', { p_passcode: code })

    if (rpcError || !data?.ok) {
      if (isAutoAttempt) localStorage.removeItem(STORAGE_KEY)
      setPhase('locked')
      setError(
        data?.reason === 'rate_limited'
          ? 'Too many attempts — please wait a few minutes and try again.'
          : "That passphrase isn't right. Please double check and try again."
      )
      return
    }

    localStorage.setItem(STORAGE_KEY, code)
    setRsvps(data.rows ?? [])
    setPhase('unlocked')
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!passcode.trim()) {
      setError('Please enter the passphrase.')
      return
    }
    attempt(passcode.trim())
  }

  function forgetPasscode() {
    localStorage.removeItem(STORAGE_KEY)
    setPasscode('')
    setRsvps([])
    setError('')
    setPhase('locked')
  }

  if (phase !== 'unlocked') {
    return (
      <div className="rsvp-results paper-surface">
        <div className="rsvp-results__gate">
          <h1>RSVP responses</h1>
          <p>Enter the passphrase to view who's coming.</p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="rsvp-passcode">Passphrase</label>
            <input
              id="rsvp-passcode"
              type="password"
              autoComplete="off"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              disabled={phase === 'checking'}
            />
            {error && <p className="rsvp-modal__error">{error}</p>}
            <button type="submit" className="button button--solid" disabled={phase === 'checking'}>
              {phase === 'checking' ? 'Checking…' : 'View RSVPs'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const attendingCount = rsvps.filter((r) => r.attending).length
  const notAttendingCount = rsvps.filter((r) => !r.attending).length
  const totalGuests = rsvps.filter((r) => r.attending).reduce((sum, r) => sum + r.party_size, 0)

  return (
    <div className="rsvp-results paper-surface">
      <div className="rsvp-results__inner">
        <h1>RSVP responses</h1>

        <div className="rsvp-results__summary">
          <div className="rsvp-results__stat">
            <strong>{rsvps.length}</strong>
            <span>{rsvps.length === 1 ? 'response' : 'responses'}</span>
          </div>
          <div className="rsvp-results__stat">
            <strong>{attendingCount}</strong>
            <span>attending</span>
          </div>
          <div className="rsvp-results__stat">
            <strong>{notAttendingCount}</strong>
            <span>not attending</span>
          </div>
          <div className="rsvp-results__stat">
            <strong>{totalGuests}</strong>
            <span>total guests</span>
          </div>
        </div>

        {rsvps.length === 0 ? (
          <p className="rsvp-results__empty">No RSVPs yet — check back soon.</p>
        ) : (
          <ul className="rsvp-results__list">
            {rsvps.map((r) => (
              <li key={r.id} className="rsvp-results__card">
                <div className="rsvp-results__card-head">
                  <h2>{r.guest_name}</h2>
                  <span className={`rsvp-results__badge ${r.attending ? 'rsvp-results__badge--yes' : 'rsvp-results__badge--no'}`}>
                    {r.attending ? 'Attending' : 'Not attending'}
                  </span>
                </div>
                {r.attending && (
                  <p><strong>Party of {r.party_size}</strong>{r.guest_names ? ` — ${r.guest_names}` : ''}</p>
                )}
                {r.dietary_requirements && <p>Dietary: {r.dietary_requirements}</p>}
                {r.song_request && <p>Song request: {r.song_request}</p>}
                {r.message && <p className="rsvp-results__message">"{r.message}"</p>}
                <p className="rsvp-results__date">
                  {new Date(r.created_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className="rsvp-results__forget" onClick={forgetPasscode}>Forget passphrase</button>
      </div>
    </div>
  )
}
