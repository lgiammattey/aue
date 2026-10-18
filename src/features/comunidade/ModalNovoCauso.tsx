import React, { useState } from 'react';
import type { Comunidade } from '../../portas/comunidade';

export interface DadosDoCausoComArroto {
  comunidadeSlug: string;
  autorNome: string;
  conteudo: string;
  consentimentoAudioPublico: boolean;
}

interface ModalNovoCausoProps {
  aberto: boolean;
  comunidades: readonly Comunidade[];
  comunidadeAtualSlug?: string;
  apelidoInicial?: string;
  /** Nota que a Arena mostrou. A publicada é a que o servidor calcula. */
  notaResultado?: number;
  /** Devolve `true` quando publicou; `false` mantém o modal aberto. */
  onSubmit: (dados: DadosDoCausoComArroto) => Promise<boolean>;
  onFechar: () => void;
}

export const ModalNovoCauso: React.FC<ModalNovoCausoProps> = ({
  aberto,
  comunidades,
  comunidadeAtualSlug,
  apelidoInicial,
  notaResultado,
  onSubmit,
  onFechar,
}) => {
  const [comunidadeSlug, setComunidadeSlug] = useState(
    comunidadeAtualSlug || comunidades[0]?.slug || 'eu-arroto-e-dai',
  );
  const [autorNome, setAutorNome] = useState(apelidoInicial ?? '');
  const [falhou, setFalhou] = useState(false);
  const [conteudo, setConteudo] = useState('');
  const [consentimentoAudio, setConsentimentoAudio] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (!aberto) return null;

  // O aceite é a condição para o arroto sair: sem marcar, não publica.
  const podeEnviar = conteudo.trim().length > 0 && consentimentoAudio && !enviando;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEnviar) return;

    setEnviando(true);
    setFalhou(false);
    try {
      const publicou = await onSubmit({
        comunidadeSlug,
        autorNome: autorNome.trim() || 'Arrotador Anônimo',
        conteudo: conteudo.trim(),
        consentimentoAudioPublico: consentimentoAudio,
      });
      if (publicou) onFechar();
      else setFalhou(true);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
      <div className="modal-card">
        <header className="modal-header">
          <h3 id="modal-titulo">Soltar Causo no Mural</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onFechar}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="select-comu">Comunidade</label>
            <select
              id="select-comu"
              value={comunidadeSlug}
              onChange={(e) => setComunidadeSlug(e.target.value)}
            >
              {comunidades.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.icone} {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="input-nome">Seu Apelido</label>
            <input
              id="input-nome"
              type="text"
              placeholder="Ex: Betão da TI, Zé do Bar"
              value={autorNome}
              onChange={(e) => setAutorNome(e.target.value)}
              maxLength={40}
            />
          </div>

          <div className="form-group">
            <label htmlFor="textarea-causo">O Causo / Contexto</label>
            <textarea
              id="textarea-causo"
              placeholder="Conta o estrago: onde foi, quem ouviu e qual foi a reação..."
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={3}
              required
            />
          </div>

          {(
            <div className="consent-box">
              <input
                id="check-consent"
                type="checkbox"
                checked={consentimentoAudio}
                onChange={(e) => setConsentimentoAudio(e.target.checked)}
              />
              <label htmlFor="check-consent" className="consent-text">
                <strong>Autorizo publicar meu arroto{notaResultado !== undefined ? ` (nota ${notaResultado})` : ''}</strong> no mural público. Qualquer pessoa poderá ouvir e me desafiar, e quem tiver o endereço do áudio consegue ouvir mesmo fora do mural. Posso apagar depois.
              </label>
            </div>
          )}

          {falhou && (
            <p role="alert" className="consent-text">
              Não deu para publicar agora. Nada foi postado. Tenta de novo.
            </p>
          )}

          <footer className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onFechar}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!podeEnviar}
            >
              {enviando ? 'Publicando…' : 'Publicar arroto'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
