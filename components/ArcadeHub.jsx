const { useState, useEffect, useCallback, useRef, useMemo } = React;

function ArcadeHub() {
  const [activeGame, setActiveGame] = useState(null);

  const GAMES = [
    {
      id: 'packet-rain',
      title: 'PACKET RAIN',
      emoji: '📡',
      desc: 'Falling protocol headers — drag each packet to its matching network category before it hits the overflow zone.',
      tags: ['Layer 2-7', 'Protocols', 'Reflexes'],
      color: '#00ffff',
      difficulty: '★★★',
    },
    {
      id: 'subnet-ipv4',
      title: 'SUBNET SPRINT',
      emoji: '🔢',
      desc: 'Race against the clock on IPv4 subnetting — network addresses, broadcast, host counts, and CIDR conversions.',
      tags: ['IPv4', 'CIDR', 'Subnetting'],
      color: '#39ff14',
      difficulty: '★★☆',
    },
    {
      id: 'subnet-ipv6',
      title: 'IPv6 GAUNTLET',
      emoji: '🌐',
      desc: 'Expand, compress, classify and prefix-match IPv6 addresses under pressure. EUI-64 boss rounds included.',
      tags: ['IPv6', 'Prefixes', 'EUI-64'],
      color: '#ff00ff',
      difficulty: '★★★',
    },
  ];

  const backBtn = (
    <button
      onClick={() => setActiveGame(null)}
      style={{marginBottom:12, background:'transparent', border:'1px solid var(--border)', color:'var(--muted)', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:12, fontFamily:'var(--mono)'}}
    >
      ← ARCADE MENU
    </button>
  );

  if (activeGame === 'packet-rain') {
    return <div>{backBtn}<NetworkArcade /></div>;
  }

  if (activeGame === 'subnet-ipv4') {
    return <div>{backBtn}<SubnetSprint /></div>;
  }

  if (activeGame === 'subnet-ipv6') {
    return <div>{backBtn}<IPv6Gauntlet /></div>;
  }

  return (
    <div className="fadein">
      <div style={{textAlign:'center', marginBottom:32, paddingTop:12}}>
        <div style={{fontSize:36, fontWeight:900, fontFamily:'var(--mono)', color:'var(--cyan)', textShadow:'0 0 30px var(--cyan)', letterSpacing:2}}>NETWORK ARCADE</div>
        <div style={{color:'var(--muted)', fontSize:13, marginTop:6}}>Select a game to play</div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:20}}>
        {GAMES.map(game => (
          <div
            key={game.id}
            onClick={() => !game.soon && setActiveGame(game.id)}
            style={{
              background:'var(--card)', border:`2px solid ${game.soon ? 'var(--border)' : game.color}`,
              borderRadius:16, padding:24, cursor: game.soon ? 'default' : 'pointer',
              transition:'all 0.2s', position:'relative', overflow:'hidden',
              boxShadow: game.soon ? 'none' : `0 0 20px ${game.color}22`,
              opacity: game.soon ? 0.55 : 1,
            }}
            onMouseEnter={e => { if (!game.soon) e.currentTarget.style.boxShadow = `0 0 40px ${game.color}55`; }}
            onMouseLeave={e => { if (!game.soon) e.currentTarget.style.boxShadow = `0 0 20px ${game.color}22`; }}
          >
            {game.soon && (
              <div style={{position:'absolute', top:12, right:12, background:'var(--panel)', border:'1px solid var(--border)', borderRadius:4, padding:'2px 8px', fontSize:10, color:'var(--dim)', fontFamily:'var(--mono)', letterSpacing:1}}>COMING SOON</div>
            )}
            <div style={{fontSize:40, marginBottom:12}}>{game.emoji}</div>
            <div style={{fontFamily:'var(--mono)', fontWeight:900, fontSize:18, color: game.soon ? 'var(--muted)' : game.color, marginBottom:8, letterSpacing:1}}>{game.title}</div>
            <div style={{fontSize:13, color:'var(--muted)', lineHeight:1.6, marginBottom:14}}>{game.desc}</div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                {game.tags.map(t => (
                  <span key={t} style={{fontSize:10, padding:'2px 7px', borderRadius:20, background:'var(--panel)', border:'1px solid var(--border)', color:'var(--dim)', fontFamily:'var(--mono)'}}>{t}</span>
                ))}
              </div>
              <div style={{fontSize:13, color: game.soon ? 'var(--dim)' : game.color, fontFamily:'var(--mono)'}}>{game.difficulty}</div>
            </div>
            {!game.soon && (
              <div style={{marginTop:16, textAlign:'center', padding:'8px', borderRadius:8, background:`${game.color}18`, border:`1px solid ${game.color}44`, fontSize:12, fontWeight:700, color:game.color, fontFamily:'var(--mono)', letterSpacing:2}}>
                PLAY →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Subnet Sprint ───────────────────────────────────────────
window.ArcadeHub = ArcadeHub;
