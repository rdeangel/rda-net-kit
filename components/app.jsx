const { useState, useEffect, useCallback, useRef, useMemo } = React;

const TOOLS = [
  // IPv4
  { id:'subnet',    label:'Subnet Calculator',    group:'IPv4', type:'tool' },
  { id:'vlsm',      label:'VLSM Planner',          group:'IPv4', type:'tool' },
  { id:'supernet',  label:'Supernet / Summary',   group:'IPv4', type:'tool' },
  { id:'range',     label:'Range ↔ CIDR',         group:'IPv4', type:'tool' },
  { id:'wildcard',  label:'Wildcard Mask',         group:'IPv4', type:'tool' },
  { id:'overlap',   label:'Overlap Detector',      group:'IPv4', type:'tool' },
  { id:'split',     label:'Split & Merge',         group:'IPv4', type:'tool' },
  { id:'map',       label:'Subnet Visual Map',     group:'IPv4', type:'tool' },
  { id:'dhcp',      label:'DHCP Scope Planner',     group:'IPv4', type:'tool' },
  { id:'converter', label:'IP Converter',          group:'IPv4', type:'tool' },
  { id:'acl',       label:'ACL Generator',         group:'IPv4', type:'tool' },

  // IPv6
  { id:'ipv6subnet',label:'IPv6 Subnet Calc',      group:'IPv6', type:'tool' },
  { id:'ipv6-trans',label:'IPv6 Transition Mech',  group:'IPv6', type:'ref' },

  // Both IPv4 & IPv6
  { id:'classify',  label:'IP Classifier',         group:'BOTH (IPv4 and IPv6)', type:'tool' },
  { id:'mac',       label:'MAC Address Tools',     group:'BOTH (IPv4 and IPv6)', type:'tool', online:false },
  { id:'cheatsheet',label:'IP Cheat Sheet',        group:'BOTH (IPv4 and IPv6)', type:'ref' },

  // Multicast
  { id:'mcast-ref',     label:'Multicast Reference',   group:'Multicast', type:'ref' },
  { id:'mcast-planner', label:'Multicast Planner',     group:'Multicast', type:'tool' },
  { id:'mcast-map',     label:'Multicast IP-MAC Map',  group:'Multicast', type:'tool' },
  { id:'mcast-analyze', label:'Multicast Analyzer',    group:'Multicast', type:'tool' },
  { id:'mcast-builder', label:'IPv6 Mcast Builder',    group:'Multicast', type:'tool' },
  { id:'mcast-solicited', label:'Solicited-Node Calc', group:'Multicast', type:'tool' },
  { id:'mcast-glop',    label:'GLOP Calculator',       group:'Multicast', type:'tool' },
  { id:'mcast-collision', label:'MAC Collision Check', group:'Multicast', type:'tool' },

  // Switching (Layer 2)
  { id:'switching-ref', label:'Switching (STP/VPC)',   group:'Switching', type:'ref' },
  { id:'lacp-tool',     label:'LACP / Port-Channel',   group:'Switching', type:'tool' },
  { id:'config-gen',    label:'Interface Config Gen',  group:'Switching', type:'tool' },
  { id:'vxlan-ref',     label:'VXLAN Reference',       group:'Switching', type:'ref' },

  // Routing (Layer 3)
  { id:'proto-ref',     label:'IP Proto Reference',    group:'Routing', type:'ref' },
  { id:'mpls-ref',      label:'MPLS Reference',        group:'Routing', type:'ref' },
  { id:'vpn-ref',       label:'VPN / IPsec Architect', group:'Routing', type:'ref' },
  { id:'bgp-lg',        label:'BGP Looking Glass',     group:'Routing', type:'tool', online:true },
  { id:'asn',           label:'BGP / ASN Lookup',      group:'Routing', type:'tool', online:true },

  // Infrastructure
  { id:'osi-model',     label:'OSI & TCP/IP Model',    group:'Infrastructure', type:'ref' },
  { id:'packet-headers',label:'Packet Header Map',     group:'Infrastructure', type:'ref' },
  { id:'qos-tool',      label:'QoS / DSCP Bit Map',    group:'Infrastructure', type:'tool' },
  { id:'mtu',           label:'MTU & Encapsulation',   group:'Infrastructure', type:'tool' },
  { id:'wlan-tool',     label:'WLAN / 802.11 Planner', group:'Infrastructure', type:'tool' },
  { id:'wifi-qr',       label:'WiFi QR Code Gen',      group:'Infrastructure', type:'tool' },

  // Media
  { id:'ipfm-ref',      label:'IPFM / NBM / PTP',      group:'Media', type:'ref' },

  // Tools (Diagnostics & Utilities)
  { id:'dns',       label:'DNS Lookup',            group:'Tools', type:'tool', online:true },
  { id:'diag',      label:'Remote Ping / MTR',     group:'Tools', type:'tool', online:true },
  { id:'geo',       label:'IP Geolocation',        group:'Tools', type:'tool', online:true },
  { id:'ssl',       label:'SSL/TLS Inspector',     group:'Tools', type:'tool', online:true },
  { id:'http-hdrs', label:'HTTP Header Analyzer',  group:'Tools', type:'tool', online:true },
  { id:'sweep',     label:'Ping Sweep Planner',    group:'Tools', type:'tool' },
  { id:'bandwidth', label:'Bandwidth & Throughput', group:'Tools', type:'tool' },
  { id:'cert-gen',  label:'Self-Signed Cert Gen',  group:'Tools', type:'tool' },
  { id:'cypher',    label:'Cypher Deck',           group:'Tools', type:'tool' },
  { id:'wireshark', label:'Wireshark Toolkit',     group:'Tools', type:'tool' },
  { id:'systools',  label:'SysTool CLI Builder',   group:'Tools', type:'tool', keywords:'netsh nmtui netstat ss route ip ping traceroute hping3 iperf3 wget curl nload nethogs iftop speedometer ipconfig tracert nslookup network diagnostic command cli' },
  { id:'cli-ref',   label:'CLI Quick Reference',   group:'Tools', type:'tool' },
  { id:'ports',     label:'Port Reference',        group:'Tools', type:'ref' },

  // Education
  { id:'net-arcade', label:'Network Arcade',       group:'Education', type:'tool' },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "#3584e4",
  "darkMode": true
}/*EDITMODE-END*/;

function App() {
  const getInitialTool = () => {
    try {
      const hash = decodeURIComponent(location.hash.slice(1));
      if (hash) { const d = JSON.parse(hash); return d.tool || 'subnet'; }
    } catch {}
    return localStorage.getItem('ip-tool-active') || 'subnet';
  };

  const [activeTool, setActiveTool] = useState(getInitialTool);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [theme, setTheme] = useState(() => {
    const s = localStorage.getItem('ip-tool-dark');
    if (s === null || s === 'system') return 'system';
    return s === 'false' ? 'light' : 'dark';
  });

  const dark = theme === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : theme === 'dark';

  useEffect(() => {
    const el = document.getElementById('boot-screen');
    if (!el) return;
    const MIN_MS = 600;
    const elapsed = Date.now() - (window.__bootStart || Date.now());
    const delay = Math.max(0, MIN_MS - elapsed);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 200);
    }, delay);
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => document.documentElement.className = mq.matches ? '' : 'light';
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleSearchSelect = (item) => {
    setActiveTool(item.id);
    setShowSearch(false);
    setSearchQuery('');
    setIsSidebarOpen(false);
  };
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [showTweaks, setShowTweaks] = useState(false);

  useEffect(() => {
    document.documentElement.className = dark ? '' : 'light';
    localStorage.setItem('ip-tool-dark', theme);
  }, [dark, theme]);

  useEffect(() => {
    localStorage.setItem('ip-tool-active', activeTool);
  }, [activeTool]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Tweaks protocol
  useEffect(() => {
    const handler = e => {
      if (e.data?.type === '__activate_edit_mode') setShowTweaks(true);
      if (e.data?.type === '__deactivate_edit_mode') setShowTweaks(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const navGroups = ['IPv4','IPv6','BOTH (IPv4 and IPv6)','Multicast','Switching','Routing','Infrastructure','Media','Tools','Education'];
  const navTypes = [
    { id:'tool', label:'Utility Tools' },
    { id:'ref', label:'Reference Library' }
  ];

  const isOnlineQuery = /^onl?i/i.test(searchQuery.trim());
  const filteredTools = searchQuery.trim() === ''
    ? TOOLS
    : isOnlineQuery
      ? TOOLS.filter(t => t.online)
      : TOOLS.filter(t => {
          const s = searchQuery.toLowerCase();
          return t.label.toLowerCase().includes(s) ||
                 t.group.toLowerCase().includes(s) ||
                 (t.keywords && t.keywords.toLowerCase().includes(s));
        });

  const renderTool = () => {
    switch (activeTool) {
      case 'subnet': return <SubnetCalc onShare={setShareData} />;
      case 'range': return <RangeCIDR />;
      case 'supernet': return <SupernetCalc />;
      case 'wildcard': return <WildcardTool />;
      case 'converter': return <IPConverter />;
      case 'vlsm': return <VLSMPlanner />;
      case 'map': return <SubnetMap />;
      case 'ipv6': return <IPv6Tools />;
      case 'split':     return <SplitMerge />;
      case 'overlap':   return <OverlapDetector />;
      case 'acl':       return <ACLGenerator />;
      case 'ipv6subnet':return <IPv6SubnetCalc />;
      case 'classify':  return <IPClassifier />;
      case 'mac':       return <MACTools />;
      case 'mcast-map':     return <McastIpMacMap />;
      case 'mcast-analyze': return <McastAnalyzer />;
      case 'mcast-glop':    return <GlopCalc />;
      case 'mcast-ref':     return <McastReference />;
      case 'mcast-planner': return <McastPlanner />;
      case 'mcast-solicited': return <McastSolicited />;
      case 'mcast-collision': return <McastCollision />;
      case 'mcast-builder':   return <McastBuilder />;
      case 'ipfm-ref':        return <IPFMRef />;
      case 'switching-ref': return <SwitchingRef />;
      case 'mpls-ref':      return <MPLSRef />;
      case 'vxlan-ref':     return <VXLANRef />;
      case 'dns':       return <DNSLookup />;
      case 'ssl':       return <SSLInspector />;
      case 'http-hdrs': return <HTTPHeaderAnalyzer />;
      case 'cert-gen':  return <SelfSignedCertGen />;
      case 'diag':      return <RemoteDiagnostics />;
      case 'geo':       return <GeoLookup />;
      case 'asn':       return <ASNLookup />;
      case 'sweep':     return <PingSweep />;
      case 'ports':     return <PortReference />;
      case 'cheatsheet':return <CheatSheet />;
      case 'osi-model': return <OSIModel />;
      case 'packet-headers': return <PacketHeaders />;
      case 'config-gen':     return <InterfaceConfigGen />;
      case 'wireshark':      return <WiresharkTools />;
      case 'systools':       return <SysToolBuilder />;
      case 'cypher':         return <CypherDeck />;
      case 'proto-ref':     return <RoutingReference />;
      case 'vpn-ref':   return <VPNArchitect />;
      case 'qos-tool':  return <QoSDSCPTool />;
      case 'wlan-tool': return <WLANPlanner />;
      case 'wifi-qr':   return <WifiQRCode />;
      case 'ipv6-trans':return <IPv6Transition />;
      case 'bgp-lg':    return <BGPLookingGlass />;
      case 'lacp-tool': return <LACPSimulator />;
      case 'net-arcade': return <ArcadeHub />;
      case 'bandwidth': return <BandwidthCalc />;
      case 'mtu':       return <MTUCalc />;
      case 'dhcp':      return <DHCPPlanner />;
      case 'cli-ref':   return <CLIReference />;
      default: return null;
    }
  };

  const toolInfo = TOOLS.find(t => t.id === activeTool);

  return (
    <div className="app">
      <header className="header">
        <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        {/* Left: Logo area with fixed width matching sidebar and vertical divider */}
        <div className="logo-area">
          <div className="logo">
            <div className="logo-icon" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {/* Outer Mesh Boundary */}
                <path d="M12 2L22 12L12 22L2 12Z" fill="rgba(0, 212, 200, 0.1)" />
                {/* Fully Interconnected Diagonals */}
                <line x1="12" y1="2" x2="12" y2="22" strokeOpacity="0.4" />
                <line x1="2" y1="12" x2="22" y2="12" strokeOpacity="0.4" />
                {/* Connections to Core */}
                <line x1="12" y1="12" x2="12" y2="2" strokeOpacity="0.6" />
                <line x1="12" y1="12" x2="22" y2="12" strokeOpacity="0.6" />
                <line x1="12" y1="12" x2="12" y2="22" strokeOpacity="0.6" />
                <line x1="12" y1="12" x2="2" y2="12" strokeOpacity="0.6" />
                {/* Nodes */}
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <circle cx="12" cy="2" r="1.5" fill="currentColor" />
                <circle cx="22" cy="12" r="1.5" fill="currentColor" />
                <circle cx="12" cy="22" r="1.5" fill="currentColor" />
                <circle cx="2" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div style={{marginLeft:10, fontWeight:700, letterSpacing:'-0.01em', fontSize:15, color:'var(--text)'}}>RDA Net Kit</div>
          </div>
        </div>

        {/* Center: Tool title and category centered in the remaining space */}
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', padding:'0 20px'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <span className="topbar-title">{toolInfo?.label}</span>
            <span className="topbar-badge">{toolInfo?.group}</span>
            {toolInfo?.online && (
              <span className="badge badge-blue" style={{fontSize:10, padding:'2px 8px', display:'flex', alignItems:'center', gap:5, opacity:0.8}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Online Tool
                </span>

            )}
          </div>
          {/* Theme toggle and Search pinned to the far right of this section */}
          <div style={{position:'absolute', right:20, display:'flex', alignItems:'center', gap:8}}>
            <button className="theme-toggle-btn" onClick={() => setShowSearch(true)} title="Search tools & content (Ctrl+K)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
            <button className="theme-toggle-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : t === 'light' ? 'system' : 'dark')} title={`Theme: ${theme} — click to cycle`}>
              {theme === 'system' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              ) : dark ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="main-layout">
        {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
        <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
          <div className="sidebar-mobile-header">
            <div className="logo">
              <div className="logo-icon" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L22 12L12 22L2 12Z" fill="rgba(0, 212, 200, 0.1)" />
                  <line x1="12" y1="2" x2="12" y2="22" strokeOpacity="0.4" />
                  <line x1="2" y1="12" x2="22" y2="12" strokeOpacity="0.4" />
                  <line x1="12" y1="12" x2="12" y2="2" strokeOpacity="0.6" />
                  <line x1="12" y1="12" x2="22" y2="12" strokeOpacity="0.6" />
                  <line x1="12" y1="12" x2="12" y2="22" strokeOpacity="0.6" />
                  <line x1="12" y1="12" x2="2" y2="12" strokeOpacity="0.6" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <circle cx="12" cy="2" r="1.5" fill="currentColor" />
                  <circle cx="22" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="22" r="1.5" fill="currentColor" />
                  <circle cx="2" cy="12" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <div style={{marginLeft:10, fontWeight:700, letterSpacing:'-0.01em', fontSize:15, color:'var(--text)'}}>RDA Net Kit</div>
            </div>
            <button className="sidebar-close" onClick={() => setIsSidebarOpen(false)}>X</button>
          </div>
          <div className="sidebar-search">
            <div className="search-input-wrapper">
              <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input className="search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." />
              {searchQuery && (
                <div className="search-clear" onClick={() => setSearchQuery('')}>X</div>
              )}
            </div>
          </div>

          <div className="sidebar-nav">
            {navTypes.map(type => {
              const typeItems = filteredTools.filter(t => t.type === type.id);
              if (typeItems.length === 0) return null;
              return (
                <div key={type.id}>
                  <div className="sidebar-group-title">{type.label}</div>
                  {navGroups.map(grp => {
                    const items = typeItems.filter(t => t.group === grp);
                    if (items.length === 0) return null;
                    return (
                      <div key={grp}>
                        <div className="sidebar-section">{grp}</div>
                        {items.map(t => (
                          <div key={t.id} className={`nav-item ${activeTool === t.id ? 'active' : ''}`} onClick={() => { setActiveTool(t.id); setIsSidebarOpen(false); }}>
                            <div className="nav-dot" />
                            {t.label}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {filteredTools.length === 0 && (
              <div style={{padding:20, textAlign:'center', color:'var(--dim)', fontSize:12}}>No results found</div>
            )}
          </div>
        </aside>

        <main className="main">
          <div className="content">
            {renderTool()}
          </div>
        </main>
      </div>

      <footer className="footer">
        <div>RDA Net Kit • Built for Engineers • {window.APP_VERSION || 'v1.0.0'}</div>
      </footer>

      {/* Share modal */}
      {shareData && <ShareModal data={shareData} onClose={() => setShareData(null)} />}

      {/* Command Palette */}
      {showSearch && <CommandPalette onSelect={handleSearchSelect} onClose={() => setShowSearch(false)} />}

      {/* Tweaks panel */}
      {showTweaks && (
        <div style={{position:'fixed',bottom:20,right:20,background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,padding:20,width:260,zIndex:200,boxShadow:'0 8px 32px rgba(0,0,0,.4)'}}>
          <div style={{fontWeight:600,marginBottom:14,fontSize:13}}>Tweaks</div>
          <div className="field">
            <label className="label">Theme</label>
            <div style={{display:'flex',gap:8}}>
              <button className={`btn btn-sm ${theme==='dark'?'btn-primary':'btn-ghost'}`} onClick={() => setTheme('dark')}>Dark</button>
              <button className={`btn btn-sm ${theme==='light'?'btn-primary':'btn-ghost'}`} onClick={() => setTheme('light')}>Light</button>
              <button className={`btn btn-sm ${theme==='system'?'btn-primary':'btn-ghost'}`} onClick={() => setTheme('system')}>System</button>
            </div>
          </div>
          <div className="field">
            <label className="label">Accent Color</label>
            <input type="color" value={tweaks.accentColor} onChange={e => {
              const v = e.target.value;
              setTweaks(t => ({...t, accentColor: v}));
              document.documentElement.style.setProperty('--cyan', v);
              window.parent.postMessage({type:'__edit_mode_set_keys', edits:{accentColor:v}}, '*');
            }} style={{width:'100%',height:36,borderRadius:4,border:'1px solid var(--border)',background:'none',cursor:'pointer'}} />
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
