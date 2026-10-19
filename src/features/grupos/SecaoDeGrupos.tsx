import React, { useEffect, useRef, useState } from 'react';
import { criarGruposWeb } from '../../plataforma/web/grupos';
import type { PortaDeGrupos } from '../../portas/grupos';
import { FormularioDeGrupo } from './FormularioDeGrupo';
import { ListaDeGrupos } from './ListaDeGrupos';
import type { VarianteDeGrupos } from './CartaoDeGrupo';

interface SecaoDeGruposProps {
  /** Para teste ou troca de adaptador. Sem ela, usa o do navegador. */
  porta?: PortaDeGrupos;
  titulo?: string;
  /** `publica`: o desenho de `/grupos` (Páginas Públicas.dc.html). Padrão: o do app. */
  variante?: VarianteDeGrupos;
}

/**
 * A lista de grupos, o botão de cadastrar e o formulário. Serve ao app (aba
 * Comunidade) e à página pública `/grupos`: o cadastro funciona igual dentro e
 * fora do login, porque quem escreve é a função do servidor.
 */
export const SecaoDeGrupos: React.FC<SecaoDeGruposProps> = ({
  porta: portaDeFora,
  titulo = 'Grupos da galera',
  variante = 'app',
}) => {
  const [porta] = useState<PortaDeGrupos>(() => portaDeFora ?? criarGruposWeb());
  const [formAberto, setFormAberto] = useState(false);
  const [versao, setVersao] = useState(0);
  const [aviso, setAviso] = useState('');
  const relogio = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(relogio.current), []);

  const avisar = (texto: string) => {
    setAviso(texto);
    clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setAviso(''), 4000);
  };

  return (
    <section aria-labelledby="titulo-grupos" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        {variante === 'publica' ? (
          <h2 id="titulo-grupos" style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-.02em' }}>
            {titulo}
          </h2>
        ) : (
          <h2 id="titulo-grupos" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400 }}>
            {titulo.toUpperCase()}
          </h2>
        )}
        <button
          type="button"
          onClick={() => setFormAberto(true)}
          style={{
            minHeight: 44,
            padding: '0 20px',
            border: 0,
            borderRadius: 999,
            background: 'var(--fg)',
            color: 'var(--bg)',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Cadastrar grupo
        </button>
      </div>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14, lineHeight: 1.45 }}>
        Grupos de WhatsApp, Telegram e TikTok que a galera cadastrou. O Auê só abre o convite: não sabe quantos
        membros tem nem se o grupo ainda está de pé.
      </p>

      {aviso && (
        <div role="status" style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '10px 14px', fontSize: 14 }}>
          {aviso}
        </div>
      )}

      <ListaDeGrupos porta={porta} versao={versao} aoAvisar={avisar} variante={variante} />

      <FormularioDeGrupo
        aberto={formAberto}
        porta={porta}
        onFechar={() => setFormAberto(false)}
        onCadastrado={(_slug, avisoDoCadastro) => {
          setVersao((v) => v + 1);
          avisar(avisoDoCadastro ?? 'Grupo cadastrado.');
        }}
      />
    </section>
  );
};
