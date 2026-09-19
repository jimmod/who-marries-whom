import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getSelection, metadata, occupations, type Estimate } from './data';
import './style.css';

const colors = ['#24685a', '#468f7c', '#76a79a', '#a4c2a8', '#b4be71', '#b69a65', '#c8ceca'];
const fmt = (n: number) => `${n.toFixed(1)}%`;
const interval = (r: Estimate) => `${fmt(r.lower)}–${fmt(r.upper)}`;
function wrap(text: string, width = 28) {
  const lines: string[] = [];
  for (const word of text.split(' ')) {
    if (!lines.length || lines[lines.length - 1].length + word.length + 1 > width) lines.push(word);
    else lines[lines.length - 1] += ` ${word}`;
  }
  return lines;
}

function App() {
  const [noc, setNoc] = useState('4');
  const [gender, setGender] = useState('1');
  const [view, setView] = useState<'connections' | 'table'>('connections');
  const [active, setActive] = useState<string | null>(null);
  const { profile, selection, rows } = getSelection(gender, noc);
  const top = rows.slice(0, 6);
  const remainder = rows.slice(6).reduce((sum, r) => sum + r.percent, 0) + (selection.pooled?.percent || 0);
  const graph = [...top.map(r => ({ ...r, subtitle: r.gender })), ...(remainder > 0 ? [{
    id: 'other', occupation: selection.hasUnreportedRemainder ? 'Other reported combinations' : 'All other combinations',
    subtitle: 'Grouped occupations & genders', percent: remainder,
  }] : [])];
  const change = () => setActive(null);

  return <>
    <header className="header">
      <a className="brand" href="/" aria-label="Who married who home"><span className="brandmark">↗</span>who married who<span className="brand-dot">?</span></a>
      <span className="country">The Canada edition</span>
      <a className="about-link" href="#methodology">About the data <span aria-hidden="true">↗</span></a>
    </header>
    <main>
      <div className="intro">
        <div><div className="eyebrow">OCCUPATIONS, CONNECTED</div><h1>Who do we marry<span>?</span></h1><p>Explore the connections between occupation groups<br className="desktop-break"/> among married couples living together in Canada.</p></div>
        <div className="edition">An exploration of<br/><strong>work & togetherness.</strong><span>CANADA / 2021 CENSUS</span></div>
      </div>
      <div className="demo-notice census-notice"><span className="demo-pill">2021 CENSUS</span><p>Real, weighted sample estimates. This public file supports broad occupation groups, not individual job titles. <a href="#methodology">Understand the limits ↗</a></p></div>
      <section className="explorer" aria-label="Explore spouse occupation groups">
        <div className="filters">
          <div className="filter-intro"><span className="step">01</span><div><strong>Start with a person</strong><span>Choose a gender and occupation group</span></div></div>
          <label>Gender<select value={gender} onChange={e => {setGender(e.target.value); change();}}><option value="1">Women+</option><option value="2">Men+</option></select></label>
          <label className="occupation-select">Occupation group<select value={noc} onChange={e => {setNoc(e.target.value); change();}}>{occupations.map(o => <option value={o.noc} key={o.noc}>{o.occupation}</option>)}</select></label>
          <div className="scope"><span>EXPLORING</span><strong>Married couples</strong><small>Canada-wide · 2021</small></div>
        </div>
        <div className="category-note">Women+ and Men+ each include some non-binary people. A separate non-binary category is not available in this file.</div>
        <div className="results-heading">
          <div aria-live="polite"><div className="eyebrow">FOLLOW THE CONNECTIONS</div><h2>{profile.gender} · <span>{profile.occupation}</span></h2><p>Spouses with a known occupation group and gender.</p></div>
          <div className="view-switch" role="group" aria-label="Results view"><button aria-pressed={view === 'connections'} onClick={() => setView('connections')}>⑂ Connections</button><button aria-pressed={view === 'table'} onClick={() => setView('table')}>☷ Full list</button></div>
        </div>
        {view === 'connections' ? <div className="results-grid">
          <div className="graph-panel">
            <div className="graph-topline"><span>SELECTED PERSON</span><span>SPOUSE GROUP & GENDER</span></div>
            <div className="graph-scroll"><svg viewBox="0 0 720 510" role="img" aria-label={`2021 spouse occupation estimates for ${profile.gender}, ${profile.occupation}. Exact values and uncertainty ranges are available in the full list.`}>
              <defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="#d8dfda"/></pattern></defs><rect width="720" height="510" fill="url(#dots)"/>
              {graph.map((r, i) => {
                const y = graph.length === 1 ? 239 : 45 + i * 410 / (graph.length - 1);
                const lines = wrap(r.occupation);
                return <g key={r.id} opacity={active === null || active === r.id ? 1 : 0.2}>
                  <path d={`M 168 239 C 310 239, 275 ${y}, 424 ${y}`} fill="none" stroke={colors[i]} strokeOpacity="0.45" strokeWidth={Math.max(2, r.percent * 0.55)}/><circle cx="424" cy={y} r="6" fill={colors[i]}/>
                  <text x="442" y={y - 12} className="node-title">{lines.map((line, j) => <tspan x="442" dy={j === 0 ? 0 : 17} key={j}>{line}</tspan>)}</text>
                  <text x="442" y={y + (lines.length - 1) * 17 + 8} className="node-subtitle">{r.subtitle} · {fmt(r.percent)}</text>
                </g>;
              })}
              <circle cx="137" cy="239" r="47" fill="#e9efd9"/><circle cx="137" cy="239" r="34" fill="#173e34"/><text x="137" y="248" textAnchor="middle" fontSize="26" fill="#d6ee91">◎</text>
              <text x="137" y="307" textAnchor="middle" className="source-title">{wrap(profile.occupation, 23).map((line, i) => <tspan x="137" dy={i === 0 ? 0 : 20} key={i}>{line}</tspan>)}</text>
              <text x="137" y={329 + (wrap(profile.occupation, 23).length - 1) * 20} textAnchor="middle" className="node-subtitle">{profile.gender}</text>
            </svg></div>
            <div className="graph-foot"><span><i/> Thicker connections represent larger shares</span><span>Up to 6 reportable groups + remainder</span></div>
          </div>
          <aside className="ranking"><div className="ranking-title"><h3>Largest reportable connections</h3><span>2021</span></div><p>Share of included married people</p>
            <ol>{top.map((r, i) => <li key={r.id}><button className={active === r.id ? 'rank-row active' : 'rank-row'} onMouseEnter={() => setActive(r.id)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(r.id)} onBlur={() => setActive(null)} onClick={() => setActive(active === r.id ? null : r.id)} title={`${r.fullOccupation}. Approximate 95% range: ${interval(r)}${r.quality === 'caution' ? '. Less precise estimate.' : ''}`} aria-label={`Highlight ${r.occupation}, ${r.gender}, ${fmt(r.percent)}`}>
              <span className="rank-number">0{i + 1}</span><span className="rank-content"><strong>{r.occupation}</strong><small>{r.gender}{r.quality === 'caution' ? ' · Use caution' : ''}</small><span className="bar-track"><span style={{width: `${r.percent / top[0].percent * 100}%`, background: colors[i]}}/></span></span><span className="percentage">{fmt(r.percent)}</span>
            </button></li>)}</ol>
            <button className="text-button" onClick={() => setView('table')}>Full list & uncertainty ranges <span>↗</span></button>
          </aside>
        </div> : <div className="table-wrap">
          <table><caption className="sr-only">Weighted 2021 spouse distribution for {profile.gender}, {profile.fullOccupation}</caption><thead><tr><th scope="col">Spouse occupation group</th><th scope="col">Gender</th><th scope="col">Approx. 95% range</th><th scope="col">Share</th></tr></thead>
            <tbody>{rows.map(r => <tr key={r.id}><td title={r.fullOccupation}>{r.occupation}{r.quality === 'caution' && <small className="quality-note">Use caution · less precise</small>}</td><td>{r.gender}</td><td>{interval(r)}</td><td>{fmt(r.percent)}</td></tr>)}
              {selection.pooled && <tr className="pooled-row"><td>Other combinations, grouped<small className="quality-note">Too few observations or too uncertain to show individually{selection.pooled.quality === 'caution' ? ' · Use caution' : ''}</small></td><td>Combined</td><td>{interval(selection.pooled)}</td><td>{fmt(selection.pooled.percent)}</td></tr>}
            </tbody>
          </table>
          <p className="table-note">Ranges describe sampling uncertainty, not errors introduced by missing data or privacy adjustments. Individually unreported combinations are not zero.</p>
        </div>}
        {selection.hasUnreportedRemainder && <div className="reliability-notice">Some combinations are too uncertain to report, even together. Their shares are omitted, not treated as zero; displayed percentages therefore total less than 100%.</div>}
        <div className="denominator"><span aria-hidden="true">ⓘ</span><p><strong>{fmt(selection.includedPercent)} coverage.</strong> Of all married people with the selected gender and occupation group in this file, this share has a linked spouse with usable gender and occupation data. Percentages use only that included group. Common-law couples, unlinked spouses, and spouses with unavailable or inapplicable occupations are excluded.</p></div>
      </section>
      <section id="methodology" className="methodology">
        <div><div className="eyebrow">THE STORY BEHIND THE NUMBERS</div><h2>Connections, with context.</h2><p>Derived from the 2021 Census public-use sample.<br/>Broad patterns, with their limits in view.</p><a className="source-link" href={metadata.source} target="_blank" rel="noreferrer">View the Statistics Canada source ↗</a></div>
        <div className="method-copy">
          <details open><summary>Where do these numbers come from?</summary><p>The 2021 Census Hierarchical Public Use Microdata File, corrected in November 2024. We link two married spouses within a census family and use each person’s census weight. Only aggregated estimates are included in this website; household and person records are not published here.</p></details>
          <details><summary>Why can’t I select a specific job?</summary><p>This file contains only ten broad NOC 2021 occupation categories. For example, education, law and social services share one category; its results cannot be interpreted as teacher-only results. Detailed job-to-job pairings would require a suitable custom tabulation or more detailed access. Short labels on this page are abbreviated; the full list provides complete category names on hover.</p></details>
          <details><summary>What do Women+ and Men+ mean?</summary><p>Statistics Canada includes some non-binary people in each of these two categories to protect confidentiality. The file has no separate non-binary category. Some same-gender couples’ data were also perturbed for privacy. These results cannot establish sexual orientation or a precise same-gender marriage rate.</p></details>
          <details><summary>Who is included in the percentages?</summary><p>Married spouses living together in private households, with a usable occupation category and gender for both people. Each qualifying person is counted once using their own weight. Spouses can contribute to different selections; two people with the same profile both contribute to that profile. Coverage compares included people against all married people with the selected profile in the file, including those without a usable spouse record. Missingness can affect the results.</p><p>Occupation generally describes the job in May 2–8, 2021, or the longest-held job since January 2020 if not working that week. It does not necessarily describe a current job, a job at marriage, or the likelihood of a future match.</p></details>
          <details><summary>How are uncertain estimates handled?</summary><p>Approximate 95% ranges use the file’s 16 replicate weights and the user guide’s variance method. Our display policy requires at least 30 sample people per individual combination and a coefficient of variation no greater than one third. “Use caution” means variation exceeds 16.5%. These are this website’s reliability thresholds, not a claim of Statistics Canada approval.</p><p>Combinations failing those checks are pooled when their combined estimate passes. Otherwise their share is not shown. They remain in the denominator, and are never shown as zero. Some reportable combinations can be absent from the largest six, so use the full list for detail. Rounding may also prevent totals from equalling exactly 100%.</p></details>
        </div>
      </section>
      <footer><span>who married who? <span className="footer-muted">/ Canada</span></span><span>{metadata.attribution}<br/>Contains information licensed under the <a href="https://www.statcan.gc.ca/en/terms-conditions/open-licence" target="_blank" rel="noreferrer">Statistics Canada Open Licence</a>.</span></footer>
    </main>
  </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
