import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import Logo from "./Logo";

export default function Login({ onVoltar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch {
      setErro("E-mail ou senha incorretos.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-overlay">
      <div className="login-card">
        <button className="btn-voltar" onClick={onVoltar}>← Voltar ao portal</button>
        <div className="login-logo-wrap">
          <Logo size={200} />
        </div>
        <p className="login-sub">Acesso exclusivo para a equipe</p>
        <form onSubmit={handleLogin} className="login-form">
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="exemplo@exemplo.com"
              required
              autoFocus
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          {erro && <p className="login-erro">{erro}</p>}
          <button type="submit" className="btn-primary" disabled={carregando}>
            {carregando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
