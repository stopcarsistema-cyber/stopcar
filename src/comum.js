// ─── Serviços oferecidos ───────────────────────────────────────────────────
export const SERVICOS = [
  { id: "revisao",      nome: "Revisão completa",        preco: 280 },
  { id: "oleo",         nome: "Troca de óleo + filtro",  preco: 120 },
  { id: "freios",       nome: "Manutenção de freios",    preco: 350 },
  { id: "suspensao",    nome: "Suspensão e amortecedores",preco: 480 },
  { id: "alinhamento",  nome: "Alinhamento e balanceamento", preco: 150 },
  { id: "correia",      nome: "Troca de correia dentada", preco: 420 },
  { id: "ar",           nome: "Ar-condicionado",          preco: 200 },
  { id: "eletrica",     nome: "Elétrica geral",           preco: 160 },
  { id: "diagnostico",  nome: "Diagnóstico eletrônico",   preco: 90  },
];

// ─── Horários disponíveis ──────────────────────────────────────────────────
export const HORARIOS = [
  "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

// ─── Status das OS ─────────────────────────────────────────────────────────
export const STATUS_OS = {
  aguardando:   { label: "Aguardando",    cor: "#F59E0B" },
  em_andamento: { label: "Em andamento",  cor: "#3B82F6" },
  concluido:    { label: "Concluído",     cor: "#10B981" },
  entregue:     { label: "Entregue",      cor: "#6B7280" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────
export function formatarPlaca(raw) {
  const v = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (v.length <= 3) return v;
  return v.slice(0, 3) + "-" + v.slice(3, 7);
}

export function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

export function formatarData(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export function formatarDataHora(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function nomeServico(id) {
  return SERVICOS.find(s => s.id === id)?.nome || id;
}

export function precoServico(id) {
  return SERVICOS.find(s => s.id === id)?.preco || 0;
}
