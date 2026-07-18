export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'brand--compact' : ''}`} aria-label="СМЕНА"><span>С</span>{compact ? null : <div><b>СМЕНА</b><small>управление стройкой</small></div>}</div>
}
