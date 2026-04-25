const { useState, useEffect, useCallback, useRef, useMemo } = React;

function WLANPlanner() {
  const [ss, setSS] = useState(2);
  const [bw, setBW] = useState(80);
  const [gi, setGI] = useState(0.8);
  const [mod, setMod] = useState(256);
  const [activeBand, setActiveBand] = useState('5ghz');

  const calcMCS = () => {
    const bits = Math.log2(mod);
    // Approximate subcarriers based on 802.11ax/be standards
    const subcarriers = bw === 20 ? 52 : (bw === 40 ? 108 : (bw === 80 ? 242 : (bw === 160 ? 484 : 968)));
    const rate = (ss * bits * subcarriers) / (3.2 + parseFloat(gi));
    return Math.round(rate);
  };

  const bands = {
    '2.4ghz': {
      title: '2.4 GHz ISM Band',
      color: 'var(--yellow)',
      desc: 'Crowded spectrum with only 3 non-overlapping 20MHz channels (1, 6, 11). High penetration, low speed.',
      channels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      freqRange: '2412 - 2472 MHz'
    },
    '5ghz': {
      title: '5 GHz UNII Bands',
      color: 'var(--blue)',
      desc: 'Faster speeds, more channels. Includes DFS (Dynamic Frequency Selection) ranges shared with radar.',
      sub: [
        { name: 'UNII-1', ch: '36-48', info: 'Lower band, indoor only in some regions.' },
        { name: 'UNII-2 (DFS)', ch: '52-144', info: 'Radar detection required (Wait times apply).' },
        { name: 'UNII-3', ch: '149-165', info: 'Upper band, higher power allowed.' }
      ],
      freqRange: '5180 - 5825 MHz'
    },
    '6ghz': {
      title: '6 GHz (Wi-Fi 6E / 7)',
      color: 'var(--green)',
      desc: 'The "Super Highway". Massive 1200MHz of clean spectrum. No DFS required. Supports 320MHz channels.',
      channels: ['UNII-5', 'UNII-6', 'UNII-7', 'UNII-8'],
      freqRange: '5925 - 7125 MHz'
    }
  };

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">MCS Data Rate Calculator (WiFi 4/5/6/7)</div>
        <div className="result-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', marginBottom:20}}>
          <div className="field">
            <label className="label">Spatial Streams</label>
            <select className="input" value={ss} onChange={e => setSS(parseInt(e.target.value))}>
              {[1,2,3,4,8].map(n => <option key={n} value={n}>{n}x{n} MIMO</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Bandwidth</label>
            <select className="input" value={bw} onChange={e => setBW(parseInt(e.target.value))}>
              {[20,40,80,160,320].map(n => <option key={n} value={n}>{n} MHz</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Guard Interval (µs)</label>
            <select className="input" value={gi} onChange={e => setGI(parseFloat(e.target.value))}>
              <option value="3.2">3.2 (Max Range)</option>
              <option value="1.6">1.6 (Medium)</option>
              <option value="0.8">0.8 (WiFi 6/7)</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Modulation</label>
            <select className="input" value={mod} onChange={e => setMod(parseInt(e.target.value))}>
              <option value="64">64-QAM (WiFi 4)</option>
              <option value="256">256-QAM (WiFi 5)</option>
              <option value="1024">1024-QAM (WiFi 6)</option>
              <option value="4096">4096-QAM (WiFi 7)</option>
            </select>
          </div>
        </div>
        <div style={{textAlign:'center', padding:24, background:'var(--panel)', borderRadius:12, border:'1px solid var(--cyan)', position:'relative', overflow:'hidden'}}>
          <div style={{position:'absolute', top:0, left:0, width:'100%', height:'2px', background:'linear-gradient(90deg, transparent, var(--cyan), transparent)'}} />
          <div style={{fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:4}}>Theoretical PHY Rate</div>
          <div style={{fontSize:36, fontWeight:700, color:'var(--cyan)'}}>{calcMCS().toLocaleString()} <span style={{fontSize:16, fontWeight:400, color:'var(--muted)'}}>Mbps</span></div>
          <div style={{fontSize:10, color:'var(--dim)', marginTop:8}}>Real-world throughput is typically 60-70% of PHY rate due to overhead.</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Spectrum & Frequency Explorer</div>
        <div style={{display:'flex', gap:8, marginBottom:20}}>
          {Object.keys(bands).map(b => (
            <button key={b} className={`btn btn-sm ${activeBand===b?'btn-primary':'btn-ghost'}`} onClick={()=>setActiveBand(b)} style={{flex:1}}>
              {b.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="fadein">
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
            <strong style={{fontSize:16, color:bands[activeBand].color}}>{bands[activeBand].title}</strong>
            <span style={{fontSize:12, fontFamily:'var(--mono)', color:'var(--muted)'}}>{bands[activeBand].freqRange}</span>
          </div>
          <p style={{fontSize:13, color:'var(--muted)', lineHeight:1.6, marginBottom:20}}>{bands[activeBand].desc}</p>

          {activeBand === '2.4ghz' && (
            <div style={{marginTop:20}}>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--dim)', marginBottom:4}}>
                <span>2400 MHz</span><span>2483.5 MHz</span>
              </div>
              <div style={{height:40, background:'var(--panel)', borderRadius:6, position:'relative', border:'1px solid var(--border)', display:'flex', alignItems:'flex-end', paddingBottom:5}}>
                 {[1,6,11].map((c, i) => (
                   <div key={c} style={{
                     position:'absolute', left:`${((c-1)/12)*80 + 5}%`, width:'25%', height:30,
                     background:'rgba(245, 158, 11, 0.15)', border:'1px solid var(--yellow)', borderRadius:'15px 15px 0 0',
                     display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--yellow)', fontWeight:600
                   }}>Ch {c}</div>
                 ))}
              </div>
              <div style={{marginTop:12, fontSize:11, color:'var(--dim)', textAlign:'center'}}>
                Notice: Channels 1, 6, and 11 are the <strong style={{color:'var(--text)'}}>only</strong> non-overlapping 20MHz channels.
              </div>
            </div>
          )}

          {activeBand === '5ghz' && (
            <div className="result-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))'}}>
              {bands['5ghz'].sub.map(s => (
                <div key={s.name} style={{background:'var(--panel)', padding:12, borderRadius:8, border:'1px solid var(--border)'}}>
                  <strong style={{color:'var(--blue)', fontSize:12, display:'block'}}>{s.name}</strong>
                  <div style={{fontSize:14, fontWeight:600, margin:'4px 0'}}>{s.ch}</div>
                  <div style={{fontSize:11, color:'var(--dim)'}}>{s.info}</div>
                </div>
              ))}
            </div>
          )}

          {activeBand === '6ghz' && (
            <div style={{background:'rgba(34, 197, 94, 0.05)', padding:16, borderRadius:8, border:'1px solid var(--green)'}}>
              <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                <div style={{padding:'4px 10px', background:'var(--panel)', border:'1px solid var(--green)', borderRadius:4, fontSize:11}}>59 x 20MHz</div>
                <div style={{padding:'4px 10px', background:'var(--panel)', border:'1px solid var(--green)', borderRadius:4, fontSize:11}}>29 x 40MHz</div>
                <div style={{padding:'4px 10px', background:'var(--panel)', border:'1px solid var(--green)', borderRadius:4, fontSize:11}}>14 x 80MHz</div>
                <div style={{padding:'4px 10px', background:'var(--panel)', border:'1px solid var(--green)', borderRadius:4, fontSize:11}}>7 x 160MHz</div>
                <div style={{padding:'4px 10px', background:'var(--green)', color:'#000', borderRadius:4, fontSize:11, fontWeight:600}}>3 x 320MHz</div>
              </div>
              <div style={{marginTop:16, fontSize:12, color:'var(--muted)', lineHeight:1.6}}>
                Wi-Fi 6E/7 utilizes the 6 GHz band to eliminate congestion. <strong style={{color:'var(--text)'}}>320 MHz</strong> channels allow for multi-gigabit wireless speeds over short distances.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── IPv6 Transition Mechanics ──────────────────────────────────
window.WLANPlanner = WLANPlanner;
