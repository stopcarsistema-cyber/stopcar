import { useEffect, useState } from "react";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function Dashboard() {
  const [stats, setStats] = useState({
    osHoje: 0,
    emAndamento: 0,
    aguardando: 0,
    faturamentoHoje: 0,
    faturamentoMes: 0,
    despesasMes: 0,
    lucroMes: 0,
    osMes: 0,
  });
  const [topServicos, setTopServicos] = useState([]);
  const [naOficina, setNaOficina] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const agora = new Date();
      const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

      const ordensRef = collection(db, "ordens");

      const [todasSnap, hojeSnap, mesSnap] = await Promise.all([
        getDocs(ordensRef),
        getDocs(query(ordensRef, where("criadoEm", ">=", Timestamp.fromDate(inicioDia)))),
        getDocs(query(ordensRef, where("criadoEm", ">=", Timestamp.fromDate(inicioMes)))),
      ]);

      let emAndamento = 0, aguardando = 0;
      let faturamentoHoje = 0, faturamentoMes = 0, despesasMes = 0;
      const servicoCount = {};
      const oficina = [];

      todasSnap.forEach((doc) => {
        const d = doc.data();
        if (d.status === "em_andamento") { emAndamento++; oficina.push(d); }
        if (d.status === "aguardando") aguardando++;
      });

      hojeSnap.forEach((doc) => {
        const d = doc.data();
        if (d.status === "concluida") faturamentoHoje += d.total || 0;
      });

      mesSnap.forEach((doc) => {
        const d = doc.data();
        if (d.status === "concluida") faturamentoMes += d.total || 0;
        despesasMes += d.despesas || 0;
        (d.servicos || []).forEach((s) => {
          servicoCount[s.nome] = (servicoCount[s.nome] || 0) + 1;
        });
      });

      const top = Object.entries(servicoCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nome, count]) => ({ nome, count }));

      setStats({
        osHoje: hojeSnap.size,
        emAndamento,
        aguardando,
        faturamentoHoje,
        faturamentoMes,
        despesasMes,
        lucroMes: faturamentoMes - despesasMes,
        osMes: mesSnap.size,
      });
      setTopServicos(top);
      setNaOficina(oficina.slice(0, 5));
    }

    fetchData();
  }, []);

  const fmt = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div style={styles.page}>
      {/* Header da seção */}
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <span style={styles.subtitle}>Visão geral da oficina</span>
      </div>

      {/* Cards principais */}
      <div style={styles.grid}>
        <StatCard label="OS Hoje" value={stats.osHoje} icon="📋" color="#e53e3e" />
        <StatCard label="Em Andamento" value={stats.emAndamento} icon="🔧" color="#ed8936" />
        <StatCard label="Aguardando" value={stats.aguardando} icon="⏳" color="#ecc94b" />
        <StatCard label="OS no Mês" value={stats.osMes} icon="📅" color="#48bb78" />
      </div>

      {/* Cards financeiros */}
      <div style={styles.grid}>
        <StatCard label="Faturamento Hoje" value={fmt(stats.faturamentoHoje)} icon="💰" color="#48bb78" />
        <StatCard label="Faturamento do Mês" value={fmt(stats.faturamentoMes)} icon="📈" color="#38b2ac" />
        <StatCard label="Despesas do Mês" value={fmt(stats.despesasMes)} icon="📉" color="#e53e3e" />
        <StatCard
          label="Lucro do Mês"
          value={fmt(stats.lucroMes)}
          icon="🏆"
          color={stats.lucroMes >= 0 ? "#48bb78" : "#e53e3e"}
        />
      </div>

      {/* Seção inferior */}
      <div style={styles.bottom}>
        {/* Top Serviços */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🏅 Top Serviços</h2>
          {topServicos.length === 0 ? (
            <p style={styles.empty}>Nenhum serviço registrado este mês.</p>
          ) : (
            <ul style={styles.list}>
              {topServicos.map((s, i) => (
                <li key={i} style={styles.listItem}>
                  <span style={styles.listRank}>#{i + 1}</span>
                  <span style={styles.listName}>{s.nome}</span>
                  <span style={styles.listBadge}>{s.count}x</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Na oficina agora */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🚗 Na Oficina Agora</h2>
          {naOficina.length === 0 ? (
            <p style={styles.empty}>Nenhum carro em andamento.</p>
          ) : (
            <ul style={styles.list}>
              {naOficina.map((o, i) => (
                <li key={i} style={styles.listItem}>
                  <div>
                    <div style={styles.carName}>{o.veiculo || "Veículo"}</div>
                    <div style={styles.carSub}>{o.placa || ""} · {o.cliente || ""}</div>
                  </div>
                  <span style={{ ...styles.listBadge, background: "#ed8936" }}>Em andamento</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.iconBox, background: color + "20", color }}>
        {icon}
      </div>
      <div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>
      <div style={{ ...styles.accent, background: color }} />
    </div>
  );
}

const styles = {
  page: {
    padding: "32px 24px",
    maxWidth: 1200,
    margin: "0 auto",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  header: {
    marginBottom: 28,
    borderBottom: "1px solid #2a2a2a",
    paddingBottom: 16,
    display: "flex",
    alignItems: "baseline",
    gap: 12,
  },
  title: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: 700,
    margin: 0,
  },
  subtitle: {
    color: "#888",
    fontSize: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: "20px 20px 20px 20px",
    display: "flex",
    alignItems: "center",
    gap: 16,
    position: "relative",
    overflow: "hidden",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    flexShrink: 0,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  statLabel: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  accent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: "0 0 12px 12px",
  },
  bottom: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 16,
    marginTop: 8,
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: 24,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 600,
    margin: "0 0 16px 0",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    background: "#111",
    borderRadius: 8,
    border: "1px solid #222",
  },
  listRank: {
    color: "#e53e3e",
    fontWeight: 700,
    fontSize: 13,
    width: 28,
  },
  listName: {
    color: "#ddd",
    fontSize: 14,
    flex: 1,
  },
  listBadge: {
    background: "#e53e3e",
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    padding: "2px 10px",
    borderRadius: 20,
  },
  carName: {
    color: "#ddd",
    fontSize: 14,
    fontWeight: 600,
  },
  carSub: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    color: "#555",
    fontSize: 14,
    fontStyle: "italic",
  },
};
