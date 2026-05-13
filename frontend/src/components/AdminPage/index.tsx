import { useState } from 'react'
import { CapTechLogo } from '@/components/shared/CapTechLogo'
import { Button } from '@/components/shared/Button'
import { Icon } from '@/components/shared/Icon'

type WipeState = 'idle' | 'confirming' | 'final-confirm' | 'wiping' | 'done' | 'error'

const FINAL_PHRASE = 'WIPE'

export function AdminPage() {
  const [state, setState] = useState<WipeState>('idle')
  const [phrase, setPhrase] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function openModal() {
    setErrorMsg(null)
    setPhrase('')
    setState('confirming')
  }

  function closeModal() {
    if (state === 'wiping') return
    setState('idle')
    setPhrase('')
    setErrorMsg(null)
  }

  async function performWipe() {
    setState('wiping')
    try {
      const res = await fetch('/api/admin/wipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: FINAL_PHRASE }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      setState('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Wipe failed')
      setState('error')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--page-bg)', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
      }}>
        <div style={{
          maxWidth: '720px', margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <CapTechLogo color="var(--captech-blue)" height={20} />
          <span style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)' }}>
            Prompt Coach
          </span>
          <span style={{
            fontSize: 'var(--fs-micro)',
            fontWeight: 'var(--fw-bold)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--surface)',
            padding: '2px 8px',
            background: 'var(--score-low, #B5341F)',
            borderRadius: 'var(--radius-full)',
          }}>
            Admin
          </span>
        </div>
      </header>

      <main style={{ flex: 1, padding: '48px 24px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'var(--fs-h1)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)', marginBottom: '8px' }}>
            Admin
          </h1>
          <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-3)', marginBottom: '32px' }}>
            Destructive operations live here. Be careful.
          </p>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Icon.Alert size={20} />
              <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)', margin: 0 }}>
                Wipe all data
              </h2>
            </div>
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-3)', marginBottom: '16px', lineHeight: 1.6 }}>
              Permanently deletes <strong>all users, attempts, XP events, and clusters</strong> from the database.
              This cannot be undone.
            </p>
            {state === 'done' ? (
              <div style={{
                padding: '12px 16px',
                background: 'var(--score-high-bg, #F0FDF4)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--fs-small)',
                color: 'var(--ink)',
              }}>
                ✓ Database wiped.
              </div>
            ) : (
              <Button variant="danger" onClick={openModal}>
                Wipe all data
              </Button>
            )}
          </div>
        </div>
      </main>

      {state !== 'idle' && state !== 'done' && (
        <Modal onClose={closeModal} dismissible={state !== 'wiping'}>
          {state === 'confirming' && (
            <FirstConfirm
              onCancel={closeModal}
              onConfirm={() => setState('final-confirm')}
            />
          )}
          {(state === 'final-confirm' || state === 'wiping' || state === 'error') && (
            <FinalConfirm
              phrase={phrase}
              setPhrase={setPhrase}
              onCancel={closeModal}
              onConfirm={performWipe}
              wiping={state === 'wiping'}
              errorMsg={errorMsg}
            />
          )}
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, onClose, dismissible }: { children: React.ReactNode; onClose: () => void; dismissible: boolean }) {
  return (
    <div
      onClick={dismissible ? onClose : undefined}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        zIndex: 100,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          maxWidth: '480px', width: '100%',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function FirstConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <>
      <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)', marginBottom: '12px' }}>
        Wipe all data?
      </h2>
      <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: '24px' }}>
        This will permanently delete every user, attempt, XP event, and cluster.
        It cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>Continue</Button>
      </div>
    </>
  )
}

function FinalConfirm({
  phrase, setPhrase, onCancel, onConfirm, wiping, errorMsg,
}: {
  phrase: string
  setPhrase: (s: string) => void
  onCancel: () => void
  onConfirm: () => void
  wiping: boolean
  errorMsg: string | null
}) {
  const matches = phrase === FINAL_PHRASE
  return (
    <>
      <h2 style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)', marginBottom: '12px' }}>
        Last chance.
      </h2>
      <p style={{ fontSize: 'var(--fs-body)', color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: '16px' }}>
        Type <code style={{
          background: 'var(--surface-quiet)', padding: '2px 8px',
          borderRadius: 'var(--radius-sm, 4px)',
          fontFamily: 'var(--font-mono)', fontWeight: 'var(--fw-bold)',
        }}>{FINAL_PHRASE}</code> to confirm. This will erase everything.
      </p>
      <input
        type="text"
        value={phrase}
        onChange={e => setPhrase(e.target.value)}
        disabled={wiping}
        autoFocus
        placeholder={FINAL_PHRASE}
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: 'var(--fs-body)',
          fontFamily: 'var(--font-mono)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-quiet)',
          color: 'var(--ink)',
          marginBottom: errorMsg ? '8px' : '20px',
          boxSizing: 'border-box',
        }}
      />
      {errorMsg && (
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--score-low, #B5341F)', marginBottom: '20px' }}>
          {errorMsg}
        </p>
      )}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onCancel} disabled={wiping}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={!matches || wiping} loading={wiping}>
          {wiping ? 'Wiping…' : 'Wipe everything'}
        </Button>
      </div>
    </>
  )
}
