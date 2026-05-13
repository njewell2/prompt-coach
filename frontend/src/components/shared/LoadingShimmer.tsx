import React from 'react'

interface ShimmerProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  style?: React.CSSProperties
}

export function Shimmer({ width = '100%', height = 16, borderRadius = 'var(--radius-sm)', style }: ShimmerProps) {
  return (
    <div
      className="shimmer"
      style={{ width, height, borderRadius, flexShrink: 0, ...style }}
    />
  )
}

export function ResponseCardShimmer({ title }: { title?: string }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '24px',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      {title ? (
        <h4 style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)', marginBottom: '4px' }}>
          {title}
        </h4>
      ) : (
        <Shimmer width={180} height={16} />
      )}
      <Shimmer width="92%" height={12} />
      <Shimmer width="100%" height={12} />
      <Shimmer width="85%" height={12} />
      <Shimmer width="78%" height={12} />
      <Shimmer width="60%" height={12} />
    </div>
  )
}

export function ScoreCardShimmer() {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Shimmer width={160} height={18} />
        <Shimmer width={50} height={22} borderRadius="var(--radius-full)" />
      </div>
      <Shimmer width="100%" height={8} borderRadius="var(--radius-full)" />
      <Shimmer width="90%" height={14} />
      <Shimmer width="75%" height={14} />
      <Shimmer width={140} height={12} />
    </div>
  )
}

export function AnalysisLoadingState({ statusText }: { statusText: string }) {
  return (
    <div style={{ padding: '32px 0' }}>
      {/* Progress bar — animates transform:scaleX (compositor) instead of width (layout) */}
      <div style={{
        height: '3px',
        background: 'var(--border)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        marginBottom: '32px',
      }}>
        <div style={{
          height: '100%',
          background: 'var(--captech-navy)',
          borderRadius: 'var(--radius-full)',
          width: '100%',
          transformOrigin: 'left center',
          animation: 'progressFill 6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }} />
      </div>

      <p style={{
        textAlign: 'center',
        color: 'var(--ink-2)',
        fontSize: 'var(--fs-body)',
        marginBottom: '32px',
        minHeight: '20px',
      }}>
        {statusText}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '16px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <ScoreCardShimmer key={i} />
        ))}
      </div>

      <style>{`
        @keyframes progressFill {
          0%   { transform: scaleX(0); }
          30%  { transform: scaleX(0.35); }
          60%  { transform: scaleX(0.65); }
          90%  { transform: scaleX(0.88); }
          100% { transform: scaleX(0.9); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
