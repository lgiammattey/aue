import React, { useState } from 'react';
import type { Comunidade, PedidoDePostagemDeCauso } from '../../portas/comunidade';

interface ModalNovoCausoProps {
  aberto: boolean;
  comunidades: readonly Comunidade[];
  comunidadeAtualSlug?: string;
  resultadoId?: string;
  notaResultado?: number;
  onFechar: () => void;
  onSubmit: (pedido: PedidoDePostagemDeCauso) => Promise<void>;
}

export const ModalNovoCauso: React.FC<ModalNovoCausoProps> = ({
  aberto,
  comunidades,
  comunidadeAtualSlug,
  resultadoId,
  notaResultado,
  onFechar,
  onSubmit,
}) => {
  const [comunidadeSlug, setComunidadeSlug] = useState(
    comunidadeAtualSlug || comunidades[0]?.slug || 'eu-arroto-e-dai',
  );
  const [autorNome, setAutorNome] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [consentimentoAudio, setConsentimentoAudio] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (!aberto) return null;

  const temAudio = Boolean(resultadoId);
  const podeEnviar =
    conteudo.trim().length > 0 &&
    (!temAudio || consentimentoAudio) &&
    !enviando;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEnviar) return;

    setEnviando(true);
    try {
      await onSubmit({
        comunidadeSlug,
        autorNome: autorNome.trim() || 'Arrotador Anônimo',
        conteudo: conteudo.trim(),
        resultadoId: temAudio ? resultadoId : undefined,
        consentimentoAudioPublico: consentimentoAudio,
      });
      onFechar();
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

          {temAudio && (
            <div className="consent-box">
              <input
                id="check-consent"
                type="checkbox"
                checked={consentimentoAudio}
                onChange={(e) => setConsentimentoAudio(e.target.checked)}
              />
              <label htmlFor="check-consent" className="consent-text">
                <strong>Autorizo publicar meu arroto (Nota {notaResultado})</strong> no mural público desta comunidade. Entendo que outros membros poderão ouvir e me desafiar.
              </label>
            </div>
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
              {enviando ? 'Publicando...' : 'Publicar Causo'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
