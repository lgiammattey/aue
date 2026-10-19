import React, { useCallback, useEffect, useState } from 'react';
import type { GrupoExterno, PortaDeGrupos } from '../../portas/grupos';
import { CartaoDeGrupo } from './CartaoDeGrupo';
import type { VarianteDeGrupos } from './CartaoDeGrupo';

interface ListaDeGruposProps {
  porta: PortaDeGrupos;
  /** Muda quando alguém cadastrou um grupo e a lista precisa ser relida. */
  versao?: number;
  /** Avisos curtos (ex.: "Denúncia enviada."). */
  aoAvisar?: (texto: string) => void;
  variante?: VarianteDeGrupos;
}

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'pronto'; grupos: readonly GrupoExterno[] }
  | { tipo: 'erro'; semServidor: boolean };

const caixa: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  padding: 20,
  color: 'var(--muted)',
  fontSize: 15,
  lineHeight: 1.5,
};

export const ListaDeGrupos: React.FC<ListaDeGruposProps> = ({ porta, versao = 0, aoAvisar, variante = 'app' }) => {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [denunciados, setDenunciados] = useState<ReadonlySet<string>>(new Set());

  const carregar = useCallback(async () => {
    const r = await porta.listarGrupos();
    setEstado(r.ok ? { tipo: 'pronto', grupos: r.grupos } : { tipo: 'erro', semServidor: r.motivo === 'semServidor' });
  }, [porta]);

  useEffect(() => {
    // O carregamento é assíncrono: o setState acontece depois do await, não no corpo do efeito.
    void carregar();
  }, [carregar, versao]);

  const denunciar = async (grupo: GrupoExterno) => {
    const r = await porta.denunciarGrupo(grupo.id, 'Conteúdo impróprio');
    if (r === 'registrada') {
      setDenunciados((atual) => new Set(atual).add(grupo.id));
      aoAvisar?.('Denúncia enviada. Obrigado por avisar.');
    } else if (r === 'semServidor') {
      aoAvisar?.('Não deu para denunciar: o servidor não está configurado.');
    } else {
      aoAvisar?.('Não consegui registrar a denúncia. Tenta de novo.');
    }
  };

  if (estado.tipo === 'carregando') {
    return (
      <div style={caixa} role="status">
        Carregando os grupos…
      </div>
    );
  }

  if (estado.tipo === 'erro') {
    return (
      <div style={caixa} role="alert">
        {estado.semServidor
          ? 'Os grupos vêm do servidor do Auê, que não está configurado neste ambiente.'
          : 'Não consegui carregar os grupos agora.'}{' '}
        <button
          type="button"
          onClick={() => {
            setEstado({ tipo: 'carregando' });
            void carregar();
          }}
          style={{ minHeight: 44, background: 'none', border: 0, padding: 0, color: 'var(--fg)', fontWeight: 700, cursor: 'pointer' }}
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  // Grupo que a própria pessoa acabou de denunciar some da tela dela na hora.
  const visiveis = estado.grupos.filter((g) => !denunciados.has(g.id));

  if (visiveis.length === 0) {
    return <div style={caixa}>Nenhum grupo cadastrado ainda. Cadastra o primeiro.</div>;
  }

  return (
    <div
      style={
        variante === 'publica'
          ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16 }
          : { display: 'flex', flexDirection: 'column', gap: 12 }
      }
    >
      {visiveis.map((g) => (
        <CartaoDeGrupo key={g.id} grupo={g} aoDenunciar={denunciar} variante={variante} />
      ))}
    </div>
  );
};
