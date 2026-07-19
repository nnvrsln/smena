export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="Смена"><img className="brand__mark-image" src="/graphics/svg/brand-mark.svg" alt="" /><span className="brand__name">Смена</span></div>
}
