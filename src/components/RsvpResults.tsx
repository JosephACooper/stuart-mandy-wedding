import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase, supabaseConfigured, type Rsvp } from '../lib/supabase'

const STORAGE_KEY = 'rsvp-passcode'

type Phase = 'locked' | 'checking' | 'unlocked'
type ResponseFilter = 'all' | 'attending' | 'not-attending'

type EditDraft = {
  guestName: string
  attending: boolean
  partySize: string
  guestNames: string
  dietaryRequirements: string
  songRequest: string
  message: string
}

function EditRsvpDialog({ rsvp, onClose, onSave }: {
  rsvp: Rsvp
  onClose: () => void
  onSave: (draft: EditDraft) => Promise<string | null>
}) {
  const [draft, setDraft] = useState<EditDraft>({
    guestName: rsvp.guest_name,
    attending: rsvp.attending,
    partySize: String(rsvp.party_size),
    guestNames: rsvp.guest_names ?? '',
    dietaryRequirements: rsvp.dietary_requirements ?? '',
    songRequest: rsvp.song_request ?? '',
    message: rsvp.message ?? '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.classList.add('rsvp-modal-open')
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('rsvp-modal-open')
    }
  }, [onClose, saving])

  function update<K extends keyof EditDraft>(key: K, value: EditDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const partySize = Number(draft.partySize)
    if (!draft.guestName.trim()) {
      setError('Guest name is required.')
      return
    }
    if (draft.guestName.trim().length > 200) {
      setError('Guest name must be 200 characters or fewer.')
      return
    }
    if (draft.attending && (!Number.isInteger(partySize) || partySize < 1 || partySize > 10)) {
      setError('Party size must be a whole number between 1 and 10.')
      return
    }
    if (draft.guestNames.length > 500 || draft.dietaryRequirements.length > 1000 || draft.songRequest.length > 300 || draft.message.length > 2000) {
      setError('One or more fields is too long. Please shorten the response and try again.')
      return
    }

    setSaving(true)
    setError('')
    const saveError = await onSave(draft)
    if (saveError) {
      setError(saveError)
      setSaving(false)
    }
  }

  return createPortal(
    <div className="rsvp-admin-modal" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <section className="rsvp-admin-modal__panel" role="dialog" aria-modal="true" aria-labelledby="edit-rsvp-title">
        <div className="rsvp-admin-modal__head">
          <div><span>Edit response</span><h2 id="edit-rsvp-title">{rsvp.guest_name}</h2></div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close edit RSVP dialog">×</button>
        </div>
        <form className="rsvp-admin-form" onSubmit={handleSubmit}>
          <label className="rsvp-admin-form__full"><span>Guest name</span><input autoFocus value={draft.guestName} maxLength={200} onChange={(event) => update('guestName', event.target.value)} /></label>
          <fieldset className="rsvp-admin-form__choice">
            <legend>Response</legend>
            <label><input type="radio" name="admin-attending" checked={draft.attending} onChange={() => update('attending', true)} /><span>Attending</span></label>
            <label><input type="radio" name="admin-attending" checked={!draft.attending} onChange={() => update('attending', false)} /><span>Can’t attend</span></label>
          </fieldset>
          {draft.attending && <>
            <label><span>Party size</span><input type="number" min="1" max="10" inputMode="numeric" value={draft.partySize} onChange={(event) => update('partySize', event.target.value)} /></label>
            <label><span>Guest names</span><input value={draft.guestNames} maxLength={500} onChange={(event) => update('guestNames', event.target.value)} /></label>
            <label className="rsvp-admin-form__full"><span>Dietary requirements</span><textarea value={draft.dietaryRequirements} maxLength={1000} onChange={(event) => update('dietaryRequirements', event.target.value)} /></label>
            <label className="rsvp-admin-form__full"><span>Song request</span><input value={draft.songRequest} maxLength={300} onChange={(event) => update('songRequest', event.target.value)} /></label>
          </>}
          <label className="rsvp-admin-form__full"><span>Message</span><textarea value={draft.message} maxLength={2000} onChange={(event) => update('message', event.target.value)} /></label>
          {error && <p className="rsvp-admin-form__error" role="alert">{error}</p>}
          <div className="rsvp-admin-form__footer">
            <button type="button" className="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="button button--solid" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  )
}

export function RsvpResults() {
  const [passcode, setPasscode] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')
  const [phase, setPhase] = useState<Phase>(() => (localStorage.getItem(STORAGE_KEY) ? 'checking' : 'locked'))
  const [error, setError] = useState('')
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [responseFilter, setResponseFilter] = useState<ResponseFilter>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingRsvp, setEditingRsvp] = useState<Rsvp | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    if (phase === 'checking') void attempt(passcode, true)
    // The stored passphrase should only be checked once when this screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!openMenuId) return
    function closeMenu(event: MouseEvent) {
      if (!(event.target as Element).closest('.rsvp-results__actions')) setOpenMenuId(null)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenMenuId(null)
    }
    document.addEventListener('mousedown', closeMenu)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', closeMenu)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenuId])

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
    setResponseFilter('all')
    setError('')
    setPhase('locked')
  }

  async function saveRsvp(draft: EditDraft) {
    if (!editingRsvp) return 'This RSVP is no longer available.'
    const { data, error: requestError } = await supabase.rpc('update_rsvp_admin', {
      p_passcode: passcode,
      p_rsvp_id: editingRsvp.id,
      p_guest_name: draft.guestName.trim(),
      p_attending: draft.attending,
      p_party_size: draft.attending ? Number(draft.partySize) : 1,
      p_guest_names: draft.attending ? draft.guestNames : '',
      p_dietary_requirements: draft.attending ? draft.dietaryRequirements : '',
      p_song_request: draft.attending ? draft.songRequest : '',
      p_message: draft.message,
    })
    if (requestError || !data?.ok) {
      if (data?.reason === 'rate_limited') return 'Too many attempts — please wait a few minutes and try again.'
      if (data?.reason === 'incorrect_passcode') return 'Your admin session has expired. Please sign in again.'
      return 'Couldn’t save this RSVP. Please try again.'
    }
    setRsvps((current) => current.map((item) => item.id === editingRsvp.id ? data.row as Rsvp : item))
    setEditingRsvp(null)
    setActionMessage(`Saved changes to ${draft.guestName.trim()}’s RSVP.`)
    return null
  }

  async function deleteRsvp(rsvp: Rsvp) {
    setOpenMenuId(null)
    if (!window.confirm(`Delete ${rsvp.guest_name}’s RSVP? This can’t be undone.`)) return
    setDeletingId(rsvp.id)
    setActionMessage('')
    const { data, error: requestError } = await supabase.rpc('delete_rsvp_admin', { p_passcode: passcode, p_rsvp_id: rsvp.id })
    setDeletingId(null)
    if (requestError || !data?.ok) {
      setActionMessage(data?.reason === 'rate_limited' ? 'Too many attempts — please wait a few minutes and try again.' : 'Couldn’t delete this RSVP. Please try again.')
      return
    }
    setRsvps((current) => current.filter((item) => item.id !== rsvp.id))
    setActionMessage(`Deleted ${rsvp.guest_name}’s RSVP.`)
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

  const attendingResponses = rsvps.filter((rsvp) => rsvp.attending)
  const attendingGuests = attendingResponses.reduce((total, rsvp) => total + rsvp.party_size, 0)
  const notAttending = rsvps.length - attendingResponses.length
  const filteredRsvps = rsvps.filter((rsvp) => {
    if (responseFilter === 'attending') return rsvp.attending
    if (responseFilter === 'not-attending') return !rsvp.attending
    return true
  })
  const emptyFilterMessage = responseFilter === 'attending'
    ? 'No one has confirmed they are attending yet.'
    : 'No one has said they can’t attend.'

  return (
    <main className="rsvp-results paper-surface">
      <div className="rsvp-results__inner">
        <h1>RSVP responses</h1>
        {actionMessage && <p className="rsvp-results__notice" role="status">{actionMessage}</p>}
        <div className="rsvp-results__summary">
          <div className="rsvp-results__stat"><strong>{rsvps.length}</strong><span>{rsvps.length === 1 ? 'reply received' : 'replies received'}</span></div>
          <div className="rsvp-results__stat"><strong>{attendingGuests}</strong><span>{attendingGuests === 1 ? 'guest attending' : 'guests attending'}</span></div>
          <div className="rsvp-results__stat"><strong>{notAttending}</strong><span>{notAttending === 1 ? 'reply declined' : 'replies declined'}</span></div>
        </div>

        {rsvps.length === 0 ? <p className="rsvp-results__empty">No RSVPs yet — check back soon.</p> : (
          <section className="rsvp-results__responses" aria-label="RSVP response list">
            <div className="rsvp-results__filters" role="group" aria-label="Filter responses">
              {([
                ['all', 'All', rsvps.length],
                ['attending', 'Attending', attendingResponses.length],
                ['not-attending', 'Can’t attend', notAttending],
              ] as const).map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={responseFilter === value}
                  className={responseFilter === value ? 'is-active' : ''}
                  onClick={() => setResponseFilter(value)}
                >
                  <span>{label}</span><small>{count}</small>
                </button>
              ))}
            </div>

            <div aria-live="polite">
              {filteredRsvps.length === 0 ? <p className="rsvp-results__empty">{emptyFilterMessage}</p> : (
                <ul className="rsvp-results__list">
                  {filteredRsvps.map((rsvp) => <li key={rsvp.id} className="rsvp-results__card">
                    <div className="rsvp-results__card-head">
                      <h2>{rsvp.guest_name}</h2>
                      <div className="rsvp-results__card-status">
                        <span className={`rsvp-results__badge ${rsvp.attending ? 'rsvp-results__badge--yes' : 'rsvp-results__badge--no'}`}>{rsvp.attending ? 'Attending' : 'Can’t attend'}</span>
                        <div className="rsvp-results__actions">
                          <button
                            type="button"
                            className="rsvp-results__menu-trigger"
                            aria-label={`Actions for ${rsvp.guest_name}`}
                            aria-haspopup="menu"
                            aria-expanded={openMenuId === rsvp.id}
                            onClick={() => setOpenMenuId((current) => current === rsvp.id ? null : rsvp.id)}
                            disabled={deletingId === rsvp.id}
                          >{deletingId === rsvp.id ? '…' : '•••'}</button>
                          {openMenuId === rsvp.id && <div className="rsvp-results__menu" role="menu">
                            <button type="button" role="menuitem" onClick={() => { setOpenMenuId(null); setActionMessage(''); setEditingRsvp(rsvp) }}>Edit RSVP</button>
                            <button type="button" role="menuitem" className="is-destructive" onClick={() => void deleteRsvp(rsvp)}>Delete RSVP</button>
                          </div>}
                        </div>
                      </div>
                    </div>
                    {rsvp.attending && <p><strong>Party of {rsvp.party_size}</strong>{rsvp.guest_names ? ` — ${rsvp.guest_names}` : ''}</p>}
                    {rsvp.dietary_requirements && <p>Dietary: {rsvp.dietary_requirements}</p>}
                    {rsvp.song_request && <p>Song request: {rsvp.song_request}</p>}
                    {rsvp.message && <p className="rsvp-results__message">“{rsvp.message}”</p>}
                    <p className="rsvp-results__date">{new Date(rsvp.created_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </li>)}
                </ul>
              )}
            </div>
          </section>
        )}

        <button type="button" className="rsvp-results__forget" onClick={forgetPasscode}>Forget passphrase</button>
      </div>
      {editingRsvp && <EditRsvpDialog rsvp={editingRsvp} onClose={() => setEditingRsvp(null)} onSave={saveRsvp} />}
    </main>
  )
}
