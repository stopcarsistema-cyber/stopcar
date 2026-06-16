// Logo STOPCAR — SVG vetorial baseado no cartão da oficina
export default function Logo({ size = 140, className = "" }) {
  return (
    <svg
      width={size}
      height={size * 0.38}
      viewBox="0 0 360 136"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="STOPCAR Oficina Mecânica"
    >
      {/* Silhueta do carro — branca, estilo esportivo */}
      <g stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Corpo principal */}
        <path d="M42 74 C52 74 62 58 90 52 C110 47 140 44 175 44 C205 44 228 47 248 54 C262 59 275 68 285 74 L295 74 C300 74 304 70 304 65 L300 60 C288 52 268 44 240 38 C215 33 190 31 165 32 C135 33 108 38 84 48 C64 56 50 66 42 74 Z" />
        {/* Teto e janelas */}
        <path d="M95 52 C108 38 128 30 158 28 C185 26 210 28 228 36 C242 42 252 50 258 58" />
        <path d="M130 50 L145 32" />
        <path d="M185 46 L192 29" />
        {/* Rodas */}
        <circle cx="95" cy="78" r="13" strokeWidth="2.5"/>
        <circle cx="95" cy="78" r="5"/>
        <circle cx="258" cy="78" r="13" strokeWidth="2.5"/>
        <circle cx="258" cy="78" r="5"/>
        {/* Chão / para-choques */}
        <path d="M35 74 L42 74 M285 74 L308 74" strokeWidth="2"/>
        <path d="M38 77 Q170 82 310 77" strokeWidth="1.5" opacity="0.5"/>
        {/* Detalhe frente */}
        <path d="M300 60 L312 63 L314 70 L308 74" strokeWidth="1.8"/>
        {/* Detalhe traseira */}
        <path d="M38 70 L32 66 L30 72 L35 74" strokeWidth="1.8"/>
        {/* Velocidade / rastro */}
        <path d="M18 58 L38 58" strokeWidth="1.5" opacity="0.7"/>
        <path d="M10 65 L32 65" strokeWidth="1.5" opacity="0.5"/>
        <path d="M20 72 L38 72" strokeWidth="1.2" opacity="0.3"/>
        {/* Cauda traseira */}
        <path d="M290 48 C298 50 308 56 314 62" strokeWidth="1.8"/>
        <path d="M295 43 C305 46 316 53 320 60" strokeWidth="1.2" opacity="0.5"/>
      </g>

      {/* STOPCAR — texto em vermelho forte, bold */}
      <text
        x="50%"
        y="108"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontWeight="900"
        fontSize="46"
        letterSpacing="4"
        fill="url(#redGrad)"
      >
        STOPCAR
      </text>

      {/* Linha decorativa sob STOPCAR */}
      <line x1="68" y1="113" x2="292" y2="113" stroke="white" strokeWidth="1.2" opacity="0.6"/>

      {/* Oficina Mecânica — subtítulo branco */}
      <text
        x="50%"
        y="131"
        textAnchor="middle"
        fontFamily="'Arial', sans-serif"
        fontWeight="600"
        fontSize="16"
        letterSpacing="3"
        fill="white"
        opacity="0.9"
      >
        OFICINA MECÂNICA
      </text>

      {/* Gradiente vermelho */}
      <defs>
        <linearGradient id="redGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF2020"/>
          <stop offset="100%" stopColor="#CC0000"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// Versão compacta para header/favicon
export function LogoIcone({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="STOPCAR"
    >
      <rect width="100" height="100" rx="16" fill="#111"/>
      {/* Silhueta mini */}
      <g stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 54 C18 54 24 44 38 40 C48 37 60 36 70 37 C78 38 84 42 88 48 L90 54 L88 54"/>
        <path d="M30 40 C35 33 44 30 58 30 C68 30 75 33 80 38"/>
        <path d="M46 39 L49 31"/>
        <path d="M64 37 L66 30"/>
        <circle cx="30" cy="58" r="8" strokeWidth="2.2"/>
        <circle cx="30" cy="58" r="3"/>
        <circle cx="76" cy="58" r="8" strokeWidth="2.2"/>
        <circle cx="76" cy="58" r="3"/>
        <path d="M8 48 L14 48" strokeWidth="1.5"/>
        <path d="M6 54 L12 54" strokeWidth="1.5"/>
      </g>
      {/* SC abreviado */}
      <text x="50" y="82" textAnchor="middle" fontFamily="'Arial Black', sans-serif" fontWeight="900" fontSize="14" letterSpacing="1" fill="#CC0000">STOP</text>
    </svg>
  );
}
