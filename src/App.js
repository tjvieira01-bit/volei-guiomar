import { useState, useEffect } from "react";

const JOGADORES = [
  "AMANDA","ANA PAULA","BARBARA F","BARBARA O","BIANCA",
  "BRUNNA","CAMILLA","CARMEN","CHARLES","DILLEYGOR",
  "DIORGE","EBER","EDUARDO A","EDUARDO M","ELISA",
  "FABIULA","FLAVIA","HELENO","JEAN","JOAO",
  "LAISSE","LEO","LORRAYNE","MARCIM","MARIO",
  "MATHEUS C","MATHEUS Q","MAXWELL","RODRIGO","RUBENS",
  "SIDNEY","TAINAH","TIAGO","VAGNO","VINI ALVES",
  "WAGNER","YUGUI"
];

const CRITERIOS = [
  { key:"tecnica", label:"Técnica",  icon:"⚡", peso:0.40, desc:"Saque, recepção, ataque, bloqueio, defesa" },
  { key:"fisico",  label:"Físico",   icon:"🏃", peso:0.25, desc:"Velocidade, salto e resistência" },
  { key:"tatica",  label:"Tática",   icon:"🧠", peso:0.25, desc:"Posicionamento e leitura de jogo" },
  { key:"atitude", label:"Atitude",  icon:"🤝", peso:0.10, desc:"Fair play, comprometimento, incentivo" },
];

const NOTAS = [0,0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10];

const FIREBASE_URL = "https://volei-guiomar-default-rtdb.firebaseio.com";

function notaColor(n) {
  if (n === null || n === undefined || n === "") return "#e2e8f0";
  if (n <= 2)  return "#fecaca";
  if (n <= 4)  return "#fed7aa";
  if (n <= 6)  return "#fef08a";
  if (n <= 8)  return "#bbf7d0";
  return "#93c5fd";
}

function notaFinal(notas) {
  const vals = CRITERIOS.filter(c => notas[c.key] !== null && notas[c.key] !== undefined && notas[c.key] !== "");
  if (vals.length < 4) return null;
  return Math.round(CRITERIOS.reduce((acc,c) => acc + (notas[c.key] * c.peso), 0) * 2) / 2;
}

async function salvarFirebase(avaliador, dados) {
  const key = avaliador.replace(/[^a-zA-Z0-9]/g, "_");
  try {
    const res = await fetch(`${FIREBASE_URL}/avaliacoes/${key}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avaliador, dados, timestamp: Date.now() })
    });
    const texto = await res.text();
    console.log("Firebase resposta:", res.status, texto.slice(0, 100));
    if (!res.ok) {
      console.error("Firebase erro HTTP:", res.status, texto);
      return false;
    }
    return true;
  } catch(e) {
    console.error("Firebase erro de rede:", e.message);
    return false;
  }
}

async function carregarFirebase() {
  try {
    const res = await fetch(`${FIREBASE_URL}/avaliacoes.json`);
    const texto = await res.text();
    if (!res.ok || texto === "null" || !texto) return {};
    const data = JSON.parse(texto);
    if (!data) return {};
    const resultado = {};
    Object.values(data).forEach(entry => {
      if (entry && entry.avaliador) resultado[entry.avaliador] = entry.dados;
    });
    return resultado;
  } catch(e) {
    console.error("Firebase carregar erro:", e.message);
    return {};
  }
}

// ── Seleção de avaliador ─────────────────────────────────────────────────────
function TelaSelecao({ onSelect, jaAvaliaram, onAdmin }) {
  const [busca, setBusca] = useState("");
  const filtrados = JOGADORES.filter(j => j.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div style={{ minHeight:"100vh", background:"#01284F", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem 1rem" }}>
      <div style={{ marginBottom:"1.5rem", textAlign:"center" }}>
        <div style={{ fontSize:52, marginBottom:8 }}>🏐</div>
        <h1 style={{ color:"#66F277", fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, margin:0 }}>Volei Guiomar de Melo</h1>
        <p style={{ color:"rgba(255,255,255,0.55)", fontSize:13, marginTop:6 }}>Avaliação coletiva de jogadores</p>
      </div>

      <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:18, padding:"1.5rem", width:"100%", maxWidth:400, border:"1px solid rgba(255,255,255,0.1)" }}>
        <p style={{ color:"rgba(255,255,255,0.75)", fontSize:13, marginBottom:"1rem", textAlign:"center" }}>
          Selecione o seu nome para começar
        </p>
        <input
          placeholder="Buscar o seu nome..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:14, marginBottom:10, outline:"none", boxSizing:"border-box" }}
        />
        <div style={{ maxHeight:320, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
          {filtrados.map(j => {
            const enviou = jaAvaliaram.includes(j);
            return (
              <button key={j} 
                onClick={() => {
                  if (enviou) {
                    alert("🔒 Este jogador já enviou a sua avaliação. O acesso está bloqueado para garantir a privacidade dos votos.");
                  } else {
                    onSelect(j);
                  }
                }}
                style={{ 
                  display:"flex", alignItems:"center", justifyContent:"space-between", 
                  padding:"12px 16px", borderRadius:10, 
                  border:"1px solid rgba(255,255,255,0.1)", 
                  background: enviou ? "rgba(102,242,119,0.05)" : "rgba(255,255,255,0.05)", 
                  color: enviou ? "rgba(255,255,255,0.4)" : "#fff", // O nome fica meio apagado se já tiver votado
                  fontSize:14, fontWeight:600, 
                  cursor: enviou ? "not-allowed" : "pointer", 
                  textAlign:"left" 
                }}>
                <span>{j}</span>
                {enviou && <span style={{ fontSize:11, color:"#66F277", background:"rgba(102,242,119,0.1)", padding:"2px 8px", borderRadius:20 }}>🔒 bloqueado</span>}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={onAdmin}
        style={{ marginTop:20, background:"none", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.35)", fontSize:11, borderRadius:8, padding:"6px 14px", cursor:"pointer" }}>
        painel administrador
      </button>
    </div>
  );
}

// ── Avaliação individual ─────────────────────────────────────────────────────
function TelaAvaliacao({ avaliador, avaliacoes, setAvaliacoes, onEnviar, enviando, jaEnviou, onVoltar }) {
  const [view, setView] = useState("lista");
  const [jogadorAtual, setJogadorAtual] = useState(null);
  const lista = JOGADORES.filter(j => j !== avaliador);

  const preenchidos = lista.filter(j => {
    const av = avaliacoes[j] || {};
    return CRITERIOS.every(c => av[c.key] !== undefined && av[c.key] !== "");
  }).length;
  const pct = Math.round((preenchidos / lista.length) * 100);

  function setNota(jog, crit, val) {
    setAvaliacoes(prev => ({ ...prev, [jog]: { ...(prev[jog]||{}), [crit]: val } }));
  }

  // Vista jogador
  if (view === "jogador" && jogadorAtual) {
    const notas = avaliacoes[jogadorAtual] || {};
    const nf = notaFinal(notas);
    const idx = lista.indexOf(jogadorAtual);
    const prev = idx > 0 ? lista[idx-1] : null;
    const next = idx < lista.length-1 ? lista[idx+1] : null;

    return (
      <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
        <div style={{ background:"#01284F", padding:"1rem 1.25rem", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
          <button onClick={() => setView("lista")} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:16 }}>←</button>
          <div style={{ flex:1 }}>
            <div style={{ color:"#66F277", fontSize:10, fontWeight:700, letterSpacing:1 }}>AVALIANDO</div>
            <div style={{ color:"#fff", fontSize:16, fontWeight:700 }}>{jogadorAtual}</div>
          </div>
          {nf !== null && (
            <div style={{ background:"#66F277", borderRadius:10, padding:"6px 14px", textAlign:"center" }}>
              <div style={{ fontSize:10, color:"#01284F", fontWeight:700 }}>NOTA</div>
              <div style={{ fontSize:22, color:"#01284F", fontWeight:800, lineHeight:1 }}>{nf.toFixed(1)}</div>
            </div>
          )}
        </div>

        <div style={{ padding:"1rem" }}>
          {CRITERIOS.map(c => {
            const val = notas[c.key];
            return (
              <div key={c.key} style={{ background:"#fff", borderRadius:14, padding:"1rem 1.25rem", marginBottom:10, border:"1px solid #e2e8f0" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:"#01284F" }}>{c.icon} {c.label} <span style={{ color:"#94a3b8", fontWeight:400 }}>({Math.round(c.peso*100)}%)</span></div>
                    <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{c.desc}</div>
                  </div>
                  <div style={{ background:notaColor(val), borderRadius:10, minWidth:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", fontSize: val !== undefined && val !== "" ? 18 : 13, fontWeight:800, color:"#1e293b" }}>
                    {val !== undefined && val !== "" ? Number(val).toFixed(1) : "—"}
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {NOTAS.map(n => (
                    <button key={n} onClick={() => setNota(jogadorAtual, c.key, n)}
                      style={{ width:38, height:34, borderRadius:8, border: val===n ? "2px solid #037971" : "1px solid #e2e8f0", background: val===n ? "#037971" : notaColor(n), color: val===n ? "#fff" : "#1e293b", fontSize:12, fontWeight: val===n ? 700:500, cursor:"pointer" }}>
                      {n%1===0 ? n : n.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display:"flex", gap:10, padding:"0 1rem 1.5rem" }}>
          {prev && (
            <button onClick={() => setJogadorAtual(prev)}
              style={{ flex:1, padding:12, borderRadius:12, border:"1px solid #e2e8f0", background:"#fff", color:"#01284F", fontSize:12, fontWeight:600, cursor:"pointer" }}>
              ← {prev}
            </button>
          )}
          {next ? (
            <button 
              onClick={() => { if(nf !== null) setJogadorAtual(next); }}
              disabled={nf === null}
              style={{ flex:1, padding:12, borderRadius:12, border:"none", background: nf !== null ? "#037971" : "#e2e8f0", color: nf !== null ? "#fff" : "#94a3b8", fontSize:12, fontWeight:700, cursor: nf !== null ? "pointer" : "not-allowed", opacity: nf !== null ? 1 : 0.7 }}>
              {nf === null ? "⚠️ Preencha os 4 critérios" : `${next} →`}
            </button>
          ) : (
            <button 
              onClick={() => { if(nf !== null) setView("resumo"); }}
              disabled={nf === null}
              style={{ flex:1, padding:12, borderRadius:12, border:"none", background: nf !== null ? "#66F277" : "#e2e8f0", color: nf !== null ? "#01284F" : "#94a3b8", fontSize:13, fontWeight:700, cursor: nf !== null ? "pointer" : "not-allowed", opacity: nf !== null ? 1 : 0.7 }}>
              {nf === null ? "⚠️ Preencha os 4 critérios" : "Ver resumo ✓"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Vista resumo
  if (view === "resumo") {
    const completos = lista.filter(j => {
      const av = avaliacoes[j] || {};
      return CRITERIOS.every(c => av[c.key] !== undefined && av[c.key] !== "");
    });
    const incompletos = lista.filter(j => !completos.includes(j));

    return (
      <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
        <div style={{ background:"#01284F", padding:"1rem 1.25rem", display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => setView("lista")} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:16 }}>←</button>
          <div style={{ color:"#fff", fontWeight:700, fontSize:15 }}>Resumo — {avaliador}</div>
        </div>

        <div style={{ padding:"1rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            <div style={{ background:"#fff", borderRadius:14, padding:"1rem", border:"1px solid #e2e8f0", textAlign:"center" }}>
              <div style={{ fontSize:28, fontWeight:800, color:"#037971" }}>{completos.length}</div>
              <div style={{ fontSize:12, color:"#64748b" }}>completos</div>
            </div>
            <div style={{ background:"#fff", borderRadius:14, padding:"1rem", border:"1px solid #e2e8f0", textAlign:"center" }}>
              <div style={{ fontSize:28, fontWeight:800, color: incompletos.length > 0 ? "#f97316":"#22c55e" }}>{incompletos.length}</div>
              <div style={{ fontSize:12, color:"#64748b" }}>pendentes</div>
            </div>
          </div>

          {incompletos.length > 0 && (
            <div style={{ background:"#fff7ed", borderRadius:14, padding:"1rem 1.25rem", marginBottom:14, border:"1px solid #fed7aa" }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#c2410c", marginBottom:8 }}>⚠️ Incompletos — clique para finalizar</div>
              {incompletos.map(j => (
                <button key={j} onClick={() => { setJogadorAtual(j); setView("jogador"); }}
                  style={{ display:"block", width:"100%", textAlign:"left", padding:"7px 0", background:"none", border:"none", borderBottom:"1px solid #fed7aa", color:"#c2410c", fontSize:13, cursor:"pointer" }}>
                  → {j}
                </button>
              ))}
            </div>
          )}

          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", overflow:"hidden", marginBottom:14 }}>
            <div style={{ background:"#01284F", padding:"10px 16px" }}>
              <span style={{ color:"#66F277", fontSize:11, fontWeight:700 }}>NOTAS FINAIS ({completos.length}/{lista.length})</span>
            </div>
            {completos.map((j,i) => {
              const nf = notaFinal(avaliacoes[j]||{});
              return (
                <div key={j} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 16px", borderBottom: i<completos.length-1?"1px solid #f1f5f9":"none" }}>
                  <span style={{ fontSize:13, fontWeight:500, color:"#1e293b" }}>{j}</span>
                  <span style={{ background:notaColor(nf), borderRadius:8, padding:"3px 12px", fontSize:13, fontWeight:700 }}>{nf !== null ? nf.toFixed(1):"—"}</span>
                </div>
              );
            })}
          </div>

          {jaEnviou ? (
            <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:14, padding:"1.5rem", textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
              <div style={{ fontWeight:700, color:"#166534", fontSize:15 }}>Avaliação enviada!</div>
              <div style={{ color:"#16a34a", fontSize:13, marginTop:4 }}>Obrigado, {avaliador}!</div>
              <button onClick={onVoltar} style={{ marginTop:14, padding:"10px 24px", borderRadius:10, border:"none", background:"#01284F", color:"#66F277", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                Voltar ao início
              </button>
            </div>
          ) : (
            <button onClick={onEnviar} disabled={enviando || completos.length === 0}
              style={{ width:"100%", padding:16, borderRadius:14, border:"none", background: completos.length > 0 ? "#01284F":"#e2e8f0", color: completos.length > 0 ? "#66F277":"#94a3b8", fontSize:16, fontWeight:700, cursor: completos.length > 0 ? "pointer":"default" }}>
              {enviando ? "Enviando..." : `Enviar avaliação (${completos.length}/${lista.length})`}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Vista lista
  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <div style={{ background:"#01284F", padding:"1rem 1.25rem", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div>
            <div style={{ color:"#66F277", fontSize:10, fontWeight:700, letterSpacing:1 }}>AVALIADOR</div>
            <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>{avaliador}</div>
          </div>
          <button onClick={() => setView("resumo")}
            style={{ background:"#66F277", border:"none", borderRadius:10, padding:"8px 16px", color:"#01284F", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Resumo →
          </button>
        </div>
        <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:20, height:7, overflow:"hidden" }}>
          <div style={{ background:"#66F277", height:"100%", width:`${pct}%`, borderRadius:20, transition:"width .4s" }} />
        </div>
        <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11, marginTop:4, textAlign:"right" }}>{preenchidos}/{lista.length} avaliados</div>
      </div>

      <div style={{ padding:"0.75rem" }}>
        {lista.map((j,idx) => {
          const notas = avaliacoes[j] || {};
          const nf = notaFinal(notas);
          const nP = CRITERIOS.filter(c => notas[c.key] !== undefined && notas[c.key] !== "").length;
          const ok = nP === 4;
          return (
            <button key={j} onClick={() => { setJogadorAtual(j); setView("jogador"); }}
              style={{ display:"flex", alignItems:"center", width:"100%", padding:"11px 14px", marginBottom:7, background:"#fff", borderRadius:14, border: ok?"1px solid #bbf7d0":"1px solid #e2e8f0", cursor:"pointer", gap:12, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ width:26, height:26, borderRadius:7, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#64748b", flexShrink:0 }}>
                {idx+1}
              </div>
              <div style={{ flex:1, textAlign:"left" }}>
                <div style={{ fontWeight:600, fontSize:13, color:"#1e293b" }}>{j}</div>
                <div style={{ display:"flex", gap:4, marginTop:5 }}>
                  {CRITERIOS.map(c => (
                    <div key={c.key} style={{ flex:1, height:4, borderRadius:2, background: notas[c.key] !== undefined && notas[c.key] !== "" ? notaColor(notas[c.key]):"#e2e8f0" }} />
                  ))}
                </div>
              </div>
              <div style={{ minWidth:42, height:42, borderRadius:10, background: nf !== null ? notaColor(nf):"#f1f5f9", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                {nf !== null ? (
                  <>
                    <div style={{ fontSize:15, fontWeight:800, color:"#1e293b", lineHeight:1 }}>{nf.toFixed(1)}</div>
                    <div style={{ fontSize:9, color:"#64748b" }}>{nP}/4</div>
                  </>
                ) : (
                  <div style={{ fontSize:11, color:"#94a3b8" }}>{nP}/4</div>
                )}
              </div>
              <div style={{ color:"#cbd5e1", fontSize:18 }}>›</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Painel Admin ─────────────────────────────────────────────────────────────
function TelaAdmin({ dados, onVoltar }) {
  const [tab, setTab] = useState("ranking");

  const consolidado = JOGADORES.map(jog => {
    const medias = {};
    CRITERIOS.forEach(c => {
      const arr = Object.entries(dados)
        .filter(([av]) => av !== jog)
        .map(([,av]) => av[jog]?.[c.key])
        .filter(v => v !== undefined && v !== null && v !== "")
        .map(Number);
      if (arr.length >= 3) {
        const s = [...arr].sort((a,b)=>a-b).slice(1,-1);
        medias[c.key] = s.reduce((a,b)=>a+b,0)/s.length;
      } else if (arr.length > 0) {
        medias[c.key] = arr.reduce((a,b)=>a+b,0)/arr.length;
      } else {
        medias[c.key] = null;
      }
    });
    const vals = CRITERIOS.map(c => medias[c.key]).filter(v => v !== null);
    const nf = vals.length === 4 ? Math.round(CRITERIOS.reduce((acc,c)=>acc+(medias[c.key]*c.peso),0)*2)/2 : null;
    const qtd = Object.entries(dados).filter(([av]) => av !== jog && dados[av][jog]?.tecnica !== undefined).length;
    return { nome:jog, medias, nf, qtd };
  }).sort((a,b) => (b.nf||0)-(a.nf||0));

  const jaAvaliaram = Object.keys(dados);

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <div style={{ background:"#01284F", padding:"1rem 1.25rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
          <button onClick={onVoltar} style={{ background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:16 }}>←</button>
          <div style={{ color:"#fff", fontWeight:700, fontSize:15 }}>🏆 Painel Administrador</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {["ranking","participacao"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:"6px 16px", borderRadius:20, border:"none", background:tab==="ranking"?"#66F277":"rgba(255,255,255,0.1)", color:tab===t?"#01284F":"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>
              {t==="ranking" ? "🏆 Ranking" : "👥 Participação"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"1rem" }}>
        {tab==="ranking" && (
          <>
            <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", overflow:"hidden", marginBottom:10 }}>
              <div style={{ background:"#01284F", padding:"10px 16px", display:"flex", gap:6 }}>
                <span style={{ color:"#66F277", fontSize:10, fontWeight:700, flex:2 }}>JOGADOR</span>
                {CRITERIOS.map(c=><span key={c.key} style={{ color:"rgba(255,255,255,0.5)", fontSize:11, flex:1, textAlign:"center" }}>{c.icon}</span>)}
                <span style={{ color:"#66F277", fontSize:10, fontWeight:700, flex:1, textAlign:"center" }}>NOTA</span>
              </div>
              {consolidado.map((j,i) => (
                <div key={j.nome} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderBottom:i<consolidado.length-1?"1px solid #f1f5f9":"none", background:i<3?"rgba(102,242,119,0.04)":"transparent" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:i<3?"#037971":"#94a3b8", width:18 }}>{i+1}</span>
                  <span style={{ flex:2, fontSize:12, fontWeight:600, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{j.nome}</span>
                  {CRITERIOS.map(c=>(
                    <span key={c.key} style={{ flex:1, textAlign:"center", fontSize:12, fontWeight:600, color:j.medias[c.key]!==null?"#1e293b":"#e2e8f0" }}>
                      {j.medias[c.key]!==null?j.medias[c.key].toFixed(1):"—"}
                    </span>
                  ))}
                  <div style={{ flex:1, textAlign:"center" }}>
                    <span style={{ background:j.nf!==null?notaColor(j.nf):"#f1f5f9", borderRadius:8, padding:"3px 8px", fontSize:13, fontWeight:800, color:"#1e293b" }}>
                      {j.nf!==null?j.nf.toFixed(1):"—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:10, color:"#94a3b8", textAlign:"center" }}>
              ⚡×40% + 🏃×25% + 🧠×25% + 🤝×10% · notas extremas descartadas
            </div>
          </>
        )}

        {tab==="participacao" && (
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e2e8f0", overflow:"hidden" }}>
            <div style={{ background:"#01284F", padding:"10px 16px", display:"flex", justifyContent:"space-between" }}>
              <span style={{ color:"#66F277", fontSize:11, fontWeight:700 }}>PARTICIPAÇÃO</span>
              <span style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>{jaAvaliaram.length}/{JOGADORES.length} enviaram</span>
            </div>
            {JOGADORES.map((j,i) => {
              const enviou = jaAvaliaram.includes(j);
              return (
                <div key={j} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", borderBottom:i<JOGADORES.length-1?"1px solid #f1f5f9":"none" }}>
                  <span style={{ fontSize:13, color:"#1e293b", fontWeight:500 }}>{j}</span>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:enviou?"#f0fdf4":"#fef2f2", color:enviou?"#166534":"#dc2626" }}>
                    {enviou?"✓ enviou":"pendente"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── App principal ─────────────────────────────────────────────────────────────
export default function App() {
  const [tela, setTela] = useState("selecao");
  const [avaliador, setAvaliador] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState({});
  const [todasRespostas, setTodasRespostas] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [jaEnviou, setJaEnviou] = useState(false);
  const [jaAvaliaram, setJaAvaliaram] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarFirebase().then(dados => {
      setTodasRespostas(dados);
      setJaAvaliaram(Object.keys(dados));
      setCarregando(false);
    });
  }, []);

  async function handleEnviar() {
    setEnviando(true);
    const ok = await salvarFirebase(avaliador, avaliacoes);
    if (ok) {
      const atualizadas = { ...todasRespostas, [avaliador]: avaliacoes };
      setTodasRespostas(atualizadas);
      setJaAvaliaram(Object.keys(atualizadas));
      setJaEnviou(true);
    } else {
      alert("Erro ao salvar. Verifique a conexão e tente novamente.");
    }
    setEnviando(false);
  }

  function handleSelect(nome) {
    setAvaliador(nome);
    setAvaliacoes(todasRespostas[nome] || {});
    setJaEnviou(!!todasRespostas[nome]);
    setTela("avaliacao");
  }

  function acessarAdmin() {
    const senhaDigitada = window.prompt("Acesso restrito. Digite a senha:");
    
    // A senha definida foi "TiagoAdmin". Você pode alterá-la na linha abaixo:
    if (senhaDigitada === "TiagoAdmin") {
      setTela("admin");
    } else if (senhaDigitada !== null && senhaDigitada !== "") {
      alert("Senha incorreta! Acesso negado.");
    }
  }

  if (carregando) return (
    <div style={{ minHeight:"100vh", background:"#01284F", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"#66F277", fontSize:16, fontFamily:"'DM Sans',sans-serif" }}>🏐 Carregando...</div>
    </div>
  );

  if (tela === "admin") return <TelaAdmin dados={todasRespostas} onVoltar={() => setTela("selecao")} />;
  if (tela === "avaliacao") return (
    <TelaAvaliacao
      avaliador={avaliador}
      avaliacoes={avaliacoes}
      setAvaliacoes={setAvaliacoes}
      onEnviar={handleEnviar}
      enviando={enviando}
      jaEnviou={jaEnviou}
      onVoltar={() => setTela("selecao")}
    />
  );
  
  return <TelaSelecao onSelect={handleSelect} jaAvaliaram={jaAvaliaram} onAdmin={acessarAdmin} />;
}
