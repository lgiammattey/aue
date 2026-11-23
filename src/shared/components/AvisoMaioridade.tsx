import { useState } from 'react';
import { analyticsArenaV2 } from '../../plataforma/web/analyticsArenaV2';
import { confirmarMaioridade, maioridadeConfirmada } from '../../plataforma/web/maioridade';
import './AvisoMaioridade.css';

const TEXTOS = {
  pt: { rotulo: 'Aviso de conteúdo para maiores de 18 anos', aviso: 'Só pra maiores. Humor pesado e zero filtro.', botao: 'Tenho 18+' },
  en: { rotulo: 'Notice: content for adults 18 and over', aviso: 'Adults only. Crude humor, no filter.', botao: "I'm 18+" },
} as const;

/** Faixa discreta de aviso +18 que não bloqueia navegação nem modais do app. */
export function AvisoMaioridade({ idioma = 'pt' }: { idioma?: keyof typeof TEXTOS } = {}) {
  const [visivel, setVisivel] = useState(() => !maioridadeConfirmada());
  const texto = TEXTOS[idioma];

  if (!visivel) return null;

  return (
    <aside className="aviso-maioridade" aria-label={texto.rotulo}>
      <div className="aviso-maioridade__miolo">
        <p className="aviso-maioridade__texto">
          <span className="aviso-maioridade__selo">+18</span>
          <span>{texto.aviso}</span>
        </p>
        <button
          type="button"
          className="aviso-maioridade__botao"
          onClick={() => {
            confirmarMaioridade();
            analyticsArenaV2.registrar('confirmou_maioridade');
            setVisivel(false);
          }}
        >
          {texto.botao}
        </button>
      </div>
    </aside>
  );
}
