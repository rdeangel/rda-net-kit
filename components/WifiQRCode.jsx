const { useState, useEffect, useCallback, useRef, useMemo } = React;

function WifiQRCode() {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [encryption, setEncryption] = useState('WPA');
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrReady, setQrReady] = useState(!!window.QRCode);
  const qrRef = useRef(null);

  useEffect(() => {
    if (window.QRCode) return;
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload = () => setQrReady(true);
    document.head.appendChild(s);
  }, []);

  const generate = () => {
    if (!ssid.trim()) return;
    if (!qrRef.current) return;
    qrRef.current.innerHTML = '';

    // Format: WIFI:S:<SSID>;T:<WPA|WEP|>;P:<password>;H:<true|false>;;
    const qrString = `WIFI:S:${ssid};T:${encryption};P:${password};H:${hidden};;`;

    new QRCode(qrRef.current, {
      text: qrString,
      width: 256,
      height: 256,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
  };

  useEffect(() => {
    if (qrReady && ssid) generate();
  }, [qrReady, ssid, password, encryption, hidden]);

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">WiFi Network Details</div>
        <div className="result-grid">
          <div className="field">
            <label className="label">SSID (Network Name)</label>
            <input className="input" value={ssid} onChange={e => setSsid(e.target.value)} placeholder="My Awesome WiFi" />
          </div>
          <div className="field">
            <label className="label">Encryption</label>
            <select className="select" value={encryption} onChange={e => setEncryption(e.target.value)}>
              <option value="WPA">WPA/WPA2/WPA3</option>
              <option value="WEP">WEP</option>
              <option value="nopass">None (Open)</option>
            </select>
          </div>
        </div>
        <div className="two-col">
          <div className="field">
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" disabled={encryption === 'nopass'} />
          </div>
          <div className="field" style={{display:'flex', alignItems:'flex-end', paddingBottom:10}}>
            <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:12, color:'var(--muted)'}}>
              <input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} />
              Hidden Network
            </label>
          </div>
        </div>
      </div>

      <div className="card fadein" style={{display:'flex', flexDirection:'column', alignItems:'center', gap:20, padding:40}}>
        <div className="card-title" style={{alignSelf:'flex-start', marginBottom:0}}>Generated QR Code</div>
        <div style={{
          padding:16, background:'#fff', borderRadius:12, boxShadow:'0 10px 30px rgba(0,0,0,0.2)',
          display:'flex', alignItems:'center', justifyContent:'center', minWidth:288, minHeight:288
        }}>
          {!ssid ? (
            <div style={{color:'#888', textAlign:'center', fontSize:14, maxWidth:200}}>
              Enter an SSID to generate a WiFi QR Code
            </div>
          ) : !qrReady ? (
            <div style={{color:'#888', textAlign:'center', fontSize:14}}>Loading QR Library...</div>
          ) : null}
          <div ref={qrRef} />
        </div>
        {ssid && (
          <div style={{textAlign:'center'}}>
            <div style={{fontWeight:600, fontSize:15, color:'var(--text)'}}>{ssid}</div>
            <div style={{fontSize:12, color:'var(--muted)', marginTop:4}}>{encryption === 'nopass' ? 'Open Network' : encryption}</div>
            <button className="btn btn-ghost btn-sm" style={{marginTop:16}} onClick={() => {
              const canvas = qrRef.current.querySelector('canvas');
              if (canvas) {
                const link = document.createElement('a');
                link.download = `wifi-qr-${ssid}.png`;
                link.href = canvas.toDataURL();
                link.click();
              }
            }}>↓ Download PNG</button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">How to use</div>
        <div style={{fontSize:13, color:'var(--muted)', lineHeight:1.6}}>
          1. Enter your WiFi network name (SSID) and password.<br/>
          2. Select the correct encryption type (usually WPA).<br/>
          3. Point your phone's camera at the QR code.<br/>
          4. Tap the notification to join the network automatically.<br/><br/>
          <strong style={{color:'var(--cyan)'}}>Security Note:</strong> This tool runs entirely in your browser. Your WiFi credentials never leave your computer.
        </div>
      </div>
    </div>
  );
}

// ─── WLAN / 802.11 Planner ──────────────────────────────────────
window.WifiQRCode = WifiQRCode;
