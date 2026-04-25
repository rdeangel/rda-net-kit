const { useState, useEffect, useCallback, useRef, useMemo } = React;

// ─── Helpers ────────────────────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(null);
  const copy = (text, key) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };
  return [copied, copy];
}
window.useCopy = useCopy;

function getRFCUrl(rfc) {
  const m = String(rfc).match(/\d+/);
  return m ? `https://www.rfc-editor.org/rfc/rfc${m[0]}.html` : null;
}
window.getRFCUrl = getRFCUrl;

function RFCLink({ rfc, className }) {
  if (!rfc || rfc === '-') return <span>-</span>;
  const url = getRFCUrl(rfc);
  if (!url) return <span className={className}>{rfc}</span>;
  return (
    <a href={url} target="_blank" rel="noopener" className={className} style={{textDecoration:'none'}}>
      {rfc}
    </a>
  );
}
window.RFCLink = RFCLink;

function CopyBtn({ text, label = 'copy', id }) {
  const [copied, copy] = useCopy();
  return (
    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={() => copy(text, id)}>
      {copied ? '✓' : label}
    </button>
  );
}
window.CopyBtn = CopyBtn;

function ResultItem({ label, value, accent, green, yellow, red }) {
  const cls = accent ? 'accent' : green ? 'green' : yellow ? 'yellow' : red ? 'red' : '';
  const isRFC = label === 'RFC';
  return (
    <div className="result-item">
      <div>
        <div className="result-label">{label}</div>
        <div className={`result-value ${cls}`}>
          {isRFC ? <RFCLink rfc={value} /> : value}
        </div>
      </div>
      <CopyBtn text={String(value)} />
    </div>
  );
}
window.ResultItem = ResultItem;

function Err({ msg }) {
  if (!msg) return null;
  return <div className="err">⚠ {msg}</div>;
}
window.Err = Err;

function exportJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
window.exportJSON = exportJSON;

function exportCSV(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k]}"`).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
window.exportCSV = exportCSV;

function scopeBadge(scope) {
  const map = { Global:'badge-cyan', Private:'badge-green', Host:'badge-yellow', Link:'badge-blue', Docs:'badge-purple', Special:'badge-gray', Reserved:'badge-red', Various:'badge-purple' };
  return <span className={`badge ${map[scope]||'badge-gray'}`}>{scope}</span>;
}
window.scopeBadge = scopeBadge;
