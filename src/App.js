import { useState, useEffect } from "react";

// ── Cores VGM V2 ──────────────────────────────────────────────────────────────
const AZUL     = "#0047A1";
const AZUL_ESC = "#001f4d";
const AZUL_MED = "#003380";
const OURO     = "#FFC107";
const OURO_ESC = "#D4AF37";
const OURO_CL  = "#FFD966";
const PRETO    = "#000000";
const BRANCO   = "#ffffff";
const CZ_CL    = "#0a1628";
const CZ_MED   = "#0d1f3c";
const CZ_CARD  = "#0a1f4a";
const AM       = "#1a3460";

// ── Jogadores com gênero pré-definido ────────────────────────────────────────
const JOGADORES_BASE = [
  { nome:"AMANDA",     genero:"F" }, { nome:"ANA PAULA",  genero:"F" },
  { nome:"BARBARA F",  genero:"F" }, { nome:"BARBARA O",  genero:"F" },
  { nome:"BIANCA",     genero:"F" }, { nome:"BRUNNA",     genero:"F" },
  { nome:"CAMILLA",    genero:"F" }, { nome:"CARMEN",     genero:"F" },
  { nome:"CHARLES",    genero:"M" }, { nome:"DILLEYGOR",  genero:"M" },
  { nome:"DIORGE",     genero:"M" }, { nome:"EBER",       genero:"M" },
  { nome:"EDUARDO A",  genero:"M" }, { nome:"EDUARDO M",  genero:"M" },
  { nome:"ELISA",      genero:"F" }, { nome:"FABIULA",    genero:"F" },
  { nome:"FLAVIA",     genero:"F" }, { nome:"HELENO",     genero:"M" },
  { nome:"JEAN",       genero:"M" }, { nome:"JOAO",       genero:"M" },
  { nome:"LAISSE",     genero:"F" }, { nome:"LEO",        genero:"M" },
  { nome:"LORRAYNE",   genero:"F" }, { nome:"LUCIO",      genero:"M" },
  { nome:"MARCIM",     genero:"M" }, { nome:"MARIO",      genero:"M" },
  { nome:"MATHEUS C",  genero:"M" }, { nome:"MATHEUS Q",  genero:"M" },
  { nome:"MAXWELL",    genero:"M" }, { nome:"MURILO",     genero:"M" },
  { nome:"RODRIGO",    genero:"M" }, { nome:"RUBENS",     genero:"M" },
  { nome:"SIDNEY",     genero:"M" }, { nome:"TAINAH",     genero:"F" },
  { nome:"TIAGO",      genero:"M" }, { nome:"VAGNO",      genero:"M" },
  { nome:"VINI ALVES", genero:"M" }, { nome:"WAGNER",     genero:"M" },
  { nome:"YUGUI",      genero:"M" },
];
const JOGADORES = JOGADORES_BASE.map(j => j.nome);
const TOTAL_VOTANTES = JOGADORES.length;
const FIREBASE_URL = "https://volei-guiomar-default-rtdb.firebaseio.com";

// ── Tabela porte → nota base ──────────────────────────────────────────────────
// Aceita porte ("Baixo"/"Médio"/"Alto") ou altura em cm para compatibilidade
function notaBaseAltura(porteOuAltura, genero) {
  if (!porteOuAltura) return null;
  // Se for porte textual
  if (porteOuAltura === "Baixo") return 1;
  if (porteOuAltura === "Médio") return 4;
  if (porteOuAltura === "Alto")  return 7;
  // Fallback: altura em cm (compatibilidade)
  const h = Number(porteOuAltura);
  if (isNaN(h)) return null;
  if (genero === "M") {
    if (h < 170) return 1;
    if (h <= 180) return 4;
    return 7;
  } else {
    if (h < 160) return 1;
    if (h <= 170) return 4;
    return 7;
  }
}

function calcFisico(altura, genero, mobilidade) {
  const base = notaBaseAltura(altura, genero);
  if (base === null || mobilidade === null || mobilidade === undefined) return null;
  return Math.min(10, base + Number(mobilidade));
}

function notaFinalV2(tecnico, fisico, leitura) {
  if (tecnico===null||fisico===null||leitura===null) return null;
  return Math.round(((tecnico*0.6)+(fisico*0.25)+(leitura*0.15))*2)/2;
}

function leituraTotal(sub) {
  if (!sub) return null;
  // Formato novo: posicionamento, leitura, decisao
  if (sub.posicionamento!==undefined || sub.leitura!==undefined) {
    const { posicionamento, leitura, decisao } = sub;
    if ([posicionamento,leitura,decisao].some(v=>v===null||v===undefined)) return null;
    return Number(posicionamento)+Number(leitura)+Number(decisao);
  }
  // Formato antigo: rotacao, espacos, decisao, comunicacao
  const { rotacao, espacos, decisao, comunicacao } = sub;
  if ([rotacao,espacos,decisao,comunicacao].some(v=>v===null||v===undefined)) return null;
  return Number(rotacao)+Number(espacos)+Number(decisao)+Number(comunicacao);
}

// ── Níveis ────────────────────────────────────────────────────────────────────
function nivelLabel(nota) {
  if (!nota) return "—";
  if (nota >= 9.0) return "💎 Diamante";
  if (nota >= 8.0) return "🥇 Platina";
  if (nota >= 7.0) return "🥈 Ouro";
  if (nota >= 6.0) return "🥉 Prata";
  return "🏅 Bronze";
}

function notaColor(n) {
  if (n===null||n===undefined||n==="") return "#1a3a6a";
  if (n<=2)  return "#7f1d1d";
  if (n<=4)  return "#7c2d12";
  if (n<=6)  return "#713f12";
  if (n<=8)  return "#14532d";
  return "#1e3a5f";
}
function notaColorText(n) {
  if (n===null||n===undefined||n==="") return "#94a3b8";
  if (n<=2)  return "#fca5a5";
  if (n<=4)  return "#fdba74";
  if (n<=6)  return "#fde047";
  if (n<=8)  return "#86efac";
  return "#93c5fd";
}

// ── Firebase ──────────────────────────────────────────────────────────────────
async function fbGet(path) {
  try {
    const res = await fetch(`${FIREBASE_URL}/${path}.json`);
    const txt = await res.text();
    if (!res.ok||txt==="null"||!txt) return null;
    return JSON.parse(txt);
  } catch { return null; }
}
async function fbSet(path, data) {
  try {
    const res = await fetch(`${FIREBASE_URL}/${path}.json`, {
      method:"PUT", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch { return false; }
}
async function fbPatch(path, data) {
  try {
    const res = await fetch(`${FIREBASE_URL}/${path}.json`, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch { return false; }
}

async function carregarTudo() {
  const [avalData, validData, fase3Data, configData, cadastroData] = await Promise.all([
    fbGet("avaliacoes"), fbGet("validacao"), fbGet("fase3"),
    fbGet("config"), fbGet("cadastro")
  ]);
  const avaliacoes = {};
  if (avalData) Object.values(avalData).forEach(e => { if(e?.avaliador) avaliacoes[decodeURIComponent(e.avaliador)]=e.dados; });
  const validacao = {};
  if (validData) Object.values(validData).forEach(e => { if(e?.votante) validacao[decodeURIComponent(e.votante)]=e.votos; });
  const fase3 = {};
  if (fase3Data) Object.entries(fase3Data).forEach(([k,v]) => { fase3[decodeURIComponent(k.replace(/%/g,'%'))]=v; });
  const config = configData || { fase2Liberada:false, fase3Liberada:false };
  const cadastro = cadastroData || {};
  return { avaliacoes, validacao, fase3, config, cadastro };
}

// ── Serpentina global (compartilhada entre admin e tela de sorteio) ─────────────
function gerarSerpentina(listaFinal, nTimes, vagasH, vagasM) {
  const homens   = listaFinal.filter(j => JOGADORES_BASE.find(x=>x.nome===j.nome)?.genero==="M")
                              .sort((a,b)=>(b.notaFinal||0)-(a.notaFinal||0));
  const mulheres = listaFinal.filter(j => JOGADORES_BASE.find(x=>x.nome===j.nome)?.genero==="F")
                              .sort((a,b)=>(b.notaFinal||0)-(a.notaFinal||0));

  const times = Array.from({length:nTimes}, () => ({ homens:[], mulheres:[], soma:0 }));

  // Serpentina homens
  const hAtivos = homens.slice(0, vagasH * nTimes);
  const hReservas = homens.slice(vagasH * nTimes);
  let dir=1, t=0;
  hAtivos.forEach(j => {
    times[t].homens.push(j); times[t].soma += j.notaFinal||0;
    t += dir;
    if (t >= nTimes) { t = nTimes-1; dir = -1; }
    else if (t < 0)  { t = 0; dir = 1; }
  });

  // Serpentina mulheres
  const mAtivas = mulheres.slice(0, vagasM * nTimes);
  const mReservas = mulheres.slice(vagasM * nTimes);
  dir=1; t=0;
  mAtivas.forEach(j => {
    times[t].mulheres.push(j); times[t].soma += j.notaFinal||0;
    t += dir;
    if (t >= nTimes) { t = nTimes-1; dir = -1; }
    else if (t < 0)  { t = 0; dir = 1; }
  });

  const reservas = [...hReservas, ...mReservas];
  return { times, reservas };
}

// ── Calcular resultado final (helper compartilhado) ───────────────────────────
function calcResultadoFinal(dados, cadastro, votosValidacao, fase3) {
  const consolidado = JOGADORES.map(jog => {
    const avs = Object.entries(dados).filter(([av]) => av !== jog);
    const tecArr = avs.map(([,av])=>av[jog]?.tecnico).filter(v=>v!=null).map(Number);
    const mobArr = avs.map(([,av])=>av[jog]?.fisico_mob).filter(v=>v!=null).map(Number);
    const ltArr  = avs.map(([,av])=>leituraTotal(av[jog]?.leitura_sub)).filter(v=>v!=null);
    const media = arr => {
      if (!arr.length) return null;
      const s = arr.length>=3 ? [...arr].sort((a,b)=>a-b).slice(1,-1) : arr;
      return s.reduce((a,b)=>a+b,0)/s.length;
    };
    const gen = JOGADORES_BASE.find(j=>j.nome===jog)?.genero||"M";
    const nb  = notaBaseAltura(cadastro[jog]?.porte||cadastro[jog]?.altura, gen);
    const mobM = media(mobArr);
    const fis  = nb!==null && mobM!==null ? Math.min(10, nb+mobM) : null;
    const nf   = notaFinalV2(media(tecArr), fis, media(ltArr));
    return { nome:jog, nf, qtd:tecArr.length };
  });

  return consolidado.map(j => {
    if (!j.nf) return { ...j, notaFinal: null };
    if (fase3[j.nome]?.notaAjustada !== undefined)
      return { ...j, notaFinal: fase3[j.nome].notaAjustada, ajustadaF3: true };
    const opcoes = [Math.round((j.nf-0.5)*2)/2, j.nf, Math.round((j.nf+0.5)*2)/2];
    const contagem = { [opcoes[0]]:0, [j.nf]:0, [opcoes[2]]:0 };
    Object.values(votosValidacao).forEach(v => {
      const voto = v[j.nome];
      if (voto!==undefined && contagem[voto]!==undefined) contagem[voto]++;
    });
    let maxV=-1, nfV=j.nf;
    Object.entries(contagem).forEach(([nota,qtd]) => {
      if (qtd>maxV || (qtd===maxV && Number(nota)===j.nf)) { maxV=qtd; nfV=Number(nota); }
    });
    return { ...j, notaFinal: nfV };
  }).filter(j=>j.notaFinal!==null)
    .sort((a,b)=>(b.notaFinal||0)-(a.notaFinal||0));
}

// ── Header VGM ────────────────────────────────────────────────────────────────
function Header({ titulo, subtitulo, onVoltar, direita }) {
  return (
    <div style={{ background:`linear-gradient(135deg, ${PRETO} 0%, ${AZUL_ESC} 50%, ${AZUL_MED} 100%)`, padding:"0.85rem 1.25rem", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10, boxShadow:`0 2px 20px rgba(0,0,0,0.5), 0 1px 0 ${OURO_ESC}` }}>
      {onVoltar
        ? <button onClick={onVoltar} style={{ background:`rgba(255,193,7,0.15)`, border:`1px solid rgba(212,175,55,0.4)`, color:OURO, borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:16, lineHeight:1 }}>←</button>
        : <img src="/VGM.png" alt="VGM" width="38" height="38" style={{ width:38, height:38, borderRadius:8, objectFit:"cover", border:`2px solid ${OURO_ESC}` }} />
      }
      <div style={{ flex:1 }}>
        <div style={{ color:OURO_ESC, fontSize:9, fontWeight:700, letterSpacing:2 }}>★ VOLEI GUIOMAR DE MELO ★</div>
        <div style={{ color:BRANCO, fontSize:15, fontWeight:700 }}>{titulo}</div>
        {subtitulo && <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>{subtitulo}</div>}
      </div>
      {direita}
    </div>
  );
}

// ── Tela Seleção ──────────────────────────────────────────────────────────────
function TelaSelecao({ onF1, onF2, jaAvaliaram, fase2Liberada, onAdmin, onSorteio }) {
  const [busca, setBusca] = useState("");
  const filtrados = JOGADORES.filter(j => j.toLowerCase().includes(busca.toLowerCase()));
  const pct = Math.round((jaAvaliaram.length/TOTAL_VOTANTES)*100);

  return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(ellipse at top, ${AZUL_MED} 0%, ${AZUL_ESC} 40%, ${PRETO} 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem 1rem" }}>
      <div style={{ marginBottom:"1.5rem", textAlign:"center" }}>
        <img src="/VGM.png" alt="Logo" width="110" height="110" style={{ width:110, height:110, borderRadius:20, objectFit:"cover", boxShadow:`0 0 0 3px ${OURO_ESC}, 0 0 25px rgba(255,193,7,0.25)`, marginBottom:14 }} />
        <h1 style={{ color:OURO, fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, margin:0 }}>Guiomar de Melo</h1>
        <p style={{ color:OURO_ESC, fontSize:10, fontWeight:700, marginTop:3, letterSpacing:2 }}>UNIÃO · FORÇA · EVOLUÇÃO</p>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:10, marginTop:2 }}>Fundado em 2020 · Sistema de avaliação V2</p>
      </div>

      {/* Progresso */}
      <div style={{ width:"100%", maxWidth:400, marginBottom:12, padding:"10px 16px", background:`rgba(0,31,77,0.6)`, borderRadius:14, border:`1px solid rgba(212,175,55,0.3)` }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ color:"rgba(255,255,255,0.7)", fontSize:11, fontWeight:700, letterSpacing:1 }}>⚡ FASE 1 — AVALIAÇÃO</span>
          <span style={{ color:OURO, fontSize:12, fontWeight:800 }}>{jaAvaliaram.length}<span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}>/{TOTAL_VOTANTES}</span></span>
        </div>
        <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:20, height:6, overflow:"hidden" }}>
          <div style={{ background:`linear-gradient(90deg, ${OURO} 0%, ${OURO_ESC} 100%)`, height:"100%", width:`${pct}%`, borderRadius:20, transition:"width .5s", boxShadow:`0 0 8px ${OURO}` }} />
        </div>
        <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, marginTop:4, textAlign:"right" }}>{pct}% concluído</div>
      </div>

      {/* Lista */}
      <div style={{ background:`rgba(0,31,77,0.8)`, backdropFilter:"blur(16px)", borderRadius:20, padding:"1.5rem", width:"100%", maxWidth:400, border:`1px solid ${OURO_ESC}`, marginBottom:12, boxShadow:`0 0 30px rgba(255,193,7,0.08)` }}>
        <p style={{ color:OURO, fontSize:12, marginBottom:"0.75rem", textAlign:"center", fontWeight:700, letterSpacing:1 }}>📝 SELECIONE SEU NOME PARA AVALIAR</p>
        <input placeholder="🔍 Buscar seu nome..." value={busca} onChange={e=>setBusca(e.target.value)}
          style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${OURO_ESC}`, background:`rgba(0,51,128,0.5)`, color:BRANCO, fontSize:14, marginBottom:10, outline:"none", boxSizing:"border-box" }} />
        <div style={{ maxHeight:260, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
          {filtrados.map(j => {
            const enviou = jaAvaliaram.includes(j);
            return (
              <button key={j} onClick={() => { if(enviou) alert("🔒 Você já enviou sua avaliação. Obrigado!"); else onF1(j); }}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 16px", borderRadius:10, border: enviou?`1px solid rgba(212,175,55,0.2)`:`1px solid rgba(255,255,255,0.08)`, background: enviou?"rgba(212,175,55,0.06)":"rgba(255,255,255,0.04)", color: enviou?"rgba(255,255,255,0.35)":BRANCO, fontSize:14, fontWeight:600, cursor: enviou?"not-allowed":"pointer", textAlign:"left" }}>
                <span>{j}</span>
                {enviou ? <span style={{ fontSize:11, color:OURO_ESC, background:"rgba(212,175,55,0.12)", padding:"2px 8px", borderRadius:20 }}>🔒 enviado</span>
                        : <span style={{ color:"rgba(255,255,255,0.25)", fontSize:16 }}>›</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fase 2 */}
      {fase2Liberada ? (
        <div style={{ width:"100%", maxWidth:400, marginBottom:8 }}>
          <button onClick={onF2} style={{ width:"100%", padding:"14px", borderRadius:14, border:"none", background:`linear-gradient(135deg, ${OURO} 0%, ${OURO_ESC} 100%)`, color:AZUL_ESC, fontSize:14, fontWeight:800, cursor:"pointer", boxShadow:`0 4px 20px rgba(255,193,7,0.35)`, letterSpacing:0.5 }}>
            🗳️ Validar notas — 2ª rodada
          </button>
        </div>
      ) : (
        <div style={{ width:"100%", maxWidth:400, marginBottom:8, padding:"14px 16px", borderRadius:14, border:`1px dashed rgba(212,175,55,0.2)`, background:`rgba(0,20,60,0.5)`, textAlign:"center" }}>
          <div style={{ color:"rgba(255,193,7,0.45)", fontSize:12, fontWeight:700, letterSpacing:1 }}>🔒 FASE 2 — BLOQUEADA</div>
          <div style={{ color:"rgba(255,255,255,0.3)", fontSize:11, marginTop:4 }}>Aguardando todos os {TOTAL_VOTANTES} enviarem a fase 1</div>
          <div style={{ color:OURO_ESC, fontSize:11, marginTop:3, fontWeight:700 }}>{TOTAL_VOTANTES-jaAvaliaram.length} ainda {TOTAL_VOTANTES-jaAvaliaram.length!==1?"faltam":"falta"}</div>
        </div>
      )}

      <button onClick={onSorteio}
        style={{ marginTop:8, width:"100%", maxWidth:400, padding:"12px", borderRadius:14, border:`1px solid rgba(255,193,7,0.3)`, background:"rgba(255,193,7,0.07)", color:OURO_CL, fontSize:13, fontWeight:700, cursor:"pointer" }}>
        🎲 Montar Times
      </button>

      <button onClick={onAdmin} style={{ marginTop:8, background:"none", border:`1px solid rgba(212,175,55,0.15)`, color:"rgba(255,255,255,0.25)", fontSize:10, borderRadius:8, padding:"5px 14px", cursor:"pointer", letterSpacing:1 }}>
        ⚙ painel administrador
      </button>
    </div>
  );
}

// ── Tela Avaliação Fase 1 ─────────────────────────────────────────────────────
function TelaAvaliacao({ avaliador, avaliacoes, setAvaliacoes, cadastro, onEnviar, enviando, jaEnviou, onVoltar }) {
  const [view, setView] = useState("lista");
  const [jogAtual, setJogAtual] = useState(null);
  const lista = JOGADORES.filter(j=>j!==avaliador);

  function getAv(jog) { return avaliacoes[jog]||{}; }
  function setField(jog, field, val) {
    setAvaliacoes(prev=>({ ...prev, [jog]:{ ...(prev[jog]||{}), [field]:val } }));
  }
  function setSubLeitura(jog, sub, val) {
    const curr = (avaliacoes[jog]||{}).leitura_sub||{};
    setAvaliacoes(prev=>({ ...prev, [jog]:{ ...(prev[jog]||{}), leitura_sub:{ ...curr, [sub]:val } } }));
  }

  function isCompleto(jog) {
    const av = getAv(jog);
    const lt = leituraTotal(av.leitura_sub);
    return av.tecnico!==undefined && av.tecnico!=="" && av.fisico_mob!==undefined && lt!==null;
  }

  const preenchidos = lista.filter(j=>isCompleto(j)).length;
  const pct = Math.round((preenchidos/lista.length)*100);

  if (view==="jogador"&&jogAtual) {
    const av = getAv(jogAtual);
    const cad = cadastro[jogAtual]||{};
    const genero = JOGADORES_BASE.find(j=>j.nome===jogAtual)?.genero||"M";
    const notaBase = notaBaseAltura(cad.porte || cad.altura, genero);
    const mob = av.fisico_mob!==undefined?Number(av.fisico_mob):null;
    const fisico = notaBase!==null&&mob!==null?Math.min(10,notaBase+mob):null;
    const lt = leituraTotal(av.leitura_sub);
    const nf = notaFinalV2(av.tecnico!==undefined?Number(av.tecnico):null, fisico, lt);
    const idx = lista.indexOf(jogAtual);
    const prev = idx>0?lista[idx-1]:null;
    const next = idx<lista.length-1?lista[idx+1]:null;
    const sub = av.leitura_sub||{};

    return (
      <div style={{ minHeight:"100vh", background:CZ_CL }}>
        <Header titulo={jogAtual} subtitulo={`${genero==="F"?"♀":"♂"} ${cad.porte||cad.altura||""}`} onVoltar={()=>setView("lista")}
          direita={nf!==null&&<div style={{ background:`linear-gradient(135deg,${OURO},${OURO_ESC})`, borderRadius:10, padding:"5px 14px", textAlign:"center", minWidth:52 }}>
            <div style={{ fontSize:9, color:AZUL_ESC, fontWeight:700 }}>NOTA</div>
            <div style={{ fontSize:20, color:AZUL_ESC, fontWeight:800, lineHeight:1 }}>{nf.toFixed(1)}</div>
          </div>}
        />
        <div style={{ padding:"1rem", display:"flex", flexDirection:"column", gap:10 }}>

          {/* ── Técnico ── */}
          <div style={{ background:CZ_CARD, borderRadius:16, padding:"1rem 1.25rem", border:`1px solid rgba(212,175,55,${av.tecnico!==undefined?0.4:0.15})` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ color:OURO, fontWeight:700, fontSize:15 }}>⚡ Técnico <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400, fontSize:12 }}>(60%)</span></div>
                <div style={{ color:"rgba(255,255,255,0.55)", fontSize:12, marginTop:3 }}>Fundamentos gerais observados em jogo</div>
                <div style={{ color:"rgba(255,255,255,0.3)", fontSize:10, marginTop:2 }}>Saque · Passe · Levantamento · Ataque · Bloqueio · Defesa</div>
              </div>
              <div style={{ background:av.tecnico!==undefined?notaColor(av.tecnico):CZ_MED, borderRadius:10, minWidth:46, height:46, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:av.tecnico!==undefined?notaColorText(av.tecnico):"#4a5568", border:`2px solid ${av.tecnico!==undefined?OURO_ESC:"rgba(255,255,255,0.1)"}` }}>
                {av.tecnico!==undefined?Number(av.tecnico).toFixed(1):"—"}
              </div>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {[0,0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10].map(n=>(
                <button key={n} onClick={()=>setField(jogAtual,"tecnico",n)}
                  style={{ width:38, height:32, borderRadius:7, border: av.tecnico===n?`2px solid ${OURO}`:`1px solid rgba(255,255,255,0.1)`, background: av.tecnico===n?AZUL:notaColor(n), color: av.tecnico===n?OURO:notaColorText(n), fontSize:12, fontWeight:av.tecnico===n?700:500, cursor:"pointer" }}>
                  {n%1===0?n:n.toFixed(1)}
                </button>
              ))}
            </div>
          </div>

          {/* ── Físico ── */}
          <div style={{ background:CZ_CARD, borderRadius:16, padding:"1rem 1.25rem", border:`1px solid rgba(212,175,55,${av.fisico_mob!==undefined?0.4:0.15})` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ color:OURO, fontWeight:700, fontSize:15 }}>🏃 Físico <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400, fontSize:12 }}>(25%)</span></div>
                <div style={{ color:"rgba(255,255,255,0.45)", fontSize:11, marginTop:3 }}>
                  {notaBase!==null?`Nota base: ${notaBase} (porte ${cad.porte||cad.altura||"não cadastrado"})`:"Porte não cadastrado"}
                </div>
                <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:4, lineHeight:1.5 }}>
                  ♂ Baixo &lt;1,70m · Médio 1,70–1,80m · Alto &gt;1,80m
                </div>
                <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, lineHeight:1.5 }}>
                  ♀ Baixo &lt;1,60m · Médio 1,60–1,70m · Alto &gt;1,70m
                </div>
                <div style={{ color:"rgba(255,193,7,0.5)", fontSize:10, marginTop:3, fontStyle:"italic" }}>
                  Alto parado pode valer menos que Baixo explosivo — a mobilidade define!
                </div>
              </div>
              <div style={{ background:fisico!==null?notaColor(fisico):CZ_MED, borderRadius:10, minWidth:46, height:46, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:fisico!==null?notaColorText(fisico):"#4a5568", border:`2px solid ${fisico!==null?OURO_ESC:"rgba(255,255,255,0.1)"}` }}>
                {fisico!==null?fisico.toFixed(1):"—"}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
              {[{v:0,label:"Lento",sub:"muito lento, pouca impulsão e reação"},{v:1,label:"Abaixo",sub:"mobilidade limitada, reage tarde"},{v:2,label:"Boa",sub:"movimenta bem, reage na hora certa"},{v:3,label:"Excelente",sub:"explosivo, salto alto, reação rápida"}].map(({v,label,sub})=>(
                <button key={v} onClick={()=>setField(jogAtual,"fisico_mob",v)}
                  style={{ padding:"10px 6px", borderRadius:10, border: av.fisico_mob===v?`2px solid ${OURO}`:`1px solid rgba(255,255,255,0.1)`, background: av.fisico_mob===v?AZUL:CZ_MED, cursor:"pointer", textAlign:"center" }}>
                  <div style={{ fontSize:16, fontWeight:800, color: av.fisico_mob===v?OURO:BRANCO }}>+{v}</div>
                  <div style={{ fontSize:10, fontWeight:700, color: av.fisico_mob===v?OURO_CL:"rgba(255,255,255,0.6)", marginTop:2 }}>{label}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:1 }}>{sub}</div>
                </button>
              ))}
            </div>
            {notaBase!==null&&mob!==null&&<div style={{ marginTop:8, padding:"6px 10px", background:"rgba(255,193,7,0.08)", borderRadius:8, fontSize:11, color:OURO_ESC, textAlign:"center" }}>
              Base {notaBase} + mobilidade {mob} = <strong style={{color:OURO}}>Físico {fisico}</strong>
            </div>}
          </div>

          {/* ── Leitura de Jogo ── */}
          <div style={{ background:CZ_CARD, borderRadius:16, padding:"1rem 1.25rem", border:`1px solid rgba(212,175,55,${lt!==null?0.4:0.15})` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div>
                <div style={{ color:OURO, fontWeight:700, fontSize:15 }}>🧠 Leitura de Jogo <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400, fontSize:12 }}>(15%)</span></div>
                <div style={{ color:"rgba(255,255,255,0.45)", fontSize:11, marginTop:3 }}>Some os pontos de cada subcritério</div>
              </div>
              <div style={{ background:lt!==null?notaColor(lt):CZ_MED, borderRadius:10, minWidth:46, height:46, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:lt!==null?notaColorText(lt):"#4a5568", border:`2px solid ${lt!==null?OURO_ESC:"rgba(255,255,255,0.1)"}` }}>
                {lt!==null?lt:"—"}<span style={{fontSize:10}}>/10</span>
              </div>
            </div>
            {[
              { key:"posicionamento", label:"Posicionamento",    max:3, desc:"Está no lugar certo — defesa, bloqueio e cobertura de ataque" },
              { key:"leitura",        label:"Leitura de quadra", max:3, desc:"Antecipa jogadas, cobre espaços, ajuda o companheiro sem bola" },
              { key:"decisao",        label:"Tomada de decisão", max:4, desc:"Finta o bloqueio, encontra os buracos, explora o bloqueio adversário, decide rápido" },
            ].map(({ key, label, max, desc }) => {
              const val = sub[key];
              const opts = Array.from({length:max+1},(_,i)=>i);
              return (
                <div key={key} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <div>
                      <div style={{ color:BRANCO, fontSize:13, fontWeight:600 }}>{label} <span style={{ color:"rgba(255,255,255,0.35)", fontSize:11 }}>(0–{max})</span></div>
                      <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11 }}>{desc}</div>
                    </div>
                    <span style={{ color:val!==undefined?OURO:"rgba(255,255,255,0.25)", fontWeight:800, fontSize:16, minWidth:24, textAlign:"center" }}>{val!==undefined?val:"—"}</span>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {opts.map(o=>(
                      <button key={o} onClick={()=>setSubLeitura(jogAtual,key,o)}
                        style={{ flex:1, padding:"8px 4px", borderRadius:8, border: val===o?`2px solid ${OURO}`:`1px solid rgba(255,255,255,0.1)`, background: val===o?AZUL:CZ_MED, color: val===o?OURO:BRANCO, fontSize:13, fontWeight:val===o?800:500, cursor:"pointer" }}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nota final preview */}
          {nf!==null&&<div style={{ background:`linear-gradient(135deg, ${AZUL_ESC}, ${AZUL_MED})`, borderRadius:14, padding:"1rem", border:`1px solid ${OURO_ESC}`, textAlign:"center" }}>
            <div style={{ color:OURO_ESC, fontSize:10, fontWeight:700, letterSpacing:1, marginBottom:4 }}>NOTA FINAL CALCULADA</div>
            <div style={{ fontSize:36, fontWeight:800, color:OURO }}>{nf.toFixed(1)}</div>
            <div style={{ color:"rgba(255,255,255,0.45)", fontSize:10, marginTop:4 }}>
              ({Number(av.tecnico).toFixed(1)}×0,6) + ({fisico.toFixed(1)}×0,25) + ({lt}×0,15)
            </div>
            <div style={{ color:OURO_ESC, fontSize:11, fontWeight:600, marginTop:3 }}>{nivelLabel(nf)}</div>
          </div>}
        </div>

        <div style={{ display:"flex", gap:10, padding:"0 1rem 1.5rem" }}>
          {prev&&<button onClick={()=>setJogAtual(prev)} style={{ flex:1, padding:12, borderRadius:12, border:`1px solid rgba(255,255,255,0.1)`, background:CZ_CARD, color:BRANCO, fontSize:12, fontWeight:600, cursor:"pointer" }}>← {prev}</button>}
          {next?(
            <button onClick={()=>{ if(isCompleto(jogAtual)) setJogAtual(next); }} disabled={!isCompleto(jogAtual)}
              style={{ flex:1, padding:12, borderRadius:12, border:"none", background:isCompleto(jogAtual)?AZUL:CZ_MED, color:isCompleto(jogAtual)?OURO:"rgba(255,255,255,0.3)", fontSize:12, fontWeight:700, cursor:isCompleto(jogAtual)?"pointer":"not-allowed" }}>
              {!isCompleto(jogAtual)?"⚠️ Complete os 3 pilares":`${next} →`}
            </button>
          ):(
            <button onClick={()=>{ if(isCompleto(jogAtual)) setView("resumo"); }} disabled={!isCompleto(jogAtual)}
              style={{ flex:1, padding:12, borderRadius:12, border:"none", background:isCompleto(jogAtual)?`linear-gradient(135deg,${OURO},${OURO_ESC})`:CZ_MED, color:isCompleto(jogAtual)?AZUL_ESC:"rgba(255,255,255,0.3)", fontSize:13, fontWeight:700, cursor:isCompleto(jogAtual)?"pointer":"not-allowed" }}>
              {!isCompleto(jogAtual)?"⚠️ Complete os 3 pilares":"Ver resumo ✓"}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (view==="resumo") {
    const completos = lista.filter(j=>isCompleto(j));
    const incompletos = lista.filter(j=>!isCompleto(j));
    return (
      <div style={{ minHeight:"100vh", background:CZ_CL }}>
        <Header titulo={`Resumo — ${avaliador}`} onVoltar={()=>setView("lista")} />
        <div style={{ padding:"1rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            <div style={{ background:CZ_CARD, borderRadius:14, padding:"1rem", border:`1px solid ${OURO_ESC}`, textAlign:"center" }}>
              <div style={{ fontSize:28, fontWeight:800, color:OURO }}>{completos.length}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>completos</div>
            </div>
            <div style={{ background:CZ_CARD, borderRadius:14, padding:"1rem", border:"1px solid rgba(255,255,255,0.1)", textAlign:"center" }}>
              <div style={{ fontSize:28, fontWeight:800, color:incompletos.length>0?"#f97316":"#22c55e" }}>{incompletos.length}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>pendentes</div>
            </div>
          </div>
          {incompletos.length>0&&(
            <div style={{ background:"rgba(251,146,60,0.1)", borderRadius:14, padding:"1rem 1.25rem", marginBottom:14, border:"1px solid rgba(251,146,60,0.3)" }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#fb923c", marginBottom:8 }}>⚠️ Incompletos — toque para finalizar</div>
              {incompletos.map(j=><button key={j} onClick={()=>{ setJogAtual(j); setView("jogador"); }} style={{ display:"block", width:"100%", textAlign:"left", padding:"7px 0", background:"none", border:"none", borderBottom:"1px solid rgba(251,146,60,0.2)", color:"#fb923c", fontSize:13, cursor:"pointer" }}>→ {j}</button>)}
            </div>
          )}
          <div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid rgba(255,255,255,0.1)`, overflow:"hidden", marginBottom:14 }}>
            <div style={{ background:AZUL_ESC, padding:"10px 16px", display:"flex", justifyContent:"space-between", borderBottom:`1px solid ${OURO_ESC}` }}>
              <span style={{ color:OURO, fontSize:11, fontWeight:700 }}>NOTAS CALCULADAS</span>
              <span style={{ color:"rgba(255,255,255,0.4)", fontSize:11 }}>{completos.length}/{lista.length}</span>
            </div>
            {completos.map((j,i)=>{
              const av=getAv(j);
              const cad=cadastro[j]||{};
              const gen=JOGADORES_BASE.find(x=>x.nome===j)?.genero||"M";
              const nb=notaBaseAltura(cad.porte||cad.altura,gen);
              const mob=av.fisico_mob!==undefined?Number(av.fisico_mob):null;
              const fis=nb!==null&&mob!==null?Math.min(10,nb+mob):null;
              const lt=leituraTotal(av.leitura_sub);
              const nf=notaFinalV2(av.tecnico!==undefined?Number(av.tecnico):null,fis,lt);
              return (
                <div key={j} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 16px", borderBottom:i<completos.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <span style={{ fontSize:13, fontWeight:500, color:BRANCO }}>{j}</span>
                  <span style={{ background:nf!==null?notaColor(nf):CZ_MED, color:nf!==null?notaColorText(nf):"#94a3b8", borderRadius:8, padding:"3px 12px", fontSize:13, fontWeight:700 }}>{nf!==null?nf.toFixed(1):"—"}</span>
                </div>
              );
            })}
          </div>
          {jaEnviou?(
            <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:14, padding:"1.5rem", textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
              <div style={{ fontWeight:700, color:"#4ade80", fontSize:15 }}>Avaliação enviada!</div>
              <div style={{ color:"rgba(74,222,128,0.7)", fontSize:13, marginTop:4 }}>Obrigado, {avaliador}!</div>
              <button onClick={onVoltar} style={{ marginTop:14, padding:"10px 24px", borderRadius:10, border:"none", background:AZUL, color:OURO, fontSize:13, fontWeight:700, cursor:"pointer" }}>Voltar ao início</button>
            </div>
          ):(
            <button onClick={onEnviar} disabled={enviando||completos.length===0}
              style={{ width:"100%", padding:16, borderRadius:14, border:"none", background:completos.length>0?`linear-gradient(135deg,${AZUL},${AZUL_MED})`:CZ_MED, color:completos.length>0?OURO:"rgba(255,255,255,0.3)", fontSize:16, fontWeight:700, cursor:completos.length>0?"pointer":"default", boxShadow:completos.length>0?`0 4px 16px rgba(0,71,161,0.4)`:"none" }}>
              {enviando?"Enviando...":`Enviar avaliação (${completos.length}/${lista.length})`}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:CZ_CL }}>
      <Header titulo="Fase 1 — Avaliação" subtitulo="Técnico · Físico · Leitura de Jogo"
        direita={<button onClick={()=>setView("resumo")} style={{ background:`linear-gradient(135deg,${OURO},${OURO_ESC})`, border:"none", borderRadius:10, padding:"7px 14px", color:AZUL_ESC, fontSize:12, fontWeight:700, cursor:"pointer" }}>Resumo →</button>}
      />
      <div style={{ background:AZUL_ESC, padding:"8px 1.25rem 10px", borderBottom:`1px solid ${OURO_ESC}` }}>
        <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:20, height:6, overflow:"hidden" }}>
          <div style={{ background:`linear-gradient(90deg,${OURO},${OURO_ESC})`, height:"100%", width:`${pct}%`, borderRadius:20, transition:"width .4s" }} />
        </div>
        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11, marginTop:4, textAlign:"right" }}>{preenchidos}/{lista.length} avaliados — {avaliador}</div>
      </div>
      <div style={{ padding:"0.75rem" }}>
        {lista.map((j,idx)=>{
          const av=getAv(j);
          const ok=isCompleto(j);
          const cad=cadastro[j]||{};
          const gen=JOGADORES_BASE.find(x=>x.nome===j)?.genero||"M";
          const nb=notaBaseAltura(cad.porte||cad.altura,gen);
          const mob=av.fisico_mob!==undefined?Number(av.fisico_mob):null;
          const fis=nb!==null&&mob!==null?Math.min(10,nb+mob):null;
          const lt=leituraTotal(av.leitura_sub);
          const nf=notaFinalV2(av.tecnico!==undefined?Number(av.tecnico):null,fis,lt);
          const pilares = [av.tecnico!==undefined,av.fisico_mob!==undefined,lt!==null];
          return (
            <button key={j} onClick={()=>{ setJogAtual(j); setView("jogador"); }}
              style={{ display:"flex", alignItems:"center", width:"100%", padding:"11px 14px", marginBottom:7, background:CZ_CARD, borderRadius:14, border:ok?`1px solid ${OURO_ESC}`:`1px solid rgba(255,255,255,0.06)`, cursor:"pointer", gap:12 }}>
              <div style={{ width:26, height:26, borderRadius:7, background:ok?AZUL:CZ_MED, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:ok?OURO:"rgba(255,255,255,0.3)", flexShrink:0 }}>{idx+1}</div>
              <div style={{ flex:1, textAlign:"left" }}>
                <div style={{ fontWeight:600, fontSize:13, color:BRANCO }}>{j}</div>
                <div style={{ display:"flex", gap:6, marginTop:5 }}>
                  {["⚡T","🏃F","🧠L"].map((label,i)=>(
                    <span key={i} style={{ fontSize:10, padding:"2px 7px", borderRadius:6, background:pilares[i]?"rgba(255,193,7,0.15)":"rgba(255,255,255,0.05)", color:pilares[i]?OURO_CL:"rgba(255,255,255,0.25)", fontWeight:600 }}>{label} {pilares[i]?"✓":"—"}</span>
                  ))}
                </div>
              </div>
              <div style={{ minWidth:44, height:44, borderRadius:10, background:nf!==null?notaColor(nf):CZ_MED, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:ok?`2px solid ${OURO_ESC}`:"2px solid transparent" }}>
                {nf!==null?<><div style={{ fontSize:15, fontWeight:800, color:notaColorText(nf), lineHeight:1 }}>{nf.toFixed(1)}</div><div style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>final</div></>:<div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{pilares.filter(Boolean).length}/3</div>}
              </div>
              <div style={{ color:"rgba(255,255,255,0.2)", fontSize:18 }}>›</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Tela Seleção Fase 2 ───────────────────────────────────────────────────────
function TelaSelecaoF2({ onSelect, jaVotaram, onVoltar }) {
  const [busca, setBusca] = useState("");
  const filtrados = JOGADORES.filter(j=>j.toLowerCase().includes(busca.toLowerCase()));
  return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(ellipse at top, ${AZUL_MED} 0%, ${AZUL_ESC} 40%, ${PRETO} 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem 1rem" }}>
      <div style={{ marginBottom:"1.5rem", textAlign:"center" }}>
        <img src="/VGM.png" alt="Logo" width="90" height="90" style={{ width:90, height:90, borderRadius:16, objectFit:"cover", boxShadow:`0 0 0 3px ${OURO_ESC}, 0 0 20px rgba(255,193,7,0.25)`, marginBottom:12 }} />
        <h1 style={{ color:OURO, fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, margin:0 }}>2ª Rodada</h1>
        <p style={{ color:OURO_ESC, fontSize:10, fontWeight:700, marginTop:3, letterSpacing:2 }}>VALIDAÇÃO DAS NOTAS</p>
      </div>
      <div style={{ background:`rgba(0,31,77,0.85)`, backdropFilter:"blur(16px)", borderRadius:20, padding:"1.5rem", width:"100%", maxWidth:400, border:`1px solid ${OURO_ESC}`, boxShadow:`0 0 30px rgba(255,193,7,0.08)` }}>
        <p style={{ color:OURO, fontSize:12, marginBottom:"1rem", textAlign:"center", fontWeight:700, letterSpacing:1 }}>SELECIONE SEU NOME</p>
        <input placeholder="🔍 Buscar seu nome..." value={busca} onChange={e=>setBusca(e.target.value)}
          style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${OURO_ESC}`, background:`rgba(0,51,128,0.5)`, color:BRANCO, fontSize:14, marginBottom:10, outline:"none", boxSizing:"border-box" }} />
        <div style={{ maxHeight:300, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
          {filtrados.map(j=>{
            const jv=jaVotaram.includes(j);
            return (
              <button key={j} onClick={()=>{ if(jv) alert("🔒 Você já enviou sua validação!"); else onSelect(j); }}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderRadius:10, border:jv?`1px solid rgba(212,175,55,0.15)`:`1px solid rgba(255,255,255,0.08)`, background:jv?"rgba(212,175,55,0.05)":"rgba(255,255,255,0.04)", color:jv?"rgba(255,255,255,0.3)":BRANCO, fontSize:14, fontWeight:600, cursor:jv?"not-allowed":"pointer", textAlign:"left" }}>
                <span>{j}</span>
                {jv?<span style={{ fontSize:11, color:OURO_ESC, background:"rgba(212,175,55,0.1)", padding:"2px 8px", borderRadius:20 }}>🔒 validado</span>
                   :<span style={{ color:"rgba(255,255,255,0.2)", fontSize:16 }}>›</span>}
              </button>
            );
          })}
        </div>
      </div>
      <button onClick={onVoltar} style={{ marginTop:16, background:"none", border:`1px solid rgba(212,175,55,0.15)`, color:"rgba(255,255,255,0.3)", fontSize:11, borderRadius:8, padding:"6px 14px", cursor:"pointer" }}>← voltar</button>
    </div>
  );
}

// ── Tela Validação Fase 2 ─────────────────────────────────────────────────────
function TelaValidacao({ votante, consolidado, votosValidacao, jaVotou, onEnviar, enviando, onVoltar }) {
  const [votos, setVotos] = useState(()=>({...(votosValidacao[votante]||{})}));
  const [view, setView] = useState("lista");
  const [jogAtual, setJogAtual] = useState(null);
  const lista = consolidado.filter(j=>j.nome!==votante&&j.nf!==null);
  const preenchidos = lista.filter(j=>votos[j.nome]!==undefined).length;
  const pct = Math.round((preenchidos/lista.length)*100);

  if (view==="jogador"&&jogAtual) {
    const jData = lista.find(j=>j.nome===jogAtual);
    if (!jData) return null;
    const nf = jData.nf;
    const opcoes = [Math.round((nf-0.5)*2)/2, nf, Math.round((nf+0.5)*2)/2];
    const vAtual = votos[jogAtual];
    const idx = lista.indexOf(jData);
    const prev = idx>0?lista[idx-1].nome:null;
    const next = idx<lista.length-1?lista[idx+1].nome:null;
    return (
      <div style={{ minHeight:"100vh", background:CZ_CL }}>
        <Header titulo={jogAtual} subtitulo={nivelLabel(nf)} onVoltar={()=>setView("lista")}
          direita={<div style={{ background:vAtual!==undefined?`linear-gradient(135deg,${OURO},${OURO_ESC})`:"rgba(255,255,255,0.08)", borderRadius:10, padding:"5px 14px", textAlign:"center", minWidth:52, border:vAtual!==undefined?"none":`1px solid rgba(255,255,255,0.1)` }}>
            <div style={{ fontSize:9, color:vAtual!==undefined?AZUL_ESC:"rgba(255,255,255,0.4)", fontWeight:700 }}>SEU VOTO</div>
            <div style={{ fontSize:20, color:vAtual!==undefined?AZUL_ESC:"rgba(255,255,255,0.3)", fontWeight:800, lineHeight:1 }}>{vAtual!==undefined?vAtual.toFixed(1):"—"}</div>
          </div>}
        />
        <div style={{ padding:"1rem" }}>
          <div style={{ background:CZ_CARD, borderRadius:16, padding:"1.25rem", marginBottom:12, border:`1px solid ${OURO_ESC}`, textAlign:"center" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:600, letterSpacing:1, marginBottom:6 }}>NOTA CONSOLIDADA ATUAL</div>
            <div style={{ fontSize:48, fontWeight:800, color:OURO, lineHeight:1 }}>{nf.toFixed(1)}</div>
            <div style={{ fontSize:12, color:OURO_ESC, marginTop:6, fontWeight:600 }}>{nivelLabel(nf)}</div>
          </div>
          <div style={{ background:CZ_CARD, borderRadius:16, padding:"1.25rem", border:`1px solid rgba(255,255,255,0.08)` }}>
            <div style={{ fontSize:13, fontWeight:700, color:BRANCO, marginBottom:14, textAlign:"center" }}>Qual nota representa melhor {jogAtual}?</div>
            <div style={{ display:"flex", gap:10 }}>
              {opcoes.map((op,i)=>{
                const labels=["📉 Muito alto","✅ Está certa","📈 Pouco baixo"];
                const sel=vAtual===op;
                return (
                  <button key={op} onClick={()=>setVotos(prev=>({...prev,[jogAtual]:op}))}
                    style={{ flex:1, padding:"16px 8px", borderRadius:14, border:sel?`2px solid ${OURO}`:`1px solid rgba(255,255,255,0.1)`, background:sel?AZUL:CZ_MED, cursor:"pointer", textAlign:"center" }}>
                    <div style={{ fontSize:22, fontWeight:800, color:sel?OURO:BRANCO, marginBottom:4 }}>{op.toFixed(1)}</div>
                    <div style={{ fontSize:10, color:sel?OURO_CL:"rgba(255,255,255,0.4)", fontWeight:600 }}>{labels[i]}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, padding:"0 1rem 1.5rem" }}>
          {prev&&<button onClick={()=>setJogAtual(prev)} style={{ flex:1, padding:12, borderRadius:12, border:`1px solid rgba(255,255,255,0.1)`, background:CZ_CARD, color:BRANCO, fontSize:12, fontWeight:600, cursor:"pointer" }}>← {prev}</button>}
          {next?(
            <button onClick={()=>{ if(vAtual!==undefined) setJogAtual(next); }} disabled={vAtual===undefined}
              style={{ flex:1, padding:12, borderRadius:12, border:"none", background:vAtual!==undefined?AZUL:CZ_MED, color:vAtual!==undefined?OURO:"rgba(255,255,255,0.3)", fontSize:12, fontWeight:700, cursor:vAtual!==undefined?"pointer":"not-allowed" }}>
              {vAtual===undefined?"⚠️ Vote antes de avançar":`${next} →`}
            </button>
          ):(
            <button onClick={()=>{ if(vAtual!==undefined) setView("resumo"); }} disabled={vAtual===undefined}
              style={{ flex:1, padding:12, borderRadius:12, border:"none", background:vAtual!==undefined?`linear-gradient(135deg,${OURO},${OURO_ESC})`:CZ_MED, color:vAtual!==undefined?AZUL_ESC:"rgba(255,255,255,0.3)", fontSize:13, fontWeight:700, cursor:vAtual!==undefined?"pointer":"not-allowed" }}>
              {vAtual===undefined?"⚠️ Vote antes de avançar":"Ver resumo ✓"}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (view==="resumo") {
    const completos=lista.filter(j=>votos[j.nome]!==undefined);
    const incompletos=lista.filter(j=>votos[j.nome]===undefined);
    return (
      <div style={{ minHeight:"100vh", background:CZ_CL }}>
        <Header titulo="Resumo da validação" onVoltar={()=>setView("lista")} />
        <div style={{ padding:"1rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            <div style={{ background:CZ_CARD, borderRadius:14, padding:"1rem", border:`1px solid ${OURO_ESC}`, textAlign:"center" }}>
              <div style={{ fontSize:28, fontWeight:800, color:OURO }}>{completos.length}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>votados</div>
            </div>
            <div style={{ background:CZ_CARD, borderRadius:14, padding:"1rem", border:"1px solid rgba(255,255,255,0.1)", textAlign:"center" }}>
              <div style={{ fontSize:28, fontWeight:800, color:incompletos.length>0?"#f97316":"#22c55e" }}>{incompletos.length}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>pendentes</div>
            </div>
          </div>
          {incompletos.length>0&&<div style={{ background:"rgba(251,146,60,0.1)", borderRadius:14, padding:"1rem", marginBottom:14, border:"1px solid rgba(251,146,60,0.3)" }}>
            <div style={{ color:"#fb923c", fontWeight:700, fontSize:13, marginBottom:8 }}>⚠️ Faltam votar</div>
            {incompletos.map(j=><button key={j.nome} onClick={()=>{ setJogAtual(j.nome); setView("jogador"); }} style={{ display:"block", width:"100%", textAlign:"left", padding:"7px 0", background:"none", border:"none", borderBottom:"1px solid rgba(251,146,60,0.2)", color:"#fb923c", fontSize:13, cursor:"pointer" }}>→ {j.nome} ({j.nf.toFixed(1)})</button>)}
          </div>}
          <div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid rgba(255,255,255,0.08)`, overflow:"hidden", marginBottom:14 }}>
            <div style={{ background:AZUL_ESC, padding:"10px 16px", borderBottom:`1px solid ${OURO_ESC}` }}>
              <span style={{ color:OURO, fontSize:11, fontWeight:700 }}>SEUS VOTOS — {completos.length}/{lista.length}</span>
            </div>
            {completos.map((j,i)=>{
              const v=votos[j.nome];
              const mudou=v!==j.nf;
              return (
                <div key={j.nome} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 16px", borderBottom:i<completos.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <span style={{ fontSize:13, fontWeight:500, color:BRANCO }}>{j.nome}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>{j.nf.toFixed(1)}</span>
                    {mudou&&<span style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>→</span>}
                    <span style={{ background:notaColor(v), color:notaColorText(v), borderRadius:8, padding:"3px 10px", fontSize:13, fontWeight:700 }}>{v.toFixed(1)} {mudou?(v>j.nf?"▲":"▼"):"✓"}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {jaVotou?(
            <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:14, padding:"1.5rem", textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
              <div style={{ fontWeight:700, color:"#4ade80", fontSize:15 }}>Validação enviada!</div>
              <div style={{ color:"rgba(74,222,128,0.7)", fontSize:13, marginTop:4 }}>Obrigado, {votante}!</div>
              <button onClick={onVoltar} style={{ marginTop:14, padding:"10px 24px", borderRadius:10, border:"none", background:AZUL, color:OURO, fontSize:13, fontWeight:700, cursor:"pointer" }}>Voltar ao início</button>
            </div>
          ):(
            <button onClick={()=>onEnviar(votos)} disabled={enviando||completos.length===0}
              style={{ width:"100%", padding:16, borderRadius:14, border:"none", background:completos.length>0?`linear-gradient(135deg,${AZUL},${AZUL_MED})`:CZ_MED, color:completos.length>0?OURO:"rgba(255,255,255,0.3)", fontSize:16, fontWeight:700, cursor:completos.length>0?"pointer":"default" }}>
              {enviando?"Enviando...":`Confirmar votos (${completos.length}/${lista.length})`}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:CZ_CL }}>
      <Header titulo="Fase 2 — Validação" subtitulo="Confirme ou ajuste ±0,5 ponto"
        direita={<button onClick={()=>setView("resumo")} style={{ background:`linear-gradient(135deg,${OURO},${OURO_ESC})`, border:"none", borderRadius:10, padding:"7px 14px", color:AZUL_ESC, fontSize:12, fontWeight:700, cursor:"pointer" }}>Resumo →</button>}
      />
      <div style={{ background:AZUL_ESC, padding:"8px 1.25rem 10px", borderBottom:`1px solid ${OURO_ESC}` }}>
        <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:20, height:6, overflow:"hidden" }}>
          <div style={{ background:`linear-gradient(90deg,${OURO},${OURO_ESC})`, height:"100%", width:`${pct}%`, borderRadius:20, transition:"width .4s" }} />
        </div>
        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11, marginTop:4, textAlign:"right" }}>{preenchidos}/{lista.length} votados — {votante}</div>
      </div>
      <div style={{ background:AM, padding:"10px 16px", borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ fontSize:12, color:OURO_CL, fontWeight:600, textAlign:"center" }}>Veja a nota atual e vote: manter, subir ou descer 0,5 ponto</div>
      </div>
      <div style={{ padding:"0.75rem" }}>
        {lista.map((j,idx)=>{
          const votado=votos[j.nome]!==undefined;
          const v=votos[j.nome];
          const mudou=votado&&v!==j.nf;
          return (
            <button key={j.nome} onClick={()=>{ setJogAtual(j.nome); setView("jogador"); }}
              style={{ display:"flex", alignItems:"center", width:"100%", padding:"11px 14px", marginBottom:7, background:CZ_CARD, borderRadius:14, border:votado?`1px solid ${OURO_ESC}`:`1px solid rgba(255,255,255,0.06)`, cursor:"pointer", gap:12 }}>
              <div style={{ width:26, height:26, borderRadius:7, background:votado?AZUL:CZ_MED, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:votado?OURO:"rgba(255,255,255,0.3)", flexShrink:0 }}>{idx+1}</div>
              <div style={{ flex:1, textAlign:"left" }}>
                <div style={{ fontWeight:600, fontSize:13, color:BRANCO }}>{j.nome}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>nota atual: {j.nf.toFixed(1)} — {nivelLabel(j.nf)}</div>
              </div>
              {votado?(
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{j.nf.toFixed(1)}</span>
                  {mudou&&<span style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>→</span>}
                  <span style={{ background:notaColor(v), color:notaColorText(v), borderRadius:8, padding:"4px 10px", fontSize:13, fontWeight:800 }}>{v.toFixed(1)} {mudou?(v>j.nf?"▲":"▼"):"✓"}</span>
                </div>
              ):<span style={{ color:"rgba(255,255,255,0.2)", fontSize:18 }}>›</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}


// ── Tela Sorteio Público ──────────────────────────────────────────────────────
function TelaSorteio({ resultadoFinal, onVoltar }) {
  const [nTimes, setNTimes] = useState(3);
  const [vagasH, setVagasH] = useState(3);
  const [vagasM, setVagasM] = useState(3);
  const [resultado, setResultado] = useState(null);

  const totalH = resultadoFinal.filter(j=>JOGADORES_BASE.find(x=>x.nome===j.nome)?.genero==="M").length;
  const totalM = resultadoFinal.filter(j=>JOGADORES_BASE.find(x=>x.nome===j.nome)?.genero==="F").length;
  const semNotas = resultadoFinal.length === 0;

  function gerarTimes() {
    const { times, reservas } = gerarSerpentina(resultadoFinal, nTimes, vagasH, vagasM);
    setResultado({ times, reservas });
  }

  const composicoes = [
    {h:1,m:5},{h:2,m:4},{h:3,m:3},{h:4,m:2},{h:5,m:1},
    {h:2,m:2},{h:3,m:2},{h:2,m:3},{h:4,m:3},{h:3,m:4},
    {h:4,m:4},{h:5,m:5},{h:4,m:5},{h:5,m:4},
  ].filter(c=>(c.h+c.m)<=12);

  return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(ellipse at top, ${AZUL_MED} 0%, ${AZUL_ESC} 40%, ${PRETO} 100%)` }}>
      <Header titulo="Montar Times" subtitulo="Sorteio por serpentina" onVoltar={onVoltar} />

      <div style={{ padding:"1rem", maxWidth:500, margin:"0 auto" }}>
        {semNotas ? (
          <div style={{ background:CZ_CARD, borderRadius:16, padding:"2rem", textAlign:"center", border:`1px solid rgba(255,255,255,0.1)`, marginTop:20 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
            <div style={{ color:OURO, fontWeight:700, fontSize:15, marginBottom:8 }}>Ainda não há notas consolidadas</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13 }}>Aguarde o administrador liberar o resultado para montar os times.</div>
          </div>
        ) : (
          <>
            {/* Config times */}
            <div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid ${OURO_ESC}`, padding:"1rem", marginBottom:12 }}>
              <div style={{ color:OURO, fontWeight:700, fontSize:13, marginBottom:10 }}>⚙️ Configuração</div>

              {/* Nº de times */}
              <div style={{ marginBottom:12 }}>
                <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, marginBottom:6 }}>Número de times:</div>
                <div style={{ display:"flex", gap:8 }}>
                  {[2,3,4,5,6].map(n=>(
                    <button key={n} onClick={()=>setNTimes(n)}
                      style={{ width:38, height:38, borderRadius:8, border:nTimes===n?`2px solid ${OURO}`:`1px solid rgba(255,255,255,0.15)`, background:nTimes===n?AZUL:CZ_MED, color:nTimes===n?OURO:BRANCO, fontSize:14, fontWeight:700, cursor:"pointer" }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Composição */}
              <div style={{ marginBottom:10 }}>
                <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12, marginBottom:6 }}>
                  Composição por time:
                  <span style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginLeft:8 }}>♂ {totalH} disponíveis · ♀ {totalM} disponíveis</span>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ color:"#93c5fd", fontSize:11, marginBottom:4 }}>♂ Homens por time</div>
                    <div style={{ display:"flex", gap:6 }}>
                      {[1,2,3,4,5,6].map(n=>(
                        <button key={n} onClick={()=>setVagasH(n)}
                          style={{ width:32, height:32, borderRadius:7, border:vagasH===n?`2px solid #93c5fd`:`1px solid rgba(255,255,255,0.1)`, background:vagasH===n?"#1e3a5f":CZ_MED, color:vagasH===n?"#93c5fd":BRANCO, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:"#f9a8d4", fontSize:11, marginBottom:4 }}>♀ Mulheres por time</div>
                    <div style={{ display:"flex", gap:6 }}>
                      {[1,2,3,4,5,6].map(n=>(
                        <button key={n} onClick={()=>setVagasM(n)}
                          style={{ width:32, height:32, borderRadius:7, border:vagasM===n?`2px solid #f9a8d4`:`1px solid rgba(255,255,255,0.1)`, background:vagasM===n?"#4a1942":CZ_MED, color:vagasM===n?"#f9a8d4":BRANCO, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:8 }}>
                  {nTimes} times × ({vagasH}♂ + {vagasM}♀) = {nTimes*(vagasH+vagasM)} jogadores em quadra
                  {nTimes*vagasH > totalH && <span style={{ color:"#fb923c", marginLeft:8 }}>⚠️ Homens insuficientes</span>}
                  {nTimes*vagasM > totalM && <span style={{ color:"#fb923c", marginLeft:8 }}>⚠️ Mulheres insuficientes</span>}
                </div>
              </div>

              <button onClick={gerarTimes}
                style={{ width:"100%", padding:"13px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${OURO},${OURO_ESC})`, color:AZUL_ESC, fontSize:14, fontWeight:800, cursor:"pointer", boxShadow:`0 4px 16px rgba(255,193,7,0.3)`, letterSpacing:0.5 }}>
                🎲 Gerar Times
              </button>
            </div>

            {/* Resultado */}
            {resultado && (
              <>
                {resultado.times.map((time, i) => {
                  const todos = [...time.homens,...time.mulheres].sort((a,b)=>(b.notaFinal||0)-(a.notaFinal||0));
                  const media = todos.length ? time.soma/todos.length : 0;
                  return (
                    <div key={i} style={{ background:CZ_CARD, borderRadius:14, border:`1px solid ${OURO_ESC}`, overflow:"hidden", marginBottom:10 }}>
                      <div style={{ background:`linear-gradient(135deg,${AZUL_ESC},${AZUL_MED})`, padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${OURO_ESC}` }}>
                        <span style={{ color:OURO, fontWeight:800, fontSize:15 }}>TIME {String.fromCharCode(65+i)}</span>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ color:BRANCO, fontSize:12, fontWeight:700 }}>Média: {media.toFixed(2)}</div>
                          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10 }}>{todos.length} jogadores · Soma: {time.soma.toFixed(1)}</div>
                        </div>
                      </div>
                      <div style={{ padding:"6px 0" }}>
                        {todos.map((j,k)=>{
                          const gen=JOGADORES_BASE.find(x=>x.nome===j.nome)?.genero;
                          return (
                            <div key={j.nome} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", borderBottom:k<todos.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
                              <span style={{ fontSize:13, color:gen==="F"?"#f9a8d4":"#93c5fd" }}>{gen==="F"?"♀":"♂"}</span>
                              <span style={{ flex:1, fontSize:13, fontWeight:500, color:BRANCO }}>{j.nome}</span>
                              <span style={{ background:notaColor(j.notaFinal), color:notaColorText(j.notaFinal), borderRadius:8, padding:"3px 10px", fontSize:13, fontWeight:700 }}>{j.notaFinal?.toFixed(1)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Reservas */}
                {resultado.reservas.length > 0 && (
                  <div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid rgba(255,255,255,0.1)`, overflow:"hidden", marginBottom:10 }}>
                    <div style={{ background:"rgba(255,255,255,0.06)", padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                      <span style={{ color:"rgba(255,255,255,0.6)", fontWeight:700, fontSize:13 }}>🔄 Reservas ({resultado.reservas.length})</span>
                    </div>
                    <div style={{ padding:"6px 0" }}>
                      {resultado.reservas.sort((a,b)=>(b.notaFinal||0)-(a.notaFinal||0)).map((j,k)=>{
                        const gen=JOGADORES_BASE.find(x=>x.nome===j.nome)?.genero;
                        return (
                          <div key={j.nome} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", borderBottom:k<resultado.reservas.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
                            <span style={{ fontSize:13, color:gen==="F"?"#f9a8d4":"#93c5fd" }}>{gen==="F"?"♀":"♂"}</span>
                            <span style={{ flex:1, fontSize:13, color:"rgba(255,255,255,0.6)" }}>{j.nome}</span>
                            <span style={{ background:notaColor(j.notaFinal), color:notaColorText(j.notaFinal), borderRadius:8, padding:"3px 10px", fontSize:12, fontWeight:700, opacity:0.7 }}>{j.notaFinal?.toFixed(1)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Verificação equilíbrio */}
                <div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid rgba(255,255,255,0.1)`, padding:"1rem", marginBottom:20 }}>
                  <div style={{ color:OURO, fontWeight:700, fontSize:12, marginBottom:8 }}>📊 Verificação de equilíbrio</div>
                  {(() => {
                    const medias = resultado.times.map(t => {
                      const todos = [...t.homens,...t.mulheres];
                      return todos.length ? t.soma/todos.length : 0;
                    });
                    const maxDif = Math.max(...medias) - Math.min(...medias);
                    const ok = maxDif <= 1.0;
                    return (
                      <div>
                        {resultado.times.map((t,i)=>{
                          const todos=[...t.homens,...t.mulheres];
                          const m = todos.length ? t.soma/todos.length : 0;
                          return (
                            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:i<resultado.times.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                              <span style={{ color:"rgba(255,255,255,0.6)", fontSize:12 }}>Time {String.fromCharCode(65+i)}</span>
                              <span style={{ color:OURO, fontSize:12, fontWeight:700 }}>{m.toFixed(2)}</span>
                            </div>
                          );
                        })}
                        <div style={{ marginTop:8, padding:"8px 10px", borderRadius:8, background:ok?"rgba(34,197,94,0.1)":"rgba(251,146,60,0.1)", border:`1px solid ${ok?"rgba(34,197,94,0.3)":"rgba(251,146,60,0.3)"}` }}>
                          <span style={{ fontSize:12, fontWeight:700, color:ok?"#4ade80":"#fb923c" }}>
                            {ok?"✅ Times equilibrados":"⚠️ Diferença > 1,0 ponto — considere ajuste manual"} (Δ {maxDif.toFixed(2)})
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Painel Admin ──────────────────────────────────────────────────────────────
function TelaAdmin({ dados, cadastro, setCadastro, votosValidacao, fase3, setFase3, config, setConfig, onVoltar }) {
  const [tab, setTab] = useState("ranking");
  const [jogSel, setJogSel] = useState(null);
  const [editCad, setEditCad] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [nTimes, setNTimes] = useState(3);

  // Calcular consolidado
  function calcConsolidado(dadosBase) {
    return JOGADORES.map(jog => {
      const avs = Object.entries(dadosBase).filter(([av]) => av !== jog);
      const tecArr = avs.map(([,av])=>av[jog]?.tecnico).filter(v=>v!==null&&v!==undefined).map(Number);
      const mobArr = avs.map(([,av])=>av[jog]?.fisico_mob).filter(v=>v!==null&&v!==undefined).map(Number);
      const ltArr  = avs.map(([,av])=>leituraTotal(av[jog]?.leitura_sub)).filter(v=>v!==null);
      const media = arr => {
        if (!arr.length) return null;
        const s = arr.length>=3?[...arr].sort((a,b)=>a-b).slice(1,-1):arr;
        return s.reduce((a,b)=>a+b,0)/s.length;
      };
      const tecMedia = media(tecArr);
      const mobMedia = media(mobArr);
      const ltMedia  = media(ltArr);
      const gen = JOGADORES_BASE.find(j=>j.nome===jog)?.genero||"M";
      const nb = notaBaseAltura(cadastro[jog]?.porte || cadastro[jog]?.altura, gen);
      const fisMedia = nb!==null&&mobMedia!==null?Math.min(10,nb+mobMedia):null;
      const nf = notaFinalV2(tecMedia, fisMedia, ltMedia);
      return { nome:jog, tecnico:tecMedia, fisico:fisMedia, leitura:ltMedia, nf, qtd:tecArr.length };
    }).sort((a,b)=>(b.nf||0)-(a.nf||0));
  }

  const consolidado = calcConsolidado(dados);
  const jaAvaliaram = Object.keys(dados);
  const jaVotaramF2 = Object.keys(votosValidacao);
  const todos39 = jaAvaliaram.length >= TOTAL_VOTANTES;

  // Resultado final (com fase2 e fase3)
  const resultadoFinal = consolidado.map(j => {
    if (!j.nf) return { ...j, notaFinal: null };
    // Fase 3 override
    if (fase3[j.nome]?.notaAjustada !== undefined) return { ...j, notaFinal: fase3[j.nome].notaAjustada, ajustadaF3: true, justificativa: fase3[j.nome].justificativa };
    // Fase 2
    const opcoes = [Math.round((j.nf-0.5)*2)/2, j.nf, Math.round((j.nf+0.5)*2)/2];
    const contagem = { [opcoes[0]]:0, [j.nf]:0, [opcoes[2]]:0 };
    Object.values(votosValidacao).forEach(v => { const voto=v[j.nome]; if(voto!==undefined&&contagem[voto]!==undefined) contagem[voto]++; });
    let maxV=-1; let nfV=j.nf;
    Object.entries(contagem).forEach(([nota,qtd]) => { if(qtd>maxV||(qtd===maxV&&Number(nota)===j.nf)){maxV=qtd;nfV=Number(nota);} });
    return { ...j, notaFinal: nfV, votos: contagem };
  }).sort((a,b)=>(b.notaFinal||0)-(a.notaFinal||0));

  // Serpentina — usa função global parametrizada
  function gerarSerpentinaAdmin(nT) {
    const rf = resultadoFinal.filter(j=>j.notaFinal!==null);
    const { times } = gerarSerpentina(rf, nT, Math.ceil(rf.filter(j=>JOGADORES_BASE.find(x=>x.nome===j.nome)?.genero==="M").length/nT), Math.ceil(rf.filter(j=>JOGADORES_BASE.find(x=>x.nome===j.nome)?.genero==="F").length/nT));
    return times;
  }

  async function salvarCadastro(nome, dados) {
    setSalvando(true);
    const ok = await fbPatch(`cadastro/${encodeURIComponent(nome)}`, dados);
    if (ok) setCadastro(prev=>({...prev,[nome]:{...(prev[nome]||{}),...dados}}));
    setSalvando(false);
    return ok;
  }

  async function salvarFase3(nome, notaAjustada, justificativa) {
    const entry = { notaAjustada, justificativa, timestamp: Date.now() };
    const ok = await fbSet(`fase3/${encodeURIComponent(nome)}`, entry);
    if (ok) setFase3(prev=>({...prev,[nome]:entry}));
    return ok;
  }

  async function liberarFase(fase) {
    if (!window.confirm(`Confirma liberar a Fase ${fase}?`)) return;
    const novo = { ...config, [`fase${fase}Liberada`]: true };
    await fbSet("config", novo);
    setConfig(novo);
    alert(`✅ Fase ${fase} liberada!`);
  }

  const f3Sel = jogSel ? (fase3[jogSel]||{}) : {};
  const [novaNotaF3, setNovaNotaF3] = useState("");
  const [justF3, setJustF3] = useState("");

  // Vista: detalhe jogador
  if (jogSel) {
    const jData = consolidado.find(j=>j.nome===jogSel);
    const cad = cadastro[jogSel]||{};
    const gen = JOGADORES_BASE.find(j=>j.nome===jogSel)?.genero||"M";
    const f3 = fase3[jogSel]||{};
    const rf = resultadoFinal.find(j=>j.nome===jogSel);

    return (
      <div style={{ minHeight:"100vh", background:CZ_CL }}>
        <Header titulo={`🔍 ${jogSel}`} subtitulo={nivelLabel(rf?.notaFinal)} onVoltar={()=>setJogSel(null)}
          direita={rf?.notaFinal&&<div style={{ background:`linear-gradient(135deg,${OURO},${OURO_ESC})`, borderRadius:10, padding:"5px 14px", textAlign:"center" }}>
            <div style={{ fontSize:9, color:AZUL_ESC, fontWeight:700 }}>NOTA FINAL</div>
            <div style={{ fontSize:20, color:AZUL_ESC, fontWeight:800, lineHeight:1 }}>{rf.notaFinal?.toFixed(1)}</div>
          </div>}
        />
        <div style={{ padding:"1rem" }}>
          {/* Notas por pilar */}
          <div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid ${OURO_ESC}`, overflow:"hidden", marginBottom:12 }}>
            <div style={{ background:AZUL_ESC, padding:"10px 16px", borderBottom:`1px solid ${OURO_ESC}` }}>
              <span style={{ color:OURO, fontSize:11, fontWeight:700 }}>MÉDIAS POR PILAR — {jData?.qtd} avaliações</span>
            </div>
            {[{label:"⚡ Técnico",val:jData?.tecnico,peso:"60%"},{label:"🏃 Físico",val:jData?.fisico,peso:"25%"},{label:"🧠 Leitura",val:jData?.leitura,peso:"15%"}].map(({label,val,peso})=>(
              <div key={label} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:BRANCO }}>{label} <span style={{ color:"rgba(255,255,255,0.35)" }}>({peso})</span></div>
                  <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:6, height:5, marginTop:5, overflow:"hidden" }}>
                    <div style={{ background:val!==null?`linear-gradient(90deg,${OURO},${OURO_ESC})`:"rgba(255,255,255,0.1)", height:"100%", width:`${val!==null?(val/10)*100:0}%`, borderRadius:6 }} />
                  </div>
                </div>
                <span style={{ background:val!==null?notaColor(val):CZ_MED, color:val!==null?notaColorText(val):"#64748b", borderRadius:8, padding:"4px 12px", fontSize:14, fontWeight:800, minWidth:44, textAlign:"center" }}>{val!==null?val.toFixed(1):"—"}</span>
              </div>
            ))}
          </div>

          {/* Cadastro */}
          <div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid rgba(255,255,255,0.1)`, padding:"1rem", marginBottom:12 }}>
            <div style={{ color:OURO, fontWeight:700, fontSize:13, marginBottom:10 }}>📋 Cadastro — {gen==="F"?"♀ Feminino":"♂ Masculino"}</div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <select id={`porte_${jogSel}`} defaultValue={cad.porte||""}
                style={{ flex:1, padding:"8px 12px", borderRadius:8, border:`1px solid ${OURO_ESC}`, background:CZ_MED, color:BRANCO, fontSize:13, outline:"none" }}>
                <option value="">— Selecione o porte —</option>
                <option value="Baixo">🔴 Baixo</option>
                <option value="Médio">🟡 Médio</option>
                <option value="Alto">🟢 Alto</option>
              </select>
              <button onClick={async()=>{
                const porte = document.getElementById(`porte_${jogSel}`)?.value;
                if (!porte) return alert("Selecione um porte");
                const ok = await salvarCadastro(jogSel, { porte });
                if (ok) alert("✅ Porte salvo!");
              }} style={{ padding:"8px 14px", borderRadius:8, border:"none", background:OURO, color:AZUL_ESC, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                {salvando?"...":"Salvar"}
              </button>
            </div>
            {(cad.porte||cad.altura)&&<div style={{ fontSize:11, color:OURO_ESC, marginTop:6 }}>
              Porte: <strong>{cad.porte||"—"}</strong> · Nota base: <strong>{notaBaseAltura(cad.porte||cad.altura,gen)}</strong>
              {gen==="M"?" (♂ Baixo&lt;1,70 · Médio 1,70–1,80 · Alto&gt;1,80)":" (♀ Baixo&lt;1,60 · Médio 1,60–1,70 · Alto&gt;1,70)"}
            </div>}
          </div>

          {/* Fase 3 */}
          {config.fase3Liberada&&<div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid rgba(212,175,55,0.3)`, padding:"1rem", marginBottom:12 }}>
            <div style={{ color:OURO, fontWeight:700, fontSize:13, marginBottom:10 }}>🎯 Fase 3 — Calibragem Admin</div>
            {f3.notaAjustada&&<div style={{ background:"rgba(255,193,7,0.1)", borderRadius:8, padding:"8px 12px", marginBottom:10, fontSize:12, color:OURO_CL }}>
              Nota atual F3: <strong>{f3.notaAjustada}</strong> — {f3.justificativa}
            </div>}
            <input type="number" step="0.5" min="0" max="10" placeholder="Nova nota (0–10)" value={novaNotaF3} onChange={e=>setNovaNotaF3(e.target.value)}
              style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${OURO_ESC}`, background:CZ_MED, color:BRANCO, fontSize:13, outline:"none", boxSizing:"border-box", marginBottom:8 }} />
            <textarea placeholder="Justificativa do ajuste..." value={justF3} onChange={e=>setJustF3(e.target.value)} rows={2}
              style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid rgba(255,255,255,0.1)`, background:CZ_MED, color:BRANCO, fontSize:12, outline:"none", boxSizing:"border-box", resize:"none", marginBottom:8 }} />
            <button onClick={async()=>{
              if (!novaNotaF3||!justF3) return alert("Preencha nota e justificativa");
              const ok = await salvarFase3(jogSel, Number(novaNotaF3), justF3);
              if (ok) alert("✅ Ajuste F3 salvo!");
            }} style={{ width:"100%", padding:"10px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${OURO},${OURO_ESC})`, color:AZUL_ESC, fontSize:13, fontWeight:700, cursor:"pointer" }}>
              💾 Salvar ajuste fase 3
            </button>
          </div>}
        </div>
      </div>
    );
  }

  const times = gerarSerpentinaAdmin(nTimes);

  return (
    <div style={{ minHeight:"100vh", background:CZ_CL }}>
      <Header titulo="Painel Administrador" onVoltar={onVoltar} />
      <div style={{ background:AZUL_ESC, padding:"8px 1.25rem 12px", display:"flex", gap:8, flexWrap:"wrap", borderBottom:`1px solid ${OURO_ESC}` }}>
        {[["ranking","🏆"],["resultado","🎯"],["serpentina","⚡"],["cadastro","📋"],["participacao","👥"]].map(([t,icon])=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{ padding:"6px 12px", borderRadius:20, border:tab===t?"none":`1px solid rgba(255,255,255,0.1)`, background:tab===t?`linear-gradient(135deg,${OURO},${OURO_ESC})`:"rgba(255,255,255,0.08)", color:tab===t?AZUL_ESC:BRANCO, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            {icon} {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ padding:"1rem" }}>
        {/* Controles de fase */}
        <div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid rgba(255,255,255,0.1)`, padding:"1rem", marginBottom:12 }}>
          <div style={{ color:OURO, fontWeight:700, fontSize:13, marginBottom:10 }}>🔒 Controle de Fases</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[{n:2,label:"Fase 2 — Validação coletiva",key:"fase2Liberada",cond:todos39},{n:3,label:"Fase 3 — Calibragem adms",key:"fase3Liberada",cond:jaVotaramF2.length>=TOTAL_VOTANTES}].map(({n,label,key,cond})=>(
              <div key={n} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:BRANCO }}>{label}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>
                    {n===2?`F1: ${jaAvaliaram.length}/${TOTAL_VOTANTES}`:`F2: ${jaVotaramF2.length}/${TOTAL_VOTANTES}`}
                    {!cond&&` — faltam ${n===2?TOTAL_VOTANTES-jaAvaliaram.length:TOTAL_VOTANTES-jaVotaramF2.length}`}
                  </div>
                </div>
                {config[key]
                  ? <span style={{ background:"rgba(34,197,94,0.15)", color:"#4ade80", padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700 }}>✅ Ativa</span>
                  : <button onClick={()=>liberarFase(n)} disabled={!cond}
                      style={{ padding:"7px 14px", borderRadius:10, border:"none", background:cond?`linear-gradient(135deg,${OURO},${OURO_ESC})`:CZ_MED, color:cond?AZUL_ESC:"rgba(255,255,255,0.3)", fontSize:12, fontWeight:700, cursor:cond?"pointer":"not-allowed" }}>
                      {cond?"🔓 Liberar":"Aguardando..."}
                    </button>
                }
              </div>
            ))}
          </div>
        </div>

        {tab==="ranking"&&(
          <>
            <button onClick={()=>{
              const sep=";"; const linhas=[];
              linhas.push("RANKING — VOLEI GUIOMAR DE MELO V2");
              linhas.push(`${new Date().toLocaleDateString("pt-BR")}`);
              linhas.push("");
              linhas.push(["Pos","Jogador","Nivel","Tecnico","Fisico","Leitura","NOTA FINAL","Avaliacoes"].join(sep));
              consolidado.forEach((j,i)=>linhas.push([i+1,j.nome,nivelLabel(j.nf||0),j.tecnico?.toFixed(1)||"—",j.fisico?.toFixed(1)||"—",j.leitura?.toFixed(1)||"—",j.nf?.toFixed(1)||"—",j.qtd].join(sep)));
              const csv="\uFEFF"+linhas.join("\n");
              const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
              const url=URL.createObjectURL(blob); const a=document.createElement("a");
              a.href=url; a.download=`VGM_Ranking_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.csv`;
              a.click(); URL.revokeObjectURL(url);
            }} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"12px", borderRadius:12, border:`1px solid ${OURO}`, background:`rgba(255,193,7,0.08)`, color:OURO, fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:12 }}>
              📥 Exportar ranking (.csv)
            </button>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:10, textAlign:"center" }}>Toque em um jogador para ver detalhes e editar cadastro</p>
            <div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid rgba(255,255,255,0.08)`, overflow:"hidden" }}>
              <div style={{ background:AZUL_ESC, padding:"10px 16px", display:"flex", gap:6, borderBottom:`1px solid ${OURO_ESC}` }}>
                <span style={{ color:OURO, fontSize:10, fontWeight:700, width:20 }}>#</span>
                <span style={{ color:OURO, fontSize:10, fontWeight:700, flex:2 }}>JOGADOR</span>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:10, flex:1, textAlign:"center" }}>⚡T</span>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:10, flex:1, textAlign:"center" }}>🏃F</span>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:10, flex:1, textAlign:"center" }}>🧠L</span>
                <span style={{ color:OURO, fontSize:10, fontWeight:700, flex:1, textAlign:"center" }}>NOTA</span>
              </div>
              {consolidado.map((j,i)=>(
                <div key={j.nome} onClick={()=>setJogSel(j.nome)}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 16px", borderBottom:i<consolidado.length-1?"1px solid rgba(255,255,255,0.04)":"none", background:i<3?"rgba(255,193,7,0.04)":"transparent", cursor:"pointer" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:i<3?OURO:"rgba(255,255,255,0.3)", width:20 }}>{i+1}</span>
                  <span style={{ flex:2, fontSize:12, fontWeight:600, color:BRANCO, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{j.nome}</span>
                  {[j.tecnico,j.fisico,j.leitura].map((v,k)=><span key={k} style={{ flex:1, textAlign:"center", fontSize:12, fontWeight:600, color:v!==null?notaColorText(v):"rgba(255,255,255,0.15)" }}>{v!==null?v.toFixed(1):"—"}</span>)}
                  <div style={{ flex:1, textAlign:"center" }}>
                    <span style={{ background:j.nf!==null?notaColor(j.nf):CZ_MED, color:j.nf!==null?notaColorText(j.nf):"rgba(255,255,255,0.3)", borderRadius:8, padding:"3px 8px", fontSize:13, fontWeight:800 }}>{j.nf!==null?j.nf.toFixed(1):"—"}</span>
                  </div>
                  <span style={{ color:"rgba(255,255,255,0.15)", fontSize:14 }}>›</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab==="resultado"&&(
          <div>
            <button onClick={()=>{
              const sep=";"; const linhas=[];
              linhas.push("RESULTADO FINAL — VOLEI GUIOMAR DE MELO V2");
              linhas.push(`${new Date().toLocaleDateString("pt-BR")}`);
              linhas.push("");
              linhas.push(["Pos","Jogador","Genero","Nivel","Nota F1","Nota Final","Status","Justificativa F3"].join(sep));
              resultadoFinal.forEach((j,i)=>{
                const gen=JOGADORES_BASE.find(x=>x.nome===j.nome)?.genero||"?";
                const status=j.ajustadaF3?"Ajuste F3":j.notaFinal!==j.nf?"Alterado F2":"Mantido";
                linhas.push([i+1,j.nome,gen,nivelLabel(j.notaFinal||0),j.nf?.toFixed(1)||"—",j.notaFinal?.toFixed(1)||"—",status,j.justificativa||""].join(sep));
              });
              linhas.push(""); linhas.push("NOTAS PARA O TEAMS GENERATION");
              linhas.push(["Jogador","Genero","Posicao","Nota 0-10","Nivel"].join(sep));
              resultadoFinal.forEach(j=>{
                const gen=JOGADORES_BASE.find(x=>x.nome===j.nome)?.genero||"?";
                linhas.push([j.nome,gen,"",j.notaFinal?.toFixed(1)||"—",nivelLabel(j.notaFinal||0)].join(sep));
              });
              const csv="\uFEFF"+linhas.join("\n");
              const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
              const url=URL.createObjectURL(blob); const a=document.createElement("a");
              a.href=url; a.download=`VGM_Resultado_Final_${new Date().toLocaleDateString("pt-BR").replace(/\//g,"-")}.csv`;
              a.click(); URL.revokeObjectURL(url);
            }} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"12px", borderRadius:12, border:`1px solid ${OURO}`, background:`rgba(255,193,7,0.08)`, color:OURO, fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:12 }}>
              📥 Exportar resultado final (.csv)
            </button>
            <div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid rgba(255,255,255,0.08)`, overflow:"hidden" }}>
              <div style={{ background:AZUL_ESC, padding:"10px 16px", display:"flex", gap:6, borderBottom:`1px solid ${OURO_ESC}` }}>
                <span style={{ color:OURO, fontSize:10, fontWeight:700, width:20 }}>#</span>
                <span style={{ color:OURO, fontSize:10, fontWeight:700, flex:2 }}>JOGADOR</span>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:10, flex:1, textAlign:"center" }}>F1</span>
                <span style={{ color:OURO, fontSize:10, fontWeight:700, flex:1, textAlign:"center" }}>FINAL</span>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:10, flex:1, textAlign:"center" }}>STATUS</span>
              </div>
              {resultadoFinal.map((j,i)=>{
                const mudou=j.notaFinal!==j.nf;
                const subiu=j.notaFinal>j.nf;
                return (
                  <div key={j.nome} style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 16px", borderBottom:i<resultadoFinal.length-1?"1px solid rgba(255,255,255,0.04)":"none", background:i<3?"rgba(255,193,7,0.03)":"transparent" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:i<3?OURO:"rgba(255,255,255,0.3)", width:20 }}>{i+1}</span>
                    <div style={{ flex:2 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:BRANCO }}>{j.nome}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{nivelLabel(j.notaFinal)}</div>
                    </div>
                    <span style={{ flex:1, textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.4)" }}>{j.nf?.toFixed(1)||"—"}</span>
                    <div style={{ flex:1, textAlign:"center" }}>
                      <span style={{ background:j.notaFinal?notaColor(j.notaFinal):CZ_MED, color:j.notaFinal?notaColorText(j.notaFinal):"rgba(255,255,255,0.3)", borderRadius:8, padding:"3px 8px", fontSize:13, fontWeight:800, border:mudou?`2px solid ${subiu?"#22c55e":"#f97316"}`:"none" }}>
                        {j.notaFinal?.toFixed(1)||"—"} {mudou?(subiu?"▲":"▼"):""}
                      </span>
                    </div>
                    <span style={{ flex:1, textAlign:"center", fontSize:10, color:j.ajustadaF3?OURO:mudou?"#86efac":"rgba(255,255,255,0.25)" }}>
                      {j.ajustadaF3?"⚙F3":mudou?"✦F2":"—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="serpentina"&&(
          <div>
            <div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid ${OURO_ESC}`, padding:"1rem", marginBottom:12 }}>
              <div style={{ color:OURO, fontWeight:700, fontSize:13, marginBottom:10 }}>⚡ Gerar times por serpentina</div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <span style={{ color:BRANCO, fontSize:13 }}>Número de times:</span>
                {[2,3,4,5,6].map(n=>(
                  <button key={n} onClick={()=>setNTimes(n)}
                    style={{ width:36, height:36, borderRadius:8, border:nTimes===n?`2px solid ${OURO}`:`1px solid rgba(255,255,255,0.1)`, background:nTimes===n?AZUL:CZ_MED, color:nTimes===n?OURO:BRANCO, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    {n}
                  </button>
                ))}
              </div>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11 }}>
                {resultadoFinal.filter(j=>j.notaFinal!==null).length} jogadores disponíveis ·{" "}
                {JOGADORES_BASE.filter(j=>j.genero==="M").length} ♂ · {JOGADORES_BASE.filter(j=>j.genero==="F").length} ♀
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {times.map((time,i)=>{
                const mediaTime = time.soma/(time.homens.length+time.mulheres.length)||0;
                return (
                  <div key={i} style={{ background:CZ_CARD, borderRadius:14, border:`1px solid ${OURO_ESC}`, overflow:"hidden" }}>
                    <div style={{ background:`linear-gradient(135deg,${AZUL_ESC},${AZUL_MED})`, padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${OURO_ESC}` }}>
                      <span style={{ color:OURO, fontWeight:800, fontSize:14 }}>TIME {String.fromCharCode(65+i)}</span>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ color:BRANCO, fontSize:12, fontWeight:700 }}>Média: {mediaTime.toFixed(2)}</div>
                        <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10 }}>{time.homens.length+time.mulheres.length} jogadores · Soma: {time.soma.toFixed(1)}</div>
                      </div>
                    </div>
                    <div style={{ padding:"8px 0" }}>
                      {[...time.homens,...time.mulheres].sort((a,b)=>(b.notaFinal||0)-(a.notaFinal||0)).map((j,k)=>{
                        const gen=JOGADORES_BASE.find(x=>x.nome===j.nome)?.genero;
                        return (
                          <div key={j.nome} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 16px", borderBottom:k<(time.homens.length+time.mulheres.length-1)?"1px solid rgba(255,255,255,0.04)":"none" }}>
                            <span style={{ fontSize:12, color:gen==="F"?"#f9a8d4":"#93c5fd" }}>{gen==="F"?"♀":"♂"}</span>
                            <span style={{ flex:1, fontSize:13, fontWeight:500, color:BRANCO }}>{j.nome}</span>
                            <span style={{ background:notaColor(j.notaFinal), color:notaColorText(j.notaFinal), borderRadius:8, padding:"3px 10px", fontSize:13, fontWeight:700 }}>{j.notaFinal?.toFixed(1)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Verificação de equilíbrio */}
            <div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid rgba(255,255,255,0.1)`, padding:"1rem", marginTop:12 }}>
              <div style={{ color:OURO, fontWeight:700, fontSize:12, marginBottom:8 }}>📊 Verificação de equilíbrio</div>
              {(() => {
                const medias = times.map(t=>t.soma/(t.homens.length+t.mulheres.length)||0);
                const maxDif = Math.max(...medias)-Math.min(...medias);
                const ok = maxDif<=1.0;
                return (
                  <div>
                    {times.map((t,i)=><div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:i<times.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                      <span style={{ color:"rgba(255,255,255,0.6)", fontSize:12 }}>Time {String.fromCharCode(65+i)}</span>
                      <span style={{ color:OURO, fontSize:12, fontWeight:700 }}>{(t.soma/(t.homens.length+t.mulheres.length)||0).toFixed(2)}</span>
                    </div>)}
                    <div style={{ marginTop:8, padding:"8px 10px", borderRadius:8, background:ok?"rgba(34,197,94,0.1)":"rgba(251,146,60,0.1)", border:`1px solid ${ok?"rgba(34,197,94,0.3)":"rgba(251,146,60,0.3)"}` }}>
                      <span style={{ fontSize:12, fontWeight:700, color:ok?"#4ade80":"#fb923c" }}>
                        {ok?"✅ Times equilibrados":"⚠️ Diferença > 1,0 ponto — considere ajuste manual"} (Δ {maxDif.toFixed(2)})
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {tab==="cadastro"&&(
          <div>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:10, textAlign:"center" }}>Clique em um jogador no Ranking para editar a altura individualmente</p>
            <div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid rgba(255,255,255,0.08)`, overflow:"hidden" }}>
              <div style={{ background:AZUL_ESC, padding:"10px 16px", display:"flex", gap:6, borderBottom:`1px solid ${OURO_ESC}` }}>
                <span style={{ color:OURO, fontSize:10, fontWeight:700, flex:2 }}>JOGADOR</span>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:10, flex:1, textAlign:"center" }}>GÊN</span>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:10, flex:1, textAlign:"center" }}>ALTURA</span>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:10, flex:1, textAlign:"center" }}>BASE</span>
              </div>
              {JOGADORES.map((j,i)=>{
                const cad=cadastro[j]||{};
                const gen=JOGADORES_BASE.find(x=>x.nome===j)?.genero||"M";
                const nb=notaBaseAltura(cad.porte||cad.altura,gen);
                return (
                  <div key={j} onClick={()=>setJogSel(j)} style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderBottom:i<JOGADORES.length-1?"1px solid rgba(255,255,255,0.04)":"none", cursor:"pointer" }}>
                    <span style={{ flex:2, fontSize:12, fontWeight:600, color:BRANCO }}>{j}</span>
                    <span style={{ flex:1, textAlign:"center", fontSize:12, color:gen==="F"?"#f9a8d4":"#93c5fd" }}>{gen==="F"?"♀":"♂"}</span>
                    <span style={{ flex:1, textAlign:"center", fontSize:12, color:cad.altura?OURO_CL:"rgba(255,255,255,0.2)" }}>{cad.altura?`${cad.altura}cm`:"—"}</span>
                    <span style={{ flex:1, textAlign:"center", fontSize:12, color:nb!==null?OURO:"rgba(255,255,255,0.2)" }}>{nb!==null?nb:"—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="participacao"&&(
          <div style={{ background:CZ_CARD, borderRadius:14, border:`1px solid rgba(255,255,255,0.08)`, overflow:"hidden" }}>
            <div style={{ background:AZUL_ESC, padding:"10px 16px", display:"flex", justifyContent:"space-between", borderBottom:`1px solid ${OURO_ESC}` }}>
              <span style={{ color:OURO, fontSize:11, fontWeight:700 }}>PARTICIPAÇÃO</span>
              <span style={{ color:"rgba(255,255,255,0.4)", fontSize:11 }}>F1: {jaAvaliaram.length} · F2: {jaVotaramF2.length} · Total: {TOTAL_VOTANTES}</span>
            </div>
            {JOGADORES.map((j,i)=>{
              const f1=jaAvaliaram.includes(j);
              const f2=jaVotaramF2.includes(j);
              const f3ok=!!fase3[j];
              return (
                <div key={j} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", borderBottom:i<JOGADORES.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
                  <span style={{ fontSize:13, fontWeight:500, color:BRANCO }}>{j}</span>
                  <div style={{ display:"flex", gap:5 }}>
                    {[{ok:f1,label:"F1"},{ok:f2,label:"F2"},{ok:f3ok,label:"F3",cond:config.fase3Liberada}].filter(x=>x.cond!==false).map(({ok,label})=>(
                      <span key={label} style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:12, background:ok?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)", color:ok?"#4ade80":"#f87171" }}>{label} {ok?"✓":"—"}</span>
                    ))}
                  </div>
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
  const [votosValidacao, setVotosValidacao] = useState({});
  const [jaVotaramF2, setJaVotaramF2] = useState([]);
  const [jaVotouF2, setJaVotouF2] = useState(false);
  const [enviandoF2, setEnviandoF2] = useState(false);
  const [fase3, setFase3] = useState({});
  const [config, setConfig] = useState({ fase2Liberada:false, fase3Liberada:false });
  const [cadastro, setCadastro] = useState({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarTudo().then(({ avaliacoes, validacao, fase3, config, cadastro }) => {
      setTodasRespostas(avaliacoes);
      setJaAvaliaram(Object.keys(avaliacoes));
      setVotosValidacao(validacao);
      setJaVotaramF2(Object.keys(validacao));
      setFase3(fase3);
      setConfig(config);
      setCadastro(cadastro);
      setCarregando(false);
    });
  }, []);

  async function handleEnviarF1() {
    setEnviando(true);
    const key = encodeURIComponent(avaliador);
    const ok = await fbSet(`avaliacoes/${key}`, { avaliador, dados: avaliacoes, timestamp: Date.now() });
    if (ok) {
      const ats = { ...todasRespostas, [avaliador]: avaliacoes };
      setTodasRespostas(ats); setJaAvaliaram(Object.keys(ats)); setJaEnviou(true);
    } else alert("Erro ao salvar. Tente novamente.");
    setEnviando(false);
  }

  async function handleEnviarF2(votos) {
    setEnviandoF2(true);
    const key = encodeURIComponent(avaliador);
    const ok = await fbSet(`validacao/${key}`, { votante: avaliador, votos, timestamp: Date.now() });
    if (ok) {
      const ats = { ...votosValidacao, [avaliador]: votos };
      setVotosValidacao(ats); setJaVotaramF2(Object.keys(ats)); setJaVotouF2(true);
    } else alert("Erro ao salvar. Tente novamente.");
    setEnviandoF2(false);
  }

  function calcConsolidadoF2() {
    return JOGADORES.map(jog => {
      const avs = Object.entries(todasRespostas).filter(([av])=>av!==jog);
      const tecArr = avs.map(([,av])=>av[jog]?.tecnico).filter(v=>v!==null&&v!==undefined).map(Number);
      const mobArr = avs.map(([,av])=>av[jog]?.fisico_mob).filter(v=>v!==null&&v!==undefined).map(Number);
      const ltArr  = avs.map(([,av])=>leituraTotal(av[jog]?.leitura_sub)).filter(v=>v!==null);
      const media = arr => {
        if (!arr.length) return null;
        const s=arr.length>=3?[...arr].sort((a,b)=>a-b).slice(1,-1):arr;
        return s.reduce((a,b)=>a+b,0)/s.length;
      };
      const gen=JOGADORES_BASE.find(j=>j.nome===jog)?.genero||"M";
      const nb=notaBaseAltura(cadastro[jog]?.porte||cadastro[jog]?.altura,gen);
      const mobM=media(mobArr);
      const fis=nb!==null&&mobM!==null?Math.min(10,nb+mobM):null;
      const nf=notaFinalV2(media(tecArr),fis,media(ltArr));
      return { nome:jog, nf };
    }).filter(j=>j.nf!==null);
  }

  if (carregando) return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(ellipse at top, ${AZUL_MED} 0%, ${AZUL_ESC} 40%, ${PRETO} 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <img src="/VGM.png" alt="Logo" width="90" height="90" style={{ width:90, height:90, borderRadius:18, boxShadow:`0 0 0 3px ${OURO_ESC}, 0 0 25px rgba(255,193,7,0.2)` }} />
      <div style={{ color:OURO, fontSize:15, fontFamily:"'DM Sans',sans-serif", fontWeight:700, letterSpacing:1 }}>Carregando...</div>
      <div style={{ color:OURO_ESC, fontSize:11, letterSpacing:2 }}>★ VOLEI GUIOMAR DE MELO ★</div>
    </div>
  );

  if (tela==="admin") return (
    <TelaAdmin dados={todasRespostas} cadastro={cadastro} setCadastro={setCadastro}
      votosValidacao={votosValidacao} fase3={fase3} setFase3={setFase3}
      config={config} setConfig={setConfig} onVoltar={()=>setTela("selecao")} />
  );

  if (tela==="avaliacao") return (
    <TelaAvaliacao avaliador={avaliador} avaliacoes={avaliacoes} setAvaliacoes={setAvaliacoes}
      cadastro={cadastro} onEnviar={handleEnviarF1} enviando={enviando} jaEnviou={jaEnviou} onVoltar={()=>setTela("selecao")} />
  );

  if (tela==="selecao_f2") return (
    <TelaSelecaoF2 onSelect={nome=>{ setAvaliador(nome); setJaVotouF2(!!votosValidacao[nome]); setTela("validacao"); }}
      jaVotaram={jaVotaramF2} onVoltar={()=>setTela("selecao")} />
  );

  if (tela==="validacao") {
    const consolidado = calcConsolidadoF2();
    return (
      <TelaValidacao votante={avaliador} consolidado={consolidado}
        votosValidacao={votosValidacao} jaVotou={jaVotouF2}
        onEnviar={handleEnviarF2} enviando={enviandoF2} onVoltar={()=>setTela("selecao")} />
    );
  }

  if (tela==="sorteio") {
    const rf = calcResultadoFinal(todasRespostas, cadastro, votosValidacao, fase3);
    return <TelaSorteio resultadoFinal={rf} onVoltar={()=>setTela("selecao")} />;
  }

  return (
    <TelaSelecao onF1={nome=>{ setAvaliador(nome); setAvaliacoes(todasRespostas[nome]||{}); setJaEnviou(!!todasRespostas[nome]); setTela("avaliacao"); }}
      onF2={()=>setTela("selecao_f2")} jaAvaliaram={jaAvaliaram}
      fase2Liberada={config.fase2Liberada}
      onSorteio={()=>setTela("sorteio")}
      onAdmin={()=>{ const s=window.prompt("Senha:"); if(s==="TiagoAdmin") setTela("admin"); else if(s!==null&&s!=="") alert("Senha incorreta!"); }} />
  );
}
