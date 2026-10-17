/** Decorative motion stays inside fixed-size navigation hit targets. */
export function SignalMark() {
  return <svg className="signal-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path className="signal-wave signal-wave-outer" d="M9 6a17 17 0 0 0 0 24M31 6a17 17 0 0 1 0 24"/>
      <path className="signal-wave signal-wave-inner" d="M13 10a11 11 0 0 0 0 16M27 10a11 11 0 0 1 0 16"/>
      <path d="m13 35 7-17 7 17M16 28h8M18 23h4"/>
    </g>
    <circle className="signal-beacon" cx="20" cy="15" r="2.8" fill="currentColor"/>
  </svg>;
}

type Section = 'overview' | 'review' | 'impact' | 'evaluation' | 'policies';
export function WorkspaceIcon({ section }: { section: Section }) {
  return <svg className={`workspace-icon workspace-icon-${section}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {section === 'overview' && <g className="overview-tiles"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></g>}
    {section === 'review' && <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6"/><g className="review-lens"><circle cx="10.5" cy="13" r="3"/><path d="m13 15.5 2.5 2.5"/></g><path className="review-scan" d="M7 9h4"/></>}
    {section === 'impact' && <><path className="impact-route" d="M6 4v12a3 3 0 0 0 3 3h1a8 8 0 0 0 8-8V8"/><circle className="impact-node impact-node-start" cx="6" cy="18" r="3" fill="var(--sidebar)"/><circle className="impact-node impact-node-end" cx="18" cy="5" r="3"/></>}
    {section === 'evaluation' && <><path className="evaluation-guide" d="M2 12h20"/><path className="evaluation-trace" d="m2 12 5 0 3-8 4 16 3-8h5"/></>}
    {section === 'policies' && <><path d="M12 3c3 2 5 3 8 3v6c0 5-4 8-8 10-4-2-8-5-8-10V6c3 0 5-1 8-3z"/><path className="policy-check" d="m8 12 3 3 5-6"/></>}
  </svg>;
}
