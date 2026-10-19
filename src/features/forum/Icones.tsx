/** Ícones de traço do fórum: `currentColor`, 24px, decorativos (`aria-hidden`). */

interface Props {
  readonly tamanho?: number;
  readonly traco?: number;
}

function Svg({ d, tamanho = 24, traco = 1.8 }: Props & { d: string }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={traco}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}

export const IconeComunidades = (p: Props) => (
  <Svg d="M16 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a6 6 0 0112 0v1M17 14a5 5 0 015 5v2" {...p} />
);
export const IconeExplorar = (p: Props) => <Svg d="M12 22a10 10 0 100-20 10 10 0 000 20zM16 8l-2 6-6 2 2-6z" {...p} />;
export const IconeArena = (p: Props) => <Svg d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3zM5 11a7 7 0 0014 0M12 18v3" {...p} />;
export const IconePerfil = (p: Props) => <Svg d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" {...p} />;
export const IconeVoltar = (p: Props) => <Svg d="M19 12H5M12 19l-7-7 7-7" {...p} />;
export const IconeFixado = (p: Props) => <Svg d="M9 4h6l-1 6 3 3H7l3-3zM12 13v8" tamanho={14} {...p} />;
export const IconeFechado = (p: Props) => <Svg d="M6 11h12v9H6zM8 11V8a4 4 0 018 0v3" tamanho={14} {...p} />;
export const IconeTema = (p: Props) => (
  <Svg d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 17a5 5 0 100-10 5 5 0 000 10z" {...p} />
);
export const IconeMaisOpcoes = (p: Props) => <Svg d="M5 12h.01M12 12h.01M19 12h.01" traco={3} {...p} />;
