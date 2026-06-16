import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./Login";
import PortalCliente from "./PortalCliente";
import PainelOficina from "./PainelOficina";
import Logo, { LogoIcone } from "./Logo";

export default function App() {
  const [tela, setTela] = useState("portal");
  const [usuario, setUsuario] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setLoadingAuth(false);
      if (user) setTela("painel");
    });
    return unsub;
  }, []);

  if (loadingAuth) {
    return (
      <div className="splash">
        <LogoIcone size={72} />
      </div>
    );
  }

  if (usuario) return <PainelOficina usuario={usuario} />;

  if (tela === "login") return <Login onVoltar={() => setTela("portal")} />;

  return (
    <>
      <header className="site-header">
        <div className="site-logo">
          <Logo size={160} />
        </div>
        <button className="btn-area-oficina" onClick={() => setTela("login")}>
          Área da Oficina →
        </button>
      </header>
      <PortalCliente />
    </>
  );
}
