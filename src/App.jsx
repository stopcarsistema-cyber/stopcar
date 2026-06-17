import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./Login";
import PainelOficina from "./PainelOficina";
import { LogoIcone } from "./Logo";

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setLoadingAuth(false);
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

  return <Login />;
}
