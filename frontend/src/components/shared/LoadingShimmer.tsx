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
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '24px',
      boxShadow: 'var(--shadow-card)',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      {title ? (
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
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
      background: 'var(--bg-card)',
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
      {/* Progress bar */}
      <div style={{
        height: '3px',
        background: 'var(--border)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        marginBottom: '32px',
      }}>
        <div style={{
          height: '100%',
          background: 'var(--accent-navy)',
          borderRadius: 'var(--radius-full)',
          animation: 'progressFill 6s ease-out forwards',
          width: '0%',
        }} />
      </div>

      <p style={{
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '14px',
        marginBottom: '32px',
        minHeight: '20px',
      }}>
        {statusText}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ScoreCardShimmer key={i} />
        ))}
      </div>

      <style>{`
        @keyframes progressFill {
          0%   { width: 0%; }
          30%  { width: 35%; }
          60%  { width: 65%; }
          90%  { width: 88%; }
          100% { width: 90%; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
