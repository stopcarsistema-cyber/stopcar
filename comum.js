// ─── Serviços oferecidos ───────────────────────────────────────────────────
export const SERVICOS = [
  { id: "revisao",      nome: "Revisão completa",           preco: 280 },
  { id: "oleo",         nome: "Troca de óleo + filtro",     preco: 120 },
  { id: "freios",       nome: "Manutenção de freios",       preco: 350 },
  { id: "suspensao",    nome: "Suspensão e amortecedores",  preco: 480 },
  { id: "alinhamento",  nome: "Alinhamento e balanceamento",preco: 150 },
  { id: "correia",      nome: "Troca de correia dentada",   preco: 420 },
  { id: "ar",           nome: "Ar-condicionado",            preco: 200 },
  { id: "eletrica",     nome: "Elétrica geral",             preco: 160 },
  { id: "diagnostico",  nome: "Diagnóstico eletrônico",     preco: 90  },
  { id: "pneus",        nome: "Troca de pneus",             preco: 180 },
  { id: "bateria",      nome: "Troca de bateria",           preco: 250 },
  { id: "embreagem",    nome: "Embreagem",                  preco: 600 },
  { id: "injecao",      nome: "Injeção eletrônica",         preco: 220 },
  { id: "escapamento",  nome: "Escapamento",                preco: 300 },
  { id: "outros",       nome: "Outros serviços",            preco: 0   },
];

// ─── Checklist de inspeção ─────────────────────────────────────────────────
export const CHECKLIST_ITENS = [
  { id: "oleo_motor",    label: "Óleo do motor" },
  { id: "oleo_cambio",   label: "Óleo do câmbio" },
  { id: "fluido_freio",  label: "Fluido de freio" },
  { id: "fluido_direcao",label: "Fluido da direção" },
  { id: "agua_radiador", label: "Água do radiador" },
  { id: "bateria",       label: "Bateria" },
  { id: "pneus",         label: "Pneus (calibragem/desgaste)" },
  { id: "freios_diant",  label: "Freios dianteiros" },
  { id: "freios_tras",   label: "Freios traseiros" },
  { id: "correia",       label: "Correia dentada" },
  { id: "suspensao",     label: "Suspensão" },
  { id: "escapamento",   label: "Escapamento" },
  { id: "farois",        label: "Faróis e lanternas" },
  { id: "limpador",      label: "Limpador de para-brisa" },
  { id: "ar_cond",       label: "Ar-condicionado" },
];

// ─── Status das OS ─────────────────────────────────────────────────────────
export const STATUS_OS = {
  orcamento:    { label: "Orçamento",    cor: "#8B5CF6" },
  aguardando:   { label: "Aguardando",   cor: "#F59E0B" },
  em_andamento: { label: "Em andamento", cor: "#3B82F6" },
  concluido:    { label: "Concluído",    cor: "#10B981" },
  entregue:     { label: "Entregue",     cor: "#6B7280" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────
export function formatarPlaca(raw) {
  const v = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (v.length <= 3) return v;
  return v.slice(0, 3) + "-" + v.slice(3, 7);
}

export function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0);
}

export function formatarData(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatarDataHora(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function nomeServico(id) {
  return SERVICOS.find(s => s.id === id)?.nome || id;
}

export function precoServico(id) {
  return SERVICOS.find(s => s.id === id)?.preco || 0;
}

export function enviarWhatsApp(telefone, mensagem) {
  const num = telefone.replace(/\D/g, "");
  const url = `https://wa.me/55${num}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
}

// Mantidos para compatibilidade

// Mantidos para compatibilidade com PortalCliente
export const HORARIOS = [
  "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];
