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

  // NOVA FUNÇÃO: Protege o painel do administrador com senha
  function acessarAdmin() {
    const senhaDigitada = window.prompt("Acesso restrito. Digite a senha:");
    
    // Você pode alterar a senha "TiagoAdmin" aqui embaixo para a que preferir:
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
  
  // MODIFICADO: Agora o botão onAdmin chama a função da senha em vez de abrir direto
  return <TelaSelecao onSelect={handleSelect} jaAvaliaram={jaAvaliaram} onAdmin={acessarAdmin} />;
}
