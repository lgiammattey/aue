/* @ds-bundle: {"format":4,"namespace":"AuDesignSystem_226135","components":[{"name":"BolhaAue","sourcePath":"components/bolha/BolhaAue.jsx"},{"name":"R","sourcePath":"components/bolha/caminhoDaBolha.js"},{"name":"MODOS","sourcePath":"components/bolha/caminhoDaBolha.js"},{"name":"Botao","sourcePath":"components/botao/Botao.jsx"},{"name":"Cronometro","sourcePath":"components/cronometro/Cronometro.jsx"},{"name":"ContagemDaRevanche","sourcePath":"components/cronometro/Cronometro.jsx"},{"name":"GatilhoDeMicrofone","sourcePath":"components/gatilho/GatilhoDeMicrofone.jsx"},{"name":"Hud","sourcePath":"components/hud/Hud.jsx"},{"name":"Metrica","sourcePath":"components/metrica/Metrica.jsx"},{"name":"ListaDeMetricas","sourcePath":"components/metrica/Metrica.jsx"},{"name":"NotaNaBolha","sourcePath":"components/nota/NotaNaBolha.jsx"},{"name":"EscolhaDeOrigem","sourcePath":"components/origem/EscolhaDeOrigem.jsx"},{"name":"Overlay","sourcePath":"components/overlay/Overlay.jsx"},{"name":"PilulaDeLink","sourcePath":"components/pilulas/PilulaDeLink.jsx"},{"name":"Player","sourcePath":"components/pilulas/Player.jsx"},{"name":"BlocoVersus","sourcePath":"components/placar/BlocoVersus.jsx"},{"name":"LinhaDoPlacar","sourcePath":"components/placar/LinhaDoPlacar.jsx"},{"name":"Podio","sourcePath":"components/podio/Podio.jsx"}],"sourceHashes":{"components/bolha/BolhaAue.jsx":"cc08a5b1d1d3","components/bolha/caminhoDaBolha.js":"a8fd5d644f00","components/botao/Botao.jsx":"13b50ca54eab","components/cronometro/Cronometro.jsx":"c2baf85e625f","components/gatilho/GatilhoDeMicrofone.jsx":"3e44fca57093","components/hud/Hud.jsx":"6e3857e98ddb","components/metrica/Metrica.jsx":"6c28d8d56521","components/nota/NotaNaBolha.jsx":"caed1770ad31","components/origem/EscolhaDeOrigem.jsx":"fa7483ce8ded","components/overlay/Overlay.jsx":"f15ca21e987c","components/pilulas/PilulaDeLink.jsx":"6dd4004755d2","components/pilulas/Player.jsx":"bbd8368da897","components/placar/BlocoVersus.jsx":"cba671336b0c","components/placar/LinhaDoPlacar.jsx":"a2ca153f4599","components/podio/Podio.jsx":"c21743fe54a8","ui_kits/arena/ArenaKit.jsx":"d973317116b2"},"inlinedExternals":[],"unexposedExports":[{"name":"amplitudeDoNivel","sourcePath":"components/bolha/caminhoDaBolha.js"},{"name":"caminhoDaBolha","sourcePath":"components/bolha/caminhoDaBolha.js"},{"name":"noise","sourcePath":"components/bolha/caminhoDaBolha.js"}]} */

(() => {

const __ds_ns = (window.AuDesignSystem_226135 = window.AuDesignSystem_226135 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/bolha/caminhoDaBolha.js
try { (() => {
// Geometria da Bolha Auê — DESIGN.md §7.1. Blob orgânico de N pontos de
// controle num círculo de raio R, deslocados por ruído determinístico, unidos
// por curva suave (Catmull-Rom). Nunca um círculo perfeito, nem em repouso.
const R = 96;
function noise(a, t, seed) {
  return (Math.sin(a * 3 + t * 0.9 + seed * 5) * 0.5 + Math.sin(a * 5 - t * 1.3 + seed * 9) * 0.32 + Math.sin(a * 2 + t * 0.55 + seed * 3) * 0.4) / 1.22;
}

// DESIGN.md §7.3 — treze modos, amp/N/escala/preenchimento/contorno.
const MODOS = {
  idle: {
    amp: 8,
    n: 5,
    escala: 1.00,
    fill: 'color-mix(in oklch, var(--accent) 8%, var(--surface-2))',
    stroke: 'var(--border)'
  },
  asking: {
    amp: 6,
    n: 6,
    escala: 0.94,
    fill: 'var(--surface-2)',
    stroke: 'var(--fg)'
  },
  recording: {
    amp: 34,
    n: 8,
    escala: 1.16,
    fill: 'var(--accent)',
    stroke: 'var(--accent)',
    dirigida: true
  },
  holding: {
    amp: 6,
    n: 5,
    escala: 0.86,
    fill: 'color-mix(in oklch, var(--accent) 40%, var(--bg))',
    stroke: 'var(--border)'
  },
  checking: {
    amp: 11,
    n: 9,
    escala: 0.90,
    fill: 'color-mix(in oklch, var(--accent) 16%, var(--bg))',
    stroke: 'var(--fg)'
  },
  judging: {
    amp: 15,
    n: 7,
    escala: 0.82,
    fill: 'color-mix(in oklch, var(--accent) 26%, var(--bg))',
    stroke: 'var(--border)'
  },
  cradle: {
    amp: 7,
    n: 6,
    escala: 1.00,
    fill: 'color-mix(in oklch, var(--accent) 13%, var(--surface-2))',
    stroke: 'color-mix(in oklch, var(--accent) 30%, var(--border))'
  },
  waiting: {
    amp: 5,
    n: 6,
    escala: 1.00,
    fill: 'color-mix(in oklch, var(--accent) 8%, var(--surface-2))',
    stroke: 'var(--border)'
  },
  playing: {
    amp: 26,
    n: 8,
    escala: 1.06,
    fill: 'color-mix(in oklch, var(--accent) 22%, var(--bg))',
    stroke: 'var(--border)',
    dirigida: true
  },
  flat: {
    amp: 2,
    n: 4,
    escala: 0.70,
    fill: 'var(--surface)',
    stroke: 'var(--border)'
  },
  dead: {
    amp: 3,
    n: 5,
    escala: 0.78,
    fill: 'var(--bg)',
    stroke: 'var(--border)'
  },
  victory: {
    amp: 13,
    n: 6,
    escala: 1.12,
    fill: 'color-mix(in oklch, var(--gold) 18%, var(--bg))',
    stroke: 'var(--gold)'
  },
  defeat: {
    amp: 7,
    n: 5,
    escala: 0.90,
    fill: 'var(--surface)',
    stroke: 'var(--border)'
  }
};

/** Sobe até ~135% do raio no pico do envelope de áudio (Estouro). */
function amplitudeDoNivel(nivel) {
  return 8 + nivel * 40;
}
function caminhoDaBolha({
  amp,
  n,
  drive = 0
}, t, seed = 0.31) {
  const pontos = [];
  for (let i = 0; i < n; i++) {
    const theta = i * (2 * Math.PI / n);
    const raio = R + amp * noise(theta, t, seed);
    const x = Math.cos(theta) * raio;
    const y = Math.sin(theta) * raio * (1 + drive * 0.06);
    pontos.push([x, y]);
  }
  return smoothClosed(pontos);
}

// Catmull-Rom → Bézier cúbica fechada.
function smoothClosed(pts) {
  const n = pts.length;
  const get = i => pts[(i + n) % n];
  let d = `M ${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)} `;
  for (let i = 0; i < n; i++) {
    const p0 = get(i - 1),
      p1 = get(i),
      p2 = get(i + 1),
      p3 = get(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)} `;
  }
  return d + 'Z';
}
Object.assign(__ds_scope, { R, noise, MODOS, amplitudeDoNivel, caminhoDaBolha });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/bolha/caminhoDaBolha.js", error: String((e && e.message) || e) }); }

// components/bolha/BolhaAue.jsx
try { (() => {
const {
  useEffect,
  useRef
} = React;
/**
 * A Bolha Auê — elemento vivo central do jogo (DESIGN.md §7). Se ela aparece,
 * ela está dizendo algo. Nunca é decoração, nunca é waveform tradicional,
 * nunca tem gradiente ou glow.
 *
 * A pulsação escreve direto no atributo `d` do path via requestAnimationFrame
 * — nunca via re-render do React — para não custar 60 setState/s por segundo
 * de vida do componente.
 */
function BolhaAue({
  modo = 'idle',
  nivel,
  size = 220,
  reducedMotion = false
}) {
  const pathRef = useRef(null);
  const nivelRef = useRef(nivel);
  nivelRef.current = nivel;
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const forma = __ds_scope.MODOS[modo] || __ds_scope.MODOS.idle;
    if (reducedMotion || typeof window === 'undefined' || !window.matchMedia) {
      path.setAttribute('d', __ds_scope.caminhoDaBolha({
        ...forma,
        amp: 0
      }, 0));
    }
    if (reducedMotion) return;
    let frame;
    let inicio = null;
    let ampAtual = forma.amp;
    const desenhar = agora => {
      if (inicio === null) inicio = agora;
      const nivelAtual = typeof nivelRef.current === 'function' ? nivelRef.current() : nivelRef.current ?? 0;
      const alvo = forma.dirigida ? __ds_scope.amplitudeDoNivel(nivelAtual) : forma.amp;
      ampAtual += (alvo - ampAtual) * 0.14;
      path.setAttribute('d', __ds_scope.caminhoDaBolha({
        ...forma,
        amp: ampAtual
      }, (agora - inicio) / 1000));
      frame = requestAnimationFrame(desenhar);
    };
    frame = requestAnimationFrame(desenhar);
    return () => cancelAnimationFrame(frame);
  }, [modo, reducedMotion]);
  const forma = __ds_scope.MODOS[modo] || __ds_scope.MODOS.idle;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      aspectRatio: '1',
      transform: `scale(${forma.escala})`,
      transition: 'transform var(--duration-slow) var(--easing-emphasize)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "-160 -160 320 320",
    style: {
      width: '100%',
      height: '100%',
      overflow: 'visible'
    },
    role: "img",
    "aria-label": "Bolha Au\xEA"
  }, /*#__PURE__*/React.createElement("path", {
    ref: pathRef,
    d: __ds_scope.caminhoDaBolha({
      ...forma,
      amp: 0
    }, 0),
    fill: forma.fill,
    stroke: forma.stroke,
    strokeWidth: "1.5",
    style: {
      transition: 'fill var(--duration-slow) var(--easing-standard), stroke var(--duration-slow) var(--easing-standard)'
    }
  })));
}
Object.assign(__ds_scope, { BolhaAue });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/bolha/BolhaAue.jsx", error: String((e && e.message) || e) }); }

// components/botao/Botao.jsx
try { (() => {
/**
 * O CTA da Arena — DESIGN.md §6.1. Peça de jogo, não pílula de formulário:
 * raio moderado, corpo grande, tipografia de display. Cede no toque
 * (translateY+scale), nunca pisca.
 */
function Botao({
  variante = 'primario',
  tamanho = 'grande',
  children,
  disabled,
  onClick,
  type = 'button'
}) {
  const base = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: tamanho === 'grande' ? 60 : 44,
    borderRadius: variante === 'fantasma' ? 0 : 'var(--radius-md)',
    fontFamily: variante === 'fantasma' ? 'var(--font-body)' : 'var(--font-display)',
    fontWeight: variante === 'fantasma' ? 600 : 700,
    fontSize: tamanho === 'grande' ? variante === 'fantasma' ? 15 : 21 : 16,
    letterSpacing: variante === 'fantasma' ? 0 : '0.02em',
    textTransform: variante === 'fantasma' ? 'none' : 'uppercase',
    padding: '0 var(--space-4)',
    border: variante === 'contorno' ? '1px solid var(--border)' : '1px solid transparent',
    background: variante === 'primario' ? 'var(--accent)' : 'transparent',
    color: variante === 'primario' ? 'var(--accent-on)' : variante === 'fantasma' ? 'var(--muted)' : 'var(--fg)',
    outline: variante === 'primario' ? '2px solid var(--accent)' : 'none',
    outlineOffset: 2,
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color var(--duration-fast) var(--easing-standard), border-color var(--duration-fast) var(--easing-standard), color var(--duration-fast) var(--easing-standard), transform var(--duration-instant) var(--easing-standard)'
  };
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    disabled: disabled,
    onClick: onClick,
    className: 'au-botao au-botao--' + variante,
    style: base,
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'translateY(2px) scale(0.985)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'none';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'none';
    }
  }, children);
}
Object.assign(__ds_scope, { Botao });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/botao/Botao.jsx", error: String((e && e.message) || e) }); }

// components/cronometro/Cronometro.jsx
try { (() => {
/** Cronômetro de gravação — máximo 10s, vira --gold aos 8s como aviso, nunca erro. */
function Cronometro({
  segundos,
  maximo = 10
}) {
  const aviso = segundos >= maximo - 2;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 28,
      lineHeight: 1,
      color: aviso ? 'var(--gold)' : 'var(--accent)',
      fontVariantNumeric: 'tabular-nums'
    },
    className: aviso ? 'au-cronometro au-cronometro--aviso' : 'au-cronometro',
    "aria-live": "off"
  }, "0:", String(Math.max(0, maximo - segundos)).padStart(2, '0'));
}

/** Contagem da revanche — 3·2·1 no palco antes de reiniciar a rodada. */
function ContagemDaRevanche({
  numero
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(96px,30vw,140px)',
      lineHeight: 0.85,
      color: 'var(--fg)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, numero);
}
Object.assign(__ds_scope, { Cronometro, ContagemDaRevanche });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cronometro/Cronometro.jsx", error: String((e && e.message) || e) }); }

// components/gatilho/GatilhoDeMicrofone.jsx
try { (() => {
const {
  useEffect,
  useRef
} = React;
/**
 * O gatilho de microfone — a ação de entrada da Arena (IDLE). Bola de accent
 * de 112px com anel ambiente "ei, tô aqui". O alvo tocável é o conjunto
 * inteiro (bola + legenda) — acertar não exige mira. Alvo tocável nunca
 * abaixo de --hit-target-min (44px/44pt/48dp), em qualquer plataforma.
 */
function GatilhoDeMicrofone({
  jaGravou = false,
  permissao = 'concedida',
  onClick,
  size = 112
}) {
  const negada = permissao === 'negada';
  const pedindo = permissao === 'pedindo';
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: negada ? undefined : onClick,
    "aria-label": negada ? 'Microfone bloqueado — ative nas configurações' : 'Arrotar',
    disabled: negada,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-4)',
      userSelect: 'none',
      touchAction: 'manipulation',
      minWidth: 'var(--hit-target-min)',
      minHeight: 'var(--hit-target-min)',
      opacity: negada ? 0.5 : 1,
      cursor: negada ? 'not-allowed' : 'pointer'
    },
    onMouseDown: e => {
      if (!negada) e.currentTarget.querySelector('.bola').style.transform = 'scale(0.94)';
    },
    onMouseUp: e => {
      e.currentTarget.querySelector('.bola').style.transform = 'none';
    },
    onMouseLeave: e => {
      e.currentTarget.querySelector('.bola').style.transform = 'none';
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "bola",
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      position: 'relative',
      background: jaGravou || negada ? 'transparent' : 'var(--accent)',
      color: jaGravou || negada ? 'var(--fg)' : 'var(--accent-on)',
      outline: `2px solid ${jaGravou || negada ? 'var(--fg)' : 'var(--accent)'}`,
      outlineOffset: 3,
      display: 'grid',
      placeItems: 'center',
      transition: 'background-color var(--duration-fast) var(--easing-standard), transform var(--duration-instant) var(--easing-standard)'
    }
  }, !jaGravou && !negada && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      border: '2px solid var(--accent)',
      animation: 'chamadoGatilho 6s cubic-bezier(0,0,.2,1) infinite'
    }
  }), pedindo && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: -6,
      borderRadius: '50%',
      border: '2px solid var(--accent)',
      borderTopColor: 'transparent',
      animation: 'giroPedindo 900ms linear infinite'
    }
  }), negada ? /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      width: size * 0.46,
      height: size * 0.46
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 10v1a7 7 0 0 1-11.32 5.32M5 5l14 14"
  })) : /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      width: size * 0.46,
      height: size * 0.46
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 10v1a7 7 0 0 1-14 0v-1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 18v4M9 22h6"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 22,
      color: 'var(--fg)',
      textTransform: 'uppercase',
      letterSpacing: '0.01em',
      textAlign: 'center'
    }
  }, negada ? 'Sem microfone' : pedindo ? 'Pedindo acesso…' : jaGravou ? 'Já foi' : 'Arrotar'), /*#__PURE__*/React.createElement("style", null, `@keyframes chamadoGatilho{0%{transform:scale(1);opacity:.5}22%{transform:scale(1.45);opacity:0}100%{transform:scale(1.45);opacity:0}}@keyframes giroPedindo{to{transform:rotate(360deg)}}`));
}
Object.assign(__ds_scope, { GatilhoDeMicrofone });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/gatilho/GatilhoDeMicrofone.jsx", error: String((e && e.message) || e) }); }

// components/hud/Hud.jsx
try { (() => {
/**
 * HUD — DESIGN.md §8. Não é navegação. Três coisas e só três: wordmark,
 * marca de X1 aberto (opcional) e botão de menu. Altura fixa 56px. Some
 * (opacity:0) durante RECORDING, VALIDATING, JUDGING, RESULT_REVEAL, REMATCH.
 */
function Hud({
  x1Aberto = false,
  onMenu,
  oculto = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 56,
      opacity: oculto ? 0 : 1,
      pointerEvents: oculto ? 'none' : 'auto',
      transition: 'opacity var(--duration-base) var(--easing-standard)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 22,
      letterSpacing: '0.01em',
      color: 'var(--fg)'
    }
  }, "Au\xEA", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg)'
    }
  }, "!")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)'
    }
  }, x1Aberto && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      minHeight: 32,
      padding: '0 var(--space-3)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-full)',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--muted)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--accent)'
    }
  }), "X1 aberto"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onMenu,
    "aria-label": "Menu",
    style: {
      width: 44,
      height: 44,
      borderRadius: 'var(--radius-full)',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--muted)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    style: {
      width: 20,
      height: 20
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 7h16M4 12h16M4 17h16"
  })))));
}
Object.assign(__ds_scope, { Hud });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/hud/Hud.jsx", error: String((e && e.message) || e) }); }

// components/metrica/Metrica.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Linha de métrica — DESIGN.md §6.4. Nunca card. Rótulo + valor tabular +
 * barra de 4px. Preenchimento --fg (não accent: o verde já está no score).
 */
function Metrica({
  rotulo,
  valor,
  percentual
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--muted)'
    }
  }, rotulo), /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums'
    }
  }, valor)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      borderRadius: 'var(--radius-full)',
      background: 'var(--border)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${percentual}%`,
      background: 'var(--fg)',
      borderRadius: 'var(--radius-full)',
      transition: 'width var(--duration-slow) var(--easing-decelerate)'
    }
  })));
}

/** Lista fixa: Força · Fôlego · Grave. */
function ListaDeMetricas({
  metricas
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)'
    }
  }, metricas.map(m => /*#__PURE__*/React.createElement(Metrica, _extends({
    key: m.rotulo
  }, m))));
}
Object.assign(__ds_scope, { Metrica, ListaDeMetricas });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/metrica/Metrica.jsx", error: String((e && e.message) || e) }); }

// components/nota/NotaNaBolha.jsx
try { (() => {
/**
 * A nota dentro da Bolha — DESIGN.md §9. Inteiro 0–100, sem casa decimal,
 * sempre a camada concêntrica com a Bolha. Eyebrow curto por contrato
 * (<=15ch), corpo tabular.
 */
function NotaNaBolha({
  valor,
  rotulo,
  tamanho = 'resultado',
  impacto = false
}) {
  const tamanhos = {
    revelacao: 'clamp(60px,19vw,92px)',
    resultado: 'clamp(48px,15vw,64px)',
    x1: 'clamp(36px,11vw,48px)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4
    }
  }, rotulo && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--muted)',
      maxWidth: '15ch',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, rotulo), /*#__PURE__*/React.createElement("span", {
    "data-sound": impacto ? 'var(--sound-reveal)' : undefined,
    className: 'au-nota',
    "data-haptic": impacto ? 'var(--haptic-heavy)' : undefined,
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: tamanhos[tamanho],
      lineHeight: 0.86,
      letterSpacing: '-0.015em',
      color: 'var(--accent)',
      fontVariantNumeric: 'tabular-nums',
      display: 'inline-block',
      animation: impacto ? 'notaImpacto var(--duration-impact) var(--easing-impact)' : 'none'
    }
  }, Math.round(valor)), impacto && /*#__PURE__*/React.createElement("style", null, `@keyframes notaImpacto{0%{transform:scale(0.6);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}`));
}
Object.assign(__ds_scope, { NotaNaBolha });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/nota/NotaNaBolha.jsx", error: String((e && e.message) || e) }); }

// components/origem/EscolhaDeOrigem.jsx
try { (() => {
const ORIGENS = [{
  id: 'cerveja',
  rotulo: 'Cerveja',
  emoji: '🍺'
}, {
  id: 'refri',
  rotulo: 'Refri',
  emoji: '🥤'
}, {
  id: 'comida',
  rotulo: 'Comida',
  emoji: '🍽️'
}, {
  id: 'ar',
  rotulo: 'Ar',
  emoji: '💨'
}];

/**
 * Escolha de origem — DESIGN.md §6.5. Fora do caminho crítico: vem DEPOIS da
 * nota, um toque resolve e nunca bloqueia nenhum CTA.
 */
function EscolhaDeOrigem({
  onEscolher,
  escolhida
}) {
  if (escolhida) {
    return /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 13,
        color: 'var(--muted)'
      }
    }, "Origem: ", /*#__PURE__*/React.createElement("b", {
      style: {
        color: 'var(--fg)',
        fontWeight: 600
      }
    }, escolhida));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--muted)'
    }
  }, "De onde veio"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      width: '100%'
    }
  }, ORIGENS.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.id,
    type: "button",
    onClick: () => onEscolher?.(o.rotulo),
    style: {
      flex: 1,
      minHeight: 44,
      padding: '0 var(--space-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-full)',
      fontSize: 14,
      fontWeight: 600,
      color: 'var(--fg)',
      display: 'grid',
      placeItems: 'center'
    }
  }, o.rotulo))));
}
Object.assign(__ds_scope, { EscolhaDeOrigem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/origem/EscolhaDeOrigem.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Overlay.jsx
try { (() => {
/**
 * Camada de overlay — DESIGN.md §11. Sobre a Arena, nunca um estado: não
 * troca data-state, não entra no histórico, não interrompe a partida.
 */
function Overlay({
  titulo,
  children,
  onFechar
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "overlayTitulo",
    style: {
      position: 'fixed',
      inset: 0,
      background: 'var(--overlay-scrim)',
      backdropFilter: 'blur(2px)',
      display: 'grid',
      placeItems: 'center',
      padding: 'var(--space-5)'
    },
    onClick: e => {
      if (e.target === e.currentTarget) onFechar?.();
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 400,
      background: 'var(--surface)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6) var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      boxShadow: 'var(--shadow-modal)'
    }
  }, titulo && /*#__PURE__*/React.createElement("h2", {
    id: "overlayTitulo",
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 26,
      textTransform: 'uppercase',
      margin: 0
    }
  }, titulo), children));
}
Object.assign(__ds_scope, { Overlay });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Overlay.jsx", error: String((e && e.message) || e) }); }

// components/pilulas/PilulaDeLink.jsx
try { (() => {
const {
  useState
} = React;
/**
 * Pílula de link do X1 — leitura + copiar (DESIGN.md §6.3). Sem accent: o
 * verde já está gasto no CTA e/ou na nota. Confirmação promove cor/borda para
 * --fg, nunca vira verde.
 */
function PilulaDeLink({
  link,
  onCopiar
}) {
  const [estado, setEstado] = useState('parado');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      minHeight: 56,
      padding: '0 var(--space-2) 0 var(--space-5)',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-full)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontFamily: 'var(--font-mono)',
      fontSize: 14,
      color: 'var(--fg)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, link), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: async () => {
      const ok = await (onCopiar ? onCopiar(link) : navigator.clipboard.writeText(link).then(() => true).catch(() => false));
      setEstado(ok ? 'copiado' : 'recusado');
    },
    style: {
      minHeight: 44,
      padding: '0 var(--space-4)',
      borderRadius: 'var(--radius-full)',
      border: '1px solid var(--border)',
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: estado === 'copiado' ? 'var(--fg)' : 'var(--muted)',
      borderColor: estado === 'copiado' ? 'var(--fg)' : 'var(--border)'
    }
  }, estado === 'copiado' ? 'Copiado' : 'Copiar'));
}
Object.assign(__ds_scope, { PilulaDeLink });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/pilulas/PilulaDeLink.jsx", error: String((e && e.message) || e) }); }

// components/pilulas/Player.jsx
try { (() => {
/** Player de replay — mesma família de pílula, botão circular + barra de progresso. */
function Player({
  rotulo,
  duracao = '0:00',
  progresso = 0,
  tocando = false,
  onTogglePlay
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      minHeight: 56,
      padding: '0 var(--space-5) 0 6px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-full)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onTogglePlay,
    style: {
      flex: '0 0 44px',
      width: 44,
      height: 44,
      borderRadius: 'var(--radius-full)',
      border: '1px solid var(--border)',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--fg)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    style: {
      width: 18,
      height: 18
    }
  }, tocando ? /*#__PURE__*/React.createElement("path", {
    d: "M6 5h4v14H6zM14 5h4v14h-4z"
  }) : /*#__PURE__*/React.createElement("path", {
    d: "M7 5l12 7-12 7V5z"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13,
      color: 'var(--muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, rotulo), /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--fg)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, duracao)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      borderRadius: 'var(--radius-full)',
      background: 'var(--border)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${progresso * 100}%`,
      background: 'var(--fg)',
      borderRadius: 'var(--radius-full)',
      transition: 'width var(--duration-slow) var(--easing-decelerate)'
    }
  }))));
}
Object.assign(__ds_scope, { Player });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/pilulas/Player.jsx", error: String((e && e.message) || e) }); }

// components/placar/BlocoVersus.jsx
try { (() => {
/** Bloco VS — dois blocos espelhados, marca central. DESIGN.md §10.1. */
function BlocoVersus({
  esquerda,
  direita,
  empate = false
}) {
  const cor = lado => empate ? 'var(--fg)' : lado.venceu ? 'var(--gold)' : 'var(--muted)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-4)',
      width: '100%'
    }
  }, [esquerda, direita].map((lado, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i === 1 && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      flex: 'none',
      borderRadius: 'var(--radius-full)',
      background: 'var(--surface)',
      display: 'grid',
      placeItems: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: empate ? 'var(--fg)' : 'var(--muted)'
    }
  }, empate ? '=' : 'VS'), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 400,
      fontSize: 'clamp(40px,13vw,58px)',
      lineHeight: 1,
      fontVariantNumeric: 'tabular-nums',
      color: cor(lado)
    },
    className: lado.venceu && !empate ? 'au-ouro' : undefined
  }, Math.round(lado.nota)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: empate ? 'var(--fg)' : lado.venceu ? 'var(--fg)' : 'var(--muted)',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, lado.nome)))));
}
Object.assign(__ds_scope, { BlocoVersus });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/placar/BlocoVersus.jsx", error: String((e && e.message) || e) }); }

// components/placar/LinhaDoPlacar.jsx
try { (() => {
/** Uma linha do placar tocável — DESIGN.md §10.2. Cada linha toca o arroto daquele competidor. */
function LinhaDoPlacar({
  nome,
  nota,
  lider = false,
  tocando = false,
  semAudio = false,
  onPlay
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: semAudio,
    onClick: onPlay,
    style: {
      position: 'relative',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      textAlign: 'left',
      padding: '10px 0',
      borderTop: '1px solid var(--border)',
      fontSize: 15,
      color: 'var(--fg)',
      opacity: semAudio ? 0.6 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: '0 0 32px',
      width: 32,
      height: 32,
      borderRadius: 'var(--radius-full)',
      border: '1px solid var(--border)',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--muted)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    style: {
      width: 14,
      height: 14
    }
  }, tocando ? /*#__PURE__*/React.createElement("path", {
    d: "M6 5h4v14H6zM14 5h4v14h-4z"
  }) : /*#__PURE__*/React.createElement("path", {
    d: "M7 5l12 7-12 7V5z"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      color: lider ? 'var(--fg)' : 'var(--muted)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, nome), lider && /*#__PURE__*/React.createElement("span", {
    className: 'au-ouro-texto',
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--gold)'
    }
  }, "L\xEDder"), /*#__PURE__*/React.createElement("b", {
    className: lider ? 'au-ouro-texto' : undefined,
    style: {
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
      color: lider ? 'var(--gold)' : 'var(--fg)'
    }
  }, Math.round(nota)));
}
Object.assign(__ds_scope, { LinhaDoPlacar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/placar/LinhaDoPlacar.jsx", error: String((e && e.message) || e) }); }

// components/podio/Podio.jsx
try { (() => {
const CORES = ['var(--gold)', 'var(--silver)', 'var(--bronze)'];

/**
 * Pódio da mesa — disputa presencial/local (extraído de PodioBanner.tsx). Vira
 * PNG compartilhável. Aguenta 1–5 colocados; empate no topo divide o círculo
 * de campeão em vez de forçar um vencedor.
 */
function Podio({
  colocacoes,
  legenda
}) {
  const campeoes = colocacoes.filter(c => c.posicao === 1);
  const demais = colocacoes.filter(c => c.posicao !== 1);
  const campeao = campeoes[0];
  if (!campeao) return null;
  const empate = campeoes.length > 1;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      textAlign: 'center',
      padding: 'var(--space-5)',
      background: 'var(--bg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--muted)'
    }
  }, legenda ?? 'Fim de jogo'), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 32,
      textTransform: 'uppercase',
      margin: 0
    }
  }, empate ? 'Empate no topo' : 'Campeão do Auê'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginTop: 6
    }
  }, campeoes.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.nome,
    style: {
      width: empate ? 64 : 84,
      height: empate ? 64 : 84,
      borderRadius: 999,
      background: 'var(--accent)',
      display: 'grid',
      placeItems: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: empate ? 24 : 32,
      color: 'var(--bg)'
    }
  }, p.nome.charAt(0).toUpperCase()))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 24,
      textTransform: 'uppercase',
      marginTop: 4
    }
  }, campeoes.length === 1 ? campeao.nome : `${campeoes.slice(0, -1).map(c => c.nome).join(', ')} e ${campeoes[campeoes.length - 1].nome}`), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 20,
      color: 'var(--accent)',
      fontWeight: 700
    }
  }, Math.round(campeao.nota))), demais.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      textAlign: 'left'
    }
  }, demais.map((p, i) => {
    const cor = CORES[p.posicao - 1] ?? 'var(--muted)';
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '11px 10px',
        borderTop: '1px solid var(--border)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 28,
        height: 28,
        borderRadius: 999,
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        fontWeight: 700,
        border: `1px solid ${cor}`,
        color: cor,
        background: 'var(--surface)'
      }
    }, p.posicao), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 38,
        height: 38,
        borderRadius: 999,
        background: 'var(--border)',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 14
      }
    }, p.nome.charAt(0).toUpperCase()), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        fontWeight: 600,
        fontSize: 14
      }
    }, p.nome), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        fontSize: 15,
        color: cor
      }
    }, Math.round(p.nota)));
  })));
}
Object.assign(__ds_scope, { Podio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/podio/Podio.jsx", error: String((e && e.message) || e) }); }

// ui_kits/arena/ArenaKit.jsx
try { (() => {
const {
  useEffect,
  useRef,
  useState
} = React;
const DS = window.AuDesignSystem_226135;
const {
  BolhaAue,
  NotaNaBolha,
  Hud,
  GatilhoDeMicrofone,
  Botao,
  Cronometro,
  ContagemDaRevanche,
  PilulaDeLink,
  Player,
  ListaDeMetricas,
  EscolhaDeOrigem,
  BlocoVersus,
  LinhaDoPlacar,
  Overlay
} = DS;
const STAGE_H = {
  IDLE: 'clamp(196px,30svh,264px)',
  RECORDING: 'clamp(228px,38svh,308px)',
  DEFAULT: 'clamp(228px,38svh,308px)',
  RESULT: 'clamp(168px,24svh,200px)',
  SCOREBOARD: 'clamp(148px,23svh,196px)',
  DRAW: 'clamp(148px,23svh,196px)',
  CHALLENGE_CREATED: 'clamp(158px,25svh,200px)',
  WAITING_OPPONENT: 'clamp(158px,25svh,200px)'
};
const FALAS_RESULTADO = {
  alta: ['Tá maluco.', 'Esse bagulho tá apelão.'],
  media: ['Aí sim, porra.', 'Caralho, veio forte.'],
  baixa: ['Foi isso?', 'Tá fraco, hein.']
};
function faixaDe(nota) {
  if (nota >= 85) return 'alta';
  if (nota >= 60) return 'media';
  return 'baixa';
}

/** Layout de grade fixo — DESIGN.md §16.1: HUD · Palco · Reação · Ação, sempre nas mesmas posições. */
function Grade({
  estado,
  hudOculto,
  x1Aberto,
  onMenu,
  children
}) {
  const [palco, reacao, acao] = children;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      maxWidth: 440,
      minHeight: '100svh',
      background: 'var(--bg)',
      display: 'grid',
      gridTemplateRows: `56px minmax(0,${STAGE_H[estado] || STAGE_H.DEFAULT}) 1fr auto`,
      padding: 'var(--space-2) var(--space-5) var(--space-5)',
      margin: '0 auto',
      transition: 'grid-template-rows var(--duration-slow) var(--easing-standard)'
    }
  }, /*#__PURE__*/React.createElement(Hud, {
    oculto: hudOculto,
    x1Aberto: x1Aberto,
    onMenu: onMenu
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      placeItems: 'center',
      position: 'relative'
    }
  }, palco), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-3)',
      paddingTop: 'var(--space-4)',
      textAlign: 'center'
    },
    "aria-live": "polite"
  }, reacao), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      paddingTop: acao ? 'var(--space-5)' : 0
    }
  }, acao));
}
function ArenaKit() {
  const [estado, setEstado] = useState('IDLE');
  const [seg, setSeg] = useState(0);
  const [nota, setNota] = useState(91);
  const [jaGravou, setJaGravou] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [contagem, setContagem] = useState(3);
  const timerRef = useRef(null);
  useEffect(() => {
    if (estado === 'RECORDING') {
      setSeg(0);
      timerRef.current = setInterval(() => setSeg(s => {
        if (s >= 9) {
          clearInterval(timerRef.current);
          setEstado('VALIDATING');
          return 10;
        }
        return s + 1;
      }), 1000);
      return () => clearInterval(timerRef.current);
    }
    if (estado === 'VALIDATING') {
      const t = setTimeout(() => setEstado('JUDGING'), 900);
      return () => clearTimeout(t);
    }
    if (estado === 'JUDGING') {
      const t = setTimeout(() => {
        setNota(Math.floor(60 + Math.random() * 40));
        setEstado('RESULT_REVEAL');
      }, 1500);
      return () => clearTimeout(t);
    }
    if (estado === 'RESULT_REVEAL') {
      const t = setTimeout(() => setEstado('RESULT'), 1500);
      return () => clearTimeout(t);
    }
    if (estado === 'REMATCH') {
      setContagem(3);
      const t1 = setTimeout(() => setContagem(2), 620);
      const t2 = setTimeout(() => setContagem(1), 1240);
      const t3 = setTimeout(() => setEstado('RECORDING'), 1860);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [estado]);
  const irPara = e => {
    setJaGravou(true);
    setEstado(e);
  };
  const faixa = faixaDe(nota);
  const fala = FALAS_RESULTADO[faixa][0];
  let hud, palco, reacao, acao;
  const hudOculto = ['RECORDING', 'VALIDATING', 'JUDGING', 'RESULT_REVEAL', 'REMATCH'].includes(estado);
  switch (estado) {
    case 'IDLE':
      palco = /*#__PURE__*/React.createElement(BolhaAue, {
        modo: "idle",
        size: 220
      });
      reacao = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h2", {
        style: {
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(30px,9vw,38px)',
          margin: 0
        }
      }, "Bora?"), /*#__PURE__*/React.createElement("p", {
        style: {
          color: 'var(--muted)',
          fontSize: 15,
          margin: 0,
          maxWidth: '30ch'
        }
      }, "Solta o primeiro e v\xEA quanto d\xE1."));
      acao = /*#__PURE__*/React.createElement(GatilhoDeMicrofone, {
        jaGravou: jaGravou,
        onClick: () => setEstado('RECORDING')
      });
      break;
    case 'RECORDING':
      palco = /*#__PURE__*/React.createElement(BolhaAue, {
        modo: "recording",
        size: 260,
        nivel: () => (Math.sin(Date.now() / 250) + 1) / 2
      });
      reacao = /*#__PURE__*/React.createElement(Cronometro, {
        segundos: seg
      });
      acao = /*#__PURE__*/React.createElement(Botao, {
        variante: "contorno",
        onClick: () => setEstado('VALIDATING')
      }, "Parar");
      break;
    case 'VALIDATING':
      palco = /*#__PURE__*/React.createElement(BolhaAue, {
        modo: "checking",
        size: 200
      });
      reacao = /*#__PURE__*/React.createElement("p", {
        style: {
          color: 'var(--muted)',
          fontSize: 15,
          margin: 0
        }
      }, "Conferindo\u2026");
      break;
    case 'JUDGING':
      palco = /*#__PURE__*/React.createElement(BolhaAue, {
        modo: "judging",
        size: 180
      });
      reacao = /*#__PURE__*/React.createElement("p", {
        className: "grito",
        style: {
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(30px,9vw,38px)',
          margin: 0
        }
      }, "T\xF4 julgando essa porra.");
      break;
    case 'RESULT_REVEAL':
      palco = /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'grid',
          placeItems: 'center',
          width: '100%',
          height: '100%'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          position: 'relative',
          display: 'grid',
          placeItems: 'center'
        }
      }, /*#__PURE__*/React.createElement(BolhaAue, {
        modo: "cradle",
        size: 280
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          position: 'absolute'
        }
      }, /*#__PURE__*/React.createElement(NotaNaBolha, {
        valor: nota,
        rotulo: "De p\xE9",
        tamanho: "revelacao"
      }))));
      reacao = /*#__PURE__*/React.createElement("p", {
        className: "grito",
        style: {
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(30px,9vw,38px)',
          margin: 0
        }
      }, fala);
      break;
    case 'RESULT':
      palco = /*#__PURE__*/React.createElement("div", {
        style: {
          position: 'relative',
          display: 'grid',
          placeItems: 'center'
        }
      }, /*#__PURE__*/React.createElement(BolhaAue, {
        modo: "cradle",
        size: 210
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          position: 'absolute'
        }
      }, /*#__PURE__*/React.createElement(NotaNaBolha, {
        valor: nota,
        rotulo: "Valendo",
        tamanho: "resultado"
      })));
      reacao = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h2", {
        style: {
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(30px,9vw,38px)',
          margin: 0
        }
      }, fala), /*#__PURE__*/React.createElement("p", {
        style: {
          color: 'var(--muted)',
          fontSize: 15,
          margin: 0,
          maxWidth: '30ch'
        }
      }, "Manda isso no grupo e v\xEA se algu\xE9m peita."), /*#__PURE__*/React.createElement("div", {
        style: {
          width: '100%'
        }
      }, /*#__PURE__*/React.createElement(Player, {
        rotulo: "Seu arroto",
        duracao: "0:07",
        progresso: 0.3
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          width: '100%'
        }
      }, /*#__PURE__*/React.createElement(ListaDeMetricas, {
        metricas: [{
          rotulo: 'Força',
          valor: 82,
          percentual: 82
        }, {
          rotulo: 'Fôlego',
          valor: '4,2s',
          percentual: 60
        }, {
          rotulo: 'Grave',
          valor: 71,
          percentual: 71
        }]
      })), /*#__PURE__*/React.createElement(EscolhaDeOrigem, {
        onEscolher: () => {}
      }));
      acao = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'grid',
          gridAutoFlow: 'column',
          gap: 'var(--space-2)'
        }
      }, /*#__PURE__*/React.createElement(Botao, {
        variante: "primario",
        tamanho: "compacto",
        onClick: () => irPara('CHALLENGE_CREATED')
      }, "Chamar pro X1"), /*#__PURE__*/React.createElement(Botao, {
        variante: "contorno",
        tamanho: "compacto",
        onClick: () => setEstado('SCOREBOARD')
      }, "Jogar no grupo")), /*#__PURE__*/React.createElement(Botao, {
        variante: "fantasma",
        onClick: () => setEstado('RECORDING')
      }, "Mandar outro"));
      break;
    case 'CHALLENGE_CREATED':
      palco = /*#__PURE__*/React.createElement(BolhaAue, {
        modo: "holding",
        size: 176
      });
      reacao = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
        style: {
          color: 'var(--muted)',
          fontSize: 15,
          margin: 0
        }
      }, "Link pronto. Manda pro infeliz."), /*#__PURE__*/React.createElement(PilulaDeLink, {
        link: "aue.gg/x1/9f2a",
        onCopiar: async () => true
      }));
      acao = /*#__PURE__*/React.createElement(Botao, {
        variante: "primario",
        onClick: () => setEstado('WAITING_OPPONENT')
      }, "Mandar pro infeliz");
      break;
    case 'WAITING_OPPONENT':
      palco = /*#__PURE__*/React.createElement(BolhaAue, {
        modo: "waiting",
        size: 176
      });
      reacao = /*#__PURE__*/React.createElement("p", {
        style: {
          color: 'var(--muted)',
          fontSize: 15,
          margin: 0
        }
      }, "Ningu\xE9m aceitou ainda.");
      acao = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Botao, {
        variante: "contorno",
        onClick: () => {
          setNota(88);
          setEstado('DRAW');
        }
      }, "Simular empate"), /*#__PURE__*/React.createElement(Botao, {
        variante: "primario",
        onClick: () => setEstado('SCOREBOARD')
      }, "Simular resposta"));
      break;
    case 'SCOREBOARD':
      palco = /*#__PURE__*/React.createElement("div", {
        style: {
          width: '100%'
        }
      }, /*#__PURE__*/React.createElement(BlocoVersus, {
        esquerda: {
          nome: 'Você',
          nota,
          venceu: true
        },
        direita: {
          nome: 'Luiz',
          nota: nota - 13
        }
      }));
      reacao = /*#__PURE__*/React.createElement("div", {
        style: {
          width: '100%'
        }
      }, /*#__PURE__*/React.createElement(LinhaDoPlacar, {
        nome: "Voc\xEA",
        nota: nota,
        lider: true,
        onPlay: () => {}
      }), /*#__PURE__*/React.createElement(LinhaDoPlacar, {
        nome: "Luiz",
        nota: nota - 13,
        onPlay: () => {}
      }));
      acao = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Botao, {
        variante: "primario",
        onClick: () => setEstado('REMATCH')
      }, "Revanche"), /*#__PURE__*/React.createElement(Botao, {
        variante: "fantasma",
        onClick: () => setEstado('IDLE')
      }, "Sair"));
      break;
    case 'DRAW':
      palco = /*#__PURE__*/React.createElement("div", {
        style: {
          width: '100%'
        }
      }, /*#__PURE__*/React.createElement(BlocoVersus, {
        esquerda: {
          nome: 'Você',
          nota: 88
        },
        direita: {
          nome: 'Luiz',
          nota: 88
        },
        empate: true
      }));
      reacao = /*#__PURE__*/React.createElement("p", {
        style: {
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          margin: 0
        }
      }, "Ningu\xE9m ganhou.");
      acao = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Botao, {
        variante: "primario",
        onClick: () => setEstado('REMATCH')
      }, "Revanche"), /*#__PURE__*/React.createElement(Botao, {
        variante: "fantasma",
        onClick: () => setEstado('IDLE')
      }, "Sair"));
      break;
    case 'REMATCH':
      palco = /*#__PURE__*/React.createElement(ContagemDaRevanche, {
        numero: contagem,
        key: contagem
      });
      break;
    default:
      palco = /*#__PURE__*/React.createElement(BolhaAue, {
        modo: "idle",
        size: 220
      });
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Grade, {
    estado: estado,
    hudOculto: hudOculto,
    x1Aberto: estado === 'CHALLENGE_CREATED' || estado === 'WAITING_OPPONENT',
    onMenu: () => setMenuAberto(true)
  }, palco, reacao, acao), menuAberto && /*#__PURE__*/React.createElement(Overlay, {
    titulo: "Como funciona",
    onFechar: () => setMenuAberto(false)
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--muted)',
      fontSize: 15,
      margin: 0
    }
  }, "Arrota. Recebe a nota. Chama algu\xE9m pro X1. Perdeu? Revanche."), /*#__PURE__*/React.createElement(Botao, {
    variante: "primario",
    onClick: () => setMenuAberto(false)
  }, "Fechar")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 8,
      left: 8,
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      maxWidth: 300,
      zIndex: 99
    }
  }, ['IDLE', 'MIC_ERROR', 'NO_SOUND'].map(e => /*#__PURE__*/React.createElement("button", {
    key: e,
    onClick: () => setEstado(e),
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      color: 'var(--muted)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      padding: '2px 6px',
      background: 'var(--surface)'
    }
  }, e))), estado === 'MIC_ERROR' && /*#__PURE__*/React.createElement(Overlay, {
    titulo: "Sem microfone",
    onFechar: () => setEstado('IDLE')
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--muted)',
      fontSize: 15,
      margin: 0
    }
  }, "O navegador bloqueou o microfone. Libera nas configura\xE7\xF5es do site e tenta de novo."), /*#__PURE__*/React.createElement(Botao, {
    variante: "primario",
    onClick: () => setEstado('IDLE')
  }, "Entendi")), estado === 'NO_SOUND' && /*#__PURE__*/React.createElement(Overlay, {
    titulo: "Nada por aqui",
    onFechar: () => setEstado('IDLE')
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--muted)',
      fontSize: 15,
      margin: 0
    }
  }, "N\xE3o veio som nenhum. Tenta de novo, mais de perto."), /*#__PURE__*/React.createElement(Botao, {
    variante: "primario",
    onClick: () => setEstado('RECORDING')
  }, "Tentar de novo")));
}
window.ArenaKit = ArenaKit;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/arena/ArenaKit.jsx", error: String((e && e.message) || e) }); }

__ds_ns.BolhaAue = __ds_scope.BolhaAue;

__ds_ns.R = __ds_scope.R;

__ds_ns.MODOS = __ds_scope.MODOS;

__ds_ns.Botao = __ds_scope.Botao;

__ds_ns.Cronometro = __ds_scope.Cronometro;

__ds_ns.ContagemDaRevanche = __ds_scope.ContagemDaRevanche;

__ds_ns.GatilhoDeMicrofone = __ds_scope.GatilhoDeMicrofone;

__ds_ns.Hud = __ds_scope.Hud;

__ds_ns.Metrica = __ds_scope.Metrica;

__ds_ns.ListaDeMetricas = __ds_scope.ListaDeMetricas;

__ds_ns.NotaNaBolha = __ds_scope.NotaNaBolha;

__ds_ns.EscolhaDeOrigem = __ds_scope.EscolhaDeOrigem;

__ds_ns.Overlay = __ds_scope.Overlay;

__ds_ns.PilulaDeLink = __ds_scope.PilulaDeLink;

__ds_ns.Player = __ds_scope.Player;

__ds_ns.BlocoVersus = __ds_scope.BlocoVersus;

__ds_ns.LinhaDoPlacar = __ds_scope.LinhaDoPlacar;

__ds_ns.Podio = __ds_scope.Podio;

})();
