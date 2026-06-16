import { useState, useEffect } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, doc, deleteDoc, serverTimestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "./firebase";
import {
  STATUS_OS, SERVICOS, formatarMoeda, formatarData,
  formatarDataHora, nomeServico, precoServico,
} from "./comum.js";
import { LogoIcone } from "./Logo";

const ABAS = ["Ordens de Serviço", "Agenda", "Clientes", "Estoque"];

export default function PainelOficina({ usuario }) {
  const [aba, setAba] = useState(0);
  const [ordens, setOrdens] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [estoque, setEstoque] = useState([]);

  // Listeners em tempo real
  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, "ordens"), orderBy("criadoEm", "desc")), snap => {
        setOrdens(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(query(collection(db, "agendamentos"), orderBy("criadoEm", "desc")), snap => {
        setAgendamentos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(query(collection(db, "clientes"), orderBy("nome")), snap => {
        setClientes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
      onSnapshot(query(collection(db, "estoque"), orderBy("nome")), snap => {
        setEstoque(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  return (
    <div className="painel">
      <header className="painel-header">
        <div className="painel-logo">
          <LogoIcone size={38} />
          <span className="painel-logo-text">STOPCAR</span>
        </div>
        <nav className="painel-nav">
          {ABAS.map((a, i) => (
            <button
              key={i}
              className={`nav-tab ${aba === i ? "ativo" : ""}`}
              onClick={() => setAba(i)}
            >
              {a}
              {i === 1 && agendamentos.filter(a => a.status === "pendente").length > 0 && (
                <span className="badge">{agendamentos.filter(a => a.status === "pendente").length}</span>
              )}
            </button>
          ))}
        </nav>
        <button className="btn-sair" onClick={() => signOut(auth)}>
          Sair
        </button>
      </header>

      <main className="painel-main">
        {aba === 0 && <AbaOS ordens={ordens} clientes={clientes} />}
        {aba === 1 && <AbaAgenda agendamentos={agendamentos} />}
        {aba === 2 && <AbaClientes clientes={clientes} />}
        {aba === 3 && <AbaEstoque estoque={estoque} />}
      </main>
    </div>
  );
}

// ─── Aba: Ordens de Serviço ────────────────────────────────────────────────
function AbaOS({ ordens, clientes }) {
  const [modal, setModal] = useState(null); // null | "nova" | {id,...}
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const ordensFiltradas = filtroStatus === "todos"
    ? ordens
    : ordens.filter(o => o.status === filtroStatus);

  // Totais por status (kanban summary)
  const contagem = Object.keys(STATUS_OS).reduce((acc, k) => {
    acc[k] = ordens.filter(o => o.status === k).length;
    return acc;
  }, {});

  async function salvarOS(dados) {
    if (dados.id) {
      await updateDoc(doc(db, "ordens", dados.id), { ...dados, atualizadoEm: serverTimestamp() });
    } else {
      await addDoc(collection(db, "ordens"), { ...dados, criadoEm: serverTimestamp() });
    }
    setModal(null);
  }

  async function excluirOS(id) {
    if (!confirm("Excluir esta OS?")) return;
    await deleteDoc(doc(db, "ordens", id));
  }

  async function mudarStatus(id, novoStatus) {
    await updateDoc(doc(db, "ordens", id), { status: novoStatus, atualizadoEm: serverTimestamp() });
  }

  return (
    <div className="aba-content">
      {/* Sumário kanban */}
      <div className="kanban-summary">
        {Object.entries(STATUS_OS).map(([k, v]) => (
          <button
            key={k}
            className={`kanban-pill ${filtroStatus === k ? "ativo" : ""}`}
            style={{ "--cor": v.cor }}
            onClick={() => setFiltroStatus(filtroStatus === k ? "todos" : k)}
          >
            <span className="kanban-count">{contagem[k]}</span>
            <span>{v.label}</span>
          </button>
        ))}
        <button
          className={`kanban-pill ${filtroStatus === "todos" ? "ativo" : ""}`}
          style={{ "--cor": "#6B7280" }}
          onClick={() => setFiltroStatus("todos")}
        >
          <span className="kanban-count">{ordens.length}</span>
          <span>Todas</span>
        </button>
      </div>

      <div className="aba-header-row">
        <h2>Ordens de Serviço</h2>
        <button className="btn-primary btn-sm" onClick={() => setModal("nova")}>+ Nova OS</button>
      </div>

      {ordensFiltradas.length === 0 ? (
        <div className="vazio">
          <p>Nenhuma OS encontrada.</p>
        </div>
      ) : (
        <div className="os-lista">
          {ordensFiltradas.map(os => (
            <div key={os.id} className="os-card">
              <div className="os-card-top">
                <div>
                  <span className="os-placa">{os.placa}</span>
                  <span className="os-modelo">{os.modelo}</span>
                </div>
                <span
                  className="os-status-badge"
                  style={{ background: STATUS_OS[os.status]?.cor + "22", color: STATUS_OS[os.status]?.cor }}
                >
                  {STATUS_OS[os.status]?.label}
                </span>
              </div>
              <p className="os-cliente">{os.cliente} · {os.telefone}</p>
              <p className="os-servico">{nomeServico(os.servico)}</p>
              {os.obs && <p className="os-obs">{os.obs}</p>}
              <div className="os-card-bottom">
                <span className="os-valor">{formatarMoeda(os.valor)}</span>
                <span className="os-data">{formatarData(os.criadoEm)}</span>
              </div>
              <div className="os-acoes">
                <select
                  value={os.status}
                  onChange={e => mudarStatus(os.id, e.target.value)}
                  className="select-status"
                >
                  {Object.entries(STATUS_OS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <button className="btn-icon" onClick={() => setModal(os)}>✏️</button>
                <button className="btn-icon" onClick={() => excluirOS(os.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ModalOS
          dados={modal === "nova" ? null : modal}
          clientes={clientes}
          onSalvar={salvarOS}
          onFechar={() => setModal(null)}
        />
      )}
    </div>
  );
}

function ModalOS({ dados, clientes, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    cliente: dados?.cliente || "",
    telefone: dados?.telefone || "",
    placa: dados?.placa || "",
    modelo: dados?.modelo || "",
    servico: dados?.servico || "",
    obs: dados?.obs || "",
    valor: dados?.valor || "",
    status: dados?.status || "aguardando",
    id: dados?.id || null,
  });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{dados ? "Editar OS" : "Nova OS"}</h3>
          <button className="modal-close" onClick={onFechar}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label>
              Cliente
              <input value={form.cliente} onChange={e => set("cliente", e.target.value)} placeholder="Nome do cliente" />
            </label>
            <label>
              Telefone
              <input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-9999" />
            </label>
            <label>
              Placa
              <input value={form.placa} onChange={e => set("placa", e.target.value.toUpperCase())} placeholder="ABC-1234" />
            </label>
            <label>
              Modelo
              <input value={form.modelo} onChange={e => set("modelo", e.target.value)} placeholder="Fiat Uno 2018" />
            </label>
            <label>
              Serviço
              <select value={form.servico} onChange={e => {
                set("servico", e.target.value);
                if (!form.valor) set("valor", precoServico(e.target.value));
              }}>
                <option value="">Selecione…</option>
                {SERVICOS.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </label>
            <label>
              Valor (R$)
              <input type="number" value={form.valor} onChange={e => set("valor", Number(e.target.value))} placeholder="0" />
            </label>
            <label>
              Status
              <select value={form.status} onChange={e => set("status", e.target.value)}>
                {Object.entries(STATUS_OS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </label>
            <label className="span2">
              Observações
              <textarea value={form.obs} onChange={e => set("obs", e.target.value)} rows={2} placeholder="Detalhes do serviço…" />
            </label>
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

// ─── Aba: Agenda ──────────────────────────────────────────────────────────
function AbaAgenda({ agendamentos }) {
  async function confirmarComoOS(ag) {
    // Cria a OS
    await addDoc(collection(db, "ordens"), {
      cliente: ag.nome,
      telefone: ag.telefone,
      placa: ag.placa,
      modelo: ag.modelo,
      servico: ag.servico,
      obs: ag.obs || "",
      valor: precoServico(ag.servico),
      status: "aguardando",
      criadoEm: serverTimestamp(),
    });
    // Marca agendamento como confirmado
    await updateDoc(doc(db, "agendamentos", ag.id), { status: "confirmado" });
  }

  async function recusarAgendamento(id) {
    if (!confirm("Recusar este agendamento?")) return;
    await updateDoc(doc(db, "agendamentos", id), { status: "recusado" });
  }

  const pendentes = agendamentos.filter(a => a.status === "pendente");
  const outros = agendamentos.filter(a => a.status !== "pendente");

  return (
    <div className="aba-content">
      <h2>Agenda de Solicitações</h2>

      {pendentes.length > 0 && (
        <>
          <h3 className="secao-titulo">🔔 Novos pedidos ({pendentes.length})</h3>
          <div className="agenda-lista">
            {pendentes.map(ag => (
              <div key={ag.id} className="agenda-card pendente">
                <div className="agenda-info">
                  <strong>{ag.nome}</strong>
                  <span>{ag.telefone}</span>
                  <span className="agenda-placa">{ag.placa} · {ag.modelo}</span>
                  <span>{nomeServico(ag.servico)}</span>
                  <span className="agenda-datetime">
                    {ag.data ? new Date(ag.data + "T12:00").toLocaleDateString("pt-BR") : ""} às {ag.hora}
                  </span>
                  {ag.obs && <span className="agenda-obs">{ag.obs}</span>}
                </div>
                <div className="agenda-acoes">
                  <button className="btn-primary btn-sm" onClick={() => confirmarComoOS(ag)}>
                    ✓ Confirmar → OS
                  </button>
                  <button className="btn-danger btn-sm" onClick={() => recusarAgendamento(ag.id)}>
                    ✕ Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pendentes.length === 0 && (
        <div className="vazio">
          <p>Nenhum agendamento pendente. 🎉</p>
        </div>
      )}

      {outros.length > 0 && (
        <>
          <h3 className="secao-titulo">Histórico</h3>
          <div className="agenda-lista">
            {outros.map(ag => (
              <div key={ag.id} className={`agenda-card ${ag.status}`}>
                <div className="agenda-info">
                  <strong>{ag.nome}</strong>
                  <span>{ag.placa} · {ag.modelo}</span>
                  <span>{nomeServico(ag.servico)}</span>
                  <span className="agenda-datetime">
                    {ag.data ? new Date(ag.data + "T12:00").toLocaleDateString("pt-BR") : ""} às {ag.hora}
                  </span>
                </div>
                <span className={`agenda-status-badge ${ag.status}`}>
                  {ag.status === "confirmado" ? "Confirmado" : "Recusado"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Aba: Clientes ────────────────────────────────────────────────────────
function AbaClientes({ clientes }) {
  const [modal, setModal] = useState(null);
  const [busca, setBusca] = useState("");

  const filtrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.placa?.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.includes(busca)
  );

  async function salvar(dados) {
    if (dados.id) {
      await updateDoc(doc(db, "clientes", dados.id), dados);
    } else {
      await addDoc(collection(db, "clientes"), { ...dados, criadoEm: serverTimestamp() });
    }
    setModal(null);
  }

  async function excluir(id) {
    if (!confirm("Excluir este cliente?")) return;
    await deleteDoc(doc(db, "clientes", id));
  }

  return (
    <div className="aba-content">
      <div className="aba-header-row">
        <h2>Clientes</h2>
        <button className="btn-primary btn-sm" onClick={() => setModal({})}>+ Novo cliente</button>
      </div>

      <input
        className="busca-input"
        placeholder="Buscar por nome, placa ou telefone…"
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      {filtrados.length === 0 ? (
        <div className="vazio"><p>Nenhum cliente encontrado.</p></div>
      ) : (
        <div className="clientes-tabela">
          <div className="tabela-header">
            <span>Nome</span><span>Telefone</span><span>Placa / Modelo</span><span>Cadastro</span><span></span>
          </div>
          {filtrados.map(c => (
            <div key={c.id} className="tabela-row">
              <span className="cliente-nome">{c.nome}</span>
              <span>{c.telefone}</span>
              <span>{c.placa} · {c.modelo}</span>
              <span>{formatarData(c.criadoEm)}</span>
              <div className="tabela-acoes">
                <button className="btn-icon" onClick={() => setModal(c)}>✏️</button>
                <button className="btn-icon" onClick={() => excluir(c.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ModalCliente dados={modal} onSalvar={salvar} onFechar={() => setModal(null)} />
      )}
    </div>
  );
}

function ModalCliente({ dados, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    nome: dados?.nome || "",
    telefone: dados?.telefone || "",
    email: dados?.email || "",
    placa: dados?.placa || "",
    modelo: dados?.modelo || "",
    obs: dados?.obs || "",
    id: dados?.id || null,
  });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{dados?.id ? "Editar cliente" : "Novo cliente"}</h3>
          <button className="modal-close" onClick={onFechar}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="span2">
              Nome
              <input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Nome completo" />
            </label>
            <label>
              Telefone
              <input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-9999" />
            </label>
            <label>
              E-mail
              <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@exemplo.com" />
            </label>
            <label>
              Placa
              <input value={form.placa} onChange={e => set("placa", e.target.value.toUpperCase())} placeholder="ABC-1234" />
            </label>
            <label>
              Modelo
              <input value={form.modelo} onChange={e => set("modelo", e.target.value)} placeholder="Fiat Uno 2018" />
            </label>
            <label className="span2">
              Obs
              <textarea value={form.obs} onChange={e => set("obs", e.target.value)} rows={2} placeholder="Anotações…" />
            </label>
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

// ─── Aba: Estoque ─────────────────────────────────────────────────────────
function AbaEstoque({ estoque }) {
  const [modal, setModal] = useState(null);

  const comAlerta = estoque.filter(p => p.quantidade <= p.minimo);

  async function salvar(dados) {
    if (dados.id) {
      await updateDoc(doc(db, "estoque", dados.id), dados);
    } else {
      await addDoc(collection(db, "estoque"), { ...dados, criadoEm: serverTimestamp() });
    }
    setModal(null);
  }

  async function excluir(id) {
    if (!confirm("Excluir este item do estoque?")) return;
    await deleteDoc(doc(db, "estoque", id));
  }

  return (
    <div className="aba-content">
      {comAlerta.length > 0 && (
        <div className="alerta-estoque">
          ⚠️ {comAlerta.length} {comAlerta.length === 1 ? "item abaixo" : "itens abaixo"} do estoque mínimo:{" "}
          {comAlerta.map(p => p.nome).join(", ")}
        </div>
      )}

      <div className="aba-header-row">
        <h2>Estoque</h2>
        <button className="btn-primary btn-sm" onClick={() => setModal({})}>+ Adicionar peça</button>
      </div>

      {estoque.length === 0 ? (
        <div className="vazio"><p>Nenhuma peça cadastrada.</p></div>
      ) : (
        <div className="clientes-tabela">
          <div className="tabela-header">
            <span>Peça / Código</span><span>Quantidade</span><span>Mínimo</span><span>Preço unit.</span><span></span>
          </div>
          {estoque.map(p => (
            <div key={p.id} className={`tabela-row ${p.quantidade <= p.minimo ? "alerta-row" : ""}`}>
              <span>
                <strong>{p.nome}</strong>
                {p.codigo && <small> · {p.codigo}</small>}
              </span>
              <span className={p.quantidade <= p.minimo ? "qtd-alerta" : ""}>{p.quantidade}</span>
              <span>{p.minimo}</span>
              <span>{formatarMoeda(p.preco)}</span>
              <div className="tabela-acoes">
                <button className="btn-icon" onClick={() => setModal(p)}>✏️</button>
                <button className="btn-icon" onClick={() => excluir(p.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ModalEstoque dados={modal} onSalvar={salvar} onFechar={() => setModal(null)} />
      )}
    </div>
  );
}

function ModalEstoque({ dados, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    nome: dados?.nome || "",
    codigo: dados?.codigo || "",
    quantidade: dados?.quantidade ?? "",
    minimo: dados?.minimo ?? 5,
    preco: dados?.preco ?? "",
    id: dados?.id || null,
  });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{dados?.id ? "Editar peça" : "Nova peça"}</h3>
          <button className="modal-close" onClick={onFechar}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <label className="span2">
              Nome da peça
              <input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Filtro de óleo" />
            </label>
            <label>
              Código / Referência
              <input value={form.codigo} onChange={e => set("codigo", e.target.value)} placeholder="FO-001" />
            </label>
            <label>
              Preço unit. (R$)
              <input type="number" value={form.preco} onChange={e => set("preco", Number(e.target.value))} placeholder="0" />
            </label>
            <label>
              Quantidade em estoque
              <input type="number" value={form.quantidade} onChange={e => set("quantidade", Number(e.target.value))} placeholder="0" />
            </label>
            <label>
              Quantidade mínima
              <input type="number" value={form.minimo} onChange={e => set("minimo", Number(e.target.value))} placeholder="5" />
            </label>
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
