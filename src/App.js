import { useState, useEffect } from "react";

const AZUL     = "#1a3a8f";
const AZUL_ESC = "#0f2266";
const OURO     = "#f5a800";
const OURO_CL  = "#ffd966";
const BRANCO   = "#ffffff";
const CZ_CL    = "#f1f5f9";

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
    if (!res.ok) { console.error("Firebase erro:", res.status, texto); return false; }
    return true;
  } catch(e) { console.error("Firebase rede:", e.message); return false; }
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
  } catch(e) { return {}; }
}

// ── Header VGM ───────────────────────────────────────────────────────────────
function Header({ titulo, onVoltar, direita }) {
  return (
    <div style={{ background:`linear-gradient(135deg, ${AZUL_ESC} 0%, ${AZUL} 100%)`, padding:"0.85rem 1.25rem", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10, boxShadow:"0 2px 12px rgba(0,0,0,0.25)" }}>
      {onVoltar
        ? <button onClick={onVoltar} style={{ background:`rgba(245,168,0,0.15)`, border:`1px solid rgba(245,168,0,0.35)`, color:OURO, borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:16, lineHeight:1 }}>←</button>
        : <img src="/VGM.jpg" alt="Logo VGM" style={{ width:36, height:36, borderRadius:8, objectFit:"cover", border:`2px solid ${OURO}` }} />
      }
      <div style={{ flex:1 }}>
        <div style={{ color:OURO, fontSize:10, fontWeight:700, letterSpacing:1.5 }}>VOLEI GUIOMAR DE MELO</div>
        <div style={{ color:BRANCO, fontSize:15, fontWeight:700 }}>{titulo}</div>
      </div>
      {direita}
    </div>
  );
}

// ── Tela Seleção ─────────────────────────────────────────────────────────────
function TelaSelecao({ onSelect, jaAvaliaram, onAdmin }) {
  const [busca, setBusca] = useState("");
  const filtrados = JOGADORES.filter(j => j.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg, ${AZUL_ESC} 0%, ${AZUL} 55%, #1e4db7 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem 1rem" }}>
      <div style={{ marginBottom:"1.75rem", textAlign:"center" }}>
        <img src="/VGM.jpg" alt="Logo" style={{ width:110, height:110, borderRadius:20, objectFit:"cover", boxShadow:`0 0 0 4px ${OURO}`, marginBottom:14 }} />
        <h1 style={{ color:OURO, fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, margin:0 }}>Guiomar de Melo</h1>
        <p style={{ color:"rgba(255,255,255,0.55)", fontSize:13, marginTop:4 }}>Avaliação coletiva de jogadores</p>
      </div>

      <div style={{ background:"rgba(255,255,255,0.07)", backdropFilter:"blur(10px)", borderRadius:20, padding:"1.5rem", width:"100%", maxWidth:400, border:`1px solid rgba(245,168,0,0.25)` }}>
        <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginBottom:"1rem", textAlign:"center", fontWeight:500 }}>Selecione o seu nome para começar</p>
        <input
          placeholder="🔍 Buscar seu nome..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid rgba(245,168,0,0.3)`, background:"rgba(255,255,255,0.08)", color:BRANCO, fontSize:14, marginBottom:10, outline:"none", boxSizing:"border-box" }}
        />
        <div style={{ maxHeight:320, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
          {filtrados.map(j => {
            const enviou = jaAvaliaram.includes(j);
            return (
              <button key={j}
                onClick={() => {
                  if (enviou) alert("🔒 Este jogador já enviou a sua avaliação. O acesso está bloqueado para garantir a privacidade dos votos.");
                  else onSelect(j);
                }}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderRadius:10, border: enviou ? `1px solid rgba(245,168,0,0.2)` : `1px solid rgba(255,255,255,0.1)`, background: enviou ? "rgba(245,168,0,0.07)" : "rgba(255,255,255,0.05)", color: enviou ? "rgba(255,255,255,0.4)" : BRANCO, fontSize:14, fontWeight:600, cursor: enviou ? "not-allowed":"pointer", textAlign:"left" }}>
                <span>{j}</span>
                {enviou
                  ? <span style={{ fontSize:11, color:OURO, background:"rgba(245,168,0,0.15)", padding:"2px 8px", borderRadius:20 }}>🔒 bloqueado</span>
                  : <span style={{ color:"rgba(255,255,255,0.3)", fontSize:16 }}>›</span>
                }
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={onAdmin}
        style={{ marginTop:20, background:"none", border:`1px solid rgba(245,168,0,0.2)`, color:"rgba(255,255,255,0.3)", fontSize:11, borderRadius:8, padding:"6px 14px", cursor:"pointer" }}>
        painel administrador
      </button>
    </div>
  );
}

// ── Tela Avaliação ───────────────────────────────────────────────────────────
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

  // Vista: jogador
  if (view === "jogador" && jogadorAtual) {
    const notas = avaliacoes[jogadorAtual] || {};
    const nf = notaFinal(notas);
    const idx = lista.indexOf(jogadorAtual);
    const prev = idx > 0 ? lista[idx-1] : null;
    const next = idx < lista.length-1 ? lista[idx+1] : null;

    return (
      <div style={{ minHeight:"100vh", background:CZ_CL }}>
        <Header titulo={jogadorAtual} onVoltar={() => setView("lista")}
          direita={nf !== null && (
            <div style={{ background:OURO, borderRadius:10, padding:"5px 14px", textAlign:"center", minWidth:52 }}>
              <div style={{ fontSize:9, color:AZUL_ESC, fontWeight:700 }}>NOTA</div>
              <div style={{ fontSize:20, color:AZUL_ESC, fontWeight:800, lineHeight:1 }}>{nf.toFixed(1)}</div>
            </div>
          )}
        />
        <div style={{ padding:"1rem" }}>
          {CRITERIOS.map(c => {
            const val = notas[c.key];
            const ok = val !== undefined && val !== "";
            return (
              <div key={c.key} style={{ background:BRANCO, borderRadius:16, padding:"1rem 1.25rem", marginBottom:10, border:`1px solid ${ok ? OURO_CL : "#e2e8f0"}`, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:AZUL_ESC }}>{c.icon} {c.label} <span style={{ color:"#94a3b8", fontWeight:400 }}>({Math.round(c.peso*100)}%)</span></div>
                    <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{c.desc}</div>
                  </div>
                  <div style={{ background: ok ? notaColor(val) : CZ_CL, borderRadius:10, minWidth:46, height:46, display:"flex", alignItems:"center", justifyContent:"center", fontSize: ok ? 18:12, fontWeight:800, color:"#1e293b", border: ok ? `2px solid ${OURO}` : "2px solid #e2e8f0" }}>
                    {ok ? Number(val).toFixed(1) : "—"}
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {NOTAS.map(n => (
                    <button key={n} onClick={() => setNota(jogadorAtual, c.key, n)}
                      style={{ width:38, height:34, borderRadius:8, border: val===n ? `2px solid ${AZUL}` : "1px solid #e2e8f0", background: val===n ? AZUL : notaColor(n), color: val===n ? OURO : "#1e293b", fontSize:12, fontWeight: val===n ? 700:500, cursor:"pointer" }}>
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
              style={{ flex:1, padding:12, borderRadius:12, border:`1px solid #e2e8f0`, background:BRANCO, color:AZUL, fontSize:12, fontWeight:600, cursor:"pointer" }}>
              ← {prev}
            </button>
          )}
          {next ? (
            <button onClick={() => { if(nf !== null) setJogadorAtual(next); }} disabled={nf===null}
              style={{ flex:1, padding:12, borderRadius:12, border:"none", background: nf!==null ? AZUL : "#e2e8f0", color: nf!==null ? OURO : "#94a3b8", fontSize:12, fontWeight:700, cursor: nf!==null?"pointer":"not-allowed", opacity: nf!==null?1:0.7 }}>
              {nf===null ? "⚠️ Preencha os 4 critérios" : `${next} →`}
            </button>
          ) : (
            <button onClick={() => { if(nf !== null) setView("resumo"); }} disabled={nf===null}
              style={{ flex:1, padding:12, borderRadius:12, border:"none", background: nf!==null ? OURO : "#e2e8f0", color: nf!==null ? AZUL_ESC : "#94a3b8", fontSize:13, fontWeight:700, cursor: nf!==null?"pointer":"not-allowed", opacity: nf!==null?1:0.7 }}>
              {nf===null ? "⚠️ Preencha os 4 critérios" : "Ver resumo ✓"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Vista: resumo
  if (view === "resumo") {
    const completos = lista.filter(j => {
      const av = avaliacoes[j] || {};
      return CRITERIOS.every(c => av[c.key] !== undefined && av[c.key] !== "");
    });
    const incompletos = lista.filter(j => !completos.includes(j));

    return (
      <div style={{ minHeight:"100vh", background:CZ_CL }}>
        <Header titulo={`Resumo — ${avaliador}`} onVoltar={() => setView("lista")} />
        <div style={{ padding:"1rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            <div style={{ background:BRANCO, borderRadius:14, padding:"1rem", border:`1px solid ${OURO_CL}`, textAlign:"center" }}>
              <div style={{ fontSize:28, fontWeight:800, color:AZUL }}>{completos.length}</div>
              <div style={{ fontSize:12, color:"#64748b" }}>completos</div>
            </div>
            <div style={{ background:BRANCO, borderRadius:14, padding:"1rem", border:"1px solid #e2e8f0", textAlign:"center" }}>
              <div style={{ fontSize:28, fontWeight:800, color: incompletos.length>0?"#f97316":"#22c55e" }}>{incompletos.length}</div>
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

          <div style={{ background:BRANCO, borderRadius:14, border:"1px solid #e2e8f0", overflow:"hidden", marginBottom:14 }}>
            <div style={{ background:AZUL, padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ color:OURO, fontSize:11, fontWeight:700 }}>NOTAS FINAIS</span>
              <span style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>{completos.length}/{lista.length}</span>
            </div>
            {completos.map((j,i) => {
              const nf = notaFinal(avaliacoes[j]||{});
              return (
                <div key={j} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 16px", borderBottom:i<completos.length-1?"1px solid #f1f5f9":"none" }}>
                  <span style={{ fontSize:13, fontWeight:500 }}>{j}</span>
                  <span style={{ background:notaColor(nf), borderRadius:8, padding:"3px 12px", fontSize:13, fontWeight:700 }}>{nf!==null?nf.toFixed(1):"—"}</span>
                </div>
              );
            })}
          </div>

          {jaEnviou ? (
            <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:14, padding:"1.5rem", textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
              <div style={{ fontWeight:700, color:"#166534", fontSize:15 }}>Avaliação enviada!</div>
              <div style={{ color:"#16a34a", fontSize:13, marginTop:4 }}>Obrigado, {avaliador}!</div>
              <button onClick={onVoltar} style={{ marginTop:14, padding:"10px 24px", borderRadius:10, border:"none", background:AZUL, color:OURO, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                Voltar ao início
              </button>
            </div>
          ) : (
            <button onClick={onEnviar} disabled={enviando || completos.length===0}
              style={{ width:"100%", padding:16, borderRadius:14, border:"none", background: completos.length>0 ? AZUL:"#e2e8f0", color: completos.length>0 ? OURO:"#94a3b8", fontSize:16, fontWeight:700, cursor: completos.length>0?"pointer":"default" }}>
              {enviando ? "Enviando..." : `Enviar avaliação (${completos.length}/${lista.length})`}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Vista: lista
  return (
    <div style={{ minHeight:"100vh", background:CZ_CL }}>
      <Header titulo="Avaliação de Jogadores"
        direita={
          <button onClick={() => setView("resumo")}
            style={{ background:OURO, border:"none", borderRadius:10, padding:"7px 14px", color:AZUL_ESC, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            Resumo →
          </button>
        }
      />
      <div style={{ background:AZUL, padding:"8px 1.25rem 10px" }}>
        <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:20, height:7, overflow:"hidden" }}>
          <div style={{ background:OURO, height:"100%", width:`${pct}%`, borderRadius:20, transition:"width .4s" }} />
        </div>
        <div style={{ color:"rgba(255,255,255,0.6)", fontSize:11, marginTop:4, textAlign:"right" }}>
          {preenchidos}/{lista.length} avaliados — {avaliador}
        </div>
      </div>
      <div style={{ padding:"0.75rem" }}>
        {lista.map((j,idx) => {
          const notas = avaliacoes[j] || {};
          const nf = notaFinal(notas);
          const nP = CRITERIOS.filter(c => notas[c.key] !== undefined && notas[c.key] !== "").length;
          const ok = nP === 4;
          return (
            <button key={j} onClick={() => { setJogadorAtual(j); setView("jogador"); }}
              style={{ display:"flex", alignItems:"center", width:"100%", padding:"11px 14px", marginBottom:7, background:BRANCO, borderRadius:14, border: ok ? `1px solid ${OURO_CL}` : "1px solid #e2e8f0", cursor:"pointer", gap:12, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ width:26, height:26, borderRadius:7, background: ok ? AZUL : CZ_CL, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color: ok ? OURO : "#64748b", flexShrink:0 }}>
                {idx+1}
              </div>
              <div style={{ flex:1, textAlign:"left" }}>
                <div style={{ fontWeight:600, fontSize:13, color:"#1e293b" }}>{j}</div>
                <div style={{ display:"flex", gap:4, marginTop:5 }}>
                  {CRITERIOS.map(c => (
                    <div key={c.key} style={{ flex:1, height:4, borderRadius:2, background: notas[c.key]!==undefined && notas[c.key]!=="" ? notaColor(notas[c.key]):"#e2e8f0" }} />
                  ))}
                </div>
              </div>
              <div style={{ minWidth:42, height:42, borderRadius:10, background: nf!==null ? notaColor(nf):CZ_CL, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border: ok ? `2px solid ${OURO}` : "2px solid transparent" }}>
                {nf!==null ? (
                  <>
                    <div style={{ fontSize:15, fontWeight:800, color:"#1e293b", lineHeight:1 }}>{nf.toFixed(1)}</div>
                    <div style={{ fontSize:9, color:"#64748b" }}>{nP}/4</div>
                  </>
                ) : <div style={{ fontSize:11, color:"#94a3b8" }}>{nP}/4</div>}
              </div>
              <div style={{ color:"#cbd5e1", fontSize:18 }}>›</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ── Exportar para CSV ────────────────────────────────────────────────────────
function exportarCSV(consolidado, dados) {
  const linhas = [];

  // Cabeçalho principal
  linhas.push("VOLEI GUIOMAR DE MELO — Avaliações Consolidadas");
  linhas.push(`Exportado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`);
  linhas.push("");

  // ── ABA 1: Ranking consolidado
  linhas.push("=== RANKING CONSOLIDADO ===");
  linhas.push("Pos,Jogador,Técnica,Físico,Tática,Atitude,NOTA FINAL,Avaliações recebidas");
  consolidado.forEach((j, i) => {
    linhas.push([
      i + 1,
      j.nome,
      j.medias.tecnica !== null ? j.medias.tecnica.toFixed(2) : "—",
      j.medias.fisico  !== null ? j.medias.fisico.toFixed(2)  : "—",
      j.medias.tatica  !== null ? j.medias.tatica.toFixed(2)  : "—",
      j.medias.atitude !== null ? j.medias.atitude.toFixed(2) : "—",
      j.nf !== null ? j.nf.toFixed(1) : "—",
      j.qtd
    ].join(","));
  });

  linhas.push("");
  linhas.push("=== AVALIAÇÕES INDIVIDUAIS (quem avaliou quem) ===");
  linhas.push("Avaliador,Jogador Avaliado,Técnica,Físico,Tática,Atitude,Nota Final");

  Object.entries(dados).forEach(([avaliador, respostas]) => {
    JOGADORES.forEach(jog => {
      if (avaliador === jog) return;
      const av = respostas[jog];
      if (!av) return;
      const nf = notaFinal(av);
      linhas.push([
        avaliador,
        jog,
        av.tecnica !== undefined ? Number(av.tecnica).toFixed(1) : "—",
        av.fisico  !== undefined ? Number(av.fisico).toFixed(1)  : "—",
        av.tatica  !== undefined ? Number(av.tatica).toFixed(1)  : "—",
        av.atitude !== undefined ? Number(av.atitude).toFixed(1) : "—",
        nf !== null ? nf.toFixed(1) : "—"
      ].join(","));
    });
  });

  linhas.push("");
  linhas.push("=== NOTAS PARA O TEAMS GENERATION ===");
  linhas.push("Jogador,Posição App,NOTA 0-10");
  consolidado.forEach(j => {
    linhas.push([
      j.nome,
      "",
      j.nf !== null ? j.nf.toFixed(1) : "—"
    ].join(","));
  });

  const csv = "\uFEFF" + linhas.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `VGM_Avaliacoes_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Painel Admin ─────────────────────────────────────────────────────────────
function TelaAdmin({ dados, onVoltar }) {
  const [tab, setTab] = useState("ranking");
  const [jogadorSelecionado, setJogadorSelecionado] = useState(null);

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
    const qtd = Object.entries(dados).filter(([av]) => av !== jog && dados[av]?.[jog]?.tecnica !== undefined).length;
    return { nome:jog, medias, nf, qtd };
  }).sort((a,b) => (b.nf||0)-(a.nf||0));

  const jaAvaliaram = Object.keys(dados);

  // Sub-detalhe: votos recebidos por jogador
  if (jogadorSelecionado) {
    const votosRecebidos = Object.entries(dados)
      .filter(([av]) => av !== jogadorSelecionado && dados[av]?.[jogadorSelecionado])
      .map(([av, avDados]) => ({ avaliador: av, notas: avDados[jogadorSelecionado] }));

    const mediaCrit = (crit) => {
      const arr = votosRecebidos.map(v => v.notas[crit]).filter(v => v !== undefined).map(Number).sort((a,b)=>a-b);
      if (!arr.length) return null;
      const sem = arr.length >= 3 ? arr.slice(1,-1) : arr;
      return sem.reduce((a,b)=>a+b,0)/sem.length;
    };
    const mediaGeral = notaFinal({ tecnica:mediaCrit("tecnica"), fisico:mediaCrit("fisico"), tatica:mediaCrit("tatica"), atitude:mediaCrit("atitude") });

    return (
      <div style={{ minHeight:"100vh", background:CZ_CL }}>
        <Header titulo={`🔍 ${jogadorSelecionado}`} onVoltar={() => setJogadorSelecionado(null)}
          direita={mediaGeral !== null && (
            <div style={{ background:OURO, borderRadius:10, padding:"5px 14px", textAlign:"center" }}>
              <div style={{ fontSize:9, color:AZUL_ESC, fontWeight:700 }}>NOTA FINAL</div>
              <div style={{ fontSize:20, color:AZUL_ESC, fontWeight:800, lineHeight:1 }}>{mediaGeral.toFixed(1)}</div>
            </div>
          )}
        />
        <div style={{ padding:"1rem" }}>
          {/* Médias por critério */}
          <div style={{ background:BRANCO, borderRadius:14, border:`1px solid ${OURO_CL}`, overflow:"hidden", marginBottom:12 }}>
            <div style={{ background:AZUL, padding:"10px 16px" }}>
              <span style={{ color:OURO, fontSize:11, fontWeight:700 }}>MÉDIAS POR CRITÉRIO — {votosRecebidos.length} avaliações</span>
            </div>
            {CRITERIOS.map(c => {
              const m = mediaCrit(c.key);
              return (
                <div key={c.key} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", borderBottom:"1px solid #f1f5f9" }}>
                  <span style={{ fontSize:18 }}>{c.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#1e293b" }}>{c.label} <span style={{ color:"#94a3b8" }}>({Math.round(c.peso*100)}%)</span></div>
                    <div style={{ background:"#f1f5f9", borderRadius:6, height:6, marginTop:5, overflow:"hidden" }}>
                      <div style={{ background: m!==null?AZUL:"#e2e8f0", height:"100%", width:`${m!==null?(m/10)*100:0}%`, borderRadius:6 }} />
                    </div>
                  </div>
                  <span style={{ background: m!==null?notaColor(m):"#f1f5f9", borderRadius:8, padding:"4px 12px", fontSize:14, fontWeight:800, color:"#1e293b", minWidth:44, textAlign:"center" }}>
                    {m!==null?m.toFixed(1):"—"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Lista individual */}
          <div style={{ background:BRANCO, borderRadius:14, border:"1px solid #e2e8f0", overflow:"hidden" }}>
            <div style={{ background:AZUL, padding:"10px 16px", display:"flex", gap:6 }}>
              <span style={{ color:OURO, fontSize:10, fontWeight:700, flex:2 }}>AVALIADOR</span>
              {CRITERIOS.map(c=><span key={c.key} style={{ color:"rgba(255,255,255,0.5)", fontSize:11, flex:1, textAlign:"center" }}>{c.icon}</span>)}
              <span style={{ color:OURO, fontSize:10, fontWeight:700, flex:1, textAlign:"center" }}>NOTA</span>
            </div>
            {votosRecebidos.length === 0
              ? <div style={{ padding:16, textAlign:"center", color:"#94a3b8", fontSize:13 }}>Nenhuma avaliação recebida ainda.</div>
              : votosRecebidos.map((v,i) => {
                  const nf = notaFinal(v.notas);
                  return (
                    <div key={v.avaliador} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderBottom:i<votosRecebidos.length-1?"1px solid #f1f5f9":"none" }}>
                      <span style={{ flex:2, fontSize:12, fontWeight:600, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.avaliador}</span>
                      {CRITERIOS.map(c=>(
                        <span key={c.key} style={{ flex:1, textAlign:"center", fontSize:12, fontWeight:600, color:"#1e293b" }}>
                          {v.notas[c.key]!==undefined && v.notas[c.key]!=="" ? Number(v.notas[c.key]).toFixed(1) : "—"}
                        </span>
                      ))}
                      <div style={{ flex:1, textAlign:"center" }}>
                        <span style={{ background:nf!==null?notaColor(nf):"#f1f5f9", borderRadius:8, padding:"3px 8px", fontSize:12, fontWeight:800 }}>
                          {nf!==null?nf.toFixed(1):"—"}
                        </span>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:CZ_CL }}>
      <Header titulo="Painel Administrador" onVoltar={onVoltar} />
      <div style={{ background:AZUL, padding:"8px 1.25rem 12px", display:"flex", gap:8 }}>
        {["ranking","participacao"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:"6px 16px", borderRadius:20, border:"none", background:tab===t?OURO:"rgba(255,255,255,0.1)", color:tab===t?AZUL_ESC:BRANCO, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            {t==="ranking" ? "🏆 Ranking" : "👥 Participação"}
          </button>
        ))}
      </div>

      <div style={{ padding:"1rem" }}>
        {tab==="ranking" && (
          <>
            <p style={{ fontSize:11, color:"#94a3b8", marginBottom:10, textAlign:"center" }}>Toque em um jogador para ver todas as avaliações recebidas</p>
            <button
              onClick={() => exportarCSV(consolidado, dados)}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"12px", borderRadius:12, border:`1px solid ${OURO}`, background:`rgba(245,168,0,0.08)`, color:OURO, fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:12 }}>
              📥 Exportar planilha completa (.csv)
            </button>
            <div style={{ background:BRANCO, borderRadius:14, border:"1px solid #e2e8f0", overflow:"hidden", marginBottom:10 }}>
              <div style={{ background:AZUL, padding:"10px 16px", display:"flex", gap:6 }}>
                <span style={{ color:OURO, fontSize:10, fontWeight:700, flex:2 }}>JOGADOR</span>
                {CRITERIOS.map(c=><span key={c.key} style={{ color:"rgba(255,255,255,0.5)", fontSize:11, flex:1, textAlign:"center" }}>{c.icon}</span>)}
                <span style={{ color:OURO, fontSize:10, fontWeight:700, flex:1, textAlign:"center" }}>NOTA</span>
              </div>
              {consolidado.map((j,i) => (
                <div key={j.nome} onClick={() => setJogadorSelecionado(j.nome)}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 16px", borderBottom:i<consolidado.length-1?"1px solid #f1f5f9":"none", background:i<3?`rgba(26,58,143,0.04)`:"transparent", cursor:"pointer" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:i<3?AZUL:"#94a3b8", width:20 }}>{i+1}</span>
                  <span style={{ flex:2, fontSize:12, fontWeight:600, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{j.nome}</span>
                  {CRITERIOS.map(c=>(
                    <span key={c.key} style={{ flex:1, textAlign:"center", fontSize:12, fontWeight:600, color:j.medias[c.key]!==null?"#1e293b":"#e2e8f0" }}>
                      {j.medias[c.key]!==null?j.medias[c.key].toFixed(1):"—"}
                    </span>
                  ))}
                  <div style={{ flex:1, textAlign:"center" }}>
                    <span style={{ background:j.nf!==null?notaColor(j.nf):"#f1f5f9", borderRadius:8, padding:"3px 8px", fontSize:13, fontWeight:800 }}>
                      {j.nf!==null?j.nf.toFixed(1):"—"}
                    </span>
                  </div>
                  <span style={{ color:"#cbd5e1", fontSize:14 }}>›</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize:10, color:"#94a3b8", textAlign:"center" }}>⚡×40% + 🏃×25% + 🧠×25% + 🤝×10% · notas extremas descartadas</div>
          </>
        )}

        {tab==="participacao" && (
          <div style={{ background:BRANCO, borderRadius:14, border:"1px solid #e2e8f0", overflow:"hidden" }}>
            <div style={{ background:AZUL, padding:"10px 16px", display:"flex", justifyContent:"space-between" }}>
              <span style={{ color:OURO, fontSize:11, fontWeight:700 }}>PARTICIPAÇÃO</span>
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
    if (senhaDigitada === "TiagoAdmin") setTela("admin");
    else if (senhaDigitada !== null && senhaDigitada !== "") alert("Senha incorreta! Acesso negado.");
  }

  if (carregando) return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg, ${AZUL_ESC}, ${AZUL})`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <img src="/VGM.jpg" alt="Logo" style={{ width:80, height:80, borderRadius:16, boxShadow:`0 0 0 3px ${OURO}` }} />
      <div style={{ color:OURO, fontSize:15, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Carregando...</div>
    </div>
  );

  if (tela==="admin") return <TelaAdmin dados={todasRespostas} onVoltar={() => setTela("selecao")} />;
  if (tela==="avaliacao") return (
    <TelaAvaliacao avaliador={avaliador} avaliacoes={avaliacoes} setAvaliacoes={setAvaliacoes}
      onEnviar={handleEnviar} enviando={enviando} jaEnviou={jaEnviou} onVoltar={() => setTela("selecao")} />
  );
  return <TelaSelecao onSelect={handleSelect} jaAvaliaram={jaAvaliaram} onAdmin={acessarAdmin} />;
}
