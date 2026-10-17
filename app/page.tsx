'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, Check,
  CheckCheck, ChevronDown, ChevronRight, CircleAlert, CircleCheck,
  CircleHelp, ClipboardCheck, Clock3, Code2, Database, ExternalLink,
  FileCheck2, FileSearch, FileText, Filter, GitBranch, Layers3,
  LayoutDashboard, ListChecks, LoaderCircle, Menu, Network,
  Play, RadioTower, RefreshCw, Search, Settings2, ShieldAlert,
  ShieldCheck, Sparkles, Target, TrendingUp, TriangleAlert, X,
} from 'lucide-react';
import { SignalMark, WorkspaceIcon } from '@/components/workspace-icons';
import { cases, policies, sourceById, sources, updates } from '@/data';
import { className, demoAnalysis, impactForUpdate, ruleChecks, scoreRecords } from '@/lib/engine';
import type { AnalysisRecord, Classification, EditorialCase, ReviewDecision, Sector } from '@/lib/types';

type Tab = 'overview' | 'review' | 'impact' | 'evaluation' | 'policies';
type FilterSector = Sector | 'All';
const tabs: { id: Tab; label: string; sub: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', sub: 'Workspace', icon: LayoutDashboard },
  { id: 'review', label: 'Review desk', sub: '20 cases', icon: FileSearch },
  { id: 'impact', label: 'Impact map', sub: '4 changes', icon: GitBranch },
  { id: 'evaluation', label: 'Evaluation lab', sub: 'Benchmark', icon: Activity },
  { id: 'policies', label: 'Policy library', sub: '7 rules', icon: ShieldCheck },
];
const sectors: FilterSector[] = ['All', 'Health', 'Legal', 'Travel', 'Media'];
const formatPct = (v: number | null) => v === null ? 'n/a' : `${Math.round(v * 100)}%`;
const labelPriority = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);
const timeStamp = () => new Date().toISOString();

function Chip({ children, tone = 'slate' }: { children: React.ReactNode; tone?: string }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}
function ClassChip({ value }: { value: Classification }) {
  const tones: Record<Classification,string> = { supported: 'green', contradicted: 'red', insufficient_evidence: 'amber', policy_issue: 'purple' };
  return <Chip tone={tones[value]}>{className(value)}</Chip>;
}
function PriorityChip({ value }: { value: string }) {
  return <Chip tone={value === 'high' || value === 'critical' ? 'red' : value === 'medium' ? 'amber' : 'slate'}>{labelPriority(value)}</Chip>;
}
function SectionHeading({ eyebrow, title, description, right }: { eyebrow: string; title: string; description: string; right?: React.ReactNode }) {
  return <div className="section-head"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="section-description">{description}</p></div>{right && <div className="section-head-right">{right}</div>}</div>;
}
function Metric({ label, value, detail, icon: Icon, tone = 'blue' }: { label: string; value: string; detail: string; icon: typeof Activity; tone?: string }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon tone-${tone}`}><Icon size={16}/></span></div><strong>{value}</strong><small>{detail}</small></div>;
}
function Pair({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="pair"><div className="pair-label">{title}</div><div>{children}</div></div>;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>('overview');
  const [sector, setSector] = useState<FilterSector>('All');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState('CS-001');
  const [activeUpdate, setActiveUpdate] = useState(updates[0].id);
  const [openMobile, setOpenMobile] = useState(false);
  const [showGold, setShowGold] = useState(false);
  const [status, setStatus] = useState<{ configured: boolean; model: string; owner?: boolean } | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showIntake, setShowIntake] = useState(false);
  const [customSector, setCustomSector] = useState<Sector>('Travel');
  const [customTitle, setCustomTitle] = useState('Fictional updated ferry schedule');
  const [customContent, setCustomContent] = useState('The regional ferry departs every day at 8 PM.');
  const [customSource, setCustomSource] = useState('The regional ferry runs daily, with the final departure at 6 PM.');
  const [customResult, setCustomResult] = useState<AnalysisRecord | null>(null);
  const [live, setLive] = useState<Record<string, AnalysisRecord>>({});
  const [decisions, setDecisions] = useState<Record<string, ReviewDecision>>({});
  const [benchmarkSource, setBenchmarkSource] = useState<'demo' | 'live'>('demo');
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [impactDecision, setImpactDecision] = useState<Record<string, ReviewDecision>>({});
  const baseline = useMemo(() => cases.map(demoAnalysis), []);
  const allRecords = useMemo(() => cases.map(c => live[c.id] || demoAnalysis(c)), [live]);
  const records = benchmarkSource === 'demo' ? baseline : Object.values(live);
  const score = scoreRecords(records);
  const baselineScore = useMemo(() => scoreRecords(baseline), [baseline]);
  const selected = cases.find(c => c.id === selectedId) || cases[0];
  const source = sourceById(selected.sourceId)!;
  const result = live[selected.id] || demoAnalysis(selected);
  const currentUpdate = updates.find(u => u.id === activeUpdate) || updates[0];
  const impactMatches = impactForUpdate(currentUpdate);
  const linkedCount = impactMatches.filter(m => m.basis === 'linked_source').length;
  const filtered = cases.filter(c => (sector === 'All' || c.sector === sector) && (`${c.title} ${c.content} ${c.id} ${c.property}`).toLowerCase().includes(q.toLowerCase()));
  const reviewCount = Object.keys(decisions).length;

  useEffect(() => {
    fetch('/api/status').then(r => r.json()).then(setStatus).catch(() => setStatus({ configured:false, model:'gpt-4.1-mini' }));
    try {
      const v = window.localStorage.getItem('contentsignal-review-v1');
      if (v) setDecisions(JSON.parse(v));
    } catch { /* storage may be blocked */ }
  }, []);
  const saveDecision = (id: string, decision: ReviewDecision) => {
    const next = { ...decisions, [id]: decision };
    setDecisions(next);
    try { window.localStorage.setItem('contentsignal-review-v1', JSON.stringify(next)); } catch { /* no persistent storage */ }
    setFeedback(`Case ${id}: reviewer marked ${decision}. Saved in this browser.`);
  };
  const navigate = (t: Tab) => { setTab(t); setOpenMobile(false); setFeedback(''); };
  const viewCase = (id: string) => { setSelectedId(id); navigate('review'); };

  const analyzeOne = useCallback(async (id: string): Promise<boolean> => {
    const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId: id }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Analysis failed.');
    if (data.mode !== 'live' || data.caseId !== id) throw new Error('Unexpected API response.');
    setLive(old => ({ ...old, [id]: data as AnalysisRecord }));
    return true;
  }, []);
  const runOne = async (id: string) => {
    if (running) return;
    setRunning(id); setFeedback('');
    try { await analyzeOne(id); setFeedback(`Live model analysis finished for ${id}.`); }
    catch (err) { setFeedback(err instanceof Error ? err.message : 'Model request failed.'); }
    finally { setRunning(null); }
  };
  const runCustom = async () => {
    if (running || !status?.configured) return;
    setRunning('custom'); setFeedback(''); setCustomResult(null);
    try {
      const response = await fetch('/api/analyze', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({custom:{sector:customSector,title:customTitle,content:customContent,sourceExcerpt:customSource}}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed.');
      setCustomResult(data as AnalysisRecord);
    } catch(err) { setFeedback(err instanceof Error ? err.message : 'Custom analysis failed.'); }
    finally { setRunning(null); }
  };
  const runBatch = async () => {
    if (running) return;
    if (!status?.configured) { setFeedback('No API key configured. Copy .env.example to .env.local and set OPENAI_API_KEY to run the live benchmark.'); return; }
    const confirmed = window.confirm('Run 20 separate OpenAI API calls? This incurs API usage charges and may take time.');
    if (!confirmed) return;
    setRunning('batch'); setFeedback(''); setBatchProgress({ current:0, total:cases.length });
    let completed = 0; const errors: string[] = [];
    for (const item of cases) {
      try { await analyzeOne(item.id); completed += 1; }
      catch (err) { errors.push(`${item.id}: ${err instanceof Error ? err.message : 'Error'}`); }
      setBatchProgress(old => ({ ...old, current: old.current + 1 }));
    }
    setBenchmarkSource('live');
    setRunning(null);
    setFeedback(`Live batch finished: ${completed}/${cases.length} completed.${errors.length ? ` ${errors.length} failed; retry individual cases.` : ''}`);
  };

  return <div className="shell">
    <aside className={`sidebar ${openMobile ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><SignalMark/></div><div><div className="brand-name">Content<span>Signal</span></div><div className="brand-sub">EDITORIAL INTELLIGENCE</div></div></div>
      <div className="sidebar-heading">WORKSPACE</div>
      <nav className="navigation" aria-label="Primary navigation">
        {tabs.map((item, index) => <button key={item.id} className={`nav-item ${tab===item.id ? 'active' : ''}`} aria-current={tab===item.id ? 'page' : undefined} onClick={()=>navigate(item.id)}><span className="nav-icon-wrap" style={{ animationDelay: `${120 + index * 65}ms` }}><WorkspaceIcon section={item.id}/></span><span>{item.label}</span>{tab===item.id && <span className="nav-dot"/>}</button>)}
      </nav>
      <div className="sidebar-spacer"/>
      <div className="sidebar-bottom">
        <div className="sidebar-heading">SYSTEM STATUS</div>
        <div className="status-line" role="status"><span className={`status-pulse ${status?.configured ? 'online' : ''}`}/><span>{status === null ? 'Checking API connection' : status.configured ? 'OpenAI configured' : 'Demo mode ready'}</span></div>
        <div className="sidebar-fine">{status === null ? 'Connecting to this workspace…' : status.configured ? `${status.model} · server-side only` : 'Public demo · live testing is owner-only'}</div>
        <a className="owner-access-link" href="/owner">{status?.owner ? 'Manage owner access' : 'Owner access'} <ArrowUpRight size={12}/></a>
        <div className="synth-note"><ShieldCheck size={16}/><span>100% synthetic content<br/>No real user or patient records</span></div>
      </div>
    </aside>

    {openMobile && <button className="scrim" onClick={()=>setOpenMobile(false)} aria-label="Close navigation"/>}
    <div className="main-column">
      <header className="topbar"><div className="top-left"><button className="mobile-menu icon-button" onClick={()=>setOpenMobile(true)} aria-label="Open navigation"><Menu size={20}/></button><span className="breadcrumb">Workspace</span><ChevronRight size={15} className="muted"/><span className="breadcrumb-current">{tabs.find(t => t.id===tab)?.label}</span></div><div className="top-right"><span className="top-data"><span className="status-pulse online"/> Synthetic dataset</span><Chip tone="blue">Portfolio prototype</Chip></div></header>
      <main className="content">
        {tab==='overview' && <>
          <SectionHeading eyebrow="EDITORIAL INTELLIGENCE PLATFORM" title="Accuracy at portfolio scale." description="Trace claims to evidence, surface source changes, and test AI reliability before editorial decisions are made." right={<button className="button primary" onClick={()=>navigate('review')}>Open review desk <ArrowRight size={16}/></button>}/>
          <div className="metrics-grid">
            <Metric label="Editorial cases" value={String(cases.length)} detail="Four publishing verticals" icon={FileText}/>
            <Metric label="Source updates" value={String(updates.length).padStart(2,'0')} detail="Versioned reference changes" icon={RefreshCw} tone="violet"/>
            <Metric label="Review decisions" value={`${reviewCount} / ${cases.length}`} detail="Local reviewer actions" icon={ClipboardCheck} tone="amber"/>
            <Metric label="Demo classification score" value={formatPct(baselineScore.accuracy)} detail="Authored baseline, not model performance" icon={Target} tone="green"/>
          </div>
          <div className="two-columns dashboard-panels">
            <section className="panel"><div className="panel-header"><div><h2>Review pipeline</h2><p>From a claim to an accountable editorial decision</p></div><Chip tone="slate">5 stages</Chip></div>
              <div className="pipeline">
                {[{n:'01',t:'Intake',d:'Article and reference',i:FileText},{n:'02',t:'Extract',d:'Checkable claim',i:Search},{n:'03',t:'Compare',d:'Rules + AI',i:Code2},{n:'04',t:'Evaluate',d:'Gold labels',i:Activity},{n:'05',t:'Review',d:'Human decision',i:CheckCheck}].map((s,i)=><div className="stage" key={s.n}><div className="stage-icon"><s.i size={18}/></div><div className="stage-name">{s.t}</div><div className="stage-detail">{s.d}</div>{i!==4&&<ArrowRight className="stage-arrow" size={15}/>}</div>)}
              </div>
              <div className="pipeline-foot"><span><ShieldCheck size={17}/> Source excerpts required for evidence claims</span><span><Network size={17}/> Humans decide publication outcomes</span></div>
            </section>
            <section className="panel"><div className="panel-header"><div><h2>Portfolio coverage</h2><p>Fictional properties and editorial records</p></div></div>
              <div className="portfolio-list">{(['Health','Legal','Travel','Media'] as Sector[]).map((s,i)=>{const icons=[Activity,BookOpen,Layers3,RadioTower];const Icon=icons[i];return <button className="portfolio-row" key={s} onClick={()=>{setSector(s);navigate('review');}}><div className={`portfolio-icon tone-${['blue','violet','green','amber'][i]}`}><Icon size={17}/></div><div><strong>{s}</strong><span>{cases.filter(c=>c.sector===s)[0].property}</span></div><b>{cases.filter(c=>c.sector===s).length} cases</b><ChevronRight size={16}/></button>;})}</div>
            </section>
          </div>
          <div className="two-columns">
            <section className="panel"><div className="panel-header"><div><h2>Recent reference changes</h2><p>Changes that may affect published content</p></div><button className="text-button" onClick={()=>navigate('impact')}>View impact map <ArrowRight size={15}/></button></div>
              <div className="list-rows">{updates.slice(0,3).map(u=><button key={u.id} className="change-row" onClick={()=>{setActiveUpdate(u.id);navigate('impact')}}><div className="small-icon"><GitBranch size={17}/></div><div><strong>{u.title}</strong><small>{u.id} · {u.sector} · {u.date}</small></div><Chip tone="amber">{impactForUpdate(u).length} candidates</Chip><ChevronRight size={15}/></button>)}</div>
            </section>
            <section className="panel featured-panel"><div className="panel-header"><div><h2>Evaluation comes first</h2><p>An inspectable test bench, not a black box</p></div><div className="featured-spark"><Sparkles size={19}/></div></div><div className="big-score">{formatPct(baselineScore.accuracy)} <span>demo agreement</span></div><div className="progress-track"><div className="progress-fill" style={{width:formatPct(baselineScore.accuracy)}}/></div><p className="feature-copy">The authored baseline intentionally makes errors. Switch to live model runs to measure accuracy, high-priority recall, abstention, and evidence-quote validity.</p><button className="button subtle" onClick={()=>navigate('evaluation')}>Explore evaluation <ArrowUpRight size={15}/></button></section>
          </div>
          <div className="footnote"><CircleHelp size={15}/> This is an independent portfolio prototype. Fictional sources, policies, brands, and editorial cases do not represent actual Internet Brands data.</div>
        </>}

        {tab==='review' && <>
          <SectionHeading eyebrow="WORKFLOW 01 / EDITORIAL REVIEW" title="Evidence review desk" description="Inspect article claims alongside source excerpts and apply explicit editorial rules. Model outputs are advisory." right={<div className="head-actions"><Chip tone={status?.configured?'green':'amber'}>{status?.configured ? 'Live API available' : 'Demo baseline'}</Chip><button className="button primary" onClick={()=>setShowIntake(!showIntake)}><FileText size={15}/> {showIntake?'Close intake':'New test intake'}</button></div>}/>
          {showIntake&&<section className="panel custom-intake"><div className="panel-header"><div><h2>Ad hoc source comparison</h2><p>Paste only fictional or properly cleared text. This is not part of the labeled benchmark.</p></div><Chip tone="purple">Experiment</Chip></div><div className="intake-form"><label>Vertical<select value={customSector} onChange={e=>setCustomSector(e.target.value as Sector)}>{(['Health','Legal','Travel','Media'] as Sector[]).map(x=><option key={x}>{x}</option>)}</select></label><label>Article title<input value={customTitle} maxLength={160} onChange={e=>setCustomTitle(e.target.value)}/></label><label>Article claim<textarea value={customContent} maxLength={3000} rows={3} onChange={e=>setCustomContent(e.target.value)}/></label><label>Reference source excerpt<textarea value={customSource} maxLength={3000} rows={3} onChange={e=>setCustomSource(e.target.value)}/></label><div className="intake-submit"><span>{status?.configured ? "Submissions go to the configured OpenAI API; don't enter confidential or personal data." : 'Live tests are owner-only. Explore the demo cases without signing in.'}</span><button disabled={!status?.configured||Boolean(running)||customContent.trim().length<15||customSource.trim().length<15} className="button primary" onClick={runCustom}>{running==='custom'?<LoaderCircle size={16} className="spin"/>:<Sparkles size={16}/>} Analyze new submission</button></div>{customResult&&<div className="custom-output"><div><strong>Live result</strong><ClassChip value={customResult.analysis.classification}/><PriorityChip value={customResult.analysis.priority}/><Chip tone={customResult.evidenceVerified?'green':'red'}>{customResult.evidenceVerified?'Valid exact quote':'Invalid / missing quote'}</Chip></div><p>{customResult.analysis.rationale}</p><blockquote>{customResult.analysis.evidenceQuote||'No quoted evidence supplied'}</blockquote><small>{customResult.analysis.recommendedAction}</small></div>}</div></section>}
          <div className="review-layout">
            <section className="panel queue-panel"><div className="panel-header"><div><h2>Incoming queue</h2><p>{filtered.length} of {cases.length} records</p></div><Filter size={17} className="muted"/></div><label className="search-box"><Search size={16}/><input aria-label="Search cases" placeholder="Search by claim or ID…" value={q} onChange={e=>setQ(e.target.value)}/></label>
              <div className="filters">{sectors.map(s=><button key={s} className={`filter-button ${sector===s ? 'selected' : ''}`} onClick={()=>setSector(s)}>{s}</button>)}</div>
              <div className="case-list">{filtered.length===0?<p className="empty-state">No cases match this filter.</p>:filtered.map(c=><button key={c.id} className={`case-item ${selected.id===c.id?'case-active':''}`} onClick={()=>setSelectedId(c.id)}><div className="case-top"><span className="case-id">{c.id}</span><span className="case-sector">{c.sector}</span>{decisions[c.id]&&<CircleCheck size={14} className="green-icon"/>}</div><strong>{c.title}</strong><span className="case-excerpt">{c.content}</span><div className="case-bottom"><span>{c.intake}</span><ChevronRight size={15}/></div></button>)}</div>
            </section>
            <div className="review-detail">
              <section className="panel"><div className="panel-header"><div><p className="eyebrow">{selected.property} / {selected.id}</p><h2 className="detail-title">{selected.title}</h2></div><Chip tone="slate">{selected.intake}</Chip></div>
                <div className="review-grid">
                  <div className="document-panel"><div className="document-header"><FileText size={16}/><strong>Article / submission</strong></div><div className="document-text">{selected.content}</div><div className="document-meta">Published / submitted: {selected.published}<br/>Owner: {selected.owner}</div></div>
                  <div className="document-panel evidence-panel"><div className="document-header"><BookOpen size={16}/><strong>Linked source evidence</strong></div><div className="document-text">“{source.excerpt}”</div><div className="document-meta">{source.id} · {source.title}<br/>Version {source.version} · Synthetic, unverified</div></div>
                </div>
                <div className="structural-checks"><div className="subhead"><ShieldCheck size={16}/> Deterministic document checks</div><div className="checks-grid">{ruleChecks(selected).map(check=><div key={check.label} className="check"><CircleCheck size={15}/><div><strong>{check.label}</strong><small>{check.detail}</small></div></div>)}</div><p className="micro-copy">Passing these checks confirms fixture completeness, not that editorial claims are true.</p></div>
              </section>
              <section className="panel"><div className="panel-header"><div><h2>Evidence analysis</h2><p>{result.mode==='live'?'Structured output from the configured API':'Prewritten baseline prediction — no AI call'}</p></div><div className="panel-header-actions"><Chip tone={result.mode==='live'?'green':'amber'}>{result.mode==='live'?'Live model':'Synthetic baseline'}</Chip><button disabled={Boolean(running)||!status?.configured} className="button small primary" onClick={()=>runOne(selected.id)}>{running===selected.id?<LoaderCircle size={15} className="spin"/>:<Sparkles size={15}/>} {running===selected.id?'Analyzing…':'Analyze with AI'}</button></div></div>
                <div className="analysis-top"><ClassChip value={result.analysis.classification}/><PriorityChip value={result.analysis.priority}/>{result.evidenceVerified?<span className="evidence-ok"><Check size={14}/> Exact quote matched</span>:<span className="evidence-bad"><CircleAlert size={14}/> Evidence check failed</span>}</div>
                <Pair title="Rationale"><p className="analysis-text">{result.analysis.rationale}</p></Pair>
                <Pair title="Quoted source passage"><div className="quote-block">{result.analysis.evidenceQuote ? `“${result.analysis.evidenceQuote}”` : 'No direct source quote supplied. The system must abstain or seek further evidence.'}</div></Pair>
                <Pair title="Suggested editorial action"><p className="analysis-text">{result.analysis.recommendedAction}</p></Pair>
                <div className="policy-line"><ShieldCheck size={15}/> Policies referenced: {result.analysis.appliedPolicyIds.join(', ')}</div>
                <div className="review-actions"><div><strong>Reviewer decision</strong><span>Advisory system — no automatic publication or edits</span></div><div className="action-group"><button className={`button small ${decisions[selected.id]==='confirmed'?'active-green':'outline'}`} onClick={()=>saveDecision(selected.id,'confirmed')}><Check size={15}/> Confirm</button><button className={`button small ${decisions[selected.id]==='dismissed'?'active-red':'outline'}`} onClick={()=>saveDecision(selected.id,'dismissed')}><X size={15}/> Dismiss</button><button className={`button small ${decisions[selected.id]==='investigate'?'active-amber':'outline'}`} onClick={()=>saveDecision(selected.id,'investigate')}><Search size={15}/> Investigate</button></div></div>
              </section>
            </div>
          </div>
        </>}

        {tab==='impact' && <>
          <SectionHeading eyebrow="WORKFLOW 02 / DOCUMENT DEPENDENCIES" title="Cross-portfolio impact map" description="When a reference changes, surface known linked articles and weaker keyword candidates without confusing relevance with factual impact." right={<Chip tone="violet">Version-aware</Chip>}/>
          <div className="impact-layout"><section className="panel"><div className="panel-header"><div><h2>Source change feed</h2><p>Select a version update</p></div><RefreshCw size={17} className="muted"/></div><div className="updates-list">{updates.map(u=><button key={u.id} className={`update-select ${activeUpdate===u.id?'selected':''}`} onClick={()=>setActiveUpdate(u.id)}><div className="update-row-top"><span className="case-id">{u.id}</span><Chip tone="slate">{u.sector}</Chip></div><strong>{u.title}</strong><small>{u.date} · v{u.previousVersion} → v{u.updatedVersion}</small></button>)}</div></section>
            <div className="impact-main"><section className="panel"><div className="panel-header"><div><p className="eyebrow">{currentUpdate.id} · {currentUpdate.sector.toUpperCase()}</p><h2>{currentUpdate.title}</h2><p className="panel-lede">{currentUpdate.date} · {currentUpdate.sourceId}</p></div><Chip tone="blue">Source changed</Chip></div>
              <div className="version-compare"><div className="version-block old-version"><div className="version-head"><span><X size={15}/> Previous version</span><b>v{currentUpdate.previousVersion}</b></div><p>{currentUpdate.previousText}</p></div><div className="version-block new-version"><div className="version-head"><span><Check size={15}/> Updated version</span><b>v{currentUpdate.updatedVersion}</b></div><p>{currentUpdate.updatedText}</p></div></div>
              <div className="terms"><span>Change cues</span>{currentUpdate.changedTerms.map(t=><Chip key={t} tone="slate">{t}</Chip>)}</div>
            </section>
            <div className="impact-flow"><div className="flow-unit"><Database size={17}/><span>Source version</span></div><ArrowRight size={18}/><div className="flow-unit"><Network size={17}/><span>Dependency + keyword scan</span></div><ArrowRight size={18}/><div className="flow-unit"><ListChecks size={17}/><span>Human review queue</span></div></div>
            <section className="panel"><div className="panel-header"><div><h2>Potentially affected content</h2><p>{linkedCount} known linked record{linkedCount!==1?'s':''} · {impactMatches.length-linkedCount} keyword candidate{impactMatches.length-linkedCount!==1?'s':''}</p></div><Chip tone="amber">{impactMatches.length} candidates</Chip></div>
              <div className="impact-items">{impactMatches.map(m=>{const related=cases.find(c=>c.id===m.caseId)!;const key=`${currentUpdate.id}:${m.caseId}`;return <div className="impact-item" key={m.caseId}><div className="impact-item-main"><div className="impact-item-top"><span className="case-id">{m.caseId} · {m.property}</span><Chip tone={m.basis==='linked_source'?'blue':'amber'}>{m.basis==='linked_source'?'Known source link':'Keyword candidate'}</Chip></div><button className="impact-title" onClick={()=>viewCase(m.caseId)}>{m.title} <ArrowUpRight size={15}/></button><p>{related.content}</p><small>Matching cues: {m.matchingTerms.length?m.matchingTerms.join(', '):'Document-source ID relationship'}</small></div><div className="impact-item-actions"><PriorityChip value={m.basis==='linked_source'?'medium':'low'}/><select aria-label={`Impact review for ${m.caseId}`} value={impactDecision[key]||''} onChange={e=>setImpactDecision(prev=>({...prev,[key]:e.target.value as ReviewDecision}))}><option value="">Not reviewed</option><option value="confirmed">Review confirmed</option><option value="dismissed">Not affected</option><option value="investigate">Investigate</option></select></div></div>})}</div>
              <div className="disclaimer"><TriangleAlert size={17}/><p>Dependency mapping does not prove that an article is incorrect. Linked sources are established by fixture IDs; unlinked matches use simple keyword cues and must be independently assessed.</p></div>
            </section></div></div>
        </>}

        {tab==='evaluation' && <>
          <SectionHeading eyebrow="WORKFLOW 03 / QUALITY ASSURANCE" title="Model evaluation lab" description="Compare classifications with a separate labeled benchmark, inspect failures, and enforce source-quote checks." right={<button className="button primary" onClick={runBatch} disabled={Boolean(running)||!status?.configured}>{running==='batch'?<LoaderCircle className="spin" size={16}/>:<Play size={16}/>} {running==='batch'?'Evaluating…':'Run 20 live cases'}</button>}/>
          <div className="evaluation-controls"><div className="segmented"><button className={benchmarkSource==='demo'?'on':''} onClick={()=>setBenchmarkSource('demo')}>Demo baseline</button><button className={benchmarkSource==='live'?'on':''} onClick={()=>setBenchmarkSource('live')}>Live API results ({Object.keys(live).length})</button></div><span>{benchmarkSource==='demo'?'Prewritten predictions, used to demonstrate scoring':status?.configured?`${status.model} · API requests may incur charges`:'Configure OPENAI_API_KEY in .env.local for live tests'}</span></div>
          {running==='batch'&&<div className="batch-status"><LoaderCircle size={17} className="spin"/> Evaluating {batchProgress.current} / {batchProgress.total} test cases sequentially…</div>}
          <div className="metrics-grid"><Metric label="Classification accuracy" value={score.total?formatPct(score.accuracy):'—'} detail={`${score.correct} / ${score.total} matching gold labels`} icon={Target} tone="blue"/><Metric label="High-priority recall" value={formatPct(score.highPriorityRecall)} detail="Actual high-priority cases caught" icon={ShieldAlert} tone="amber"/><Metric label="Evidence validity" value={score.total?formatPct(score.evidenceValidity):'—'} detail="Exact quote exists in source" icon={FileCheck2} tone="green"/><Metric label="Abstention recall" value={formatPct(score.abstentionRecall)} detail="Insufficient cases recognized" icon={CircleHelp} tone="violet"/></div>
          <div className="two-columns"><section className="panel"><div className="panel-header"><div><h2>Prediction agreement</h2><p>{benchmarkSource==='demo'?'Authored benchmark example':'Completed live model evaluations'}</p></div><Chip tone={benchmarkSource==='demo'?'amber':'green'}>{benchmarkSource==='demo'?'Not model performance':'Live model output'}</Chip></div>
            <div className="accuracy-viz"><div className="accuracy-number">{score.total?formatPct(score.accuracy):'No results'}<span>matching labeled outcomes</span></div><div className="accuracy-track"><div className="accurate" style={{width:formatPct(score.accuracy)}}/><div className="inaccurate" style={{width:formatPct(score.total?1-score.accuracy:0)}}/></div><div className="legend"><span><i className="legend-good"/> Correct: {score.correct}</span><span><i className="legend-bad"/> Incorrect: {score.total-score.correct}</span></div></div>
            <div className="evaluation-foot"><div>False-positive rate <b>{formatPct(score.falsePositiveRate)}</b></div><div>Priority matches <b>{score.priorityMatches} / {score.total}</b></div></div>
          </section><section className="panel"><div className="panel-header"><div><h2>Evaluation protocol</h2><p>Why this benchmark is auditable</p></div><Code2 size={17} className="muted"/></div><div className="protocol-list">{[{n:'01',t:'Independent gold labels',d:'Expected classifications and priorities are authored separately from model predictions.'},{n:'02',t:'Structured model response',d:'Zod validates class, priority, rationale, evidence quote, and selected policy IDs.'},{n:'03',t:'Deterministic comparison',d:'Classification, priority, and quote-substring validity are scored in code.'},{n:'04',t:'Failure review',d:'Missed issues and unsupported citations are surfaced for an analyst.'}].map(p=><div className="protocol-item" key={p.n}><span>{p.n}</span><div><strong>{p.t}</strong><p>{p.d}</p></div></div>)}</div></section></div>
          <section className="panel"><div className="panel-header"><div><h2>Case-by-case evaluation</h2><p>Inspect prediction disagreements and citation validation</p></div><button className="button small outline" onClick={()=>setShowGold(!showGold)}>{showGold?'Hide':'Show'} gold labels <ChevronDown size={15}/></button></div>
            <div className="table-scroll"><table className="evaluation-table"><thead><tr><th>Case</th><th>Vertical</th><th>Prediction</th><th>Match</th><th>Evidence</th>{showGold&&<th>Gold label</th>}<th>Open</th></tr></thead><tbody>{records.length ? records.map(r=>{const c=cases.find(x=>x.id===r.caseId)!;const match=r.analysis.classification===c.gold;return <tr key={c.id}><td><strong>{c.id}</strong><small>{c.title}</small></td><td>{c.sector}</td><td><ClassChip value={r.analysis.classification}/></td><td>{match?<span className="table-success"><Check size={14}/> Match</span>:<span className="table-error"><X size={14}/> Mismatch</span>}</td><td>{r.evidenceVerified?<span className="table-success"><Check size={14}/> Valid quote</span>:<span className="table-error"><X size={14}/> Invalid quote</span>}</td>{showGold&&<td><ClassChip value={c.gold}/></td>}<td><button className="round-button" onClick={()=>viewCase(c.id)} aria-label={`Open ${c.id}`}><ArrowUpRight size={15}/></button></td></tr>;}) : <tr><td colSpan={showGold?7:6}><p className="empty-state">No live results yet. Run an individual case from Review desk or choose the complete evaluation.</p></td></tr>}</tbody></table></div>
          </section>
          <div className="footnote"><CircleAlert size={15}/> This is a small synthetic benchmark, not evidence of clinical, legal, or editorial production readiness. One dataset cannot establish real-world accuracy or robustness.</div>
        </>}

        {tab==='policies' && <>
          <SectionHeading eyebrow="GOVERNANCE / REFERENCE RULES" title="Editorial policy library" description="Explicit fictional rules control prioritization and define what the model may claim. Real deployments would require approved domain-specific policies." right={<Chip tone="blue">7 policy fixtures</Chip>}/>
          <div className="policy-intro"><ShieldCheck size={23}/><div><strong>Policy-driven, not policy-inventing</strong><p>The model receives the relevant policies alongside a source excerpt. It cannot create new policies or silently treat its own response as authority. These rules are examples, not actual Internet Brands policies.</p></div></div>
          <div className="policy-grid">{policies.map(p=><article className="panel policy-card" key={p.id}><div className="policy-top"><span className="case-id">{p.id}</span><Chip tone={p.sector==='Health'?'blue':p.sector==='Legal'?'purple':p.sector==='Travel'?'green':p.sector==='Media'?'amber':'slate'}>{p.sector}</Chip></div><h2>{p.title}</h2><p>{p.requirement}</p><div className="policy-rationale"><span>Why it matters</span>{p.rationale}</div></article>)}</div>
          <div className="footnote"><BookOpen size={15}/> To use this approach in a real organization, replace these fictional rules with verified, versioned, organization-approved policies and an established editorial escalation process.</div>
        </>}
      </main>
      {feedback&&<div className="toast" role="status"><CircleHelp size={18}/><span>{feedback}</span><button onClick={()=>setFeedback('')} aria-label="Dismiss notification"><X size={16}/></button></div>}
    </div>
  </div>;
}
