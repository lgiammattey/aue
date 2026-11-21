import { useState } from 'react';
import { analyticsArenaV2 } from '../../plataforma/web/analyticsArenaV2';
import { confirmarMaioridade, maioridadeConfirmada } from '../../plataforma/web/maioridade';
import './AvisoMaioridade.css';

/** Faixa discreta de aviso +18 que não bloqueia navegação nem modais do app. */
export function AvisoMaioridade() {
  const [visivel, setVisivel] = useState(() => !maioridadeConfirmada());

  if (!visivel) return null;

  return (
    <aside className="aviso-maioridade" aria-label="Aviso de conteúdo para maiores de 18 anos">
      <div className="aviso-maioridade__miolo">
        <p className="aviso-maioridade__texto">
          <span className="aviso-maioridade__selo">+18</span>
          <span>Ambiente para maiores de 18 anos. Arrotos sem filtro, humor pesado e anúncios irrestritos.</span>
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
          Tenho 18+ · Liberar
        </button>
      </div>
    </aside>
  );
}
