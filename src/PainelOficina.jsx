import { useState, useEffect } from "react";
import {
  collection, query, orderBy, onSnapshot, getDocs,
  addDoc, updateDoc, doc, deleteDoc, serverTimestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "./firebase";
import {
  STATUS_OS, SERVICOS, CHECKLIST_ITENS,
  formatarMoeda, formatarData,
  nomeServico, precoServico, enviarWhatsApp,
} from "./comum.js";
import { LogoIcone } from "./Logo";

const ABAS = ["Dashboard", "OS", "Historico", "Financeiro", "Clientes", "Equipe", "Estoque"];

function gerarNumeroOS(ordens) {
  if (!ordens.length) return "001";
  const nums = ordens.map(o => parseInt(o.numero || "0")).filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return String(max + 1).padStart(3, "0");
}

function imprimirOS(os) {
  const dataFormatada = os.criadoEm
    ? (os.criadoEm.toDate ? os.criadoEm.toDate() : new Date(os.criadoEm)).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");
  const janela = window.open("", "_blank");
  janela.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
  <title>OS #${os.numero || "---"} - STOPCAR</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:13px;color:#111;padding:20px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #CC0000;padding-bottom:12px;margin-bottom:16px}
    .logo h1{font-size:28px;font-weight:900;color:#CC0000;letter-spacing:2px}
    .logo p{font-size:11px;color:#555;letter-spacing:1px}
    .num{text-align:right}.num .n{font-size:22px;font-weight:700;color:#CC0000}
    .num .d{font-size:11px;color:#555;margin-top:4px}
    .sec{margin-bottom:14px}
    .sec-t{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#CC0000;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:8px}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .g4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px}
    .c label{font-size:10px;color:#888;display:block;margin-bottom:2px;text-transform:uppercase}
    .c .v{font-weight:600;border-bottom:1px solid #ddd;padding-bottom:3px;min-height:20px}
    .box{border:1px solid #ddd;border-radius:4px;padding:8px;min-height:50px;margin-top:4px;font-size:12px}
    .total{background:#f5f5f5;border:1px solid #ddd;border-radius:4px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;margin-top:8px}
    .total .tl{font-size:12px;color:#555}.total .tv{font-size:20px;font-weight:700;color:#CC0000}
    .assin{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:30px}
    .assin div{text-align:center}
    .assin-linha{border-top:1px solid #333;margin-bottom:6px}
    .assin-label{font-size:11px;color:#555}
    .via{text-align:center;font-size:10px;color:#aaa;margin-top:20px;border-top:1px dashed #ccc;padding-top:8px}
    @media print{body{padding:10px}}
  </style></head><body>
  <div class="header">
    <div class="logo"><h1>STOPCAR</h1><p>OFICINA MECANICA</p></div>
    <div class="num">
      <div class="n">OS #${os.numero || "---"}</div>
      <div class="d">Data: ${dataFormatada}</div>
      <div class="d">Status: <strong>${STATUS_OS[os.status]?.label || os.status}</strong></div>
    </div>
  </div>
  <div class="sec"><div class="sec-t">Cliente</div>
    <div class="g2">
      <div class="c"><label>Nome</label><div class="v">${os.cliente || ""}</div></div>
      <div class="c"><label>Telefone</label><div class="v">${os.telefone || ""}</div></div>
    </div>
  </div>
  <div class="sec"><div class="sec-t">Veiculo</div>
    <div class="g4">
      <div class="c"><label>Placa</label><div class="v">${os.placa || ""}</div></div>
      <div class="c"><label>Modelo</label><div class="v">${os.modelo || ""}</div></div>
      <div class="c"><label>KM</label><div class="v">${os.km || ""}</div></div>
      <div class="c"><label>Prox. Revisao KM</label><div class="v">${os.proxRevisaoKm || ""}</div></div>
    </div>
  </div>
  <div class="sec"><div class="sec-t">Servico</div>
    <div class="g2">
      <div class="c"><label>Tipo</label><div class="v">${nomeServico(os.servico)}</div></div>
      <div class="c"><label>Mecanico</label><div class="v">${os.mecanico || ""}</div></div>
    </div>
    <div class="c" style="margin-top:8px"><label>Descricao</label><div class="box">${os.obs || ""}</div></div>
  </div>
  <div class="sec"><div class="sec-t">Pecas</div><div class="box">${os.pecas || ""}</div></div>
  <div class="total"><span class="tl">Valor Total</span><span class="tv">${formatarMoeda(os.valor)}</span></div>
  <div style="margin-top:6px;font-size:11px;color:#888">Pagamento: <strong>${os.pagamento || "-"}</strong> | Prox. revisao: <strong>${os.proxRevisao || "-"}</strong></div>
  <div class="assin">
    <div><div style="height:50px"></div><div class="assin-linha"></div><div class="assin-label">Assinatura do Cliente</div></div>
    <div><div style="height:50px"></div><div class="assin-linha"></div><div class="assin-label">Responsavel pela Oficina</div></div>
  </div>
  <div class="via">STOPCAR Oficina Mecanica - Via da Oficina</div>
  <script>window.onload=function(){window.print()}</script>
  </body></html>`);
  janela.document.close();
}

export default function PainelOficina({ usuario }) {
  const [aba, setAba] = useState(0);
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [estoque, setEstoque] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, "ordens"), orderBy("criadoEm", "desc")), snap =>
        setOrdens(snap.docs.map(d => ({ ...d.data(), id: d.id })))),
      onSnapshot(query(collection(db, "clientes"), orderBy("nome")), snap =>
        setClientes(snap.docs.map(d => ({ ...d.data(), id: d.id })))),
      onSnapshot(query(collection(db, "estoque"), orderBy("nome")), snap =>
        setEstoque(snap.docs.map(d => ({ ...d.data(), id: d.id })))),
      onSnapshot(query(collection(db, "mecanicos"), orderBy("nome")), snap =>
        setMecanicos(snap.docs.map(d => ({ ...d.data(), id: d.id })))),
      onSnapshot(query(collection(db, "financeiro"), orderBy("criadoEm", "desc")), snap =>
        setFinanceiro(snap.docs.map(d => ({ ...d.data(), id: d.id })))),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const nomesAbas = ["Dashboard", "Ordens", "Historico", "Financeiro", "Clientes", "Equipe", "Estoque"];

  return (
    <div className="painel">
      <header className="painel-header">
        <div className="painel-logo">
          <LogoIcone size={38} />
          <span className="painel-logo-text">STOPCAR</span>
        </div>
        <nav className="painel-nav">
          {nomesAbas.map((a, i) => (
            <button key={i} className={"nav-tab" + (aba === i ? " ativo" : "")} onClick={() => setAba(i)}>{a}</button>
          ))}
        </nav>
        <button className="btn-sair" onClick={() => signOut(auth)}>Sair</button>
      </header>
      <main className="painel-main">
        {aba === 0 && <AbaDashboard ordens={ordens} financeiro={financeiro} estoque={estoque} setAba={setAba} />}
        {aba === 1 && <AbaOS ordens={ordens} mecanicos={mecanicos} clientes={clientes} />}
        {aba === 2 && <AbaHistorico ordens={ordens} />}
        {aba === 3 && <AbaFinanceiro financeiro={financeiro} ordens={ordens} />}
        {aba === 4 && <AbaClientes clientes={clientes} ordens={ordens} />}
        {aba === 5 && <AbaEquipe mecanicos={mecanicos} ordens={ordens} />}
        {aba === 6 && <AbaEstoque estoque={estoque} />}
      </main>
    </div>
  );
}

function AbaDashboard({ ordens, financeiro, estoque, setAba }) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const toDate = ts => ts?.toDate ? ts.toDate() : ts ? new Date(ts) : new Date(0);
  const ordensHoje = ordens.filter(o => toDate(o.criadoEm).toDateString() === hoje.toDateString());
  const ordensMes = ordens.filter(o => toDate(o.criadoEm) >= inicioMes);
  const emAndamento = ordens.filter(o => o.status === "em_andamento");
  const aguardando = ordens.filter(o => o.status === "aguardando");
  const faturamentoMes = ordensMes.filter(o => o.status === "concluido" || o.status === "entregue").reduce((a, o) => a + (Number(o.valor) || 0), 0);
  const faturamentoHoje = ordensHoje.filter(o => o.status === "concluido" || o.status === "entregue").reduce((a, o) => a + (Number(o.valor) || 0), 0);
  const despesasMes = financeiro.filter(f => f.tipo === "despesa" && toDate(f.criadoEm) >= inicioMes).reduce((a, f) => a + (Number(f.valor) || 0), 0);
  const lucroMes = faturamentoMes - despesasMes;
  const estoqueBaixo = estoque.filter(p => p.quantidade <= p.minimo);
  const pendentePagamento = ordens.filter(o => o.pagamento === "Pendente" || o.pagamento === "Parcial");
  const osParadas = ordens.filter(o => {
    if (o.status === "entregue" || o.status === "concluido") return false;
    return (hoje - toDate(o.criadoEm)) / (1000 * 60 * 60 * 24) > 3;
  }).sort((a, b) => toDate(a.criadoEm) - toDate(b.criadoEm));
  const contagemServicos = {};
  ordens.forEach(o => { if (o.servico) contagemServicos[o.servico] = (contagemServicos[o.servico] || 0) + 1; });
  const topServicos = Object.entries(contagemServicos).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxServico = topServicos[0]?.[1] || 1;
  const nomeMes = hoje.toLocaleString("pt-BR", { month: "long", year: "numeric" });

  const card = (cor, icon, valor, label, aba) => (
    <div onClick={() => setAba(aba)} style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:12, padding:"16px 18px", display:"flex", alignItems:"center", gap:14, position:"relative", overflow:"hidden", cursor:"pointer", transition:"border-color 0.15s, transform 0.1s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = cor; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ width:40, height:40, borderRadius:10, background:cor+"20", color:cor, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ color:"#fff", fontSize:19, fontWeight:700, lineHeight:1.2 }}>{valor}</div>
        <div style={{ color:"#888", fontSize:11, marginTop:2, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</div>
      </div>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:cor }} />
    </div>
  );

  const S = { padding:"24px", maxWidth:1200, margin:"0 auto", fontFamily:"'Inter','Segoe UI',sans-serif", display:"flex", flexDirection:"column", gap:16 };
  const cardBox = { background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:12, padding:20 };
  const secTitle = { color:"#fff", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 14px" };

  return (
    <div style={S}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #2a2a2a", paddingBottom:16 }}>
        <div>
          <h2 style={{ color:"#fff", fontSize:22, fontWeight:700, margin:"0 0 2px" }}>Dashboard</h2>
          <span style={{ color:"#888", fontSize:13 }}>{hoje.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })}</span>
        </div>
      </div>

      {/* Alertas */}
      {(estoqueBaixo.length > 0 || osParadas.length > 0 || pendentePagamento.length > 0) && (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {estoqueBaixo.length > 0 && (
            <div onClick={() => setAba(6)} style={{ background:"#e53e3e15", border:"1px solid #e53e3e44", borderRadius:8, padding:"10px 14px", color:"#fc8181", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:16 }}>⚠️</span>
              <span style={{ flex:1 }}><strong>{estoqueBaixo.length} item(ns)</strong> com estoque baixo: {estoqueBaixo.map(p => p.nome).join(", ")}</span>
              <span style={{ fontSize:11, opacity:0.7 }}>Ver estoque →</span>
            </div>
          )}
          {osParadas.length > 0 && (
            <div onClick={() => setAba(1)} style={{ background:"#ecc94b15", border:"1px solid #ecc94b44", borderRadius:8, padding:"10px 14px", color:"#f6e05e", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:16 }}>⏰</span>
              <span style={{ flex:1 }}><strong>{osParadas.length} OS</strong> parada(s) há mais de 3 dias</span>
              <span style={{ fontSize:11, opacity:0.7 }}>Ver OS →</span>
            </div>
          )}
          {pendentePagamento.length > 0 && (
            <div onClick={() => setAba(3)} style={{ background:"#4299e115", border:"1px solid #4299e144", borderRadius:8, padding:"10px 14px", color:"#63b3ed", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:16 }}>💳</span>
              <span style={{ flex:1 }}><strong>{pendentePagamento.length} OS</strong> com pagamento pendente</span>
              <span style={{ fontSize:11, opacity:0.7 }}>Ver financeiro →</span>
            </div>
          )}
        </div>
      )}

      {/* Cards operacionais */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12 }}>
        {card("#e53e3e", "📋", ordensHoje.length,         "OS hoje",        1)}
        {card("#ed8936", "🔧", emAndamento.length,         "Em andamento",   1)}
        {card("#ecc94b", "⏳", aguardando.length,          "Aguardando",     1)}
        {card("#48bb78", "📅", ordensMes.length,           "OS no mês",      1)}
      </div>

      {/* Cards financeiros */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12 }}>
        {card("#48bb78", "💰", formatarMoeda(faturamentoHoje),  "Faturamento hoje",   3)}
        {card("#38b2ac", "📈", formatarMoeda(faturamentoMes),   "Faturamento do mês", 3)}
        {card("#e53e3e", "📉", formatarMoeda(despesasMes),      "Despesas do mês",    3)}
        {card(lucroMes >= 0 ? "#48bb78" : "#e53e3e", "🏆", formatarMoeda(lucroMes), "Lucro do mês", 3)}
      </div>

      {/* Linha inferior */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:14 }}>

        {/* Top Serviços com barras */}
        <div style={cardBox} onClick={() => setAba(1)}>
          <h3 style={secTitle}>🏅 Top Serviços</h3>
          {topServicos.length === 0
            ? <p style={{ color:"#555", fontSize:13, fontStyle:"italic" }}>Nenhum serviço ainda.</p>
            : topServicos.map(([id, qtd], i) => (
              <div key={id} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ color:"#ddd", fontSize:13 }}><span style={{ color:"#e53e3e", fontWeight:700, marginRight:6 }}>#{i+1}</span>{nomeServico(id)}</span>
                  <span style={{ color:"#888", fontSize:12 }}>{qtd}x</span>
                </div>
                <div style={{ height:5, background:"#222", borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(qtd/maxServico)*100}%`, background:"#e53e3e", borderRadius:99 }} />
                </div>
              </div>
            ))
          }
        </div>

        {/* OS paradas */}
        <div style={cardBox} onClick={() => setAba(1)}>
          <h3 style={secTitle}>⏰ OS Aguardando — Mais Antigas</h3>
          {osParadas.length === 0 && aguardando.length === 0
            ? <p style={{ color:"#555", fontSize:13, fontStyle:"italic" }}>Nenhuma OS parada.</p>
            : [...osParadas, ...aguardando.filter(o => !osParadas.find(p => p.id === o.id))].slice(0, 5).map(os => {
                const dias = Math.floor((hoje - toDate(os.criadoEm)) / (1000 * 60 * 60 * 24));
                return (
                  <div key={os.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #222" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ color:"#ddd", fontSize:13, fontWeight:600 }}>{os.placa} · {os.cliente}</div>
                      <div style={{ color:"#888", fontSize:11, marginTop:2 }}>{nomeServico(os.servico)}</div>
                    </div>
                    <span style={{ background: dias > 3 ? "#e53e3e22" : "#ecc94b22", color: dias > 3 ? "#fc8181" : "#f6e05e", border:`1px solid ${dias > 3 ? "#e53e3e44" : "#ecc94b44"}`, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{dias}d</span>
                  </div>
                );
              })
          }
        </div>

        {/* Resumo financeiro */}
        <div style={cardBox}>
          <h3 style={secTitle}>💵 Resumo — {nomeMes}</h3>
          {[
            { label:"Receita total", valor: formatarMoeda(faturamentoMes), cor:"#48bb78" },
            { label:"Despesas",      valor: formatarMoeda(despesasMes),    cor:"#fc8181" },
            { label:"Saldo",         valor: formatarMoeda(lucroMes),       cor: lucroMes >= 0 ? "#48bb78" : "#fc8181" },
            { label:"OS realizadas", valor: ordensMes.length + " OS",       cor:"#888" },
            { label:"Pend. receber", valor: formatarMoeda(pendentePagamento.reduce((a,o)=>a+(Number(o.valor)||0),0)), cor:"#63b3ed" },
          ].map((item, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom: i < 4 ? "1px solid #222" : "none" }}>
              <span style={{ color:"#888", fontSize:13 }}>{item.label}</span>
              <span style={{ color:item.cor, fontWeight:700, fontSize:14 }}>{item.valor}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

function AbaOS({ ordens, mecanicos, clientes }) {
  const [modal, setModal] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  const ordensFiltradas = ordens
    .filter(o => filtroStatus === "todos" || o.status === filtroStatus)
    .filter(o => !busca || o.placa?.toLowerCase().includes(busca.toLowerCase()) || o.cliente?.toLowerCase().includes(busca.toLowerCase()) || (o.numero || "").includes(busca));

  const contagem = Object.keys(STATUS_OS).reduce((acc, k) => { acc[k] = ordens.filter(o => o.status === k).length; return acc; }, {});

  async function salvarOS(dados) {
    if (dados.id) {
      await updateDoc(doc(db, "ordens", dados.id), { ...dados, atualizadoEm: serverTimestamp() });
    } else {
      await addDoc(collection(db, "ordens"), { ...dados, numero: gerarNumeroOS(ordens), criadoEm: serverTimestamp() });
    }
    setModal(null);
  }

  async function excluirOS(id) {
    if (!id) { alert("Erro: ID da OS não encontrado."); return; }
    if (!window.confirm("Tem certeza que deseja excluir esta OS? Essa ação não pode ser desfeita.")) return;
    try {
      await deleteDoc(doc(db, "ordens", String(id)));
    } catch (err) {
      alert("Erro ao excluir OS: " + err.message);
    }
  }

  async function mudarStatus(id, status) {
    await updateDoc(doc(db, "ordens", id), { status, atualizadoEm: serverTimestamp() });
  }

  function whatsappPronto(os) {
    const msg = `Ola ${os.cliente}!\n\nSeu veiculo *${os.modelo}* (${os.placa}) esta pronto para retirada na STOPCAR.\n\nServico: ${nomeServico(os.servico)}\nValor: ${formatarMoeda(os.valor)}\n\nAguardamos voce!`;
    enviarWhatsApp(os.telefone, msg);
  }

  function whatsappOrcamento(os) {
    if (!os.telefone) { alert("Telefone do cliente nao informado!"); return; }
    const pecasLista = os.pecas ? "  - " + os.pecas : "  - A definir";
    const linhas = [
      "ORCAMENTO - STOPCAR OFICINA MECANICA",
      "---",
      "Ola, " + (os.cliente || "Cliente") + "!",
      "Segue o orcamento para o seu veiculo:",
      "",
      "Veiculo: " + (os.modelo || "-") + " | Placa: " + (os.placa || "-"),
      os.km ? "KM entrada: " + os.km : "",
      "",
      "Servico: " + nomeServico(os.servico),
      os.obs ? "Descricao: " + os.obs : "",
      "",
      "Pecas e Materiais:",
      pecasLista,
      "",
      "Valor Total: " + formatarMoeda(os.valor),
      "",
      "---",
      "Para aprovar ou tirar duvidas, responda esta mensagem.",
      "STOPCAR Oficina Mecanica"
    ].filter(function(l) { return l !== null && l !== undefined; }).join("\n");
    var num = os.telefone.replace(/[^0-9]/g, "");
    window.open("https://wa.me/55" + num + "?text=" + encodeURIComponent(linhas), "_blank");
  }

  return (
    <div className="aba-content">
      <div className="kanban-summary">
        {Object.entries(STATUS_OS).map(([k, v]) => (
          <button key={k} className={"kanban-pill" + (filtroStatus === k ? " ativo" : "")} style={{"--cor": v.cor}} onClick={() => setFiltroStatus(filtroStatus === k ? "todos" : k)}>
            <span className="kanban-count">{contagem[k]}</span><span>{v.label}</span>
          </button>
        ))}
        <button className={"kanban-pill" + (filtroStatus === "todos" ? " ativo" : "")} style={{"--cor": "#6B7280"}} onClick={() => setFiltroStatus("todos")}>
          <span className="kanban-count">{ordens.length}</span><span>Todas</span>
        </button>
      </div>
      <div className="aba-header-row">
        <h2>Ordens de Servico</h2>
        <button className="btn-primary btn-sm" onClick={() => setModal("nova")}>+ Nova OS</button>
      </div>
      <input className="busca-input" placeholder="Buscar por placa, cliente ou no OS..." value={busca} onChange={e => setBusca(e.target.value)} />
      {ordensFiltradas.length === 0 ? <div className="vazio"><p>Nenhuma OS encontrada.</p></div> : (
        <div className="os-lista">
          {ordensFiltradas.map(os => (
            <div key={os.id} className="os-card" onClick={() => setDetalhe(os)} style={{cursor:"pointer"}}>
              <div className="os-card-top">
                <div>
                  <span className="os-numero">OS #{os.numero || "---"}</span>
                  <span className="os-placa">{os.placa}</span>
                  <span className="os-modelo">{os.modelo}</span>
                </div>
                <span className="os-status-badge" style={{background: STATUS_OS[os.status]?.cor + "22", color: STATUS_OS[os.status]?.cor}}>
                  {STATUS_OS[os.status]?.label}
                </span>
              </div>
              <p className="os-cliente">{os.cliente} · {os.telefone}</p>
              {os.mecanico && <p className="os-cliente">🔧 {os.mecanico}</p>}
              <p className="os-servico">{nomeServico(os.servico)}</p>
              {os.obs && <p className="os-obs">{os.obs}</p>}
              {os.pecas && <p className="os-obs">🔩 {os.pecas}</p>}
              {os.km && <p className="os-obs">KM: {os.km}{os.proxRevisaoKm ? ` · Prox: ${os.proxRevisaoKm} km` : ""}</p>}
              <div className="os-card-bottom">
                <span className="os-valor">{formatarMoeda(os.valor)}</span>
                <span className="os-data">{formatarData(os.criadoEm)}</span>
              </div>
              {os.pagamento && (
                <span className={"pagamento-badge " + (os.pagamento === "Pendente" || os.pagamento === "Parcial" ? "pendente" : "pago")}>
                  {os.pagamento}
                </span>
              )}
              <div className="os-acoes">
                <select value={os.status} onChange={e => mudarStatus(os.id, e.target.value)} className="select-status">
                  {Object.entries(STATUS_OS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button onClick={e=>{e.stopPropagation();whatsappOrcamento(os);}} title="Enviar Orçamento" style={{background:"#25D36622",color:"#25D366",border:"1px solid #25D36633",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Orçamento
                </button>
                <button className="btn-icon" title="Avisar que está pronto" onClick={e=>{e.stopPropagation();whatsappPronto(os);}}><svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></button>
                <button className="btn-icon" title="Imprimir" onClick={e=>{e.stopPropagation();imprimirOS(os);}}>🖨️</button>
                <button className="btn-icon" title="Editar" onClick={e=>{e.stopPropagation();setModal(os);}}>✏️</button>
                <button className="btn-icon" title="Excluir" onClick={e=>{e.stopPropagation();excluirOS(os.id);}}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && <ModalOS dados={modal === "nova" ? null : modal} mecanicos={mecanicos} clientes={clientes} onSalvar={salvarOS} onFechar={() => setModal(null)} />}
      {detalhe && <ModalDetalheOS os={detalhe} onFechar={() => setDetalhe(null)} onEditar={() => { setModal(detalhe); setDetalhe(null); }} onWhatsApp={() => whatsappOrcamento(detalhe)} onPronto={() => whatsappPronto(detalhe)} onImprimir={() => imprimirOS(detalhe)} />}
    </div>
  );
}

function ModalDetalheOS({ os, onFechar, onEditar, onWhatsApp, onPronto, onImprimir }) {
  const cor = STATUS_OS[os.status]?.cor || "#888";
  const label = STATUS_OS[os.status]?.label || os.status;
  const checklist = os.checklist || {};
  const checkItens = CHECKLIST_ITENS.filter(i => checklist[i.id] && checklist[i.id] !== "na");
  const statusIcon = { ok:"✅", atencao:"⚠️", urgente:"🔴" };
  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" style={{ maxWidth:680, width:"95%", maxHeight:"90vh", display:"flex", flexDirection:"column" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px", borderBottom:"1px solid var(--borda,#2a2a2a)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ color:"var(--texto,#fff)", fontWeight:700, fontSize:17 }}>OS #{os.numero}</span>
            <span style={{ background:cor+"22", color:cor, border:`1px solid ${cor}44`, borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:700 }}>{label}</span>
          </div>
          <button className="modal-close" onClick={onFechar}>✕</button>
        </div>
        <div style={{ overflowY:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ background:"var(--cinza,#111)", borderRadius:10, padding:16, border:"1px solid var(--borda,#2a2a2a)" }}>
              <p style={{ color:"#e53e3e", fontSize:11, fontWeight:700, textTransform:"uppercase", margin:"0 0 8px" }}>👤 Cliente</p>
              <p style={{ color:"var(--texto,#fff)", fontWeight:700, fontSize:15, margin:"0 0 4px" }}>{os.cliente || "—"}</p>
              {os.telefone && <p style={{ color:"var(--texto-sub,#888)", fontSize:13, margin:0 }}>📱 {os.telefone}</p>}
            </div>
            <div style={{ background:"var(--cinza,#111)", borderRadius:10, padding:16, border:"1px solid var(--borda,#2a2a2a)" }}>
              <p style={{ color:"#e53e3e", fontSize:11, fontWeight:700, textTransform:"uppercase", margin:"0 0 8px" }}>🚗 Veículo</p>
              <p style={{ color:"var(--texto,#fff)", fontWeight:700, fontSize:15, margin:"0 0 4px" }}>{os.modelo || "—"}</p>
              <p style={{ color:"var(--texto-sub,#888)", fontSize:13, margin:"0 0 2px" }}>Placa: <strong style={{color:"var(--texto,#fff)"}}>{os.placa || "—"}</strong></p>
              {os.km && <p style={{ color:"var(--texto-sub,#888)", fontSize:13, margin:0 }}>KM: {os.km}</p>}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ background:"var(--cinza,#111)", borderRadius:10, padding:16, border:"1px solid var(--borda,#2a2a2a)" }}>
              <p style={{ color:"#e53e3e", fontSize:11, fontWeight:700, textTransform:"uppercase", margin:"0 0 8px" }}>🔧 Serviço</p>
              <p style={{ color:"var(--texto,#fff)", fontWeight:600, fontSize:14, margin:"0 0 4px" }}>{nomeServico(os.servico)}</p>
              {os.mecanico && <p style={{ color:"var(--texto-sub,#888)", fontSize:13, margin:0 }}>Mecânico: {os.mecanico}</p>}
              {os.proxRevisaoKm && <p style={{ color:"var(--texto-sub,#888)", fontSize:13, margin:"4px 0 0" }}>Próx. revisão: {os.proxRevisaoKm} km</p>}
            </div>
            <div style={{ background:"var(--cinza,#111)", borderRadius:10, padding:16, border:"1px solid var(--borda,#2a2a2a)" }}>
              <p style={{ color:"#e53e3e", fontSize:11, fontWeight:700, textTransform:"uppercase", margin:"0 0 8px" }}>💰 Financeiro</p>
              <p style={{ color:"#48bb78", fontWeight:700, fontSize:20, margin:"0 0 4px" }}>{formatarMoeda(os.valor)}</p>
              <p style={{ color:"var(--texto-sub,#888)", fontSize:13, margin:0 }}>Pagamento: {os.pagamento || "—"}</p>
              <p style={{ color:"var(--texto-sub,#888)", fontSize:12, margin:"4px 0 0" }}>{formatarData(os.criadoEm)}</p>
            </div>
          </div>
          {os.obs && (
            <div style={{ background:"var(--cinza,#111)", borderRadius:10, padding:16, border:"1px solid var(--borda,#2a2a2a)" }}>
              <p style={{ color:"#e53e3e", fontSize:11, fontWeight:700, textTransform:"uppercase", margin:"0 0 10px" }}>📝 Descrição</p>
              <p style={{ color:"var(--texto,#ddd)", fontSize:13, lineHeight:1.8, margin:0, whiteSpace:"pre-wrap" }}>{os.obs}</p>
            </div>
          )}
          {os.pecas && (
            <div style={{ background:"var(--cinza,#111)", borderRadius:10, padding:16, border:"1px solid var(--borda,#2a2a2a)" }}>
              <p style={{ color:"#e53e3e", fontSize:11, fontWeight:700, textTransform:"uppercase", margin:"0 0 10px" }}>🔩 Peças Utilizadas</p>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {os.pecas.split("\n").filter(l => l.trim()).map((linha, i) => {
                  const match = linha.replace(/^\d+\s*[-.]\s*/, "").match(/^(.+?)\s*[|]\s*R\$\s*([\d.,]+)$/);
                  const nome = match ? match[1].trim() : linha.replace(/^\d+\s*[-.]\s*/, "").trim();
                  const valor = match ? match[2] : null;
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", background:"var(--cinza-escuro,#0d0d0d)", borderRadius:7, border:"1px solid var(--borda,#222)" }}>
                      <span style={{ color:"#e53e3e", fontWeight:700, fontSize:12, minWidth:20 }}>{i+1}.</span>
                      <span style={{ color:"var(--texto,#ddd)", fontSize:13, flex:1 }}>{nome}</span>
                      {valor && <span style={{ color:"#48bb78", fontWeight:700, fontSize:13 }}>R$ {valor}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {checkItens.length > 0 && (
            <div style={{ background:"var(--cinza,#111)", borderRadius:10, padding:16, border:"1px solid var(--borda,#2a2a2a)" }}>
              <p style={{ color:"#e53e3e", fontSize:11, fontWeight:700, textTransform:"uppercase", margin:"0 0 8px" }}>✅ Checklist</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {checkItens.map(item => (
                  <div key={item.id} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--texto-sub,#888)" }}>
                    <span>{statusIcon[checklist[item.id]] || "•"}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:8, padding:"14px 24px", borderTop:"1px solid var(--borda,#2a2a2a)", flexWrap:"wrap" }}>
          <button onClick={onWhatsApp} style={{ background:"#25D36622", color:"#25D366", border:"1px solid #25D36644", borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Enviar Orçamento
          </button>
          <button onClick={onPronto} style={{ background:"#48bb7822", color:"#48bb78", border:"1px solid #48bb7844", borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:600, cursor:"pointer" }}>✅ Carro Pronto</button>
          <button onClick={onImprimir} style={{ background:"#2a2a2a", color:"#ddd", border:"1px solid var(--borda,#333)", borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:600, cursor:"pointer" }}>🖨️ Imprimir</button>
          <button onClick={onEditar} style={{ background:"#2a2a2a", color:"#ddd", border:"1px solid var(--borda,#333)", borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:600, cursor:"pointer" }}>✏️ Editar</button>
        </div>
      </div>
    </div>
  );
}

function PecasList({ value, onChange, onTotalChange }) {
  const parseItens = (v) => {
    if (!v) return [{ nome: "", valor: "" }];
    return v.split("\n").filter(l => l.trim()).map(l => {
      // Format: "1 - Nome - R$ 00,00" or "1 - Nome"
      const semNum = l.replace(/^\d+\s*[-.]\s*/, "");
      const match = semNum.match(/^(.+?)\s*[-|]\s*R?\$?\s*([\d.,]+)$/);
      if (match) return { nome: match[1].trim(), valor: match[2].replace(",", ".") };
      return { nome: semNum.trim(), valor: "" };
    });
  };

  const [itens, setItens] = useState(() => parseItens(value));

  function calcTotal(lista) {
    return lista.reduce((s, i) => s + (parseFloat(i.valor) || 0), 0);
  }

  function updateParent(lista) {
    const texto = lista.map((item, i) => {
      const v = parseFloat(item.valor) || 0;
      return `${i + 1} - ${item.nome || ""}${v > 0 ? " | R$ " + v.toFixed(2).replace(".", ",") : ""}`;
    }).join("\n");
    onChange(texto);
    if (onTotalChange) onTotalChange(calcTotal(lista));
  }

  function setItem(i, field, val) {
    const novos = itens.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    setItens(novos);
    updateParent(novos);
  }

  function addItem() {
    const novos = [...itens, { nome: "", valor: "" }];
    setItens(novos);
    updateParent(novos);
    setTimeout(() => {
      const inputs = document.querySelectorAll(".pecas-nome");
      if (inputs[novos.length - 1]) inputs[novos.length - 1].focus();
    }, 10);
  }

  function removeItem(i) {
    const novos = itens.length === 1 ? [{ nome: "", valor: "" }] : itens.filter((_, idx) => idx !== i);
    setItens(novos);
    updateParent(novos);
  }

  function handleKeyDown(e, i) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  }

  const total = calcTotal(itens);

  return (
    <div style={{ background:"var(--cinza-escuro,#111)", border:"1px solid var(--borda,#2a2a2a)", borderRadius:8, padding:"10px 12px", display:"flex", flexDirection:"column", gap:6 }}>
      {/* Header */}
      <div style={{ display:"grid", gridTemplateColumns:"22px 1fr 110px 24px", gap:8, paddingBottom:4, borderBottom:"1px solid var(--borda,#222)" }}>
        <span/>
        <span style={{ color:"var(--texto-sub,#666)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em" }}>Item</span>
        <span style={{ color:"var(--texto-sub,#666)", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em" }}>Valor (R$)</span>
        <span/>
      </div>
      {itens.map((item, i) => (
        <div key={i} style={{ display:"grid", gridTemplateColumns:"22px 1fr 110px 24px", gap:8, alignItems:"center" }}>
          <span style={{ color:"#e53e3e", fontWeight:700, fontSize:13, textAlign:"right" }}>{i + 1}.</span>
          <input
            className="pecas-nome"
            value={item.nome}
            onChange={e => setItem(i, "nome", e.target.value)}
            onKeyDown={e => handleKeyDown(e, i)}
            placeholder={i === 0 ? "Ex: Óleo 15W40..." : "Item..."}
            style={{ background:"transparent", border:"none", outline:"none", color:"var(--texto,#fff)", fontSize:13, padding:"3px 0" }}
          />
          <input
            value={item.valor}
            onChange={e => setItem(i, "valor", e.target.value)}
            placeholder="0,00"
            type="number"
            min="0"
            step="0.01"
            style={{ background:"var(--cinza,#1a1a1a)", border:"1px solid var(--borda,#2a2a2a)", borderRadius:6, color:"#48bb78", fontSize:13, padding:"3px 8px", width:"100%", textAlign:"right" }}
          />
          <button type="button" onClick={() => removeItem(i)} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:14 }}>✕</button>
        </div>
      ))}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:4, paddingTop:8, borderTop:"1px solid var(--borda,#222)" }}>
        <button type="button" onClick={addItem} style={{ background:"none", border:"1px dashed var(--borda,#2a2a2a)", borderRadius:6, color:"var(--texto-sub,#666)", fontSize:12, padding:"4px 10px", cursor:"pointer" }}>+ Adicionar item</button>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:"var(--texto-sub,#888)", fontSize:12 }}>Total:</span>
          <span style={{ color:"#48bb78", fontWeight:700, fontSize:15 }}>R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>
      </div>
    </div>
  );
}

function ModalOS({ dados, mecanicos, clientes = [], onSalvar, onFechar }) {
  const [form, setForm] = useState({
    cliente: dados?.cliente || "", telefone: dados?.telefone || "",
    placa: dados?.placa || "", modelo: dados?.modelo || "",
    servico: dados?.servico || "", obs: dados?.obs || "",
    pecas: dados?.pecas || "", valor: dados?.valor || "",
    km: dados?.km || "", proxRevisaoKm: dados?.proxRevisaoKm || "",
    proxRevisao: dados?.proxRevisao || "", mecanico: dados?.mecanico || "",
    pagamento: dados?.pagamento || "", status: dados?.status || "aguardando",
    checklist: dados?.checklist || {}, id: dados?.id || null,
  });
  const [abaModal, setAbaModal] = useState("dados");
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function setCheck(k, v) { setForm(f => ({ ...f, checklist: { ...f.checklist, [k]: v } })); }
  const [buscaCliente, setBuscaCliente] = useState(form.cliente || "");
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const sugestoes = buscaCliente.length >= 2
    ? clientes.filter(c => c.nome?.toLowerCase().includes(buscaCliente.toLowerCase())).slice(0, 6)
    : [];

  function selecionarCliente(c) {
    setForm(f => ({ ...f, cliente: c.nome, telefone: c.telefone || f.telefone, placa: c.placa || f.placa, modelo: c.modelo || f.modelo }));
    setBuscaCliente(c.nome);
    setMostrarSugestoes(false);
  }

  const [servicosCustom, setServicosCustom] = useState([]);
  const [modalServico, setModalServico] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoPreco, setNovoPreco] = useState("");
  const todosServicos = [...SERVICOS, ...servicosCustom];

  async function salvarNovoServico() {
    if (!novoNome.trim()) return;
    try {
      const ref = await addDoc(collection(db, "servicosExtras"), {
        id: "custom_" + Date.now(),
        nome: novoNome.trim(),
        preco: Number(novoPreco) || 0,
        criadoEm: serverTimestamp(),
      });
      const novo = { id: ref.id, nome: novoNome.trim(), preco: Number(novoPreco) || 0 };
      setServicosCustom(prev => [...prev, novo]);
      set("servico", ref.id);
      if (!form.valor) set("valor", novo.preco);
      setNovoNome("");
      setNovoPreco("");
      setModalServico(false);
    } catch(e) { alert("Erro: " + e.message); }
  }

  const statusCheck = { ok: "OK", atencao: "Atencao", urgente: "Urgente", na: "—" };

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{dados ? `Editar OS #${dados.numero || "---"}` : "Nova OS"}</h3>
          <button className="modal-close" onClick={onFechar}>✕</button>
        </div>
        <div className="modal-tabs">
          {["dados", "checklist"].map(t => (
            <button key={t} className={"modal-tab" + (abaModal === t ? " ativo" : "")} onClick={() => setAbaModal(t)}>
              {t === "dados" ? "Dados" : "Checklist"}
            </button>
          ))}
        </div>
        <div className="modal-body">
          {abaModal === "dados" && (
            <div className="form-grid">
              <label style={{ position:"relative" }}>Cliente
                <input value={buscaCliente}
                  onChange={e => { setBuscaCliente(e.target.value); set("cliente", e.target.value); setMostrarSugestoes(true); }}
                  onFocus={() => setMostrarSugestoes(true)}
                  onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
                  placeholder="Nome do cliente" autoComplete="off" />
                {mostrarSugestoes && sugestoes.length > 0 && (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#1a1a1a", border:"1px solid #333", borderRadius:8, zIndex:100, boxShadow:"0 8px 24px #0008", marginTop:2 }}>
                    {sugestoes.map(c => (
                      <div key={c.id} onMouseDown={() => selecionarCliente(c)}
                        style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #222", display:"flex", flexDirection:"column", gap:2 }}
                        onMouseEnter={e => e.currentTarget.style.background="#2a2a2a"}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                        <span style={{ color:"#fff", fontSize:13, fontWeight:600 }}>{c.nome}</span>
                        <span style={{ color:"#888", fontSize:11 }}>{c.placa ? `${c.placa} · ` : ""}{c.modelo || ""}{c.telefone ? ` · ${c.telefone}` : ""}</span>
                      </div>
                    ))}
                  </div>
                )}
              </label>
              <label>Telefone<input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-9999" /></label>
              <label>Placa<input value={form.placa} onChange={e => set("placa", e.target.value.toUpperCase())} placeholder="ABC-1234" /></label>
              <label>Modelo<input value={form.modelo} onChange={e => set("modelo", e.target.value)} placeholder="Fiat Uno 2018" /></label>
              <label>KM Entrada<input value={form.km} onChange={e => set("km", e.target.value)} placeholder="85000" /></label>
              <label>Prox. Revisao KM<input value={form.proxRevisaoKm} onChange={e => set("proxRevisaoKm", e.target.value)} placeholder="90000" /></label>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:"0.75rem",fontWeight:600,textTransform:"uppercase",color:"var(--texto-sub,#888)"}}>Servico</span>
                <div style={{display:"flex",gap:6}}>
                  <select value={form.servico} style={{flex:1}} onChange={e=>{set("servico",e.target.value);const s=todosServicos.find(x=>x.id===e.target.value);if(!form.valor&&s)set("valor",s.preco);}}>
                    <option value="">Selecione...</option>
                    <optgroup label="Padrão">{SERVICOS.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}</optgroup>
                    {servicosCustom.length>0&&<optgroup label="Personalizados">{servicosCustom.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}</optgroup>}
                  </select>
                  <button type="button" onClick={()=>setModalServico(v=>!v)} style={{background:"#e53e3e",color:"#fff",border:"none",borderRadius:8,width:36,height:36,fontSize:22,fontWeight:700,cursor:"pointer",flexShrink:0}}>+</button>
                </div>
                {modalServico&&(
                  <div style={{background:"#111",border:"1px solid #e53e3e55",borderRadius:10,padding:12,marginTop:4,display:"flex",flexDirection:"column",gap:8}}>
                    <span style={{color:"#e53e3e",fontSize:11,fontWeight:700,textTransform:"uppercase"}}>Novo Serviço</span>
                    <input value={novoNome} onChange={e=>setNovoNome(e.target.value)} placeholder="Nome do serviço"/>
                    <input value={novoPreco} onChange={e=>setNovoPreco(e.target.value)} placeholder="Preço R$" type="number"/>
                    <div style={{display:"flex",gap:8}}>
                      <button type="button" onClick={salvarNovoServico} style={{flex:1,background:"#e53e3e",color:"#fff",border:"none",borderRadius:8,padding:"8px",fontWeight:700,cursor:"pointer"}}>Salvar</button>
                      <button type="button" onClick={()=>setModalServico(false)} style={{flex:1,background:"#2a2a2a",color:"#888",border:"none",borderRadius:8,padding:"8px",cursor:"pointer"}}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
              <label>Mecanico
                <select value={form.mecanico} onChange={e => set("mecanico", e.target.value)}>
                  <option value="">Selecione...</option>
                  {mecanicos.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                  <option value="outro">Outro</option>
                </select>
              </label>
              <label>Valor (R$)<input type="number" value={form.valor} onChange={e => set("valor", Number(e.target.value))} placeholder="0" /></label>
              <label>Pagamento
                <select value={form.pagamento} onChange={e => set("pagamento", e.target.value)}>
                  <option value="">Selecione...</option>
                  <option>Pago - Dinheiro</option>
                  <option>Pago - PIX</option>
                  <option>Pago - Cartao Debito</option>
                  <option>Pago - Cartao Credito</option>
                  <option>Pendente</option>
                  <option>Parcial</option>
                </select>
              </label>
              <label>Status
                <select value={form.status} onChange={e => set("status", e.target.value)}>
                  {Object.entries(STATUS_OS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </label>
              <label>Prox. revisao recomendada<input value={form.proxRevisao} onChange={e => set("proxRevisao", e.target.value)} placeholder="Ex: 6 meses ou 5.000 km" /></label>
              <label className="span2">Descricao / Observacoes<textarea value={form.obs} onChange={e => set("obs", e.target.value)} rows={2} placeholder="Descreva o servico..." /></label>
              <div className="span2" style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <span style={{ fontSize:"0.75rem", fontWeight:600, textTransform:"uppercase", color:"var(--texto-sub,#888)" }}>Peças Utilizadas</span>
                <PecasList value={form.pecas} onChange={v => set("pecas", v)} onTotalChange={total => { if (total > 0) set("valor", total); }} />
              </div>
            </div>
          )}
          {abaModal === "checklist" && (
            <div className="checklist-grid">
              {CHECKLIST_ITENS.map(item => (
                <div key={item.id} className="checklist-item">
                  <span className="checklist-label">{item.label}</span>
                  <div className="checklist-btns">
                    {Object.entries(statusCheck).map(([k, v]) => (
                      <button key={k} className={"check-btn" + (form.checklist[item.id] === k ? " ativo check-" + k : "")} onClick={() => setCheck(item.id, k)}>{v}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onFechar}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSalvar(form)}>Salvar OS</button>
        </div>
      </div>
    </div>
  );
}

function AbaHistorico({ ordens }) {
  const [busca, setBusca] = useState("");
  const [placaSel, setPlacaSel] = useState("");
  const placas = [...new Set(ordens.map(o => o.placa).filter(Boolean))].sort();
  const placasFiltradas = placas.filter(p => p.toLowerCase().includes(busca.toLowerCase()));
  const historico = placaSel ? ordens.filter(o => o.placa === placaSel).sort((a, b) => {
    const da = a.criadoEm?.toDate ? a.criadoEm.toDate() : new Date(a.criadoEm || 0);
    const db2 = b.criadoEm?.toDate ? b.criadoEm.toDate() : new Date(b.criadoEm || 0);
    return db2 - da;
  }) : [];
  const totalGasto = historico.reduce((a, o) => a + (Number(o.valor) || 0), 0);

  return (
    <div className="aba-content">
      <h2>Historico por Veiculo</h2>
      <input className="busca-input" placeholder="Digite a placa..." value={busca} onChange={e => { setBusca(e.target.value); setPlacaSel(""); }} />
      {busca && !placaSel && (
        <div className="placas-lista">
          {placasFiltradas.length === 0 ? <div className="vazio"><p>Nenhum veiculo encontrado.</p></div> :
            placasFiltradas.map(p => {
              const os = ordens.filter(o => o.placa === p);
              return (
                <button key={p} className="placa-item" onClick={() => { setPlacaSel(p); setBusca(p); }}>
                  <span className="placa-tag">{p}</span>
                  <span className="placa-info">{os[0]?.modelo} · {os[0]?.cliente}</span>
                  <span className="placa-count">{os.length} OS</span>
                </button>
              );
            })
          }
        </div>
      )}
      {placaSel && (
        <>
          <div className="historico-header">
            <div><span className="os-placa" style={{fontSize:"1.3rem"}}>{placaSel}</span><span className="os-modelo" style={{fontSize:"1rem",marginLeft:".75rem"}}>{historico[0]?.modelo}</span></div>
            <div style={{textAlign:"right"}}>
              <div style={{color:"var(--texto-sub)",fontSize:".85rem"}}>{historico.length} servico(s)</div>
              <div style={{color:"var(--verde)",fontWeight:700}}>Total: {formatarMoeda(totalGasto)}</div>
            </div>
          </div>
          <div className="historico-lista">
            {historico.map(os => (
              <div key={os.id} className="historico-card">
                <div className="historico-card-top">
                  <div><span className="os-numero">OS #{os.numero || "---"}</span><span className="historico-data">{formatarData(os.criadoEm)}</span></div>
                  <div style={{display:"flex",gap:".5rem",alignItems:"center"}}>
                    <span className="os-status-badge" style={{background:STATUS_OS[os.status]?.cor+"22",color:STATUS_OS[os.status]?.cor}}>{STATUS_OS[os.status]?.label}</span>
                    <button className="btn-icon" onClick={() => imprimirOS(os)}>🖨️</button>
                  </div>
                </div>
                <p className="os-servico">{nomeServico(os.servico)}</p>
                {os.mecanico && <p className="os-obs">🔧 {os.mecanico}</p>}
                {os.obs && <p className="os-obs">{os.obs}</p>}
                {os.pecas && <p className="os-obs">🔩 {os.pecas}</p>}
                {os.km && <p className="os-obs">KM: {os.km}{os.proxRevisaoKm ? ` · Prox: ${os.proxRevisaoKm} km` : ""}</p>}
                {os.proxRevisao && <p className="os-obs">Recomendacao: {os.proxRevisao}</p>}
                <div className="os-card-bottom">
                  <span className="os-valor">{formatarMoeda(os.valor)}</span>
                  {os.pagamento && <span className="os-data">{os.pagamento}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {!busca && !placaSel && <div className="vazio"><p>Digite uma placa para buscar o historico.</p></div>}
    </div>
  );
}

function AbaFinanceiro({ financeiro, ordens }) {
  const [modal, setModal] = useState(false);
  const [filtroMes, setFiltroMes] = useState(() => { const h = new Date(); return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,"0")}`; });
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [abaFin, setAbaFin] = useState("lancamentos"); // lancamentos | historico
  const [fechamentos, setFechamentos] = useState({});
  const [modalFechamento, setModalFechamento] = useState(false);
  const [historico, setHistorico] = useState([]);

  const toDate = ts => ts?.toDate ? ts.toDate() : ts ? new Date(ts) : new Date(0);
  const [anoF, mesF] = filtroMes.split("-").map(Number);

  const lancamentos = financeiro.filter(f => { const d = toDate(f.criadoEm); return d.getFullYear()===anoF && d.getMonth()+1===mesF; });
  const receitas = lancamentos.filter(f => f.tipo==="receita").reduce((a,f) => a+(Number(f.valor)||0), 0);
  const despesas = lancamentos.filter(f => f.tipo==="despesa").reduce((a,f) => a+(Number(f.valor)||0), 0);
  const osPagas = ordens.filter(o => { if(!o.pagamento||o.pagamento==="Pendente") return false; const d=toDate(o.criadoEm); return d.getFullYear()===anoF&&d.getMonth()+1===mesF; });
  const totalOS = osPagas.reduce((a,o) => a+(Number(o.valor)||0), 0);
  const pendentes = ordens.filter(o => o.pagamento==="Pendente"||o.pagamento==="Parcial");
  const saldo = receitas + totalOS - despesas;
  const mesFechado = fechamentos[filtroMes];

  // Carregar historico de fechamentos
  useEffect(() => {
    const q = collection(db, "fechamentos");
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      data.sort((a,b) => b.mes.localeCompare(a.mes));
      setHistorico(data);
      const map = {};
      data.forEach(f => { map[f.mes] = f; });
      setFechamentos(map);
    });
    return unsub;
  }, []);

  // Categorias unicas para filtro
  const categorias = ["todas", ...Array.from(new Set(lancamentos.map(f => f.categoria).filter(Boolean)))];

  // Lancamentos filtrados
  const lancsFiltrados = lancamentos.filter(f => {
    if (filtroTipo !== "todos" && f.tipo !== filtroTipo) return false;
    if (filtroCategoria !== "todas" && f.categoria !== filtroCategoria) return false;
    return true;
  }).sort((a,b) => toDate(b.criadoEm) - toDate(a.criadoEm));

  // Grafico ultimos 6 meses
  const ultimos6 = Array.from({length:6}, (_,i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5-i));
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const label = d.toLocaleString("pt-BR",{month:"short"});
    const lancsM = financeiro.filter(f => { const fd = toDate(f.criadoEm); return `${fd.getFullYear()}-${String(fd.getMonth()+1).padStart(2,"0")}` === key; });
    const recM = lancsM.filter(f=>f.tipo==="receita").reduce((a,f)=>a+(Number(f.valor)||0),0);
    const depM = lancsM.filter(f=>f.tipo==="despesa").reduce((a,f)=>a+(Number(f.valor)||0),0);
    const osM = ordens.filter(o => { if(!o.pagamento||o.pagamento==="Pendente") return false; const fd=toDate(o.criadoEm); return `${fd.getFullYear()}-${String(fd.getMonth()+1).padStart(2,"0")}` === key; }).reduce((a,o)=>a+(Number(o.valor)||0),0);
    return { label, key, receita: recM + osM, despesa: depM };
  });
  const maxGraf = Math.max(...ultimos6.map(m => Math.max(m.receita, m.despesa)), 1);

  async function fecharMes() {
    if (!window.confirm(`Fechar o mes ${filtroMes.replace("-","/")}? Isso registra um resumo permanente.`)) return;
    try {
      const nomeMes = new Date(anoF, mesF - 1, 1).toLocaleString("pt-BR", { month: "long", year: "numeric" });
      const resumo = { mes: filtroMes, nomeMes, receitas: receitas+totalOS, despesas, saldo, totalOrdens: osPagas.length, totalLancamentos: lancamentos.length, fechadoEm: serverTimestamp() };
      await addDoc(collection(db, "fechamentos"), resumo);
      setModalFechamento(true);
    } catch(err) { alert("Erro: " + err.message); }
  }

  async function salvar(dados) {
    await addDoc(collection(db, "financeiro"), { ...dados, criadoEm: serverTimestamp() });
    setModal(false);
  }
  async function excluir(id) {
    if (!window.confirm("Excluir este lancamento?")) return;
    try { await deleteDoc(doc(db, "financeiro", id)); }
    catch (err) { alert("Erro ao excluir: " + err.message); }
  }

  const cards = [
    { label: "Receitas", valor: formatarMoeda(receitas + totalOS), cor: "#48bb78" },
    { label: "OS Pagas no Mes", valor: formatarMoeda(totalOS), cor: "#38b2ac" },
    { label: "Despesas", valor: formatarMoeda(despesas), cor: "#e53e3e" },
    { label: "Saldo do Mes", valor: formatarMoeda(saldo), cor: saldo >= 0 ? "#48bb78" : "#e53e3e" },
  ];

  const btnTab = (aba, label) => (
    <button onClick={() => setAbaFin(aba)} style={{ background: abaFin===aba ? "#CC0000" : "transparent", color: abaFin===aba ? "#fff" : "#888", border: abaFin===aba ? "none" : "1px solid #333", borderRadius:8, padding:"7px 16px", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all .15s" }}>{label}</button>
  );

  return (
    <div style={{ padding:"24px", maxWidth:1100, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #2a2a2a", paddingBottom:16, marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ color:"#fff", fontSize:24, fontWeight:700, margin:0 }}>Financeiro</h2>
          <span style={{ color:"#888", fontSize:13 }}>Controle de receitas e despesas</span>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <input type="month" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
            style={{ padding:"8px 12px", borderRadius:8, background:"#1a1a1a", border:"1px solid #333", color:"#fff", fontSize:13 }} />
          {mesFechado
            ? <span style={{ background:"#48bb7822", color:"#48bb78", border:"1px solid #48bb7844", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600 }}>Mes fechado</span>
            : <button onClick={fecharMes} style={{ background:"#2a2a2a", color:"#ecc94b", border:"1px solid #ecc94b55", borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Fechar Mes</button>
          }
          <button className="btn-primary btn-sm" onClick={() => setModal(true)}>+ Lancamento</button>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:24 }}>
        {cards.map((c,i) => (
          <div key={i} style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:12, padding:"18px 20px", position:"relative", overflow:"hidden" }}>
            <div style={{ color:"#888", fontSize:11, textTransform:"uppercase", letterSpacing:".05em", marginBottom:6 }}>{c.label}</div>
            <div style={{ color:c.cor, fontSize:22, fontWeight:700 }}>{c.valor}</div>
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:c.cor }} />
          </div>
        ))}
      </div>

      {/* Grafico ultimos 6 meses */}
      <div style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:12, padding:"20px 24px", marginBottom:20 }}>
        <h3 style={{ color:"#fff", fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:".05em", margin:"0 0 20px" }}>Ultimos 6 Meses</h3>
        <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120 }}>
          {ultimos6.map((m,i) => (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, height:"100%" }}>
              <div style={{ flex:1, display:"flex", alignItems:"flex-end", gap:3, width:"100%" }}>
                <div title={"Receita: "+formatarMoeda(m.receita)} style={{ flex:1, background:"#48bb78", borderRadius:"4px 4px 0 0", height: Math.max(4, (m.receita/maxGraf)*100) + "%" }} />
                <div title={"Despesa: "+formatarMoeda(m.despesa)} style={{ flex:1, background:"#e53e3e", borderRadius:"4px 4px 0 0", height: Math.max(4, (m.despesa/maxGraf)*100) + "%" }} />
              </div>
              <span style={{ color: m.key===filtroMes ? "#CC0000" : "#666", fontSize:11, fontWeight: m.key===filtroMes ? 700 : 400 }}>{m.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:16, marginTop:12 }}>
          <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#888" }}><span style={{ width:10, height:10, background:"#48bb78", borderRadius:2, display:"inline-block" }} />Receitas</span>
          <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#888" }}><span style={{ width:10, height:10, background:"#e53e3e", borderRadius:2, display:"inline-block" }} />Despesas</span>
        </div>
      </div>

      {/* Contas a receber */}
      {pendentes.length > 0 && (
        <div style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:12, padding:20, marginBottom:20 }}>
          <h3 style={{ color:"#fff", fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:".05em", margin:"0 0 14px" }}>Contas a Receber ({pendentes.length})</h3>
          {pendentes.map(os => (
            <div key={os.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"#111", borderRadius:8, border:"1px solid #222", marginBottom:8 }}>
              <span style={{ background:"#e53e3e22", color:"#fc8181", border:"1px solid #e53e3e44", borderRadius:6, padding:"2px 8px", fontSize:12, fontWeight:700 }}>{os.placa}</span>
              <span style={{ flex:1, color:"#ddd", fontSize:13 }}>{os.cliente}</span>
              <span style={{ background: os.pagamento==="Parcial"?"#ecc94b22":"#e53e3e22", color: os.pagamento==="Parcial"?"#f6e05e":"#fc8181", border:`1px solid ${os.pagamento==="Parcial"?"#ecc94b44":"#e53e3e44"}`, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:600 }}>{os.pagamento}</span>
              <span style={{ color:"#48bb78", fontWeight:700, fontSize:14 }}>{formatarMoeda(os.valor)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Abas: Lancamentos | Historico */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {btnTab("lancamentos", "Lancamentos do Mes")}
        {btnTab("historico", `Historico de Fechamentos (${historico.length})`)}
      </div>

      {abaFin === "lancamentos" && (
        <div style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:12, padding:20 }}>
          {/* Filtros */}
          <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", gap:8 }}>
              {["todos","receita","despesa"].map(t => (
                <button key={t} onClick={() => setFiltroTipo(t)} style={{ background: filtroTipo===t ? (t==="receita"?"#48bb7833":t==="despesa"?"#e53e3e33":"#333") : "transparent", color: filtroTipo===t ? (t==="receita"?"#48bb78":t==="despesa"?"#fc8181":"#fff") : "#666", border: `1px solid ${filtroTipo===t?(t==="receita"?"#48bb7855":t==="despesa"?"#e53e3e55":"#555"):"#333"}`, borderRadius:20, padding:"4px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  {t==="todos"?"Todos":t==="receita"?"Receitas":"Despesas"}
                </button>
              ))}
            </div>
            {categorias.length > 1 && (
              <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
                style={{ background:"#111", border:"1px solid #333", color:"#aaa", borderRadius:8, padding:"5px 10px", fontSize:12 }}>
                {categorias.map(c => <option key={c} value={c}>{c==="todas"?"Todas as categorias":c}</option>)}
              </select>
            )}
          </div>

          {lancsFiltrados.length === 0
            ? <p style={{ color:"#555", fontSize:13, fontStyle:"italic", textAlign:"center", padding:"20px 0" }}>Nenhum lancamento encontrado.</p>
            : lancsFiltrados.map(f => (
              <div key={f.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"#111", borderRadius:8, border:`1px solid ${f.tipo==="receita"?"#48bb7822":"#e53e3e22"}`, marginBottom:8, transition:"border-color .15s" }}>
                <div style={{ width:38, height:38, borderRadius:8, background: f.tipo==="receita"?"#48bb7820":"#e53e3e20", color: f.tipo==="receita"?"#48bb78":"#fc8181", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0, fontWeight:700 }}>
                  {f.tipo==="receita" ? "+" : "-"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:"#ddd", fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.descricao}</div>
                  <div style={{ color:"#555", fontSize:11, marginTop:3, display:"flex", gap:8 }}>
                    {f.categoria && <span style={{ background:"#222", borderRadius:4, padding:"1px 6px" }}>{f.categoria}</span>}
                    <span>{formatarData(f.criadoEm)}</span>
                  </div>
                </div>
                <span style={{ color: f.tipo==="receita"?"#48bb78":"#fc8181", fontWeight:700, fontSize:15, whiteSpace:"nowrap" }}>
                  {f.tipo==="receita" ? "+" : "-"}{formatarMoeda(f.valor)}
                </span>
                <button className="btn-icon" onClick={() => excluir(f.id)}>&#x1F5D1;</button>
              </div>
            ))
          }
          {lancamentos.length > 0 && (
            <div style={{ borderTop:"1px solid #2a2a2a", marginTop:12, paddingTop:12, display:"flex", justifyContent:"space-between", fontSize:13, color:"#888" }}>
              <span>{lancamentos.length} lancamento(s)</span>
              <span>Saldo: <strong style={{ color: saldo>=0?"#48bb78":"#fc8181" }}>{formatarMoeda(saldo)}</strong></span>
            </div>
          )}
        </div>
      )}

      {abaFin === "historico" && (
        <div style={{ background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:12, padding:20 }}>
          {historico.length === 0
            ? <p style={{ color:"#555", fontSize:13, fontStyle:"italic", textAlign:"center", padding:"20px 0" }}>Nenhum mes fechado ainda.</p>
            : historico.map((h,i) => (
              <div key={h.id||i} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:"#111", borderRadius:10, border:"1px solid #222", marginBottom:10 }}>
                <div style={{ width:42, height:42, borderRadius:10, background:"#48bb7820", color:"#48bb78", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>&#x2714;</div>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#fff", fontWeight:700, fontSize:14, textTransform:"capitalize" }}>{h.nomeMes}</div>
                  <div style={{ color:"#666", fontSize:12, marginTop:3, display:"flex", gap:12, flexWrap:"wrap" }}>
                    <span>Receitas: <span style={{color:"#48bb78"}}>{formatarMoeda(h.receitas||0)}</span></span>
                    <span>Despesas: <span style={{color:"#fc8181"}}>{formatarMoeda(h.despesas||0)}</span></span>
                    <span>OS: {h.totalOrdens||0}</span>
                    <span>Lancamentos: {h.totalLancamentos||0}</span>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ color: (h.saldo||0)>=0?"#48bb78":"#fc8181", fontWeight:700, fontSize:16 }}>{formatarMoeda(h.saldo||0)}</div>
                  <div style={{ color:"#555", fontSize:11, marginTop:2 }}>Saldo</div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {modalFechamento && (
        <div className="modal-overlay" onClick={() => setModalFechamento(false)}>
          <div className="modal" style={{ maxWidth:420, textAlign:"center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:48, marginBottom:12 }}>&#x2705;</div>
            <h3 style={{ color:"#fff", marginBottom:8 }}>Mes fechado com sucesso!</h3>
            <p style={{ color:"#888", fontSize:13, marginBottom:4 }}>Receitas: <strong style={{color:"#48bb78"}}>{formatarMoeda(receitas+totalOS)}</strong></p>
            <p style={{ color:"#888", fontSize:13, marginBottom:4 }}>Despesas: <strong style={{color:"#fc8181"}}>{formatarMoeda(despesas)}</strong></p>
            <p style={{ color:"#888", fontSize:13, marginBottom:20 }}>Saldo: <strong style={{color: saldo>=0?"#48bb78":"#fc8181"}}>{formatarMoeda(saldo)}</strong></p>
            <button className="btn-primary" onClick={() => setModalFechamento(false)}>Fechar</button>
          </div>
        </div>
      )}

      {modal && <ModalFinanceiro onSalvar={salvar} onFechar={() => setModal(false)} />}
    </div>
  );
}


function ModalFinanceiro({ onSalvar, onFechar }) {
  const [form, setForm] = useState({ tipo:"receita", descricao:"", categoria:"", valor:"" });
  function set(k,v) { setForm(f => ({...f,[k]:v})); }
  const catReceita = ["OS paga","Venda de peca","Servico avulso","Outro"];
  const catDespesa = ["Aluguel","Energia eletrica","Agua","Compra de pecas","Salario","Combustivel","Manutencao","Outro"];
  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>Novo lancamento</h3><button className="modal-close" onClick={onFechar}>✕</button></div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="span2">Tipo
              <div style={{display:"flex",gap:".75rem",marginTop:".35rem"}}>
                <button className={"tipo-btn"+(form.tipo==="receita"?" ativo-verde":"")} onClick={() => set("tipo","receita")}>Receita</button>
                <button className={"tipo-btn"+(form.tipo==="despesa"?" ativo-vermelho":"")} onClick={() => set("tipo","despesa")}>Despesa</button>
              </div>
            </label>
            <label className="span2">Descricao<input value={form.descricao} onChange={e => set("descricao",e.target.value)} placeholder="Ex: Pagamento OS #012" /></label>
            <label>Categoria
              <select value={form.categoria} onChange={e => set("categoria",e.target.value)}>
                <option value="">Selecione...</option>
                {(form.tipo==="receita"?catReceita:catDespesa).map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Valor (R$)<input type="number" value={form.valor} onChange={e => set("valor",Number(e.target.value))} placeholder="0" /></label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onFechar}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSalvar({ ...form, veiculos, placa: veiculos[0]?.placa || "", modelo: veiculos[0]?.modelo || "", cor: veiculos[0]?.cor || "", ano: veiculos[0]?.ano || "" })}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

function AbaClientes({ clientes, ordens }) {
  const [modal, setModal] = useState(null);
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState(null);
  const filtrados = clientes.filter(c => c.nome?.toLowerCase().includes(busca.toLowerCase()) || c.placa?.toLowerCase().includes(busca.toLowerCase()) || c.telefone?.includes(busca));

  async function salvar(dados) {
    if (dados.id) await updateDoc(doc(db, "clientes", dados.id), dados);
    else await addDoc(collection(db, "clientes"), { ...dados, criadoEm: serverTimestamp() });
    setModal(null);
  }
  async function excluir(id) {
    if (!window.confirm("Excluir este cliente?")) return;
    try {
      await deleteDoc(doc(db, "clientes", id));
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  }

  const ordensCliente = sel ? ordens.filter(o => o.placa===sel.placa||o.cliente===sel.nome) : [];

  if (sel) return (
    <div className="aba-content">
      <button className="btn-voltar" onClick={() => setSel(null)}>← Voltar</button>
      <div className="historico-header">
        <div><strong style={{fontSize:"1.1rem"}}>{sel.nome}</strong><span className="os-placa" style={{marginLeft:".75rem"}}>{sel.placa}</span></div>
        <div style={{textAlign:"right"}}>
          <div style={{color:"var(--texto-sub)",fontSize:".85rem"}}>{sel.telefone}</div>
          <div style={{color:"var(--verde)",fontWeight:700,marginTop:".25rem"}}>Total: {formatarMoeda(ordensCliente.reduce((a,o)=>a+(Number(o.valor)||0),0))}</div>
        </div>
      </div>
      <button className="btn-secondary btn-sm" style={{marginBottom:"1rem"}} onClick={() => enviarWhatsApp(sel.telefone,`Ola ${sel.nome}! Passando para lembrar que seu veiculo ${sel.modelo} esta proximo da revisao. Agende na STOPCAR!`)}>
        📱 Lembrete de revisao via WhatsApp
      </button>
      <h3 className="secao-titulo">Historico de servicos</h3>
      {ordensCliente.length===0 ? <div className="vazio"><p>Nenhum servico registrado.</p></div> : (
        <div className="historico-lista">
          {ordensCliente.map(os => (
            <div key={os.id} className="historico-card">
              <div className="historico-card-top">
                <div><span className="os-numero">OS #{os.numero||"---"}</span><span className="historico-data">{formatarData(os.criadoEm)}</span></div>
                <button className="btn-icon" onClick={() => imprimirOS(os)}>🖨️</button>
              </div>
              <p className="os-servico">{nomeServico(os.servico)}</p>
              {os.obs && <p className="os-obs">{os.obs}</p>}
              <div className="os-card-bottom"><span className="os-valor">{formatarMoeda(os.valor)}</span><span className="os-data">{os.pagamento||""}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="aba-content">
      <div className="aba-header-row"><h2>Clientes</h2><button className="btn-primary btn-sm" onClick={() => setModal({})}>+ Novo cliente</button></div>
      <input className="busca-input" placeholder="Buscar por nome, placa ou telefone..." value={busca} onChange={e => setBusca(e.target.value)} />
      {filtrados.length===0 ? <div className="vazio"><p>Nenhum cliente encontrado.</p></div> : (
        <div className="clientes-tabela">
          <div className="tabela-header"><span>Nome</span><span>Telefone</span><span>Placa / Modelo</span><span>Cadastro</span><span></span></div>
          {filtrados.map(c => (
            <div key={c.id} className="tabela-row" style={{cursor:"pointer"}} onClick={() => setSel(c)}>
              <span className="cliente-nome">{c.nome}</span>
              <span>{c.telefone}</span>
              <span>{c.placa} · {c.modelo}</span>
              <span>{formatarData(c.criadoEm)}</span>
              <div className="tabela-acoes" onClick={e => e.stopPropagation()}>
                <button className="btn-icon" onClick={() => setModal(c)}>✏️</button>
                <button className="btn-icon" onClick={() => excluir(c.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && <ModalCliente dados={modal} onSalvar={salvar} onFechar={() => setModal(null)} />}
    </div>
  );
}

function mascaraTelefone(v) {
  v = v.replace(/\D/g, "").slice(0, 11);
  if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}
function mascaraCPF(v) {
  v = v.replace(/\D/g, "").slice(0, 11);
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4").replace(/-$/, "");
}
function mascaraRG(v) {
  v = v.replace(/\D/g, "").slice(0, 9);
  return v.replace(/(\d{2})(\d{3})(\d{3})(\d{0,1})/, "$1.$2.$3-$4").replace(/-$/, "");
}
function mascaraCEP(v) {
  v = v.replace(/\D/g, "").slice(0, 8);
  return v.replace(/(\d{5})(\d{0,3})/, "$1-$2").replace(/-$/, "");
}
function mascaraPlaca(v) {
  // Remove tudo que não é letra ou número, uppercase
  v = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  // Mercosul: 3 letras + 1 número + 1 letra + 2 números (ex: ABC1D23)
  if (v.length >= 5 && /^[A-Z]{3}\d[A-Z]/.test(v)) {
    return v; // sem hífen no Mercosul
  }
  // Padrão antigo: ABC-1234
  if (v.length > 3 && /^[A-Z]{3}\d/.test(v)) {
    return v.slice(0, 3) + "-" + v.slice(3);
  }
  return v;
}

function ModalCliente({ dados, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    nome: dados?.nome || "",
    telefone: dados?.telefone || "",
    email: dados?.email || "",
    cpf: dados?.cpf || "",
    rg: dados?.rg || "",
    nascimento: dados?.nascimento || "",
    cep: dados?.cep || "",
    endereco: dados?.endereco || "",
    numero: dados?.numero || "",
    bairro: dados?.bairro || "",
    cidade: dados?.cidade || "",
    obs: dados?.obs || "",
    id: dados?.id || null,
  });

  const [veiculos, setVeiculos] = useState(
    dados?.veiculos?.length > 0
      ? dados.veiculos
      : [{ placa: dados?.placa || "", modelo: dados?.modelo || "", cor: dados?.cor || "", ano: dados?.ano || "" }]
  );

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function setVeiculo(i, k, v) {
    setVeiculos(vs => vs.map((v2, idx) => idx === i ? { ...v2, [k]: v } : v2));
  }
  function addVeiculo() {
    setVeiculos(vs => [...vs, { placa: "", modelo: "", cor: "", ano: "", km: "" }]);
  }
  function removeVeiculo(i) {
    setVeiculos(vs => vs.filter((_, idx) => idx !== i));
  }

  async function buscarCEP(cep) {
    const nums = cep.replace(/\D/g, "");
    if (nums.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${nums}/json/`);
      const data = await res.json();
      if (!data.erro) setForm(f => ({ ...f, endereco: data.logradouro || "", bairro: data.bairro || "", cidade: data.localidade || "" }));
    } catch {}
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" style={{ maxWidth: 640, width: "95%" }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{dados?.id ? "Editar cliente" : "Novo cliente"}</h3>
          <button className="modal-close" onClick={onFechar}>✕</button>
        </div>
        <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>

          <p style={{ color:"#e53e3e", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10 }}>👤 Dados Pessoais</p>
          <div className="form-grid">
            <label className="span2">Nome completo<input value={form.nome} onChange={e=>set("nome",e.target.value)} placeholder="João da Silva" /></label>
            <label>Telefone / WhatsApp<input value={form.telefone} onChange={e=>set("telefone",mascaraTelefone(e.target.value))} placeholder="(11) 99999-9999" /></label>
            <label>E-mail<input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="email@exemplo.com" /></label>
            <label>CPF<input value={form.cpf} onChange={e=>set("cpf",mascaraCPF(e.target.value))} placeholder="000.000.000-00" /></label>
            <label>RG<input value={form.rg} onChange={e=>set("rg",mascaraRG(e.target.value))} placeholder="00.000.000-0" /></label>
            <label>Data de Nascimento<input type="date" value={form.nascimento} onChange={e=>set("nascimento",e.target.value)} /></label>
          </div>

          <p style={{ color:"#e53e3e", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", margin:"16px 0 10px" }}>📍 Endereço</p>
          <div className="form-grid">
            <label>CEP<input value={form.cep} onChange={e=>{ const v=mascaraCEP(e.target.value); set("cep",v); buscarCEP(v); }} placeholder="00000-000" /></label>
            <label className="span2">Endereço<input value={form.endereco} onChange={e=>set("endereco",e.target.value)} placeholder="Rua, avenida..." /></label>
            <label>Número<input value={form.numero} onChange={e=>set("numero",e.target.value)} placeholder="123" /></label>
            <label>Bairro<input value={form.bairro} onChange={e=>set("bairro",e.target.value)} placeholder="Bairro" /></label>
            <label>Cidade<input value={form.cidade} onChange={e=>set("cidade",e.target.value)} placeholder="Cidade" /></label>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", margin:"16px 0 10px" }}>
            <p style={{ color:"#e53e3e", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", margin:0 }}>🚗 Veículos</p>
            <button type="button" onClick={addVeiculo} style={{ background:"#e53e3e22", color:"#e53e3e", border:"1px solid #e53e3e44", borderRadius:6, padding:"3px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>+ Adicionar veículo</button>
          </div>
          {veiculos.map((v, i) => (
            <div key={i} style={{ background:"#111", border:"1px solid #2a2a2a", borderRadius:10, padding:"14px", marginBottom:10, position:"relative" }}>
              {veiculos.length > 1 && (
                <button type="button" onClick={() => removeVeiculo(i)} style={{ position:"absolute", top:10, right:10, background:"#e53e3e22", color:"#fc8181", border:"none", borderRadius:6, width:24, height:24, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              )}
              <div style={{ color:"#888", fontSize:11, fontWeight:600, textTransform:"uppercase", marginBottom:10 }}>Veículo {i + 1}</div>
              <div className="form-grid">
                <label>Placa<input value={v.placa} onChange={e=>setVeiculo(i,"placa",mascaraPlaca(e.target.value))} placeholder="ABC-1234 ou ABC1D23" maxLength={8} /></label>
                <label>Modelo<input value={v.modelo} onChange={e=>setVeiculo(i,"modelo",e.target.value)} placeholder="Fiat Uno" /></label>
                <label>Cor<input value={v.cor} onChange={e=>setVeiculo(i,"cor",e.target.value)} placeholder="Branco" /></label>
                <label>Ano<input value={v.ano} onChange={e=>setVeiculo(i,"ano",e.target.value)} placeholder="2020" maxLength={4} /></label>
                <label>KM Atual<input value={v.km||""} onChange={e=>setVeiculo(i,"km",e.target.value)} placeholder="Ex: 85000" type="number" /></label>
              </div>
            </div>
          ))}

          <div className="form-grid" style={{ marginTop: 16 }}>
            <label className="span2">Observações<textarea value={form.obs} onChange={e=>set("obs",e.target.value)} rows={2} placeholder="Informações adicionais..." /></label>
          </div>

        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onFechar}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSalvar({ ...form, veiculos, placa: veiculos[0]?.placa || "", modelo: veiculos[0]?.modelo || "", cor: veiculos[0]?.cor || "", ano: veiculos[0]?.ano || "" })}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

function AbaEquipe({ mecanicos, ordens }) {
  const [modal, setModal] = useState(null);
  async function salvar(dados) {
    if (dados.id) await updateDoc(doc(db, "mecanicos", dados.id), dados);
    else await addDoc(collection(db, "mecanicos"), { ...dados, criadoEm: serverTimestamp() });
    setModal(null);
  }
  async function excluir(id) {
    if (!window.confirm("Excluir este mecânico?")) return;
    try {
      await deleteDoc(doc(db, "mecanicos", id));
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  }
  return (
    <div className="aba-content">
      <div className="aba-header-row"><h2>Equipe</h2><button className="btn-primary btn-sm" onClick={()=>setModal({})}>+ Adicionar mecanico</button></div>
      {mecanicos.length===0 ? <div className="vazio"><p>Nenhum mecanico cadastrado.</p></div> : (
        <div className="equipe-grid">
          {mecanicos.map(m => {
            const osMec = ordens.filter(o => o.mecanico===m.nome);
            const hoje = new Date();
            const totalMes = osMec.filter(o => { const d=o.criadoEm?.toDate?o.criadoEm.toDate():new Date(o.criadoEm||0); return d.getMonth()===hoje.getMonth()&&d.getFullYear()===hoje.getFullYear(); });
            return (
              <div key={m.id} className="mecanico-card">
                <div className="mecanico-avatar">{m.nome.charAt(0).toUpperCase()}</div>
                <div className="mecanico-info"><strong>{m.nome}</strong>{m.especialidade&&<span>{m.especialidade}</span>}{m.telefone&&<span>{m.telefone}</span>}</div>
                <div className="mecanico-stats">
                  <div><span className="stat-num">{osMec.length}</span><span>OS total</span></div>
                  <div><span className="stat-num azul">{totalMes.length}</span><span>este mes</span></div>
                  <div><span className="stat-num verde">{formatarMoeda(osMec.reduce((a,o)=>a+(Number(o.valor)||0),0))}</span><span>faturado</span></div>
                </div>
                <div className="tabela-acoes" style={{marginTop:".5rem"}}>
                  <button className="btn-icon" onClick={()=>setModal(m)}>✏️</button>
                  <button className="btn-icon" onClick={()=>excluir(m.id)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {modal && <ModalMecanico dados={modal} onSalvar={salvar} onFechar={()=>setModal(null)} />}
    </div>
  );
}

function ModalMecanico({ dados, onSalvar, onFechar }) {
  const [form, setForm] = useState({ nome:dados?.nome||"", especialidade:dados?.especialidade||"", telefone:dados?.telefone||"", obs:dados?.obs||"", id:dados?.id||null });
  function set(k,v) { setForm(f=>({...f,[k]:v})); }
  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h3>{dados?.id?"Editar mecanico":"Novo mecanico"}</h3><button className="modal-close" onClick={onFechar}>✕</button></div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="span2">Nome<input value={form.nome} onChange={e=>set("nome",e.target.value)} placeholder="Nome completo" /></label>
            <label>Especialidade<input value={form.especialidade} onChange={e=>set("especialidade",e.target.value)} placeholder="Ex: Motor, Eletrica" /></label>
            <label>Telefone<input value={form.telefone} onChange={e=>set("telefone",e.target.value)} placeholder="(11) 99999-9999" /></label>
            <label className="span2">Obs<textarea value={form.obs} onChange={e=>set("obs",e.target.value)} rows={2} /></label>
          </div>
        </div>
        <div className="modal-footer"><button className="btn-secondary" onClick={onFechar}>Cancelar</button><button className="btn-primary" onClick={()=>onSalvar(form)}>Salvar</button></div>
      </div>
    </div>
  );
}

function AbaEstoque({ estoque }) {
  const [modal, setModal] = useState(null);
  const comAlerta = estoque.filter(p => p.quantidade<=p.minimo);
  async function salvar(dados) {
    if (dados.id) await updateDoc(doc(db, "estoque", dados.id), dados);
    else await addDoc(collection(db, "estoque"), { ...dados, criadoEm: serverTimestamp() });
    setModal(null);
  }
  async function excluir(id) {
    if (!window.confirm("Excluir esta peça do estoque?")) return;
    try {
      await deleteDoc(doc(db, "estoque", id));
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  }
  return (
    <div className="aba-content">
      {comAlerta.length>0 && <div className="alerta-estoque">⚠️ {comAlerta.length} item(ns) abaixo do minimo: {comAlerta.map(p=>p.nome).join(", ")}</div>}
      <div className="aba-header-row"><h2>Estoque</h2><button className="btn-primary btn-sm" onClick={()=>setModal({})}>+ Adicionar peca</button></div>
      {estoque.length===0 ? <div className="vazio"><p>Nenhuma peca cadastrada.</p></div> : (
        <div className="clientes-tabela">
          <div className="tabela-header"><span>Peca / Codigo</span><span>Qtd</span><span>Minimo</span><span>Preco unit.</span><span>Total</span><span></span></div>
          {estoque.map(p => (
            <div key={p.id} className={"tabela-row"+(p.quantidade<=p.minimo?" alerta-row":"")}>
              <span><strong>{p.nome}</strong>{p.codigo&&<small> · {p.codigo}</small>}</span>
              <span className={p.quantidade<=p.minimo?"qtd-alerta":""}>{p.quantidade}</span>
              <span>{p.minimo}</span>
              <span>{formatarMoeda(p.preco)}</span>
              <span style={{color:"var(--verde)",fontWeight:600}}>{formatarMoeda((p.preco||0)*(p.quantidade||0))}</span>
              <div className="tabela-acoes">
                <button className="btn-icon" onClick={()=>setModal(p)}>✏️</button>
                <button className="btn-icon" onClick={()=>excluir(p.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modal && <ModalEstoque dados={modal} onSalvar={salvar} onFechar={()=>setModal(null)} />}
    </div>
  );
}

function ModalEstoque({ dados, onSalvar, onFechar }) {
  const [form, setForm] = useState({ nome:dados?.nome||"", codigo:dados?.codigo||"", quantidade:dados?.quantidade??"", minimo:dados?.minimo??5, preco:dados?.preco??"", id:dados?.id||null });
  function set(k,v) { setForm(f=>({...f,[k]:v})); }
  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h3>{dados?.id?"Editar peca":"Nova peca"}</h3><button className="modal-close" onClick={onFechar}>✕</button></div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="span2">Nome da peca<input value={form.nome} onChange={e=>set("nome",e.target.value)} placeholder="Filtro de oleo" /></label>
            <label>Codigo / Ref.<input value={form.codigo} onChange={e=>set("codigo",e.target.value)} placeholder="FO-001" /></label>
            <label>Preco unit. (R$)<input type="number" value={form.preco} onChange={e=>set("preco",Number(e.target.value))} /></label>
            <label>Quantidade<input type="number" value={form.quantidade} onChange={e=>set("quantidade",Number(e.target.value))} /></label>
            <label>Minimo<input type="number" value={form.minimo} onChange={e=>set("minimo",Number(e.target.value))} /></label>
          </div>
        </div>
        <div className="modal-footer"><button className="btn-secondary" onClick={onFechar}>Cancelar</button><button className="btn-primary" onClick={()=>onSalvar(form)}>Salvar</button></div>
      </div>
    </div>
  );
}
