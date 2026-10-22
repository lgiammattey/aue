import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarForumWeb } from '../../plataforma/web/forum';
import { criarPerfilRemoto } from '../../plataforma/web/perfilRemoto';
import type { ComunidadeDoForum } from '../../portas/forum';
import type { PerfilPublico } from '../../portas/perfil';
import { BarraLateral } from './BarraLateral';
import { BarraSuperior } from './BarraSuperior';
import { PainelDireito } from './PainelDireito';
import './casca.css';

/** Conteúdo informativo usa o mesmo caminho visual do restante do Auê. */
export function CascaInformativaOpenDesign({ children }: { readonly children: ReactNode }) {
  const navigate = useNavigate();
  const [forum] = useState(() => criarForumWeb());
  const [conta] = useState(() => criarContaWeb());
  const [comunidades, setComunidades] = useState<readonly ComunidadeDoForum[]>([]);
  const [estadoDasComunidades, setEstadoDasComunidades] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [tentativa, setTentativa] = useState(0);
  const [autenticado, setAutenticado] = useState(false);
  const [meuPerfil, setMeuPerfil] = useState<PerfilPublico | null>(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    let ativo = true;
    setEstadoDasComunidades('carregando');
    void forum.listarComunidadesDoForum().then((resultado) => {
      if (!ativo) return;
      if (!resultado.ok) { setEstadoDasComunidades('erro'); return; }
      setComunidades(resultado.valor);
      setEstadoDasComunidades('pronto');
    }).catch(() => { if (ativo) setEstadoDasComunidades('erro'); });
    return () => { ativo = false; };
  }, [forum, tentativa]);

  useEffect(() => {
    let ativo = true;
    void conta.estado().then(async (estado) => {
      if (!ativo) return;
      const entrou = estado.temSessao && !estado.anonima && !estado.perfilSocialPendente;
      setAutenticado(entrou);
      if (entrou) setMeuPerfil(await criarPerfilRemoto().obterMeuPerfil().catch(() => null));
    }).catch(() => { if (ativo) setAutenticado(false); });
    return () => { ativo = false; };
  }, [conta]);

  return (
    <div className="app od-informativo">
      <BarraLateral
        viewAtual="auth"
        estaAutenticado={autenticado}
        aoMudarView={() => undefined}
        aoAbrirGravadorRapido={() => navigate('/?gravar=1')}
        aoSair={async () => { await conta.sair(); navigate('/'); }}
        aoEntrar={() => navigate('/login?modo=entrar')}
      />
      <main className="od-informativo__main">
        <BarraSuperior busca={busca} estaAutenticado={autenticado} meuPerfil={meuPerfil} aoBuscar={setBusca} aoEntrar={() => navigate('/login?modo=entrar')} />
        <div className="publico-site od-informativo__content">{children}</div>
      </main>
      <PainelDireito comunidades={comunidades} viewAtual="auth" estaAutenticado={autenticado} contaPerfil={meuPerfil} estadoDasComunidades={estadoDasComunidades} aoTentarComunidades={() => setTentativa((atual) => atual + 1)} aoAbrirComunidade={() => undefined} />
    </div>
  );
}
