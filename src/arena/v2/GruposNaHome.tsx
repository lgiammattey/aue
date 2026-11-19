import { useEffect, useState } from 'react';
import { criarGruposWeb } from '../../plataforma/web/grupos';
import type { GrupoExterno, PortaDeGrupos } from '../../portas/grupos';

type Estado = { tipo: 'carregando' } | { tipo: 'erro' } | { tipo: 'pronto'; grupos: readonly GrupoExterno[] };

/** Convites públicos cadastrados pela galera; não verifica a validade do link externo. */
export function GruposNaHome({ porta: portaDeFora }: { porta?: PortaDeGrupos }) {
  const [porta] = useState(() => portaDeFora ?? criarGruposWeb());
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    setEstado({ tipo: 'carregando' });
    void porta.listarGrupos().then((resultado) => {
      if (!ativo) return;
      setEstado(resultado.ok ? { tipo: 'pronto', grupos: resultado.grupos.filter((grupo) => grupo.plataforma === 'whatsapp') } : { tipo: 'erro' });
    }).catch(() => { if (ativo) setEstado({ tipo: 'erro' }); });
    return () => { ativo = false; };
  }, [porta, tentativa]);
  return <div className="grupos-home">
    {estado.tipo === 'carregando' && <p role="status">Buscando os grupos…</p>}
    {estado.tipo === 'erro' && <div role="alert"><p>Não deu pra carregar os grupos agora.</p><button type="button" onClick={() => setTentativa((valor) => valor + 1)}>Tentar novamente</button></div>}
    {estado.tipo === 'pronto' && (estado.grupos.length === 0 ? <p>Ainda não tem grupo de WhatsApp cadastrado por aqui.</p> : <ul>{estado.grupos.map((grupo) => <li key={grupo.id}>
      <div><h3>{grupo.nome}</h3>{grupo.descricao && <p>{grupo.descricao}</p>}</div><a href={grupo.linkDoConvite} target="_blank" rel="nofollow ugc noopener noreferrer" aria-label={`Abrir convite de ${grupo.nome} no WhatsApp`}>Abrir convite ↗</a>
    </li>)}</ul>)}
    <p className="grupos-home__nota">Os convites são externos ao Auê e podem mudar.</p>
    <a href="/grupos">Ver todos os grupos e cadastrar o seu ↗</a>
  </div>;
}
