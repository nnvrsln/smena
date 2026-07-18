export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="СМЕНА"><img className="brand__mark-image" src="/graphics/svg/brand-mark.svg" alt="" /><span className="brand__name">СМЕНА</span></div>
}
