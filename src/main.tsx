import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getSelection, metadata, occupations, type Estimate } from './data';
import './style.css';

const colors = ['#24685a', '#468f7c', '#76a79a', '#a4c2a8', '#b4be71', '#b69a65', '#8fa093'];
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

const occupationDetails: Record<string, { nocCode: string; fullTitle: string; examples: string }> = {
  '0': {
    nocCode: 'NOC Broad Category 0',
    fullTitle: 'Legislative and senior management occupations',
    examples: 'Legislators, politicians, corporate executives (CEOs, CFOs, VPs), senior government directors, and senior managers in finance, tech, health, education, construction, and retail.',
  },
  '1': {
    nocCode: 'NOC Broad Category 1',
    fullTitle: 'Business, finance and administration occupations',
    examples: 'Accountants, financial auditors & analysts, HR professionals, office managers, executive assistants, bookkeepers, payroll administrators, and court clerks.',
  },
  '2': {
    nocCode: 'NOC Broad Category 2',
    fullTitle: 'Natural and applied sciences and related occupations',
    examples: 'Software engineers, computer programmers, data scientists, civil/mechanical/electrical engineers, architects, chemists, biologists, physicists, and IT systems analysts.',
  },
  '3': {
    nocCode: 'NOC Broad Category 3',
    fullTitle: 'Health occupations',
    examples: 'Physicians (specialists & GPs), registered nurses, nurse practitioners, pharmacists, dentists, veterinarians, physiotherapists, paramedics, and medical laboratory technologists.',
  },
  '4': {
    nocCode: 'NOC Broad Category 4',
    fullTitle: 'Occupations in education, law and social, community and government services',
    examples: 'Elementary and secondary school teachers, university professors, college instructors, early childhood educators, lawyers, judges, paralegals, social workers, psychologists, and police officers.',
  },
  '5': {
    nocCode: 'NOC Broad Category 5',
    fullTitle: 'Occupations in art, culture, recreation and sport',
    examples: 'Authors, journalists, graphic designers, illustrators, photographers, musicians, actors, producers, dancers, athletes, coaches, sports officials, librarians, and translators.',
  },
  '6': {
    nocCode: 'NOC Broad Category 6',
    fullTitle: 'Sales and service occupations',
    examples: 'Retail salespersons, store managers, cashiers, chefs, cooks, food & beverage servers, hotel front desk agents, hairstylists, security guards, flight attendants, and travel agents.',
  },
  '7': {
    nocCode: 'NOC Broad Category 7',
    fullTitle: 'Trades, transport and equipment operators and related occupations',
    examples: 'Electricians, plumbers, carpenters, steamfitters, welders, machinists, automotive mechanics, construction trades, long-haul truck drivers, transit/bus drivers, and heavy equipment operators.',
  },
  '8': {
    nocCode: 'NOC Broad Category 8',
    fullTitle: 'Natural resources, agriculture and related production occupations',
    examples: 'Farmers, agricultural managers, specialized livestock workers, loggers, forestry professionals, mine workers, oil and gas drillers, commercial fishers, and landscapers.',
  },
  '9': {
    nocCode: 'NOC Broad Category 9',
    fullTitle: 'Occupations in manufacturing and utilities',
    examples: 'Machine operators (plastics, chemical, metal, textile), assemblers (automotive, electronics), food & beverage processing workers, water plant operators, and power engineers.',
  },
};

function App() {
  const [noc, setNoc] = useState('4');
  const [gender, setGender] = useState('1');
  const [view, setView] = useState<'connections' | 'table'>('connections');
  const [active, setActive] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { profile, selection, rows } = getSelection(gender, noc);
  const activeDetail = occupationDetails[noc] || occupationDetails['4'];
  const top = rows.slice(0, 6);
  const remainder = rows.slice(6).reduce((sum, r) => sum + r.percent, 0) + (selection.pooled?.percent || 0);
  const graph = [...top.map(r => ({ ...r, subtitle: r.gender })), ...(remainder > 0 ? [{
    id: 'other', occupation: selection.hasUnreportedRemainder ? 'Other reported combinations' : 'All other combinations',
    subtitle: 'Grouped occupations & genders', percent: remainder,
  }] : [])];
  const change = () => setActive(null);

  return <>
    <header className="header">
      <a className="brand" href="/" aria-label="Who married whom? Canada — home"><span className="marriage-mark" aria-hidden="true"><svg viewBox="0 0 48 48" focusable="false"><rect width="48" height="48" rx="14" fill="#163e33"/><circle cx="19" cy="28" r="10" fill="none" stroke="#e9d598" strokeWidth="2.8"/><circle cx="30" cy="28" r="10" fill="none" stroke="#faf4da" strokeWidth="2.8"/><path d="m15 11 4-4 4 4-4 6Z" fill="#e9d598"/><path d="M26 19a10 10 0 0 1 4-1" fill="none" stroke="#163e33" strokeWidth="5"/><path d="M26 19a10 10 0 0 1 4-1" fill="none" stroke="#faf4da" strokeWidth="2.8"/></svg><span className="flag-badge">🇨🇦</span></span><span>who married whom<span className="brand-dot">?</span></span></a>
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
          <div className="occupation-field">
            <div className="field-header">
              <label htmlFor="occ-select">Occupation group</label>
              <button
                type="button"
                className="what-is-included-btn"
                onClick={() => setShowDetails(!showDetails)}
                aria-expanded={showDetails}
                aria-controls="group-info-drawer"
              >
                ⓘ What's included?
              </button>
            </div>
            <select id="occ-select" value={noc} onChange={e => {setNoc(e.target.value); change();}}>
              {occupations.map(o => <option value={o.noc} key={o.noc}>{o.occupation}</option>)}
            </select>
          </div>
          <div className="scope"><span>EXPLORING</span><strong>Married couples</strong><small>Canada-wide · 2021</small></div>
        </div>
        {showDetails && (
          <div id="group-info-drawer" className="group-info-drawer" role="region" aria-label="Occupations included in this group">
            <div className="group-info-inner">
              <div className="group-info-top">
                <span className="group-info-tag">{activeDetail.nocCode}</span>
                <button
                  type="button"
                  className="group-info-close"
                  onClick={() => setShowDetails(false)}
                  aria-label="Close details"
                >
                  ✕ Close
                </button>
              </div>
              <div className="group-info-title">{activeDetail.fullTitle}</div>
              <p className="group-info-examples">
                <strong>Common jobs included:</strong> {activeDetail.examples}
              </p>
              <div>
                <a
                  href="https://noc.esdc.gc.ca/Structure/Hierarchy"
                  target="_blank"
                  rel="noreferrer"
                  className="group-info-link"
                >
                  Search all job titles in the official NOC 2021 directory ↗
                </a>
              </div>
            </div>
          </div>
        )}
        <div className="category-note">Women+ and Men+ each include some non-binary people. A separate non-binary category is not available in this file.</div>
        <div className="results-heading">
          <div aria-live="polite"><div className="eyebrow">FOLLOW THE CONNECTIONS</div><h2>{profile.gender} · <span>{profile.occupation}</span></h2><p>Spouses with a known occupation group and gender.</p></div>
          <div className="view-switch" role="group" aria-label="Results view"><button aria-pressed={view === 'connections'} onClick={() => setView('connections')}>⑂ Connections</button><button aria-pressed={view === 'table'} onClick={() => setView('table')}>☷ Full list</button></div>
        </div>
        {view === 'connections' ? <div className="results-grid">
          <div className="graph-panel">
            <div className="graph-topline desktop-chart"><span>SELECTED PERSON</span><span>SPOUSE GROUP & GENDER</span></div>
            <div className="graph-scroll desktop-chart"><svg viewBox="0 0 720 510" role="img" aria-label={`2021 spouse occupation estimates for ${profile.gender}, ${profile.occupation}. Exact values and uncertainty ranges are available in the full list.`}>
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
            {(() => {
              const mobileFirstCardY = 120;
              const mobileSlotHeight = 92;
              const mobileCardHeight = 82;
              const mobileSvgHeight = mobileFirstCardY + graph.length * mobileSlotHeight + 10;
              return (
                <div className="mobile-chart" aria-label="Spouse connections, arranged vertically">
                  <div className="mobile-chart-inner">
                    <svg
                      className="mobile-chart-svg"
                      viewBox={`0 0 76 ${mobileSvgHeight}`}
                      style={{ height: mobileSvgHeight }}
                      aria-hidden="true"
                      focusable="false"
                    >
                      <circle cx="38" cy="38" r="26" fill="#e9efd9" />
                      <circle cx="38" cy="38" r="19" fill="#173e34" />
                      <text x="38" y="44" textAnchor="middle" fontSize="16" fill="#d6ee91" fontWeight="bold">◎</text>
                      {graph.map((r, i) => {
                        const lane = 48 - (graph.length <= 1 ? 0 : i * (28 / (graph.length - 1)));
                        const endY = mobileFirstCardY + i * mobileSlotHeight + mobileCardHeight / 2;
                        const turnDist = Math.min(26, Math.max(16, (76 - lane) * 0.5));
                        const isHovered = active === r.id;
                        const isDimmed = active !== null && !isHovered;
                        return (
                          <g key={r.id} opacity={isDimmed ? 0.22 : 1} style={{ transition: 'opacity 0.18s ease' }}>
                            <path
                              d={`M 38 55 C 38 75, ${lane} 82, ${lane} 106 L ${lane} ${endY - turnDist} C ${lane} ${endY}, ${76 - 12} ${endY}, 76 ${endY}`}
                              fill="none"
                              stroke={colors[i]}
                              strokeOpacity={isHovered ? 0.95 : 0.65}
                              strokeWidth={Math.max(2.5, Math.min(9, r.percent * 0.42)) + (isHovered ? 1.5 : 0)}
                              strokeLinecap="round"
                            />
                            <circle
                              cx="73"
                              cy={endY}
                              r={isHovered ? 5.5 : 4}
                              fill={colors[i]}
                              stroke="#fff"
                              strokeWidth="2"
                            />
                          </g>
                        );
                      })}
                    </svg>
                    <div className="mobile-chart-content">
                      <div className="mobile-source-card">
                        <span className="mobile-chart-label">SELECTED PERSON</span>
                        <strong className="mobile-source-name">{profile.occupation}</strong>
                        <span className="mobile-source-gender">{profile.gender}</span>
                      </div>
                      <div className="mobile-target-header">
                        <span className="mobile-chart-label">SPOUSE GROUP &amp; GENDER</span>
                      </div>
                      <ol className="mobile-spouse-list">
                        {graph.map((r, i) => {
                          const isSelected = active === r.id;
                          return (
                            <li key={r.id} style={{ height: mobileSlotHeight }}>
                              <button
                                className={`mobile-connection ${isSelected ? 'active' : ''}`}
                                onClick={() => setActive(isSelected ? null : r.id)}
                                aria-pressed={isSelected}
                                style={{
                                  borderLeftColor: colors[i],
                                  height: mobileCardHeight,
                                }}
                              >
                                <div className="mobile-connection-info">
                                  <strong>{r.occupation}</strong>
                                  <span>{r.subtitle}</span>
                                </div>
                                <div className="mobile-connection-percent" style={{ color: colors[i] }}>
                                  <b>{fmt(r.percent)}</b>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  </div>
                </div>
              );
            })()}
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
      <footer><span>who married whom? <span className="footer-muted">/ Canada</span></span><span>{metadata.attribution}<br/>Contains information licensed under the <a href="https://www.statcan.gc.ca/en/terms-conditions/open-licence" target="_blank" rel="noreferrer">Statistics Canada Open Licence</a>.</span></footer>
    </main>
  </>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
