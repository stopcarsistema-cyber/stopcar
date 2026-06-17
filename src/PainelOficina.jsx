import { useState, useEffect } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, doc, deleteDoc, serverTimestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "./firebase";
import {
  STATUS_OS, SERVICOS, CHECKLIST_ITENS,
  formatarMoeda, formatarData, formatarDataHora,
  nomeServico, precoServico, enviarWhatsApp,
} from "./comum.js";
import { LogoIcone } from "./Logo";

const ABAS = ["Dashboard", "Ordens de Serviço", "Histórico", "Financeiro", "Clientes", "Equipe", "Estoque"];

function gerarNumeroOS(ordens) {
  if (!ordens.length) return "001";
  const nums = ordens.map(o => parseInt(o.numero || "0")).filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return String(max + 1).padStart(3, "0");
}

// ─── Impressão de OS ──────────────────────────────────────────────────────────
function imprimirOS(os) {
  const dataFormatada = os.criadoEm
    ? (os.criadoEm.toDate ? os.criadoEm.toDate() : new Date(os.criadoEm)).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

  const checklistHTML = os.checklist ? Object.entries(os.checklist).map(([k, v]) => {
    const item = CHECKLIST_ITENS.find(i => i.id === k);
    if (!item) return "";
    const cor = v === "ok" ? "#10B981" : v === "atencao" ? "#F59E0B" : v === "urgente" ? "#EF4444" : "#ccc";
    const txt = v === "ok" ? "OK" : v === "atencao" ? "Atenção" : v === "urgente" ? "Urgente" : "—";
    return `<tr><td>${item.label}</td><td style="color:${cor};font-weight:700">${txt}</td></tr>`;
  }).join("") : "";

  const janela = window.open("", "_blank");
  janela.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
  <title>OS #${os.numero || "---"} - STOPCAR</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:13px;color:#111;padding:20px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #CC0000;padding-bottom:12px;margin-bottom:16px}
    .logo-area h1{font-size:28px;font-weight:900;color:#CC0000;letter-spacing:2px}
    .logo-area p{font-size:11px;color:#555;letter-spacing:1px}
    .os-num{text-align:right}
    .os-num .num{font-size:22px;font-weight:700;color:#CC0000}
    .os-num .data{font-size:11px;color:#555;margin-top:4px}
    .secao{margin-bottom:14px}
    .secao-titulo{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#CC0000;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:8px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
    .grid4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px}
    .campo label{font-size:10px;color:#888;display:block;margin-bottom:2px;text-transform:uppercase}
    .campo .valor{font-weight:600;border-bottom:1px solid #ddd;padding-bottom:3px;min-height:20px}
    .obs-box{border:1px solid #ddd;border-radius:4px;padding:8px;min-height:60px;margin-top:4px;font-size:12px;color:#333}
    .total-box{background:#f5f5f5;border:1px solid #ddd;border-radius:4px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;margin-top:8px}
    .total-box .label{font-size:12px;color:#555}
    .total-box .valor{font-size:20px;font-weight:700;color:#CC0000}
    .assinaturas{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:30px}
    .assinatura-campo{text-align:center}
    .assinatura-linha{border-top:1px solid #333;margin-bottom:6px}
    .assinatura-label{font-size:11px;color:#555}
    .via{text-align:center;font-size:10px;color:#aaa;margin-top:20px;border-top:1px dashed #ccc;padding-top:8px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    table td{padding:3px 6px;border-bottom:1px solid #f0f0f0}
    table td:first-child{color:#555}
    @media print{body{padding:10px}}
  </style></head><body>
  <div class="header">
    <div class="logo-area"><h1>STOPCAR</h1><p>OFICINA MECÂNICA</p></div>
    <div class="os-num">
      <div class="num">OS #${os.numero || "---"}</div>
      <div class="data">Data: ${dataFormatada}</div>
      <div class="data">Status: <strong>${STATUS_OS[os.status]?.label || os.status}</strong></div>
    </div>
  </div>
  <div class="secao">
    <div class="secao-titulo">Dados do Cliente</div>
    <div class="grid2">
      <div class="campo"><label>Nome</label><div class="valor">${os.cliente || ""}</div></div>
      <div class="campo"><label>Telefone</label><div class="valor">${os.telefone || ""}</div></div>
    </div>
  </div>
  <div class="secao">
    <div class="secao-titulo">Dados do Veículo</div>
    <div class="grid4">
      <div class="campo"><label>Placa</label><div class="valor">${os.placa || ""}</div></div>
      <div class="campo"><label>Modelo</label><div class="valor">${os.modelo || ""}</div></div>
      <div class="campo"><label>KM Entrada</label><div class="valor">${os.km || ""}</div></div>
      <div class="campo"><label>Próx. Revisão KM</label><div class="valor">${os.proxRevisaoKm || ""}</div></div>
    </div>
  </div>
  <div class="secao">
    <div class="secao-titulo">Serviço Realizado</div>
    <div class="grid2">
      <div class="campo"><label>Tipo de serviço</label><div class="valor">${nomeServico(os.servico)}</div></div>
      <div class="campo"><label>Mecânico responsável</label><div class="valor">${os.mecanico || ""}</div></div>
    </div>
    <div class="campo" style="margin-top:8px"><label>Descrição / Observações</label>
      <div class="obs-box">${os.obs || ""}</div>
    </div>
  </div>
  <div class="secao">
    <div class="secao-titulo">Peças Utilizadas</div>
    <div class="obs-box">${os.pecas || ""}</div>
  </div>
  ${checklistHTML ? `<div class="secao"><div class="secao-titulo">Checklist de Inspeção</div>
  <div class="grid2"><table>${checklistHTML}</table></div></div>` : ""}
  <div class="total-box">
    <span class="label">Valor Total</span>
    <span class="valor">${formatarMoeda(os.valor)}</span>
  </div>
  <div style="margin-top:6px;font-size:11px;color:#888">
    Pagamento: <strong>${os.pagamento || "—"}</strong>
    &nbsp;|&nbsp; Próxima revisão: <strong>${os.proxRevisao || "—"}</strong>
  </div>
  <div class="assinaturas">
    <div class="assinatura-campo">
      <div style="height:50px"></div>
      <div class="assinatura-linha"></div>
      <div class="assinatura-label">Assinatura do Cliente</div>
    </div>
    <div class="assinatura-campo">
      <div style="height:50px"></div>
      <div class="assinatura-linha"></div>
      <div class="assinatura-label">Responsável pela Oficina</div>
    </div>
  </div>
  <div class="via">STOPCAR Oficina Mecânica — Via da Oficina</div>
  <script>window.onload=function(){window.print()}</script>
  </body></html>`);
  janela.document.close();
}

// ─── Root ────────────────────────────────────────────────────────────────────
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
        setOrdens(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "clientes"), orderBy("nome")), snap =>
        setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "estoque"), orderBy("nome")), snap =>
        setEstoque(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "mecanicos"), orderBy("nome")), snap =>
        setMecanicos(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "financeiro"), orderBy("criadoEm", "desc")), snap =>
        setFinanceiro(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const nomesAbas = ["📊 Dashboard", "🔧 OS", "📋 Histórico", "💰 Financeiro", "👤 Clientes", "👥 Equipe", "📦 Estoque"];

  return (
    <div className="painel">
      <header className="painel-header">
        <div className="painel-logo">
          <LogoIcone size={38} />
          <span className="painel-logo-text">STOPCAR</span>
        </div>
        <nav className="painel-nav">
          {nomesAbas.map((a, i) => (
            <button key={i} className={`nav-tab ${aba === i ? "ativo" : ""}`} onClick={() => setAba(i)}>{a}</button>
          ))}
        </nav>
        <button className="btn-sair" onClick={() => signOut(auth)}>Sair</button>
      </header>
      <main className="painel-main">
        {aba === 0 && <AbaDashboard ordens={ordens} financeiro={financeiro} estoque={estoque} mecanicos={mecanicos} />}
        {aba === 1 && <AbaOS ordens={ordens} clientes={clientes} mecanicos={mecanicos} />}
        {aba === 2 && <AbaHistorico ordens={ordens} />}
        {aba === 3 && <AbaFinanceiro financeiro={financeiro} ordens={ordens} />}
        {aba === 4 && <AbaClientes clientes={clientes} ordens={ordens} />}
        {aba === 5 && <AbaEquipe mecanicos={mecanicos} ordens={ordens} />}
        {aba === 6 && <AbaEstoque estoque={estoque} />}
      </main>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function AbaDashboard({ ordens, financeiro, estoque, mecanicos }) {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const inicioSemana = new Date(hoje); inicioSemana.setDate(hoje.getDate() - hoje.getDay());

  const toDate = ts => ts?.toDate ? ts.toDate() : ts ? new Date(ts) : new Date(0);

  const ordensHoje = ordens.filter(o => toDate(o.criadoEm).toDateString() === hoje.toDateString());
  const ordensMes = ordens.filter(o => toDate(o.criadoEm) >= inicioMes);
  const emAndamento = ordens.filter(o => o.status === "em_andamento");
  const aguardando = ordens.filter(o => o.status === "aguardando");
  const pendentePagamento = ordens.filter(o => o.pagamento === "Pendente" || o.pagamento === "Parcial");

  const faturamentoMes = ordensMes
    .filter(o => o.status === "concluido" || o.status === "entregue")
    .reduce((acc, o) => acc + (Number(o.valor) || 0), 0);

  const faturamentoHoje = ordensHoje
    .filter(o => o.status === "concluido" || o.status === "entregue")
    .reduce((acc, o) => acc + (Number(o.valor) || 0), 0);

  const receitaFinanceiro = financeiro
    .filter(f => f.tipo === "receita" && toDate(f.criadoEm) >= inicioMes)
    .reduce((acc, f) => acc + (Number(f.valor) || 0), 0);

  const despesasMes = financeiro
    .filter(f => f.tipo === "despesa" && toDate(f.criadoEm) >= inicioMes)
    .reduce((acc, f) => acc + (Number(f.valor) || 0), 0);

  const estoqueBaixo = estoque.filter(p => p.quantidade <= p.minimo);

  // Serviços mais realizados
  const contagemServicos = {};
  ordens.forEach(o => { if (o.servico) contagemServicos[o.servico] = (contagemServicos[o.servico] || 0) + 1; });
  const topServicos = Object.entries(contagemServicos)
    .sort((a, b) => b[1] - a[1]).slice(0, 5);

  // OS paradas há mais de 3 dias
  const osParadas = ordens.filter(o => {
    if (o.status === "entregue" || o.status === "concluido") return false;
    const diff = (hoje - toDate(o.criadoEm)) / (1000 * 60 * 60 * 24);
    return diff > 3;
  });

  return (
    <div className="aba-content">
      <h2>Dashboard</h2>

      {/* Alertas */}
      {(estoqueBaixo.length > 0 || osParadas.length > 0 || pendentePagamento.length > 0) && (
        <div className="alertas-box">
          {estoqueBaixo.length > 0 && (
            <div className="alerta-item vermelho">⚠️ {estoqueBaixo.length} item(ns) com estoque baixo: {estoqueBaixo.map(p => p.nome).join(", ")}</div>
          )}
          {osParadas.length > 0 && (
            <div className="alerta-item amarelo">⏰ {osParadas.length} OS parada(s) há mais de 3 dias</div>
          )}
          {pendentePagamento.length > 0 && (
            <div className="alerta-item azul">💳 {pendentePagamento.length} OS com pagamento pendente — {formatarMoeda(pendentePagamento.reduce((a, o) => a + (Number(o.valor) || 0), 0))}</div>
          )}
        </div>
      )}

      {/* Cards de resumo */}
      <div className="dashboard-grid">
        <div className="dash-card">
          <span className="dash-label">OS hoje</span>
          <span className="dash-valor">{ordensHoje.length}</span>
        </div>
        <div className="dash-card">
          <span className="dash-label">Em andamento</span>
          <span className="dash-valor azul">{emAndamento.length}</span>
        </div>
        <div className="dash-card">
          <span className="dash-label">Aguardando</span>
          <span className="dash-valor amarelo">{aguardando.length}</span>
        </div>
        <div className="dash-card">
          <span className="dash-label">Faturamento hoje</span>
          <span className="dash-valor verde">{formatarMoeda(faturamentoHoje)}</span>
        </div>
        <div className="dash-card">
          <span className="dash-label">Faturamento do mês</span>
          <span className="dash-valor verde">{formatarMoeda(faturamentoMes)}</span>
        </div>
        <div className="dash-card">
          <span className="dash-label">Despesas do mês</span>
          <span className="dash-valor vermelho">{formatarMoeda(despesasMes)}</span>
        </div>
        <div className="dash-card">
          <span className="dash-label">Lucro do mês</span>
          <span className="dash-valor verde">{formatarMoeda(faturamentoMes - despesasMes)}</span>
        </div>
        <div className="dash-card">
          <span className="dash-label">OS no mês</span>
          <span className="dash-valor">{ordensMes.length}</span>
        </div>
      </div>

      <div className="dashboard-cols">
        {/* Serviços mais realizados */}
        <div className="dash-section">
          <h3 className="secao-titulo">🏆 Serviços mais realizados</h3>
          {topServicos.length === 0 ? <p style={{color:"var(--texto-sub)",fontSize:".85rem"}}>Nenhum serviço ainda.</p> :
            topServicos.map(([id, qtd]) => (
              <div key={id} className="rank-item">
                <span>{nomeServico(id)}</span>
                <div className="rank-bar-wrap">
                  <div className="rank-bar" style={{ width: `${(qtd / topServicos[0][1]) * 100}%` }}></div>
                </div>
                <span className="rank-num">{qtd}</span>
              </div>
            ))
          }
        </div>

        {/* OS em andamento agora */}
        <div className="dash-section">
          <h3 className="secao-titulo">🔧 Na oficina agora</h3>
          {emAndamento.length === 0 ? <p style={{color:"var(--texto-sub)",fontSize:".85rem"}}>Nenhum carro em andamento.</p> :
            emAndamento.map(os => (
              <div key={os.id} className="dash-os-item">
                <span className="os-placa" style={{fontSize:".9rem"}}>{os.placa}</span>
                <span style={{flex:1, fontSize:".85rem", color:"var(--texto-sub)"}}>{os.modelo}</span>
                <span style={{fontSize:".8rem", color:"var(--azul)"}}>{os.mecanico || "—"}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── OS ──────────────────────────────────────────────────────────────────────
function AbaOS({ ordens, clientes, mecanicos }) {
  const [modal, setModal] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  const ordensFiltradas = ordens
    .filter(o => filtroStatus === "todos" || o.status === filtroStatus)
    .filter(o => !busca ||
      o.placa?.toLowerCase().includes(busca.toLowerCase()) ||
      o.cliente?.toLowerCase().includes(busca.toLowerCase()) ||
      o.numero?.includes(busca)
    );

  const contagem = Object.keys(STATUS_OS).reduce((acc, k) => {
    acc[k] = ordens.filter(o => o.status === k).length; return acc;
  }, {});

  async function salvarOS(dados) {
    if (dados.id) {
      await updateDoc(doc(db, "ordens", dados.id), { ...dados, atualizadoEm: serverTimestamp() });
    } else {
      await addDoc(collection(db, "ordens"), { ...dados, numero: gerarNumeroOS(ordens), criadoEm: serverTimestamp() });
    }
    setModal(null);
  }

  async function excluirOS(id) {
    try {
      await deleteDoc(doc(db, "ordens", id));
    } catch(e) {
      console.error("Erro ao excluir:", e);
    }
  }

  async function mudarStatus(id, novoStatus) {
    await updateDoc(doc(db, "ordens", id), { status: novoStatus, atualizadoEm: serverTimestamp() });
  }

  function whatsappPronto(os) {
    const msg = `Olá ${os.cliente}! 🔧\n\nSeu veículo *${os.modelo}* (${os.placa}) está pronto para retirada na STOPCAR Oficina Mecânica.\n\nServiço: ${nomeServico(os.servico)}\nValor: ${formatarMoeda(os.valor)}\n\nAguardamos você!`;
    enviarWhatsApp(os.telefone, msg);
  }

  return (
    <div className="aba-content">
      <div className="kanban-summary">
        {Object.entries(STATUS_OS).map(([k, v]) => (
          <button key={k} className={`kanban-pill ${filtroStatus === k ? "ativo" : ""}`}
            style={{ "--cor": v.cor }} onClick={() => setFiltroStatus(filtroStatus === k ? "todos" : k)}>
            <span className="kanban-count">{contagem[k]}</span><span>{v.label}</span>
          </button>
        ))}
        <button className={`kanban-pill ${filtroStatus === "todos" ? "ativo" : ""}`}
          style={{ "--cor": "#6B7280" }} onClick={() => setFiltroStatus("todos")}>
          <span className="kanban-count">{ordens.length}</span><span>Todas</span>
        </button>
      </div>

      <div className="aba-header-row">
        <h2>Ordens de Serviço</h2>
        <button className="btn-primary btn-sm" onClick={() => setModal("nova")}>+ Nova OS</button>
      </div>

      <input className="busca-input" placeholder="Buscar por placa, cliente ou nº OS…"
        value={busca} onChange={e => setBusca(e.target.value)} />

      {ordensFiltradas.length === 0 ? (
        <div className="vazio"><p>Nenhuma OS encontrada.</p></div>
      ) : (
        <div className="os-lista">
          {ordensFiltradas.map(os => (
            <div key={os.id} className="os-card">
              <div className="os-card-top">
                <div>
                  <span className="os-numero">OS #{os.numero || "---"}</span>
                  <span className="os-placa">{os.placa}</span>
                  <span className="os-modelo">{os.modelo}</span>
                </div>
                <span className="os-status-badge"
                  style={{ background: STATUS_OS[os.status]?.cor + "22", color: STATUS_OS[os.status]?.cor }}>
                  {STATUS_OS[os.status]?.label}
                </span>
              </div>
              <p className="os-cliente">{os.cliente} · {os.telefone}</p>
              {os.mecanico && <p className="os-cliente">🔧 {os.mecanico}</p>}
              <p className="os-servico">{nomeServico(os.servico)}</p>
              {os.obs && <p className="os-obs">{os.obs}</p>}
              {os.pecas && <p className="os-obs">🔩 {os.pecas}</p>}
              {os.km && <p className="os-obs">KM: {os.km}{os.proxRevisaoKm ? ` · Próx: ${os.proxRevisaoKm} km` : ""}</p>}
              <div className="os-card-bottom">
                <span className="os-valor">{formatarMoeda(os.valor)}</span>
                <span className="os-data">{formatarData(os.criadoEm)}</span>
              </div>
              {os.pagamento && (
                <span className={`pagamento-badge ${os.pagamento === "Pendente" || os.pagamento === "Parcial" ? "pendente" : "pago"}`}>
                  {os.pagamento}
                </span>
              )}
              <div className="os-acoes" onClick={e => e.stopPropagation()}>
                <select value={os.status} onChange={e => { e.stopPropagation(); mudarStatus(os.id, e.target.value); }} className="select-status">
                  {Object.entries(STATUS_OS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button className="btn-icon" title="WhatsApp — carro pronto" onClick={e => { e.stopPropagation(); whatsappPronto(os); }}>📱</button>
                <button className="btn-icon" title="Imprimir OS" onClick={e => { e.stopPropagation(); imprimirOS(os); }}>🖨️</button>
                <button className="btn-icon" onClick={e => { e.stopPropagation(); setModal(os); }}>✏️</button>
                <button className="btn-icon" onClick={() => excluirOS(os.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ModalOS dados={modal === "nova" ? null : modal} mecanicos={mecanicos}
          onSalvar={salvarOS} onFechar={() => setModal(null)} />
      )}
    </div>
  );
}

function ModalOS({ dados, mecanicos, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    cliente: dados?.cliente || "", telefone: dados?.telefone || "",
    placa: dados?.placa || "", modelo: dados?.modelo || "",
    servico: dados?.servico || "", obs: dados?.obs || "",
    pecas: dados?.pecas || "", valor: dados?.valor || "",
    km: dados?.km || "", proxRevisaoKm: dados?.proxRevisaoKm || "",
    proxRevisao: dados?.proxRevisao || "", mecanico: dados?.mecanico || "",
    pagamento: dados?.pagamento || "", status: dados?.status || "aguardando",
    checklist: dados?.checklist || {},
    id: dados?.id || null,
  });
  const [abaModal, setAbaModal] = useState("dados");

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function setCheck(k, v) { setForm(f => ({ ...f, checklist: { ...f.checklist, [k]: v } })); }

  const statusCheck = { ok: "✅ OK", atencao: "⚠️ Atenção", urgente: "🔴 Urgente", na: "—" };

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{dados ? `Editar OS #${dados.numero || "---"}` : "Nova OS"}</h3>
          <button className="modal-close" onClick={onFechar}>✕</button>
        </div>
        <div className="modal-tabs">
          {["dados", "checklist"].map(t => (
            <button key={t} className={`modal-tab ${abaModal === t ? "ativo" : ""}`} onClick={() => setAbaModal(t)}>
              {t === "dados" ? "📋 Dados" : "🔍 Checklist"}
            </button>
          ))}
        </div>
        <div className="modal-body">
          {abaModal === "dados" && (
            <div className="form-grid">
              <label>Cliente<input value={form.cliente} onChange={e => set("cliente", e.target.value)} placeholder="Nome do cliente" /></label>
              <label>Telefone<input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-9999" /></label>
              <label>Placa<input value={form.placa} onChange={e => set("placa", e.target.value.toUpperCase())} placeholder="ABC-1234" /></label>
              <label>Modelo<input value={form.modelo} onChange={e => set("modelo", e.target.value)} placeholder="Fiat Uno 2018" /></label>
              <label>KM Entrada<input value={form.km} onChange={e => set("km", e.target.value)} placeholder="85000" /></label>
              <label>Próx. Revisão KM<input value={form.proxRevisaoKm} onChange={e => set("proxRevisaoKm", e.target.value)} placeholder="90000" /></label>
              <label>Serviço
                <select value={form.servico} onChange={e => { set("servico", e.target.value); if (!form.valor) set("valor", precoServico(e.target.value)); }}>
                  <option value="">Selecione…</option>
                  {SERVICOS.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </label>
              <label>Mecânico
                <select value={form.mecanico} onChange={e => set("mecanico", e.target.value)}>
                  <option value="">Selecione…</option>
                  {mecanicos.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                  <option value="outro">Outro</option>
                </select>
              </label>
              <label>Valor (R$)<input type="number" value={form.valor} onChange={e => set("valor", Number(e.target.value))} placeholder="0" /></label>
              <label>Pagamento
                <select value={form.pagamento} onChange={e => set("pagamento", e.target.value)}>
                  <option value="">Selecione…</option>
                  <option>Pago - Dinheiro</option>
                  <option>Pago - PIX</option>
                  <option>Pago - Cartão Débito</option>
                  <option>Pago - Cartão Crédito</option>
                  <option>Pendente</option>
                  <option>Parcial</option>
                </select>
              </label>
              <label>Status
                <select value={form.status} onChange={e => set("status", e.target.value)}>
                  {Object.entries(STATUS_OS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </label>
              <label>Próxima revisão recomendada<input value={form.proxRevisao} onChange={e => set("proxRevisao", e.target.value)} placeholder="Ex: 6 meses ou 5.000 km" /></label>
              <label className="span2">Descrição / Observações<textarea value={form.obs} onChange={e => set("obs", e.target.value)} rows={2} placeholder="Descreva o serviço…" /></label>
              <label className="span2">Peças utilizadas<textarea value={form.pecas} onChange={e => set("pecas", e.target.value)} rows={2} placeholder="Ex: Filtro de óleo, vela de ignição…" /></label>
            </div>
          )}
          {abaModal === "checklist" && (
            <div className="checklist-grid">
              {CHECKLIST_ITENS.map(item => (
                <div key={item.id} className="checklist-item">
                  <span className="checklist-label">{item.label}</span>
                  <div className="checklist-btns">
                    {Object.entries(statusCheck).map(([k, v]) => (
                      <button key={k}
                        className={`check-btn ${form.checklist[item.id] === k ? "ativo" : ""} check-${k}`}
                        onClick={() => setCheck(item.id, k)}>{v}
                      </button>
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

// ─── Histórico ───────────────────────────────────────────────────────────────
function AbaHistorico({ ordens }) {
  const [busca, setBusca] = useState("");
  const [placaSelecionada, setPlacaSelecionada] = useState("");

  const placas = [...new Set(ordens.map(o => o.placa).filter(Boolean))].sort();
  const placasFiltradas = placas.filter(p => p.toLowerCase().includes(busca.toLowerCase()));

  const historico = placaSelecionada
    ? ordens.filter(o => o.placa === placaSelecionada)
        .sort((a, b) => {
          const da = a.criadoEm?.toDate ? a.criadoEm.toDate() : new Date(a.criadoEm || 0);
          const db2 = b.criadoEm?.toDate ? b.criadoEm.toDate() : new Date(b.criadoEm || 0);
          return db2 - da;
        })
    : [];

  const osPlaca = historico[0];
  const totalGasto = historico.reduce((acc, o) => acc + (Number(o.valor) || 0), 0);

  return (
    <div className="aba-content">
      <h2>Histórico por Veículo</h2>
      <p style={{ color: "var(--texto-sub)", marginBottom: "1.25rem", fontSize: ".9rem" }}>
        Digite a placa para ver todo o histórico do veículo.
      </p>

      <input className="busca-input" placeholder="Digite a placa…" value={busca}
        onChange={e => { setBusca(e.target.value); setPlacaSelecionada(""); }} />

      {busca && !placaSelecionada && (
        <div className="placas-lista">
          {placasFiltradas.length === 0
            ? <div className="vazio"><p>Nenhum veículo encontrado.</p></div>
            : placasFiltradas.map(p => {
                const os = ordens.filter(o => o.placa === p);
                return (
                  <button key={p} className="placa-item" onClick={() => { setPlacaSelecionada(p); setBusca(p); }}>
                    <span className="placa-tag">{p}</span>
                    <span className="placa-info">{os[0]?.modelo} · {os[0]?.cliente}</span>
                    <span className="placa-count">{os.length} OS</span>
                  </button>
                );
              })
          }
        </div>
      )}

      {placaSelecionada && (
        <>
          <div className="historico-header">
            <div>
              <span className="os-placa" style={{ fontSize: "1.3rem" }}>{placaSelecionada}</span>
              <span className="os-modelo" style={{ fontSize: "1rem", marginLeft: ".75rem" }}>{osPlaca?.modelo}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "var(--texto-sub)", fontSize: ".85rem" }}>{historico.length} serviço(s)</div>
              <div style={{ color: "var(--verde)", fontWeight: 700 }}>Total gasto: {formatarMoeda(totalGasto)}</div>
            </div>
          </div>
          <div className="historico-lista">
            {historico.map(os => (
              <div key={os.id} className="historico-card">
                <div className="historico-card-top">
                  <div>
                    <span className="os-numero">OS #{os.numero || "---"}</span>
                    <span className="historico-data">{formatarData(os.criadoEm)}</span>
                  </div>
                  <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                    <span className="os-status-badge"
                      style={{ background: STATUS_OS[os.status]?.cor + "22", color: STATUS_OS[os.status]?.cor }}>
                      {STATUS_OS[os.status]?.label}
                    </span>
                    <button className="btn-icon" onClick={() => imprimirOS(os)}>🖨️</button>
                  </div>
                </div>
                <p className="os-servico">{nomeServico(os.servico)}</p>
                {os.mecanico && <p className="os-obs">🔧 {os.mecanico}</p>}
                {os.obs && <p className="os-obs">{os.obs}</p>}
                {os.pecas && <p className="os-obs">🔩 {os.pecas}</p>}
                {os.km && <p className="os-obs">KM: {os.km}{os.proxRevisaoKm ? ` · Próx: ${os.proxRevisaoKm} km` : ""}</p>}
                {os.proxRevisao && <p className="os-obs">📅 Recomendação: {os.proxRevisao}</p>}
                <div className="os-card-bottom">
                  <span className="os-valor">{formatarMoeda(os.valor)}</span>
                  {os.pagamento && <span className="os-data">{os.pagamento}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!busca && !placaSelecionada && (
        <div className="vazio"><p>Digite uma placa para buscar o histórico.</p></div>
      )}
    </div>
  );
}

// ─── Financeiro ──────────────────────────────────────────────────────────────
function AbaFinanceiro({ financeiro, ordens }) {
  const [modal, setModal] = useState(false);
  const [filtroMes, setFiltroMes] = useState(() => {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}`;
  });

  const toDate = ts => ts?.toDate ? ts.toDate() : ts ? new Date(ts) : new Date(0);

  const lancamentosFiltrados = financeiro.filter(f => {
    const d = toDate(f.criadoEm);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return mes === filtroMes;
  });

  const receitas = lancamentosFiltrados.filter(f => f.tipo === "receita");
  const despesas = lancamentosFiltrados.filter(f => f.tipo === "despesa");
  const totalReceitas = receitas.reduce((a, f) => a + (Number(f.valor) || 0), 0);
  const totalDespesas = despesas.reduce((a, f) => a + (Number(f.valor) || 0), 0);
  const lucro = totalReceitas - totalDespesas;

  // OS pagas no mês
  const [anoFiltro, mesFiltro] = filtroMes.split("-").map(Number);
  const osPagas = ordens.filter(o => {
    if (!o.pagamento || o.pagamento === "Pendente") return false;
    const d = toDate(o.criadoEm);
    return d.getFullYear() === anoFiltro && d.getMonth() + 1 === mesFiltro;
  });
  const totalOS = osPagas.reduce((a, o) => a + (Number(o.valor) || 0), 0);

  async function salvar(dados) {
    await addDoc(collection(db, "financeiro"), { ...dados, criadoEm: serverTimestamp() });
    setModal(false);
  }

  async function excluir(id) {
    if (!confirm("Excluir este lançamento?")) return;
    await deleteDoc(doc(db, "financeiro", id));
  }

  return (
    <div className="aba-content">
      <div className="aba-header-row">
        <h2>Financeiro</h2>
        <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
          <input type="month" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
            style={{ padding: ".45rem .75rem", borderRadius: "var(--radius)", background: "var(--cinza-escuro)", border: "1px solid var(--borda)", color: "var(--texto)" }} />
          <button className="btn-primary btn-sm" onClick={() => setModal(true)}>+ Lançamento</button>
        </div>
      </div>

      {/* Resumo */}
      <div className="fin-resumo">
        <div className="fin-card receita">
          <span>Receitas (lançamentos)</span>
          <strong>{formatarMoeda(totalReceitas)}</strong>
        </div>
        <div className="fin-card os-pagas">
          <span>OS pagas no mês</span>
          <strong>{formatarMoeda(totalOS)}</strong>
        </div>
        <div className="fin-card despesa">
          <span>Despesas</span>
          <strong>{formatarMoeda(totalDespesas)}</strong>
        </div>
        <div className={`fin-card lucro ${lucro + totalOS - totalDespesas >= 0 ? "positivo" : "negativo"}`}>
          <span>Saldo do mês</span>
          <strong>{formatarMoeda(totalReceitas + totalOS - totalDespesas)}</strong>
        </div>
      </div>

      {/* OS pendentes de pagamento */}
      {ordens.filter(o => o.pagamento === "Pendente" || o.pagamento === "Parcial").length > 0 && (
        <div className="fin-pendentes">
          <h3 className="secao-titulo">⏳ Contas a receber</h3>
          {ordens.filter(o => o.pagamento === "Pendente" || o.pagamento === "Parcial").map(os => (
            <div key={os.id} className="fin-pendente-item">
              <span className="os-placa" style={{fontSize:".85rem"}}>{os.placa}</span>
              <span style={{flex:1, fontSize:".85rem"}}>{os.cliente}</span>
              <span style={{fontSize:".8rem", color:"var(--texto-sub)"}}>{os.pagamento}</span>
              <span className="os-valor" style={{fontSize:".9rem"}}>{formatarMoeda(os.valor)}</span>
            </div>
          ))}
          <div style={{textAlign:"right", marginTop:".5rem", fontSize:".85rem", color:"var(--amarelo)", fontWeight:700}}>
            Total a receber: {formatarMoeda(ordens.filter(o => o.pagamento === "Pendente" || o.pagamento === "Parcial").reduce((a, o) => a + (Number(o.valor) || 0), 0))}
          </div>
        </div>
      )}

      {/* Lançamentos */}
      <h3 className="secao-titulo" style={{marginTop:"1.5rem"}}>Lançamentos do mês</h3>
      {lancamentosFiltrados.length === 0
        ? <div className="vazio"><p>Nenhum lançamento neste mês.</p></div>
        : <div className="fin-lista">
            {lancamentosFiltrados.map(f => (
              <div key={f.id} className={`fin-item ${f.tipo}`}>
                <div style={{display:"flex", flexDirection:"column", gap:".2rem", flex:1}}>
                  <strong style={{fontSize:".9rem"}}>{f.descricao}</strong>
                  <span style={{fontSize:".75rem", color:"var(--texto-sub)"}}>{f.categoria} · {formatarData(f.criadoEm)}</span>
                </div>
                <span className={`fin-valor ${f.tipo}`}>{f.tipo === "receita" ? "+" : "-"}{formatarMoeda(f.valor)}</span>
                <button className="btn-icon" onClick={() => excluir(f.id)}>🗑️</button>
              </div>
            ))}
          </div>
      }

      {modal && <ModalFinanceiro onSalvar={salvar} onFechar={() => setModal(false)} />}
    </div>
  );
}

function ModalFinanceiro({ onSalvar, onFechar }) {
  const [form, setForm] = useState({ tipo: "receita", descricao: "", categoria: "", valor: "" });
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const catReceita = ["OS paga", "Venda de peça", "Serviço avulso", "Outro"];
  const catDespesa = ["Aluguel", "Energia elétrica", "Água", "Compra de peças", "Salário", "Combustível", "Manutenção", "Outro"];

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Novo lançamento</h3>
          <button className="modal-close" onClick={onFechar}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="span2">Tipo
              <div style={{display:"flex", gap:".75rem", marginTop:".35rem"}}>
                <button className={`tipo-btn ${form.tipo === "receita" ? "ativo-verde" : ""}`} onClick={() => set("tipo", "receita")}>📈 Receita</button>
                <button className={`tipo-btn ${form.tipo === "despesa" ? "ativo-vermelho" : ""}`} onClick={() => set("tipo", "despesa")}>📉 Despesa</button>
              </div>
            </label>
            <label className="span2">Descrição<input value={form.descricao} onChange={e => set("descricao", e.target.value)} placeholder="Ex: Pagamento OS #012" /></label>
            <label>Categoria
              <select value={form.categoria} onChange={e => set("categoria", e.target.value)}>
                <option value="">Selecione…</option>
                {(form.tipo === "receita" ? catReceita : catDespesa).map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Valor (R$)<input type="number" value={form.valor} onChange={e => set("valor", Number(e.target.value))} placeholder="0" /></label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onFechar}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSalvar(form)}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Clientes ────────────────────────────────────────────────────────────────
function AbaClientes({ clientes, ordens }) {
  const [modal, setModal] = useState(null);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(null);

  const filtrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.placa?.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.includes(busca)
  );

  async function salvar(dados) {
    if (dados.id) await updateDoc(doc(db, "clientes", dados.id), dados);
    else await addDoc(collection(db, "clientes"), { ...dados, criadoEm: serverTimestamp() });
    setModal(null);
  }

  async function excluir(id) {
    if (!confirm("Excluir este cliente?")) return;
    await deleteDoc(doc(db, "clientes", id));
  }

  const ordensCliente = selecionado
    ? ordens.filter(o => o.placa === selecionado.placa || o.cliente === selecionado.nome)
    : [];

  if (selecionado) return (
    <div className="aba-content">
      <button className="btn-voltar" onClick={() => setSelecionado(null)}>← Voltar</button>
      <div className="historico-header">
        <div>
          <strong style={{fontSize:"1.1rem"}}>{selecionado.nome}</strong>
          <span className="os-placa" style={{marginLeft:".75rem"}}>{selecionado.placa}</span>
          <span className="os-modelo" style={{marginLeft:".5rem"}}>{selecionado.modelo}</span>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{color:"var(--texto-sub)", fontSize:".85rem"}}>{selecionado.telefone}</div>
          {selecionado.email && <div style={{color:"var(--texto-sub)", fontSize:".8rem"}}>{selecionado.email}</div>}
          <div style={{color:"var(--verde)", fontWeight:700, marginTop:".25rem"}}>
            Total gasto: {formatarMoeda(ordensCliente.reduce((a, o) => a + (Number(o.valor) || 0), 0))}
          </div>
        </div>
      </div>
      <button className="btn-secondary btn-sm" style={{marginBottom:"1rem"}}
        onClick={() => enviarWhatsApp(selecionado.telefone, `Olá ${selecionado.nome}! Tudo bem? 😊\n\nPassando para lembrar que seu veículo ${selecionado.modelo} está próximo da revisão.\n\nAgende conosco na STOPCAR! 🔧`)}>
        📱 Lembrete de revisão via WhatsApp
      </button>
      <h3 className="secao-titulo">Histórico de serviços</h3>
      {ordensCliente.length === 0 ? <div className="vazio"><p>Nenhum serviço registrado.</p></div> :
        <div className="historico-lista">
          {ordensCliente.map(os => (
            <div key={os.id} className="historico-card">
              <div className="historico-card-top">
                <div><span className="os-numero">OS #{os.numero || "---"}</span><span className="historico-data">{formatarData(os.criadoEm)}</span></div>
                <button className="btn-icon" onClick={() => imprimirOS(os)}>🖨️</button>
              </div>
              <p className="os-servico">{nomeServico(os.servico)}</p>
              {os.obs && <p className="os-obs">{os.obs}</p>}
              <div className="os-card-bottom">
                <span className="os-valor">{formatarMoeda(os.valor)}</span>
                <span className="os-data">{os.pagamento || ""}</span>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );

  return (
    <div className="aba-content">
      <div className="aba-header-row">
        <h2>Clientes</h2>
        <button className="btn-primary btn-sm" onClick={() => setModal({})}>+ Novo cliente</button>
      </div>
      <input className="busca-input" placeholder="Buscar por nome, placa ou telefone…" value={busca} onChange={e => setBusca(e.target.value)} />
      {filtrados.length === 0 ? <div className="vazio"><p>Nenhum cliente encontrado.</p></div> :
        <div className="clientes-tabela">
          <div className="tabela-header"><span>Nome</span><span>Telefone</span><span>Placa / Modelo</span><span>Cadastro</span><span></span></div>
          {filtrados.map(c => (
            <div key={c.id} className="tabela-row" style={{cursor:"pointer"}} onClick={() => setSelecionado(c)}>
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
      }
      {modal && <ModalCliente dados={modal} onSalvar={salvar} onFechar={() => setModal(null)} />}
    </div>
  );
}

function ModalCliente({ dados, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    nome: dados?.nome || "", telefone: dados?.telefone || "",
    email: dados?.email || "", placa: dados?.placa || "",
    modelo: dados?.modelo || "", obs: dados?.obs || "",
    id: dados?.id || null,
  });
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{dados?.id ? "Editar cliente" : "Novo cliente"}</h3><button className="modal-close" onClick={onFechar}>✕</button></div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="span2">Nome<input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Nome completo" /></label>
            <label>Telefone<input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-9999" /></label>
            <label>E-mail<input value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@exemplo.com" /></label>
            <label>Placa<input value={form.placa} onChange={e => set("placa", e.target.value.toUpperCase())} placeholder="ABC-1234" /></label>
            <label>Modelo<input value={form.modelo} onChange={e => set("modelo", e.target.value)} placeholder="Fiat Uno 2018" /></label>
            <label className="span2">Obs<textarea value={form.obs} onChange={e => set("obs", e.target.value)} rows={2} placeholder="Anotações…" /></label>
          </div>
        </div>
        <div className="modal-footer"><button className="btn-secondary" onClick={onFechar}>Cancelar</button><button className="btn-primary" onClick={() => onSalvar(form)}>Salvar</button></div>
      </div>
    </div>
  );
}

// ─── Equipe ──────────────────────────────────────────────────────────────────
function AbaEquipe({ mecanicos, ordens }) {
  const [modal, setModal] = useState(null);

  async function salvar(dados) {
    if (dados.id) await updateDoc(doc(db, "mecanicos", dados.id), dados);
    else await addDoc(collection(db, "mecanicos"), { ...dados, criadoEm: serverTimestamp() });
    setModal(null);
  }

  async function excluir(id) {
    if (!confirm("Excluir este mecânico?")) return;
    await deleteDoc(doc(db, "mecanicos", id));
  }

  return (
    <div className="aba-content">
      <div className="aba-header-row">
        <h2>Equipe</h2>
        <button className="btn-primary btn-sm" onClick={() => setModal({})}>+ Adicionar mecânico</button>
      </div>
      {mecanicos.length === 0 ? <div className="vazio"><p>Nenhum mecânico cadastrado.</p></div> :
        <div className="equipe-grid">
          {mecanicos.map(m => {
            const osMecanico = ordens.filter(o => o.mecanico === m.nome);
            const totalMes = osMecanico.filter(o => {
              const d = o.criadoEm?.toDate ? o.criadoEm.toDate() : new Date(o.criadoEm || 0);
              const agora = new Date();
              return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
            });
            return (
              <div key={m.id} className="mecanico-card">
                <div className="mecanico-avatar">{m.nome.charAt(0).toUpperCase()}</div>
                <div className="mecanico-info">
                  <strong>{m.nome}</strong>
                  {m.especialidade && <span>{m.especialidade}</span>}
                  {m.telefone && <span>{m.telefone}</span>}
                </div>
                <div className="mecanico-stats">
                  <div><span className="stat-num">{osMecanico.length}</span><span>OS total</span></div>
                  <div><span className="stat-num azul">{totalMes.length}</span><span>este mês</span></div>
                  <div><span className="stat-num verde">{formatarMoeda(osMecanico.reduce((a, o) => a + (Number(o.valor) || 0), 0))}</span><span>faturado</span></div>
                </div>
                <div className="tabela-acoes" style={{marginTop:".5rem"}}>
                  <button className="btn-icon" onClick={() => setModal(m)}>✏️</button>
                  <button className="btn-icon" onClick={() => excluir(m.id)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      }
      {modal && <ModalMecanico dados={modal} onSalvar={salvar} onFechar={() => setModal(null)} />}
    </div>
  );
}

function ModalMecanico({ dados, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    nome: dados?.nome || "", especialidade: dados?.especialidade || "",
    telefone: dados?.telefone || "", obs: dados?.obs || "",
    id: dados?.id || null,
  });
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{dados?.id ? "Editar mecânico" : "Novo mecânico"}</h3><button className="modal-close" onClick={onFechar}>✕</button></div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="span2">Nome<input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Nome completo" /></label>
            <label>Especialidade<input value={form.especialidade} onChange={e => set("especialidade", e.target.value)} placeholder="Ex: Motor, Elétrica" /></label>
            <label>Telefone<input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-9999" /></label>
            <label className="span2">Obs<textarea value={form.obs} onChange={e => set("obs", e.target.value)} rows={2} /></label>
          </div>
        </div>
        <div className="modal-footer"><button className="btn-secondary" onClick={onFechar}>Cancelar</button><button className="btn-primary" onClick={() => onSalvar(form)}>Salvar</button></div>
      </div>
    </div>
  );
}

// ─── Estoque ─────────────────────────────────────────────────────────────────
function AbaEstoque({ estoque }) {
  const [modal, setModal] = useState(null);
  const comAlerta = estoque.filter(p => p.quantidade <= p.minimo);

  async function salvar(dados) {
    if (dados.id) await updateDoc(doc(db, "estoque", dados.id), dados);
    else await addDoc(collection(db, "estoque"), { ...dados, criadoEm: serverTimestamp() });
    setModal(null);
  }

  async function excluir(id) {
    if (!confirm("Excluir este item?")) return;
    await deleteDoc(doc(db, "estoque", id));
  }

  return (
    <div className="aba-content">
      {comAlerta.length > 0 && (
        <div className="alerta-estoque">⚠️ {comAlerta.length} item(ns) abaixo do mínimo: {comAlerta.map(p => p.nome).join(", ")}</div>
      )}
      <div className="aba-header-row">
        <h2>Estoque</h2>
        <button className="btn-primary btn-sm" onClick={() => setModal({})}>+ Adicionar peça</button>
      </div>
      {estoque.length === 0 ? <div className="vazio"><p>Nenhuma peça cadastrada.</p></div> :
        <div className="clientes-tabela">
          <div className="tabela-header"><span>Peça / Código</span><span>Qtd</span><span>Mínimo</span><span>Preço unit.</span><span>Total</span><span></span></div>
          {estoque.map(p => (
            <div key={p.id} className={`tabela-row ${p.quantidade <= p.minimo ? "alerta-row" : ""}`}>
              <span><strong>{p.nome}</strong>{p.codigo && <small> · {p.codigo}</small>}</span>
              <span className={p.quantidade <= p.minimo ? "qtd-alerta" : ""}>{p.quantidade}</span>
              <span>{p.minimo}</span>
              <span>{formatarMoeda(p.preco)}</span>
              <span style={{color:"var(--verde)", fontWeight:600}}>{formatarMoeda((p.preco || 0) * (p.quantidade || 0))}</span>
              <div className="tabela-acoes">
                <button className="btn-icon" onClick={() => setModal(p)}>✏️</button>
                <button className="btn-icon" onClick={() => excluir(p.id)}>🗑️</button>
              </div>
            </div>
          ))}
          <div className="tabela-row" style={{borderTop:"2px solid var(--borda)", fontWeight:700}}>
            <span>Total em estoque</span><span></span><span></span><span></span>
            <span style={{color:"var(--verde)"}}>{formatarMoeda(estoque.reduce((a, p) => a + ((p.preco || 0) * (p.quantidade || 0)), 0))}</span>
            <span></span>
          </div>
        </div>
      }
      {modal && <ModalEstoque dados={modal} onSalvar={salvar} onFechar={() => setModal(null)} />}
    </div>
  );
}

function ModalEstoque({ dados, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    nome: dados?.nome || "", codigo: dados?.codigo || "",
    quantidade: dados?.quantidade ?? "", minimo: dados?.minimo ?? 5,
    preco: dados?.preco ?? "", id: dados?.id || null,
  });
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>{dados?.id ? "Editar peça" : "Nova peça"}</h3><button className="modal-close" onClick={onFechar}>✕</button></div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="span2">Nome da peça<input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Filtro de óleo" /></label>
            <label>Código / Ref.<input value={form.codigo} onChange={e => set("codigo", e.target.value)} placeholder="FO-001" /></label>
            <label>Preço unit. (R$)<input type="number" value={form.preco} onChange={e => set("preco", Number(e.target.value))} /></label>
            <label>Quantidade<input type="number" value={form.quantidade} onChange={e => set("quantidade", Number(e.target.value))} /></label>
            <label>Mínimo<input type="number" value={form.minimo} onChange={e => set("minimo", Number(e.target.value))} /></label>
          </div>
        </div>
        <div className="modal-footer"><button className="btn-secondary" onClick={onFechar}>Cancelar</button><button className="btn-primary" onClick={() => onSalvar(form)}>Salvar</button></div>
      </div>
    </div>
  );
}


