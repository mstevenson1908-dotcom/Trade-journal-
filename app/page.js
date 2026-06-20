"use client";
import { useState, useEffect } from "react";

const SETUPS = ["Breakout", "Pullback", "Trend Continuation", "Support Bounce", "Options Play", "Other"];
const EMOTIONS = ["Calm", "Confident", "Nervous", "FOMO", "Neutral", "Greedy", "Fearful"];

const EMPTY_FORM = {
  date: new Date().toISOString().split("T")[0],
  ticker: "",
  direction: "Long",
  setup: "",
  entryPrice: "",
  exitPrice: "",
  shares: "",
  emotion: "Neutral",
  entryReason: "",
  exitReason: "",
  lesson: "",
};

function calcPnL(entry, exit, shares, direction) {
  const e = parseFloat(entry), x = parseFloat(exit), s = parseFloat(shares);
  if (!e || !x || !s) return null;
  return direction === "Long" ? (x - e) * s : (e - x) * s;
}

function fmt(n, prefix = "$") {
  if (n === null || n === undefined) return "—";
  return `${n >= 0 ? "+" : ""}${prefix}${Math.abs(n).toFixed(2)}`;
}

export default function App() {
  const [trades, setTrades] = useState([]);
  const [view, setView] = useState("journal");
  const [form, setForm] = useState(EMPTY_FORM);
  const [detailId, setDetailId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("trades_v1");
      if (saved) setTrades(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("trades_v1", JSON.stringify(trades));
  }, [trades, loaded]);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveTrade = () => {
    if (!form.ticker || !form.entryPrice) return;
    setTrades(t => [{ ...form, id: Date.now() }, ...t]);
    setForm(EMPTY_FORM);
    setView("journal");
  };

  const deleteTrade = (id) => {
    setTrades(t => t.filter(tr => tr.id !== id));
    setDetailId(null);
  };

  const totalPnL = trades.reduce((a, t) => a + (calcPnL(t.entryPrice, t.exitPrice, t.shares, t.direction) ?? 0), 0);
  const wins = trades.filter(t => (calcPnL(t.entryPrice, t.exitPrice, t.shares, t.direction) ?? -1) > 0).length;
  const winRate = trades.length ? Math.round((wins / trades.length) * 100) : null;
  const previewPnL = calcPnL(form.entryPrice, form.exitPrice, form.shares, form.direction);
  const detailTrade = trades.find(t => t.id === detailId);

  const pnlColor = (val) => val === null ? "#888" : val >= 0 ? "#00e676" : "#ff5252";

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        body { background: #08090d; color: #f0f0f0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif; }
        input, select, textarea { font-family: inherit; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.3); }
        ::placeholder { color: #2a2d38; }
        select option { background: #111318; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", paddingBottom: 90 }}>

        {/* HEADER */}
        <div style={{ padding: "24px 20px 16px", background: "#08090d", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "'SF Mono', 'Courier New', monospace", fontWeight: 700, fontSize: 13, letterSpacing: 3, color: "#3a6fff", textTransform: "uppercase" }}>Trade Journal</div>
              <div style={{ fontSize: 11, color: "#333", marginTop: 3 }}>{trades.length} trades logged</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'SF Mono', monospace", fontWeight: 800, fontSize: 24, color: pnlColor(totalPnL), letterSpacing: -1 }}>
                {fmt(totalPnL)}
              </div>
              {winRate !== null && <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{winRate}% win rate · {wins}W {trades.length - wins}L</div>}
            </div>
          </div>
        </div>

        {/* JOURNAL VIEW */}
        {view === "journal" && !detailId && (
          <div style={{ padding: "0 16px" }}>
            {trades.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "#222" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
                <div style={{ fontFamily: "'SF Mono', monospace", fontSize: 13, color: "#333" }}>No trades yet</div>
                <div style={{ fontSize: 12, color: "#222", marginTop: 6 }}>Tap + to log your first trade</div>
              </div>
            ) : trades.map(t => {
              const pnl = calcPnL(t.entryPrice, t.exitPrice, t.shares, t.direction);
              return (
                <div key={t.id} onClick={() => setDetailId(t.id)} style={{
                  background: "#111318", borderRadius: 14, padding: "14px 16px",
                  marginBottom: 10, border: "1px solid #1a1d26", cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "'SF Mono', monospace", fontWeight: 700, fontSize: 16, color: "#f0f0f0" }}>{t.ticker.toUpperCase()}</span>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: t.direction === "Long" ? "#0d2f1e" : "#2f0d0d", color: t.direction === "Long" ? "#00e676" : "#ff5252", fontWeight: 700 }}>{t.direction}</span>
                      {t.setup && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "#0d1a3a", color: "#6b9fff" }}>{t.setup}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#333", marginTop: 4 }}>{t.date} · {t.emotion}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'SF Mono', monospace", fontWeight: 700, fontSize: 16, color: pnlColor(pnl) }}>{fmt(pnl)}</div>
                    <div style={{ fontSize: 10, color: "#333", marginTop: 2 }}>${parseFloat(t.entryPrice || 0).toFixed(2)} → ${parseFloat(t.exitPrice || 0).toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === "journal" && detailId && detailTrade && (() => {
          const t = detailTrade;
          const pnl = calcPnL(t.entryPrice, t.exitPrice, t.shares, t.direction);
          return (
            <div style={{ padding: "0 16px" }}>
              <button onClick={() => setDetailId(null)} style={{ background: "none", border: "none", color: "#3a6fff", fontSize: 14, cursor: "pointer", padding: "8px 0 16px", display: "flex", alignItems: "center", gap: 6 }}>← Back</button>
              <div style={{ background: "#111318", borderRadius: 16, padding: "20px", border: "1px solid #1a1d26" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: "'SF Mono', monospace", fontWeight: 800, fontSize: 28, color: "#f0f0f0" }}>{t.ticker.toUpperCase()}</div>
                    <div style={{ fontSize: 12, color: "#444", marginTop: 3 }}>{t.date}</div>
                  </div>
                  <div style={{ fontFamily: "'SF Mono', monospace", fontWeight: 800, fontSize: 28, color: pnlColor(pnl) }}>{fmt(pnl)}</div>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  {[{ l: t.direction, c: t.direction === "Long" ? "#00e676" : "#ff5252", bg: t.direction === "Long" ? "#0d2f1e" : "#2f0d0d" },
                    t.setup && { l: t.setup, c: "#6b9fff", bg: "#0d1a3a" },
                    { l: t.emotion, c: "#aaa", bg: "#1a1d26" },
                  ].filter(Boolean).map((tag, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: tag.bg, color: tag.c, fontWeight: 600 }}>{tag.l}</span>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                  {[["Entry", `$${parseFloat(t.entryPrice).toFixed(2)}`], ["Exit", `$${parseFloat(t.exitPrice || 0).toFixed(2)}`], ["Shares", t.shares]].map(([l, v]) => (
                    <div key={l} style={{ background: "#0d0f14", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{l}</div>
                      <div style={{ fontFamily: "'SF Mono', monospace", fontSize: 14, color: "#ddd", fontWeight: 700 }}>{v}</div>
                    </div>
                  ))}
                </div>

                {[["Why I entered", t.entryReason], ["Why I exited", t.exitReason], ["Lesson learned", t.lesson]].map(([label, val]) => val ? (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>{val}</div>
                  </div>
                ) : null)}

                <button onClick={() => deleteTrade(t.id)} style={{
                  marginTop: 8, width: "100%", padding: "12px", borderRadius: 10,
                  border: "1px solid #2f0d0d", background: "transparent", color: "#ff5252",
                  fontSize: 13, cursor: "pointer", fontWeight: 600,
                }}>Delete Trade</button>
              </div>
            </div>
          );
        })()}

        {/* LOG TRADE FORM */}
        {view === "log" && (
          <div style={{ padding: "0 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", marginBottom: 16 }}>New Trade</div>

            {[
              { label: "Date & Ticker", content: (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={lbl}>Date</div>
                    <input type="date" value={form.date} onChange={e => setF("date", e.target.value)} style={inp} />
                  </div>
                  <div>
                    <div style={lbl}>Ticker</div>
                    <input placeholder="SPY, AAPL..." value={form.ticker} onChange={e => setF("ticker", e.target.value.toUpperCase())} style={inp} />
                  </div>
                </div>
              )},
              { label: "Direction", content: (
                <div style={{ display: "flex", gap: 8 }}>
                  {["Long", "Short"].map(d => (
                    <button key={d} onClick={() => setF("direction", d)} style={{
                      flex: 1, padding: "12px", borderRadius: 10, border: "1px solid",
                      borderColor: form.direction === d ? (d === "Long" ? "#00e676" : "#ff5252") : "#1a1d26",
                      background: form.direction === d ? (d === "Long" ? "#0d2f1e" : "#2f0d0d") : "transparent",
                      color: form.direction === d ? (d === "Long" ? "#00e676" : "#ff5252") : "#333",
                      fontWeight: 700, fontSize: 14, cursor: "pointer",
                    }}>{d}</button>
                  ))}
                </div>
              )},
              { label: "Prices & Size", content: (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[["Entry $", "entryPrice", "0.00"], ["Exit $", "exitPrice", "0.00"], ["Shares", "shares", "10"]].map(([l, k, ph]) => (
                      <div key={k}>
                        <div style={lbl}>{l}</div>
                        <input type="number" placeholder={ph} value={form[k]} onChange={e => setF(k, e.target.value)} style={inp} />
                      </div>
                    ))}
                  </div>
                  {previewPnL !== null && (
                    <div style={{ marginTop: 10, textAlign: "center", padding: "10px", background: "#0d0f14", borderRadius: 10 }}>
                      <span style={{ fontSize: 11, color: "#333" }}>P&L Preview  </span>
                      <span style={{ fontFamily: "'SF Mono', monospace", fontWeight: 800, fontSize: 16, color: pnlColor(previewPnL) }}>{fmt(previewPnL)}</span>
                    </div>
                  )}
                </>
              )},
              { label: "Setup", content: (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {SETUPS.map(s => (
                    <button key={s} onClick={() => setF("setup", s)} style={{
                      padding: "7px 12px", borderRadius: 20, border: "1px solid",
                      borderColor: form.setup === s ? "#3a6fff" : "#1a1d26",
                      background: form.setup === s ? "#0d1a3a" : "transparent",
                      color: form.setup === s ? "#6b9fff" : "#333",
                      fontSize: 12, cursor: "pointer", fontWeight: 600,
                    }}>{s}</button>
                  ))}
                </div>
              )},
              { label: "Emotion", content: (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {EMOTIONS.map(em => (
                    <button key={em} onClick={() => setF("emotion", em)} style={{
                      padding: "7px 12px", borderRadius: 20, border: "1px solid",
                      borderColor: form.emotion === em ? "#3a6fff" : "#1a1d26",
                      background: form.emotion === em ? "#0d1a3a" : "transparent",
                      color: form.emotion === em ? "#6b9fff" : "#333",
                      fontSize: 12, cursor: "pointer", fontWeight: 600,
                    }}>{em}</button>
                  ))}
                </div>
              )},
              { label: "Notes", content: (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[["Why I entered", "entryReason", "What was the signal?"], ["Why I exited", "exitReason", "Hit target? Stop loss?"], ["Lesson learned", "lesson", "What would I do differently?"]].map(([l, k, ph]) => (
                    <div key={k}>
                      <div style={lbl}>{l}</div>
                      <textarea placeholder={ph} value={form[k]} onChange={e => setF(k, e.target.value)}
                        style={{ ...inp, resize: "none", minHeight: 64, lineHeight: 1.5 }} />
                    </div>
                  ))}
                </div>
              )},
            ].map(section => (
              <div key={section.label} style={{ background: "#111318", borderRadius: 14, padding: "16px", marginBottom: 10, border: "1px solid #1a1d26" }}>
                <div style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, fontWeight: 700 }}>{section.label}</div>
                {section.content}
              </div>
            ))}

            <button onClick={saveTrade} style={{
              width: "100%", padding: "16px", borderRadius: 14, border: "none",
              background: form.ticker && form.entryPrice ? "#3a6fff" : "#1a1d26",
              color: form.ticker && form.entryPrice ? "#fff" : "#333",
              fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 16,
            }}>Save Trade</button>
          </div>
        )}

        {/* STATS VIEW */}
        {view === "stats" && (
          <div style={{ padding: "0 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", marginBottom: 16 }}>Performance</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                ["Total P&L", fmt(totalPnL), pnlColor(totalPnL)],
                ["Win Rate", winRate !== null ? `${winRate}%` : "—", "#f0f0f0"],
                ["Total Trades", trades.length, "#f0f0f0"],
                ["Wins / Losses", `${wins} / ${trades.length - wins}`, "#f0f0f0"],
                ["Best Trade", fmt(trades.length ? Math.max(...trades.map(t => calcPnL(t.entryPrice, t.exitPrice, t.shares, t.direction) ?? 0)) : 0), "#00e676"],
                ["Worst Trade", fmt(trades.length ? Math.min(...trades.map(t => calcPnL(t.entryPrice, t.exitPrice, t.shares, t.direction) ?? 0)) : 0), "#ff5252"],
              ].map(([label, val, color]) => (
                <div key={label} style={{ background: "#111318", borderRadius: 14, padding: "16px", border: "1px solid #1a1d26" }}>
                  <div style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{label}</div>
                  <div style={{ fontFamily: "'SF Mono', monospace", fontWeight: 800, fontSize: 20, color }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Emotion breakdown */}
            <div style={{ background: "#111318", borderRadius: 14, padding: "16px", border: "1px solid #1a1d26", marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14, fontWeight: 700 }}>Win Rate by Emotion</div>
              {EMOTIONS.map(em => {
                const emTrades = trades.filter(t => t.emotion === em);
                const emWins = emTrades.filter(t => (calcPnL(t.entryPrice, t.exitPrice, t.shares, t.direction) ?? -1) > 0).length;
                const wr = emTrades.length ? Math.round((emWins / emTrades.length) * 100) : null;
                return (
                  <div key={em} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1a1d26" }}>
                    <div style={{ fontSize: 12, color: "#aaa" }}>{em}</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#333" }}>{emTrades.length} trades</span>
                      <span style={{ fontFamily: "'SF Mono', monospace", fontWeight: 700, fontSize: 13, color: wr === null ? "#333" : wr >= 50 ? "#00e676" : "#ff5252" }}>
                        {wr === null ? "—" : `${wr}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Setup breakdown */}
            <div style={{ background: "#111318", borderRadius: 14, padding: "16px", border: "1px solid #1a1d26" }}>
              <div style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14, fontWeight: 700 }}>Win Rate by Setup</div>
              {SETUPS.map(s => {
                const sTrades = trades.filter(t => t.setup === s);
                const sWins = sTrades.filter(t => (calcPnL(t.entryPrice, t.exitPrice, t.shares, t.direction) ?? -1) > 0).length;
                const wr = sTrades.length ? Math.round((sWins / sTrades.length) * 100) : null;
                return (
                  <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1a1d26" }}>
                    <div style={{ fontSize: 12, color: "#aaa" }}>{s}</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#333" }}>{sTrades.length} trades</span>
                      <span style={{ fontFamily: "'SF Mono', monospace", fontWeight: 700, fontSize: 13, color: wr === null ? "#333" : wr >= 50 ? "#00e676" : "#ff5252" }}>
                        {wr === null ? "—" : `${wr}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#08090d", borderTop: "1px solid #1a1d26",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "10px 0 24px", maxWidth: 480, margin: "0 auto",
        left: "50%", transform: "translateX(-50%)", width: "100%",
      }}>
        {[
          { id: "journal", icon: "📒", label: "Journal" },
          { id: "log", icon: "＋", label: "Log Trade", big: true },
          { id: "stats", icon: "📊", label: "Stats" },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setView(tab.id); setDetailId(null); }} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer", padding: "4px 0",
          }}>
            <span style={{
              fontSize: tab.big ? 22 : 20,
              ...(tab.big ? {
                background: "#3a6fff", borderRadius: "50%", width: 44, height: 44,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, color: "#fff", marginTop: -10,
              } : {}),
            }}>{tab.icon}</span>
            <span style={{ fontSize: 10, color: view === tab.id ? "#3a6fff" : "#333", fontWeight: 600 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

const lbl = { fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, fontWeight: 700 };
const inp = {
  width: "100%", background: "#0d0f14", border: "1px solid #1a1d26",
  borderRadius: 10, color: "#f0f0f0", fontSize: 14, padding: "11px 12px", outline: "none",
};
