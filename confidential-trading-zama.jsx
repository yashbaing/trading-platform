import { useState, useEffect, useRef, useCallback } from "react";

// ─── Zama Protocol Confidential Trading System ─────────────────────────
// A full-featured dashboard demonstrating confidential DeFi trading
// powered by Fully Homomorphic Encryption (FHE) on the Zama Protocol.

const COLORS = {
  bg: "#0A0E17",
  surface: "#111827",
  card: "#1A2234",
  cardHover: "#1E2A40",
  accent: "#00D4AA",
  accentDim: "#00D4AA33",
  accentGlow: "#00D4AA55",
  warning: "#FBBF24",
  danger: "#EF4444",
  text: "#E5E7EB",
  textDim: "#9CA3AF",
  textMuted: "#6B7280",
  border: "#1F2937",
  fhe: "#8B5CF6",
  fheDim: "#8B5CF622",
  zk: "#3B82F6",
  zkDim: "#3B82F622",
  mpc: "#EC4899",
  mpcDim: "#EC489922",
};

// ─── Simulated encrypted data ───────────────────────────────────────────
const generateEncryptedHash = () => "0x" + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
const generateCiphertext = () => "ct_" + Array.from({ length: 12 }, () => Math.floor(Math.random() * 36).toString(36)).join("");

const TRADING_PAIRS = [
  { pair: "ETH/USDC", basePrice: 3842.5, volume24h: 284000000, change: 2.34 },
  { pair: "BTC/USDC", basePrice: 97250.0, volume24h: 1200000000, change: -0.87 },
  { pair: "ZAMA/ETH", basePrice: 0.0234, volume24h: 45000000, change: 12.5 },
  { pair: "SOL/USDC", basePrice: 187.3, volume24h: 520000000, change: 4.12 },
  { pair: "MATIC/ETH", basePrice: 0.00032, volume24h: 89000000, change: -1.23 },
];

const CONFIDENTIAL_ORDERS = [
  { id: 1, type: "BUY", pair: "ETH/USDC", status: "encrypted", cipher: generateCiphertext(), zkProof: "verified", timestamp: Date.now() - 120000 },
  { id: 2, type: "SELL", pair: "BTC/USDC", status: "pending_decrypt", cipher: generateCiphertext(), zkProof: "pending", timestamp: Date.now() - 60000 },
  { id: 3, type: "BUY", pair: "ZAMA/ETH", status: "executed", cipher: generateCiphertext(), zkProof: "verified", timestamp: Date.now() - 30000 },
  { id: 4, type: "SELL", pair: "SOL/USDC", status: "encrypted", cipher: generateCiphertext(), zkProof: "verified", timestamp: Date.now() - 15000 },
  { id: 5, type: "BUY", pair: "ETH/USDC", status: "executed", cipher: generateCiphertext(), zkProof: "verified", timestamp: Date.now() - 5000 },
];

const PROTOCOL_STATS = [
  { label: "FHE Computations", value: "2.4M", sub: "Last 24h", icon: "🔐" },
  { label: "ZK Proofs Verified", value: "847K", sub: "Last 24h", icon: "✓" },
  { label: "Active Coprocessors", value: "5", sub: "of 5 nodes", icon: "⚡" },
  { label: "KMS Nodes", value: "13", sub: "2/3 threshold", icon: "🗝️" },
];

// ─── Animated Particles ─────────────────────────────────────────────────
function CryptoParticles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1, alpha: Math.random() * 0.5 + 0.1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 170, ${p.alpha})`;
        ctx.fill();
      });
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 212, 170, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.6 }} />;
}

// ─── Encryption Animation ───────────────────────────────────────────────
function EncryptionStream({ active }) {
  const [chars, setChars] = useState([]);
  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => {
      setChars((prev) => {
        const next = [...prev, { id: Date.now(), char: Math.random().toString(36).charAt(2), x: Math.random() * 100 }];
        return next.slice(-20);
      });
    }, 100);
    return () => clearInterval(iv);
  }, [active]);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {chars.map((c) => (
        <span key={c.id} style={{
          position: "absolute", left: `${c.x}%`, fontFamily: "'Courier New', monospace",
          fontSize: 10, color: COLORS.accent, opacity: 0, animation: "fallChar 2s forwards",
        }}>{c.char}</span>
      ))}
    </div>
  );
}

// ─── Price Chart (SVG) ──────────────────────────────────────────────────
function MiniChart({ data, color = COLORS.accent, w = 120, h = 40 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#grad-${color.replace("#","")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── FHE Operation Visualizer ───────────────────────────────────────────
function FHEPipeline({ stage }) {
  const stages = ["Input Encryption", "ZK Proof Gen", "FHE Compute", "Threshold Decrypt", "Result"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "12px 0" }}>
      {stages.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
          <div style={{
            flex: 1, padding: "8px 6px", borderRadius: 6, textAlign: "center",
            fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
            background: i <= stage ? COLORS.accentDim : COLORS.card,
            border: `1px solid ${i <= stage ? COLORS.accent : COLORS.border}`,
            color: i <= stage ? COLORS.accent : COLORS.textMuted,
            transition: "all 0.4s ease",
            boxShadow: i === stage ? `0 0 12px ${COLORS.accentGlow}` : "none",
          }}>{s}</div>
          {i < stages.length - 1 && (
            <span style={{ color: i < stage ? COLORS.accent : COLORS.textMuted, fontSize: 12 }}>→</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────
export default function ConfidentialTradingDashboard() {
  const [activeTab, setActiveTab] = useState("trade");
  const [selectedPair, setSelectedPair] = useState(0);
  const [orderType, setOrderType] = useState("BUY");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [pipelineStage, setPipelineStage] = useState(-1);
  const [priceHistory, setPriceHistory] = useState({});
  const [orders, setOrders] = useState(CONFIDENTIAL_ORDERS);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddr, setWalletAddr] = useState("");
  const [tick, setTick] = useState(0);

  // Simulate live price updates
  useEffect(() => {
    const iv = setInterval(() => {
      setTick((t) => t + 1);
      setPriceHistory((prev) => {
        const next = { ...prev };
        TRADING_PAIRS.forEach((tp) => {
          const arr = next[tp.pair] || Array.from({ length: 30 }, () => tp.basePrice);
          const last = arr[arr.length - 1];
          const change = last * (Math.random() - 0.5) * 0.004;
          next[tp.pair] = [...arr.slice(-29), last + change];
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const currentPrices = TRADING_PAIRS.map((tp) => {
    const hist = priceHistory[tp.pair];
    return hist ? hist[hist.length - 1] : tp.basePrice;
  });

  const connectWallet = useCallback(() => {
    setWalletConnected(true);
    setWalletAddr("0x" + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("") + "...a4F9");
  }, []);

  const submitOrder = useCallback(() => {
    if (!amount || !walletConnected) return;
    setIsEncrypting(true);
    setPipelineStage(0);
    const stages = [0, 1, 2, 3, 4];
    stages.forEach((s, i) => {
      setTimeout(() => {
        setPipelineStage(s);
        if (s === 4) {
          setTimeout(() => {
            setOrders((prev) => [{
              id: Date.now(), type: orderType, pair: TRADING_PAIRS[selectedPair].pair,
              status: "executed", cipher: generateCiphertext(), zkProof: "verified", timestamp: Date.now(),
            }, ...prev]);
            setIsEncrypting(false);
            setPipelineStage(-1);
            setAmount("");
            setPrice("");
          }, 800);
        }
      }, (i + 1) * 900);
    });
  }, [amount, walletConnected, orderType, selectedPair]);

  const tabs = [
    { id: "trade", label: "Confidential Trade" },
    { id: "orders", label: "Encrypted Orders" },
    { id: "protocol", label: "Protocol Status" },
    { id: "about", label: "Architecture" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg, color: COLORS.text,
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes fallChar { 0% { opacity:0.8; transform:translateY(0); } 100% { opacity:0; transform:translateY(100px); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 8px ${COLORS.accentGlow}; } 50% { box-shadow: 0 0 20px ${COLORS.accentGlow}; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${COLORS.bg}; } ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
      `}</style>

      <CryptoParticles />

      {/* ─── Header ─────────────────────────────────────────── */}
      <header style={{
        position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px", borderBottom: `1px solid ${COLORS.border}`,
        background: `${COLORS.surface}CC`, backdropFilter: "blur(16px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.fhe})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700,
          }}>Z</div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>
              Zama <span style={{ color: COLORS.accent }}>Confidential</span> Trading
            </div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, letterSpacing: 1 }}>FHE-POWERED ENCRYPTED EXCHANGE</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: COLORS.textDim }}>Mainnet Live</span>
          </div>
          <button onClick={connectWallet} style={{
            padding: "8px 16px", borderRadius: 8, border: walletConnected ? `1px solid ${COLORS.accent}` : "1px solid transparent",
            background: walletConnected ? COLORS.accentDim : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.fhe})`,
            color: walletConnected ? COLORS.accent : "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit", transition: "all 0.3s",
          }}>
            {walletConnected ? `🔗 ${walletAddr}` : "Connect Wallet"}
          </button>
        </div>
      </header>

      {/* ─── Navigation ─────────────────────────────────────── */}
      <nav style={{
        position: "relative", zIndex: 10, display: "flex", gap: 2, padding: "0 24px",
        borderBottom: `1px solid ${COLORS.border}`, background: `${COLORS.surface}99`,
      }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "12px 20px", fontSize: 12, fontWeight: 500, cursor: "pointer",
            background: "transparent", border: "none", fontFamily: "inherit",
            color: activeTab === t.id ? COLORS.accent : COLORS.textMuted,
            borderBottom: activeTab === t.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
            transition: "all 0.2s",
          }}>{t.label}</button>
        ))}
      </nav>

      {/* ─── Content ────────────────────────────────────────── */}
      <main style={{ position: "relative", zIndex: 10, padding: 24, maxWidth: 1280, margin: "0 auto" }}>

        {/* ═══ TRADE TAB ═══ */}
        {activeTab === "trade" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, animation: "slideUp 0.4s ease" }}>
            {/* Market Overview */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Pair Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                {TRADING_PAIRS.map((tp, i) => (
                  <div key={tp.pair} onClick={() => setSelectedPair(i)} style={{
                    padding: 16, borderRadius: 12, cursor: "pointer",
                    background: selectedPair === i ? COLORS.cardHover : COLORS.card,
                    border: `1px solid ${selectedPair === i ? COLORS.accent : COLORS.border}`,
                    transition: "all 0.3s",
                    boxShadow: selectedPair === i ? `0 0 16px ${COLORS.accentGlow}` : "none",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{tp.pair}</span>
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4,
                        background: tp.change >= 0 ? "#22C55E22" : "#EF444422",
                        color: tp.change >= 0 ? "#22C55E" : "#EF4444",
                      }}>{tp.change >= 0 ? "+" : ""}{tp.change}%</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                      ${currentPrices[i]?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <MiniChart data={priceHistory[tp.pair]} color={tp.change >= 0 ? "#22C55E" : "#EF4444"} />
                    <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 6 }}>
                      Vol: ${(tp.volume24h / 1e6).toFixed(0)}M
                    </div>
                  </div>
                ))}
              </div>

              {/* FHE Pipeline */}
              {isEncrypting && (
                <div style={{
                  padding: 20, borderRadius: 12, background: COLORS.card, border: `1px solid ${COLORS.border}`,
                  animation: "glow 2s infinite",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: COLORS.fhe }}>
                    🔐 FHE Transaction Pipeline
                  </div>
                  <FHEPipeline stage={pipelineStage} />
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 8 }}>
                    Ciphertext: {generateCiphertext()} | Security: 128-bit post-quantum
                  </div>
                </div>
              )}

              {/* Recent Encrypted Orders */}
              <div style={{ padding: 20, borderRadius: 12, background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, fontFamily: "'Space Grotesk', sans-serif" }}>
                  Recent Encrypted Orders
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {orders.slice(0, 6).map((o) => (
                    <div key={o.id} style={{
                      display: "grid", gridTemplateColumns: "60px 90px 1fr 100px 80px", gap: 8, alignItems: "center",
                      padding: "10px 12px", borderRadius: 8, background: COLORS.surface, fontSize: 11,
                    }}>
                      <span style={{
                        fontWeight: 700, color: o.type === "BUY" ? "#22C55E" : "#EF4444",
                        padding: "2px 8px", borderRadius: 4,
                        background: o.type === "BUY" ? "#22C55E15" : "#EF444415", textAlign: "center",
                      }}>{o.type}</span>
                      <span style={{ fontWeight: 500 }}>{o.pair}</span>
                      <span style={{ color: COLORS.textMuted, fontFamily: "monospace", fontSize: 10 }}>
                        {o.cipher.slice(0, 20)}...
                      </span>
                      <span style={{
                        textAlign: "center", fontSize: 10, padding: "2px 6px", borderRadius: 4,
                        background: o.status === "executed" ? "#22C55E15" : o.status === "encrypted" ? COLORS.fheDim : COLORS.warning + "22",
                        color: o.status === "executed" ? "#22C55E" : o.status === "encrypted" ? COLORS.fhe : COLORS.warning,
                      }}>
                        {o.status === "encrypted" ? "🔐 Encrypted" : o.status === "executed" ? "✓ Executed" : "⏳ Pending"}
                      </span>
                      <span style={{
                        textAlign: "center", fontSize: 10,
                        color: o.zkProof === "verified" ? COLORS.zk : COLORS.warning,
                      }}>
                        ZK: {o.zkProof === "verified" ? "✓" : "⏳"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── Order Panel ─────────────────────────────────── */}
            <div style={{ position: "relative" }}>
              <EncryptionStream active={isEncrypting} />
              <div style={{
                padding: 24, borderRadius: 16, background: COLORS.card, border: `1px solid ${COLORS.border}`,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>
                  Confidential Order
                </div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 20 }}>
                  End-to-end encrypted via FHE • ZK-verified inputs
                </div>

                {/* Buy/Sell Toggle */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 20, background: COLORS.surface, borderRadius: 8, padding: 3 }}>
                  {["BUY", "SELL"].map((t) => (
                    <button key={t} onClick={() => setOrderType(t)} style={{
                      padding: "10px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit",
                      fontSize: 13, fontWeight: 700,
                      background: orderType === t ? (t === "BUY" ? "#22C55E" : "#EF4444") : "transparent",
                      color: orderType === t ? "#fff" : COLORS.textMuted, transition: "all 0.2s",
                    }}>{t}</button>
                  ))}
                </div>

                {/* Pair Display */}
                <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>Trading Pair</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {TRADING_PAIRS[selectedPair].pair}
                    <span style={{ fontSize: 12, color: COLORS.textDim, marginLeft: 8 }}>
                      @ ${currentPrices[selectedPair]?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Amount Input */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 10, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>
                    Amount (encrypted on submit)
                  </label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
                      background: COLORS.surface, color: COLORS.text, fontSize: 16, fontFamily: "inherit",
                      outline: "none", transition: "border 0.2s",
                    }}
                    onFocus={(e) => e.target.style.borderColor = COLORS.accent}
                    onBlur={(e) => e.target.style.borderColor = COLORS.border}
                  />
                </div>

                {/* Price Input */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 10, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>
                    Limit Price (encrypted on submit)
                  </label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00"
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
                      background: COLORS.surface, color: COLORS.text, fontSize: 16, fontFamily: "inherit",
                      outline: "none", transition: "border 0.2s",
                    }}
                    onFocus={(e) => e.target.style.borderColor = COLORS.accent}
                    onBlur={(e) => e.target.style.borderColor = COLORS.border}
                  />
                </div>

                {/* Encryption Info */}
                <div style={{
                  marginBottom: 20, padding: 12, borderRadius: 8, background: COLORS.fheDim,
                  border: `1px solid ${COLORS.fhe}33`, fontSize: 10, color: COLORS.fhe,
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>🔐 FHE Encryption Details</div>
                  <div style={{ color: COLORS.textDim }}>
                    Scheme: TFHE (128-bit) • Post-quantum secure
                    <br />
                    ZK Proof: Encrypted input validity
                    <br />
                    Decryption: Threshold MPC (9/13 KMS nodes)
                  </div>
                </div>

                {/* Submit Button */}
                <button onClick={submitOrder} disabled={!walletConnected || !amount || isEncrypting}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 10, border: "none", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 14, fontWeight: 700, letterSpacing: 0.5,
                    background: !walletConnected || !amount || isEncrypting
                      ? COLORS.border : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.fhe})`,
                    color: !walletConnected || !amount || isEncrypting ? COLORS.textMuted : "#fff",
                    transition: "all 0.3s",
                    boxShadow: walletConnected && amount && !isEncrypting ? `0 4px 20px ${COLORS.accentGlow}` : "none",
                  }}>
                  {isEncrypting ? "🔐 Encrypting & Submitting..." :
                    !walletConnected ? "Connect Wallet First" :
                    `Encrypt & ${orderType} ${TRADING_PAIRS[selectedPair].pair.split("/")[0]}`}
                </button>

                {!walletConnected && (
                  <div style={{ textAlign: "center", fontSize: 10, color: COLORS.textMuted, marginTop: 8 }}>
                    Connect your wallet to place confidential orders
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ ORDERS TAB ═══ */}
        {activeTab === "orders" && (
          <div style={{ animation: "slideUp 0.4s ease" }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
              Encrypted Order Book
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 24 }}>
              All order amounts and prices are encrypted using TFHE. Only counterparties see matched values via threshold decryption.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Header */}
              <div style={{
                display: "grid", gridTemplateColumns: "60px 100px 1fr 140px 120px 120px", gap: 12,
                padding: "10px 16px", fontSize: 10, fontWeight: 600, color: COLORS.textMuted,
                textTransform: "uppercase", letterSpacing: 1,
              }}>
                <span>Side</span><span>Pair</span><span>Ciphertext Handle</span>
                <span>Status</span><span>ZK Proof</span><span>Time</span>
              </div>
              {orders.map((o, i) => (
                <div key={o.id} style={{
                  display: "grid", gridTemplateColumns: "60px 100px 1fr 140px 120px 120px", gap: 12,
                  alignItems: "center", padding: "14px 16px", borderRadius: 10,
                  background: COLORS.card, border: `1px solid ${COLORS.border}`, fontSize: 12,
                  animation: `slideUp 0.3s ease ${i * 0.05}s both`,
                }}>
                  <span style={{
                    fontWeight: 700, textAlign: "center", padding: "3px 8px", borderRadius: 4,
                    background: o.type === "BUY" ? "#22C55E15" : "#EF444415",
                    color: o.type === "BUY" ? "#22C55E" : "#EF4444",
                  }}>{o.type}</span>
                  <span style={{ fontWeight: 600 }}>{o.pair}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: COLORS.textMuted }}>
                    {o.cipher}
                  </span>
                  <span style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 11, textAlign: "center",
                    background: o.status === "executed" ? "#22C55E15" : o.status === "encrypted" ? COLORS.fheDim : `${COLORS.warning}22`,
                    color: o.status === "executed" ? "#22C55E" : o.status === "encrypted" ? COLORS.fhe : COLORS.warning,
                  }}>
                    {o.status === "encrypted" ? "🔐 FHE Encrypted" : o.status === "executed" ? "✓ Decrypted & Matched" : "⏳ Awaiting Decrypt"}
                  </span>
                  <span style={{ color: o.zkProof === "verified" ? COLORS.zk : COLORS.warning, fontSize: 11 }}>
                    {o.zkProof === "verified" ? "✓ ZK Verified" : "⏳ Generating"}
                  </span>
                  <span style={{ color: COLORS.textMuted, fontSize: 11 }}>
                    {Math.floor((Date.now() - o.timestamp) / 1000)}s ago
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ PROTOCOL TAB ═══ */}
        {activeTab === "protocol" && (
          <div style={{ animation: "slideUp 0.4s ease" }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, fontFamily: "'Space Grotesk', sans-serif" }}>
              Protocol Status Dashboard
            </div>
            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {PROTOCOL_STATS.map((s, i) => (
                <div key={s.label} style={{
                  padding: 20, borderRadius: 14, background: COLORS.card, border: `1px solid ${COLORS.border}`,
                  animation: `slideUp 0.4s ease ${i * 0.08}s both`,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.accent, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted }}>{s.sub}</div>
                </div>
              ))}
            </div>
            {/* Components Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { title: "FHE Coprocessors", color: COLORS.fhe, nodes: ["Artifact", "Blockscape", "Luganodes", "P2P", "Zama"], status: "5/5 Online", desc: "Parallel encrypted computation with TFHE-rs" },
                { title: "KMS Nodes (Threshold MPC)", color: COLORS.mpc, nodes: ["Conduit", "DFNS", "Etherscan", "Figment", "Fireblocks", "InfStones", "LayerZero", "Ledger", "OpenZeppelin", "StakeCapital", "Unit410", "Omakase", "Zama"], status: "13/13 Online", desc: "2/3 majority threshold decryption in Nitro Enclaves" },
                { title: "Gateway (Arbitrum Rollup)", color: COLORS.zk, nodes: ["ZK Verifier", "ACL Contract", "Fee Oracle", "Bridge Router"], status: "Operational", desc: "Orchestrates verification, decryption & bridging" },
                { title: "Security Parameters", color: COLORS.accent, nodes: ["128-bit FHE security", "p-fail: 2^-128", "Post-quantum resistant", "Trail of Bits audited"], status: "Maximum", desc: "Defense-in-depth with FHE + MPC + ZK + TEE" },
              ].map((c, i) => (
                <div key={c.title} style={{
                  padding: 20, borderRadius: 14, background: COLORS.card, border: `1px solid ${COLORS.border}`,
                  animation: `slideUp 0.4s ease ${i * 0.1}s both`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: c.color, fontFamily: "'Space Grotesk', sans-serif" }}>{c.title}</span>
                    <span style={{
                      fontSize: 10, padding: "3px 10px", borderRadius: 20,
                      background: `${c.color}22`, color: c.color, fontWeight: 600,
                    }}>{c.status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 12 }}>{c.desc}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {c.nodes.map((n) => (
                      <span key={n} style={{
                        fontSize: 10, padding: "4px 8px", borderRadius: 6,
                        background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textDim,
                      }}>{n}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ ARCHITECTURE TAB ═══ */}
        {activeTab === "about" && (
          <div style={{ animation: "slideUp 0.4s ease", maxWidth: 900 }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
              System Architecture
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 24 }}>
              How confidential trading works on the Zama Protocol using FHE + ZK + MPC
            </div>

            {/* Architecture Flow */}
            <div style={{ padding: 24, borderRadius: 16, background: COLORS.card, border: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: COLORS.accent }}>
                Confidential Trade Lifecycle
              </div>
              {[
                { step: "1", title: "User Encrypts Order", desc: "Amount and price encrypted client-side using TFHE public key. A ZK proof of correct encryption is generated in the browser.", color: COLORS.zk, tag: "ZK" },
                { step: "2", title: "Smart Contract Execution", desc: "The FHEVM library on the host chain performs symbolic execution — pointers are created, FHE operations are queued for coprocessors.", color: COLORS.fhe, tag: "FHE" },
                { step: "3", title: "Coprocessor Computation", desc: "5 coprocessor nodes execute the actual FHE operations in parallel on encrypted data. Results are committed via majority consensus.", color: COLORS.fhe, tag: "FHE" },
                { step: "4", title: "Order Matching (Encrypted)", desc: "The encrypted order book matches buy/sell orders entirely in ciphertext. No order details are ever revealed to anyone.", color: COLORS.fhe, tag: "FHE" },
                { step: "5", title: "Threshold Decryption", desc: "Matched results are decrypted by the KMS network (9/13 nodes required). Only authorized parties see the decrypted values.", color: COLORS.mpc, tag: "MPC" },
                { step: "6", title: "Settlement", desc: "Confidential token balances are updated on-chain. The ACL contract ensures only the owner can view their own balance.", color: COLORS.accent, tag: "ACL" },
              ].map((s, i) => (
                <div key={s.step} style={{
                  display: "flex", gap: 16, marginBottom: i < 5 ? 16 : 0, alignItems: "flex-start",
                  animation: `slideUp 0.4s ease ${i * 0.08}s both`,
                }}>
                  <div style={{
                    minWidth: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${s.color}22`, color: s.color, fontSize: 16, fontWeight: 700, border: `1px solid ${s.color}44`,
                  }}>{s.step}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{s.title}</span>
                      <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${s.color}22`, color: s.color, fontWeight: 600 }}>{s.tag}</span>
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textDim, lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                  {i < 5 && <div style={{ position: "absolute", left: 43, marginTop: 44, width: 1, height: 16, background: COLORS.border }} />}
                </div>
              ))}
            </div>

            {/* Tech Comparison */}
            <div style={{ padding: 24, borderRadius: 16, background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: COLORS.accent }}>
                Zama Protocol vs Other Approaches
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      {["Feature", "Zama (FHE)", "ZK-Only", "MPC-Only", "TEE-Based"].map((h) => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: COLORS.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Encrypted State", "✅", "❌", "✅", "❌"],
                      ["Composable", "✅", "❌", "✅", "✅"],
                      ["Verifiable", "✅", "✅", "❌", "❌"],
                      ["Decentralized", "✅", "✅", "✅", "❌"],
                      ["Post-Quantum", "✅", "❌", "❌", "❌"],
                      ["Scalable", "✅", "✅", "❌", "✅"],
                    ].map((row) => (
                      <tr key={row[0]} style={{ borderBottom: `1px solid ${COLORS.border}10` }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ padding: "10px 12px", color: cell === "✅" ? "#22C55E" : cell === "❌" ? "#EF4444" : COLORS.text, fontWeight: j === 0 ? 500 : 400 }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer style={{
        position: "relative", zIndex: 10, textAlign: "center", padding: "20px 24px",
        borderTop: `1px solid ${COLORS.border}`, fontSize: 10, color: COLORS.textMuted,
      }}>
        Zama Confidential Trading System • Powered by TFHE Fully Homomorphic Encryption
        <br />
        ZK Proof Verification • Threshold MPC Decryption • Post-Quantum Security
      </footer>
    </div>
  );
}