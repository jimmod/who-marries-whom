import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import data from './demo-data.json';
import './style.css';

type Result = { occupation: string; gender: string; count: number; percent: number; id: number };
const occupations = [...new Set(data.profiles.map(p => p.occupation))].filter(o => o !== 'No recorded occupation');
const colors = ['#24685a', '#468f7c', '#76a79a', '#a4c2a8', '#b4be71', '#b69a65', '#c8ceca'];
const fmt = (n: number) => `${n.toFixed(1)}%`;

function resultsFor(occupation: string, gender: string): Result[] {
  const selected = data.profiles.findIndex(p => p.occupation === occupation && p.gender === gender);
  const counts = new Map<number, number>();
  for (const pair of data.pairs) {
    // Each matching person is counted once; two matching spouses contribute two people.
    if (pair.a === selected) counts.set(pair.b, (counts.get(pair.b) || 0) + pair.weightedCount);
    if (pair.b === selected) counts.set(pair.a, (counts.get(pair.a) || 0) + pair.weightedCount);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return [...counts].map(([id, count]) => ({ ...data.profiles[id], id, count, percent: count / total * 100 })).sort((a, b) => b.count - a.count || a.id - b.id);
}

function App() {
  const [occupation, setOccupation] = useState('Teacher');
  const [gender, setGender] = useState('Woman');
  const [view, setView] = useState<'connections' | 'table'>('connections');
  const [active, setActive] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const results = resultsFor(occupation, gender);
  const top = results.slice(0, 6);
  const remainder = results.slice(6).reduce((sum, r) => sum + r.percent, 0);
  const graph = [...top, { occupation: 'All other combinations', gender: 'Includes no recorded occupation', percent: remainder, id: -1, count: 0 }];
  const change = () => { setActive(null); setExpanded(false); };

  return <>
    <header className="header"><a className="brand" href="/" aria-label="Who married who home"><span className="brandmark">↗</span>who married who<span className="brand-dot">?</span></a><span className="country"><span aria-hidden="true">✳</span> The Canada edition</span><a className="about-link" href="#methodology">About the data <span aria-hidden="true">↗</span></a></header>
    <main>
      <div className="intro"><div><div className="eyebrow">OCCUPATIONS, CONNECTED</div><h1>Who do we marry<span>?</span></h1><p>Explore the connections between what people do<br className="desktop-break"/> and who they share their lives with.</p></div><div className="edition">An exploration of<br/><strong>work & togetherness.</strong><span>CANADA / PROTOTYPE 01</span></div></div>
      <div className="demo-notice"><span className="demo-pill">DEMO DATA</span><p>This is a working prototype. All percentages are illustrative, not Canadian census findings.</p></div>
      <section className="explorer" aria-label="Explore spouse occupations">
        <div className="filters"><div className="filter-intro"><span className="step">01</span><div><strong>Start with a person</strong><span>Choose a gender and occupation</span></div></div><label>Gender<select value={gender} onChange={e => {setGender(e.target.value); change();}}><option>Woman</option><option>Man</option><option>Non-binary</option></select></label><label className="occupation-select">Occupation<select value={occupation} onChange={e => {setOccupation(e.target.value); change();}}>{occupations.map(o => <option key={o}>{o}</option>)}</select></label><div className="scope"><span>EXPLORING</span><strong>Married couples</strong><small>Canada-wide · Illustrative</small></div></div>
        <div className="results-heading"><div><div className="eyebrow">FOLLOW THE CONNECTIONS</div><h2>{gender === 'Woman' ? 'Women' : gender === 'Man' ? 'Men' : 'Non-binary people'} · <span>{occupation}</span></h2><p>Spouses grouped by occupation and gender.</p></div><div className="view-switch" role="group" aria-label="Results view"><button aria-pressed={view === 'connections'} onClick={() => setView('connections')}>⑂ Connections</button><button aria-pressed={view === 'table'} onClick={() => setView('table')}>☷ Full list</button></div></div>
        {view === 'connections' ? <div className="results-grid"><div className="graph-panel"><div className="graph-topline"><span>SELECTED PERSON</span><span>SPOUSE OCCUPATION & GENDER</span></div><div className="graph-scroll"><svg viewBox="0 0 720 490" role="img" aria-label={`Illustrative spouse connections for ${gender}, ${occupation}. The same percentages are available in the ranked list.`}>
          <defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="#d8dfda"/></pattern></defs><rect width="720" height="490" fill="url(#dots)"/>
          {graph.map((r, i) => { const y = 40 + i * 67; return <g key={r.id} opacity={active === null || active === r.id ? 1 : 0.2}><path d={`M 168 239 C 325 239, 290 ${y}, 439 ${y}`} fill="none" stroke={colors[i]} strokeOpacity="0.45" strokeWidth={Math.max(3, r.percent * 0.55)} /><circle cx="440" cy={y} r="7" fill={colors[i]}/><text x="461" y={y - 5} className="node-title">{r.occupation}</text><text x="461" y={y + 14} className="node-subtitle">{r.gender} · {fmt(r.percent)}</text></g>; })}
          <circle cx="137" cy="239" r="47" fill="#e9efd9"/><circle cx="137" cy="239" r="34" fill="#173e34"/><text x="137" y="248" textAnchor="middle" fontSize="26" fill="#d6ee91">◎</text><text x="137" y="307" textAnchor="middle" className="source-title">{occupation}</text><text x="137" y="329" textAnchor="middle" className="node-subtitle">{gender}</text>
        </svg></div><div className="graph-foot"><span><i/> Thicker connections represent larger shares</span><span>Top 6 + all remaining combinations</span></div></div>
        <aside className="ranking"><div className="ranking-title"><h3>Most common connections</h3><span>DEMO</span></div><p>Share of selected married people</p><ol>{top.map((r, i) => <li key={r.id}><button className={active === r.id ? 'rank-row active' : 'rank-row'} onMouseEnter={() => setActive(r.id)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(r.id)} onBlur={() => setActive(null)} onClick={() => setActive(active === r.id ? null : r.id)} aria-label={`Highlight ${r.occupation}, ${r.gender}, ${fmt(r.percent)}`}><span className="rank-number">0{i + 1}</span><span className="rank-content"><strong>{r.occupation}</strong><small>{r.gender}</small><span className="bar-track"><span style={{width: `${r.percent / top[0].percent * 100}%`, background: colors[i]}}/></span></span><span className="percentage">{fmt(r.percent)}</span></button></li>)}</ol><button className="text-button" onClick={() => setView('table')}>See all {results.length} combinations <span>↗</span></button></aside></div> : <div className="table-wrap"><table><caption className="sr-only">Illustrative spouse distribution for {gender}, {occupation}</caption><thead><tr><th scope="col">Spouse occupation</th><th scope="col">Spouse gender</th><th scope="col">Share</th></tr></thead><tbody>{(expanded ? results : results.slice(0, 12)).map(r => <tr key={r.id}><td>{r.occupation}</td><td>{r.gender}</td><td><span className="table-bar" style={{width: `${r.percent / results[0].percent * 80}px`}}/>{fmt(r.percent)}</td></tr>)}</tbody></table><button className="text-button" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show fewer' : `Show all ${results.length} combinations`} <span>{expanded ? '−' : '+'}</span></button></div>}
        <div className="denominator"><span aria-hidden="true">ⓘ</span><p>Percentages include all spouses of the selected group, including those with no recorded occupation. Rounded values may not total exactly 100%.</p></div>
      </section>
      <section id="methodology" className="methodology"><div><div className="eyebrow">THE STORY BEHIND THE NUMBERS</div><h2>Connections, with context.</h2><p>This prototype demonstrates the experience.<br/>The real story starts with verified data.</p></div><div className="method-copy"><details open><summary>Where do these numbers come from?</summary><p>For now, a local, synthetic dataset created solely to demonstrate the interface. It contains no real people and supports no conclusions about marriage in Canada. The demo deliberately weights woman–man pairings more heavily than other pairings. These weights are arbitrary assumptions, not measured marriage rates. Gender options are illustrative, not a claim about available census categories. Spouse genders do not identify sexual orientation.</p></details><details><summary>How will census data be used?</summary><p>The intended source is Statistics Canada’s <a href="https://www150.statcan.gc.ca/n1/en/catalogue/98M0001X2021002" target="_blank" rel="noreferrer">2021 Census Hierarchical Public Use Microdata File</a>. Spouse linkage, occupation detail, weights and publication rules still need verification. If insufficient, a custom tabulation will be needed. Only approved aggregated results would be served by this website.</p></details><details><summary>What would a percentage mean?</summary><p>For each selected gender and occupation: weighted people whose spouse has a particular occupation and gender, divided by all eligible married people in the selected group. Matching spouses are counted in both directions, and each person is counted once. This describes couples living together at the census, not occupations at the time of marriage or predictions about future partners.</p></details></div></section>
      <footer><span>who married who? <span className="footer-muted">/ Canada</span></span><span>An independent prototype. Not affiliated with Statistics Canada.</span></footer>
    </main>
  </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
