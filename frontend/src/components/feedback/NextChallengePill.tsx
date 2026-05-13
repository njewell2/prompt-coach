import { useEffect, useState } from 'react'
import { Icon } from '@/components/shared/Icon'

interface NextChallengePillProps {
  title: string
  nextNumber: number
  totalChallenges: number
  onClick: () => void
}

export function NextChallengePill({ title, nextNumber, totalChallenges, onClick }: NextChallengePillProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 600)
    return () => window.clearTimeout(t)
  }, [])

  if (dismissed) return null

  return (
    <div
      className="pc-next-pill-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 8500,
      }}
    >
      <style>{`
        @keyframes pc-next-pill-rise {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .pc-next-pill {
          position: absolute;
          bottom: 24px;
          right: 24px;
          pointer-events: auto;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px 12px 20px;
          background: var(--captech-blue);
          color: #fff;
          border-radius: var(--radius-full);
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.22);
          cursor: pointer;
          border: none;
          font-family: inherit;
          opacity: 0;
          transition: transform 120ms ease-out, box-shadow 120ms ease-out;
          max-width: calc(100vw - 48px);
        }
        .pc-next-pill.is-visible {
          animation: pc-next-pill-rise 220ms ease-out forwards;
        }
        .pc-next-pill:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.28);
        }
        .pc-next-pill-eyebrow {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.8;
          line-height: 1.2;
        }
        .pc-next-pill-title {
          font-size: 14px;
          font-weight: 700;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 240px;
        }
        .pc-next-pill-dismiss {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--captech-navy);
          color: #fff;
          border: 2px solid #fff;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          font-family: inherit;
          pointer-events: auto;
        }
        .pc-next-pill-dismiss:hover {
          background: #000;
        }
        @media (max-width: 720px) {
          .pc-next-pill {
            bottom: 16px;
            right: 16px;
            padding: 10px 14px 10px 16px;
            gap: 10px;
          }
          .pc-next-pill-title { max-width: 180px; font-size: 13px; }
        }
      `}</style>
      <div
        role="button"
        tabIndex={0}
        className={`pc-next-pill${visible ? ' is-visible' : ''}`}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        aria-label={`Go to next challenge: ${title}`}
      >
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
          <span className="pc-next-pill-eyebrow">
            Up next · Challenge {nextNumber} of {totalChallenges}
          </span>
          <span className="pc-next-pill-title">{title}</span>
        </span>
        <Icon.ArrowRight size={18} />
        <button
          type="button"
          className="pc-next-pill-dismiss"
          onClick={(e) => {
            e.stopPropagation()
            setDismissed(true)
          }}
          aria-label="Dismiss"
        >
          <Icon.Close size={11} />
        </button>
      </div>
    </div>
  )
}
