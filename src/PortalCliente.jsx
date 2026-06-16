import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { SERVICOS, HORARIOS, formatarPlaca, nomeServico } from "./comum.js";

const PASSOS = ["Veículo", "Serviço", "Data e hora"];

export default function PortalCliente() {
  const [passo, setPasso] = useState(0);
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [servico, setServico] = useState("");
  const [obs, setObs] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");

  function handlePlaca(e) {
    setPlaca(formatarPlaca(e.target.value));
  }

  function handleTelefone(e) {
    const v = e.target.value.replace(/\D/g, "").slice(0, 11);
    let fmt = v;
    if (v.length > 2) fmt = "(" + v.slice(0, 2) + ") " + v.slice(2);
    if (v.length > 7) fmt = "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7);
    setTelefone(fmt);
  }

  function podeAvancar() {
    if (passo === 0) return nome && telefone && placa && modelo;
    if (passo === 1) return servico;
    if (passo === 2) return data && hora;
    return false;
  }

  async function enviar() {
    setCarregando(true);
    try {
      await addDoc(collection(db, "agendamentos"), {
        nome, telefone, placa, modelo,
        servico, obs, data, hora,
        status: "pendente",
        criadoEm: serverTimestamp(),
      });
      setEnviado(true);
    } catch (err) {
      alert("Erro ao enviar. Tente novamente.");
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  function reiniciar() {
    setNome(""); setTelefone(""); setPlaca(""); setModelo("");
    setServico(""); setObs(""); setData(""); setHora("");
    setPasso(0); setEnviado(false);
  }

  if (enviado) {
    return (
      <div className="portal-confirmacao">
        <div className="confirmacao-card">
          <div className="confirmacao-icon">✓</div>
          <h2>Agendamento enviado!</h2>
          <p>Entraremos em contato pelo número <strong>{telefone}</strong> para confirmar.</p>
          <div className="confirmacao-resumo">
            <div><span>Serviço</span><strong>{nomeServico(servico)}</strong></div>
            <div><span>Data</span><strong>{new Date(data + "T12:00").toLocaleDateString("pt-BR")}</strong></div>
            <div><span>Hora</span><strong>{hora}</strong></div>
            <div><span>Placa</span><strong>{placa}</strong></div>
          </div>
          <button className="btn-primary" onClick={reiniciar}>Fazer outro agendamento</button>
        </div>
      </div>
    );
  }

  // Datas disponíveis: próximos 30 dias exceto domingos
  const hoje = new Date();
  const dataMin = new Date(hoje);
  dataMin.setDate(hoje.getDate() + 1);
  const dataMax = new Date(hoje);
  dataMax.setDate(hoje.getDate() + 30);
  const dataMinStr = dataMin.toISOString().split("T")[0];
  const dataMaxStr = dataMax.toISOString().split("T")[0];

  return (
    <div className="portal">
      <div className="portal-hero">
        <h1>Agende seu serviço</h1>
        <p>Rápido, fácil — sem precisar ligar.</p>
      </div>

      <div className="portal-card">
        {/* Stepper */}
        <div className="stepper">
          {PASSOS.map((p, i) => (
            <div key={i} className={`step ${i === passo ? "ativo" : ""} ${i < passo ? "concluido" : ""}`}>
              <div className="step-num">{i < passo ? "✓" : i + 1}</div>
              <span>{p}</span>
            </div>
          ))}
        </div>

        {/* Passo 0: Veículo */}
        {passo === 0 && (
          <div className="form-passo">
            <h3>Seus dados e veículo</h3>
            <div className="form-grid">
              <label className="span2">
                Nome completo
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="João Silva" />
              </label>
              <label>
                Telefone / WhatsApp
                <input value={telefone} onChange={handleTelefone} placeholder="(11) 99999-9999" />
              </label>
              <label>
                Placa do veículo
                <input value={placa} onChange={handlePlaca} placeholder="ABC-1234" maxLength={8} />
              </label>
              <label className="span2">
                Modelo do veículo
                <input value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Ex: Fiat Uno 2018" />
              </label>
            </div>
          </div>
        )}

        {/* Passo 1: Serviço */}
        {passo === 1 && (
          <div className="form-passo">
            <h3>Qual serviço você precisa?</h3>
            <div className="servicos-grid">
              {SERVICOS.map(s => (
                <button
                  key={s.id}
                  className={`servico-card ${servico === s.id ? "selecionado" : ""}`}
                  onClick={() => setServico(s.id)}
                >
                  <span className="servico-nome">{s.nome}</span>
                  <span className="servico-preco">
                    {s.preco > 0 ? `a partir de R$ ${s.preco}` : "Sob consulta"}
                  </span>
                </button>
              ))}
            </div>
            <label className="obs-label">
              Observações (opcional)
              <textarea
                value={obs}
                onChange={e => setObs(e.target.value)}
                placeholder="Descreva o problema ou detalhe o que está sentindo no veículo…"
                rows={3}
              />
            </label>
          </div>
        )}

        {/* Passo 2: Data e hora */}
        {passo === 2 && (
          <div className="form-passo">
            <h3>Quando você prefere?</h3>
            <label>
              Data
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                min={dataMinStr}
                max={dataMaxStr}
              />
            </label>
            <div className="horarios-grid">
              {HORARIOS.map(h => (
                <button
                  key={h}
                  className={`horario-btn ${hora === h ? "selecionado" : ""}`}
                  onClick={() => setHora(h)}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="resumo-agendamento">
              <h4>Resumo</h4>
              <p><span>Nome</span> {nome}</p>
              <p><span>Placa</span> {placa} — {modelo}</p>
              <p><span>Serviço</span> {nomeServico(servico)}</p>
              {data && <p><span>Data</span> {new Date(data + "T12:00").toLocaleDateString("pt-BR")}</p>}
              {hora && <p><span>Hora</span> {hora}</p>}
            </div>
          </div>
        )}

        {/* Navegação */}
        <div className="form-nav">
          {passo > 0 && (
            <button className="btn-secondary" onClick={() => setPasso(p => p - 1)}>
              ← Voltar
            </button>
          )}
          {passo < 2 ? (
            <button
              className="btn-primary"
              onClick={() => setPasso(p => p + 1)}
              disabled={!podeAvancar()}
            >
              Continuar →
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={enviar}
              disabled={!podeAvancar() || carregando}
            >
              {carregando ? "Enviando…" : "Confirmar agendamento"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
