import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "trading-journal-trades";

const initialForm = {
  date: new Date().toISOString().split("T")[0],
  instrument: "NQ",
  direction: "LONG",
  entry: "",
  stop: "",
  target: "",
  result: "",
  rrPlanned: "",
  rrReal: "",
  screenshot: null,
  screenshotPreview: null,
  notes: "",
  emotion: "NEUTRAL",
  outcome: "WIN",
};

const emotionColors = {
  FOMO: "#ff6b35",
  REVENGE: "#e63946",
  CALM: "#06d6a0",
  CONFIDENT: "#118ab2",
  NEUTRAL: "#8ecae6",
  FEARFUL: "#ffd166",
};

const outcomeColors = {
  WIN: "#06d6a0",
  LOSS: "#e63946",
  BE: "#ffd166",
};

export default function TradingJournal() {
  const [trades, setTrades] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [view, setView] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    loadTrades();
  }, []);

  async function loadTrades() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setTrades(JSON.parse(stored));
    } catch (e) {}
    setLoading(false);
  }

  async function saveTrades(newTrades) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTrades));
    } catch (e) {}
  }

  function calcRR(entry, stop, target) {
    const e = parseFloat(entry), s = parseFloat(stop), t = parseFloat(target);
    if (!e || !s || !t) return "";
    const risk = Math.abs(e - s);
    const reward = Math.abs(t - e);
    if (risk === 0) return "";
    return (reward / risk).toFixed(2);
  }

  function handleFormChange(field, value) {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (["entry", "stop", "target"].includes(field)) {
        updated.rrPlanned = calcRR(updated.entry, updated.stop, updated.target);
      }
      return updated;
    });
  }

  function handleScreenshot(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(prev => ({ ...prev, screenshot: ev.target.result, screenshotPreview: ev.target.result }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    const trade = { ...form, id: Date.now() };
    const updated = [trade, ...trades];
    setTrades(updated);
    await saveTrades(updated);
    setForm({ ...initialForm, date: form.date });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setView("dashboard");
  }

  async function deleteTrade(id) {
    const updated = trades.filter(t => t.id !== id);
    setTrades(updated);
    await saveTrades(updated);
  }

  const todayTrades = trades.filter(t => t.date === selectedDate);
  const wins = todayTrades.filter(t => t.outcome === "WIN").length;
  const losses = todayTrades.filter(t => t.outcome === "LOSS").length;
  const bes = todayTrades.filter(t => t.outcome === "BE").length;
  const winRate = todayTrades.length > 0 ? ((wins / todayTrades.length) * 100).toFixed(0) : 0;
  const totalPnL = todayTrades.reduce((acc, t) => acc + (parseFloat(t.result) || 0), 0);
  const allWins = trades.filter(t => t.outcome === "WIN").length;
  const globalWR = trades.length > 0 ? ((allWins / trades.length) * 100).toFixed(0) : 0;
  const avgRRPlanned = trades.length > 0
    ? (trades.reduce((a, t) => a + (parseFloat(t.rrPlanned) || 0), 0) / trades.length).toFixed(2)
    : 0;

  if (loading) return (
    <div style={{ background: "#080c14", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#00f5c4", fontFamily: "monospace", fontSize: 18, letterSpacing: 4 }}>LOADING...</div>
    </div>
  );

  return (
    <div style={{ background: "#080c14", minHeight: "100vh", fontFamily: "'Courier New', monospace", color: "#e0e6f0", padding: "0 0 80px 0" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(0,245,196,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,196,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, padding: "24px 20px 16px", borderBottom: "1px solid rgba(0,245,196,0.15)", background: "rgba(8,12,20,0.95)", backdropFilter: "blur(10px)", position: "sticky", top: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, color: "#00f5c4", letterSpacing: 4, marginBottom: 2 }}>FUNDED NEXT FLEX</div>
            <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 2, color: "#fff" }}>TRADE JOURNAL</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#666", letterSpacing: 2 }}>GLOBAL WR</div>
            <div style={{ fontSize: 28, fontWeight: "bold", color: parseFloat(globalWR) >= 60 ? "#06d6a0" : parseFloat(globalWR) >= 50 ? "#ffd166" : "#e63946" }}>{globalWR}%</div>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "0 16px" }}>
        <div style={{ display: "flex", gap: 4, margin: "16px 0", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 4 }}>
          {["dashboard", "add", "history"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 6, background: view === v ? "#00f5c4" : "transparent", color: view === v ? "#080c14" : "#888", fontFamily: "monospace", fontWeight: "bold", fontSize: 11, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase" }}>
              {v === "add" ? "+ TRADE" : v}
            </button>
          ))}
        </div>

        {view === "dashboard" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,245,196,0.2)", borderRadius: 8, color: "#00f5c4", fontFamily: "monospace", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[
                { label: "WIN RATE", value: `${winRate}%`, color: parseFloat(winRate) >= 60 ? "#06d6a0" : parseFloat(winRate) >= 50 ? "#ffd166" : "#e63946" },
                { label: "TRADES", value: todayTrades.length, color: "#8ecae6" },
                { label: "P&L $", value: totalPnL >= 0 ? `+${totalPnL.toFixed(0)}` : totalPnL.toFixed(0), color: totalPnL >= 0 ? "#06d6a0" : "#e63946" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
              {[{ l: "WINS", v: wins, c: "#06d6a0" }, { l: "LOSS", v: losses, c: "#e63946" }, { l: "B/E", v: bes, c: "#ffd166" }].map(x => (
                <div key={x.l} style={{ background: `rgba(${x.c === "#06d6a0" ? "6,214,160" : x.c === "#e63946" ? "230,57,70" : "255,209,102"},0.08)`, border: `1px solid ${x.c}33`, borderRadius: 8, padding: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: x.c, letterSpacing: 2, opacity: 0.8 }}>{x.l}</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: x.c }}>{x.v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 3, marginBottom: 10 }}>SESIÓN DE HOY</div>
            {todayTrades.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#333", fontSize: 13, letterSpacing: 2 }}>NO HAY TRADES REGISTRADOS</div>
            ) : (
              todayTrades.map(trade => <TradeCard key={trade.id} trade={trade} onDelete={deleteTrade} />)
            )}
            {trades.length > 0 && (
              <div style={{ marginTop: 24, padding: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,245,196,0.1)", borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: "#555", letterSpacing: 3, marginBottom: 12 }}>STATS GLOBALES ({trades.length} trades)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Stat label="Win Rate Global" value={`${globalWR}%`} color={parseFloat(globalWR) >= 60 ? "#06d6a0" : "#ffd166"} />
                  <Stat label="R:R Promedio" value={`1:${avgRRPlanned}`} color="#8ecae6" />
                  <Stat label="Total Trades" value={trades.length} color="#8ecae6" />
                  <Stat label="P&L Total" value={`$${trades.reduce((a, t) => a + (parseFloat(t.result) || 0), 0).toFixed(0)}`} color={trades.reduce((a, t) => a + (parseFloat(t.result) || 0), 0) >= 0 ? "#06d6a0" : "#e63946"} />
                </div>
              </div>
            )}
          </div>
        )}

        {view === "add" && (
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 3, marginBottom: 14 }}>REGISTRAR TRADE</div>
            <Field label="FECHA"><input type="date" value={form.date} onChange={e => handleFormChange("date", e.target.value)} style={inputStyle} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="INSTRUMENTO">
                <select value={form.instrument} onChange={e => handleFormChange("instrument", e.target.value)} style={inputStyle}>
                  {["NQ", "ES", "MNQ", "MES", "RTY", "YM"].map(i => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="DIRECCIÓN">
                <select value={form.direction} onChange={e => handleFormChange("direction", e.target.value)} style={inputStyle}>
                  <option>LONG</option><option>SHORT</option>
                </select>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Field label="ENTRY"><input type="number" value={form.entry} onChange={e => handleFormChange("entry", e.target.value)} placeholder="0.00" style={inputStyle} /></Field>
              <Field label="STOP"><input type="number" value={form.stop} onChange={e => handleFormChange("stop", e.target.value)} placeholder="0.00" style={inputStyle} /></Field>
              <Field label="TARGET"><input type="number" value={form.target} onChange={e => handleFormChange("target", e.target.value)} placeholder="0.00" style={inputStyle} /></Field>
            </div>
            {form.rrPlanned && (
              <div style={{ padding: "10px 14px", marginBottom: 12, background: "rgba(0,245,196,0.08)", border: "1px solid rgba(0,245,196,0.2)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#666", letterSpacing: 2 }}>R:R PLANEADO</span>
                <span style={{ color: "#00f5c4", fontWeight: "bold", fontSize: 16 }}>1:{form.rrPlanned}</span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="RESULTADO ($)"><input type="number" value={form.result} onChange={e => handleFormChange("result", e.target.value)} placeholder="+/-" style={inputStyle} /></Field>
              <Field label="OUTCOME">
                <select value={form.outcome} onChange={e => handleFormChange("outcome", e.target.value)} style={inputStyle}>
                  <option>WIN</option><option>LOSS</option><option>BE</option>
                </select>
              </Field>
            </div>
            <Field label="EMOCIÓN PRE-TRADE">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.keys(emotionColors).map(em => (
                  <button key={em} onClick={() => handleFormChange("emotion", em)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${emotionColors[em]}`, background: form.emotion === em ? emotionColors[em] : "transparent", color: form.emotion === em ? "#080c14" : emotionColors[em], fontFamily: "monospace", fontSize: 10, fontWeight: "bold", cursor: "pointer", letterSpacing: 1 }}>{em}</button>
                ))}
              </div>
            </Field>
            <Field label="SCREENSHOT DEL CHART">
              <div onClick={() => fileRef.current.click()} style={{ border: "2px dashed rgba(0,245,196,0.2)", borderRadius: 10, padding: form.screenshotPreview ? 0 : "30px 0", textAlign: "center", cursor: "pointer", overflow: "hidden" }}>
                {form.screenshotPreview ? (
                  <img src={form.screenshotPreview} alt="chart" style={{ width: "100%", borderRadius: 8, display: "block" }} />
                ) : (
                  <div><div style={{ fontSize: 24, marginBottom: 8 }}>📸</div><div style={{ fontSize: 11, color: "#555", letterSpacing: 2 }}>SUBIR SCREENSHOT</div></div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleScreenshot} style={{ display: "none" }} />
            </Field>
            <Field label="NOTAS / SETUP">
              <textarea value={form.notes} onChange={e => handleFormChange("notes", e.target.value)} placeholder="Describe el setup, confluencias ICT, por qué entraste..." rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
            </Field>
            <button onClick={handleSubmit} style={{ width: "100%", padding: "16px", marginTop: 8, background: "#00f5c4", border: "none", borderRadius: 10, color: "#080c14", fontFamily: "monospace", fontWeight: "bold", fontSize: 14, letterSpacing: 3, cursor: "pointer" }}>
              {saved ? "✓ GUARDADO" : "GUARDAR TRADE"}
            </button>
          </div>
        )}

        {view === "history" && (
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 3, marginBottom: 14 }}>HISTORIAL — {trades.length} TRADES</div>
            {trades.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#333", fontSize: 13, letterSpacing: 2 }}>NO HAY TRADES AÚN</div>
            ) : (
              trades.map(trade => <TradeCard key={trade.id} trade={trade} onDelete={deleteTrade} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TradeCard({ trade, onDelete }) {
  const [open, setOpen] = useState(false);
  const oc = outcomeColors[trade.outcome] || "#888";
  const ec = emotionColors[trade.emotion] || "#888";
  const pnl = parseFloat(trade.result) || 0;
  return (
    <div style={{ marginBottom: 10, borderRadius: 10, overflow: "hidden", border: `1px solid ${oc}33`, background: "rgba(255,255,255,0.03)" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: oc, flexShrink: 0, boxShadow: `0 0 6px ${oc}` }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: "bold", color: "#fff" }}>{trade.instrument} · {trade.direction}</div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1, marginTop: 2 }}>{trade.date}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: "bold", color: pnl >= 0 ? "#06d6a0" : "#e63946" }}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(0)}$</div>
          {trade.rrPlanned && <div style={{ fontSize: 9, color: "#555", letterSpacing: 1 }}>R:R 1:{trade.rrPlanned}</div>}
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
            {[{ l: "ENTRY", v: trade.entry || "—" }, { l: "STOP", v: trade.stop || "—" }, { l: "TARGET", v: trade.target || "—" }].map(x => (
              <div key={x.l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "8px", textAlign: "center" }}>
                <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 4 }}>{x.l}</div>
                <div style={{ fontSize: 12, color: "#ccc" }}>{x.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1, background: `${ec}15`, border: `1px solid ${ec}33`, borderRadius: 6, padding: "8px", textAlign: "center" }}>
              <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 4 }}>EMOCIÓN</div>
              <div style={{ fontSize: 11, color: ec, fontWeight: "bold" }}>{trade.emotion}</div>
            </div>
            <div style={{ flex: 1, background: `${oc}15`, border: `1px solid ${oc}33`, borderRadius: 6, padding: "8px", textAlign: "center" }}>
              <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 4 }}>OUTCOME</div>
              <div style={{ fontSize: 11, color: oc, fontWeight: "bold" }}>{trade.outcome}</div>
            </div>
          </div>
          {trade.notes && (
            <div style={{ marginTop: 10, padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
              <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 6 }}>NOTAS</div>
              <div style={{ fontSize: 11, color: "#aaa", lineHeight: 1.6 }}>{trade.notes}</div>
            </div>
          )}
          {trade.screenshot && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 6 }}>SCREENSHOT</div>
              <img src={trade.screenshot} alt="chart" style={{ width: "100%", borderRadius: 8 }} />
            </div>
          )}
          <button onClick={() => onDelete(trade.id)} style={{ marginTop: 12, width: "100%", padding: "8px", background: "transparent", border: "1px solid #e6394633", borderRadius: 6, color: "#e63946", fontFamily: "monospace", fontSize: 10, letterSpacing: 2, cursor: "pointer" }}>
            ELIMINAR TRADE
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 9, color: "#555", letterSpacing: 3, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: "bold", color }}>{value}</div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#e0e6f0",
  fontFamily: "monospace", fontSize: 13,
  outline: "none", boxSizing: "border-box",
};
