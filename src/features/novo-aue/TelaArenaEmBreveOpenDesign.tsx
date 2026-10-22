import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarForumWeb } from '../../plataforma/web/forum';
import { criarPerfilRemoto } from '../../plataforma/web/perfilRemoto';
import type { ComunidadeDoForum } from '../../portas/forum';
import type { PerfilPublico } from '../../portas/perfil';
import { BarraLateral } from './BarraLateral';
import { BarraSuperior } from './BarraSuperior';
import { PainelDireito } from './PainelDireito';
import './casca.css';
import './TelaArenaEmBreveOpenDesign.css';

/** Explica a Arena sem se passar por uma partida disponível. */
export function TelaArenaEmBreveOpenDesign() {
  const navigate = useNavigate();
  const [comunidades, setComunidades] = useState<readonly ComunidadeDoForum[]>([]);
  const [estadoDasComunidades, setEstadoDasComunidades] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [autenticado, setAutenticado] = useState(false);
  const [meuPerfil, setMeuPerfil] = useState<PerfilPublico | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    const forum = criarForumWeb();
    void forum.listarComunidadesDoForum().then((resultado) => {
      if (!ativo) return;
      if (!resultado.ok) { setEstadoDasComunidades('erro'); return; }
      setComunidades(resultado.valor);
      setEstadoDasComunidades('pronto');
    }).catch(() => { if (ativo) setEstadoDasComunidades('erro'); });
    return () => { ativo = false; };
  }, [tentativa]);

  useEffect(() => {
    let ativo = true;
    const conta = criarContaWeb();
    void conta.estado().then(async (estado) => {
      if (!ativo) return;
      const entrou = estado.temSessao && !estado.anonima && !estado.perfilSocialPendente;
      setAutenticado(entrou);
      if (entrou) setMeuPerfil(await criarPerfilRemoto().obterMeuPerfil().catch(() => null));
    }).catch(() => { if (ativo) setAutenticado(false); });
    return () => { ativo = false; };
  }, []);

  return (
    <div className="app od-arena-coming" data-testid="arena-em-breve">
      <BarraLateral
        viewAtual="arena"
        estaAutenticado={autenticado}
        aoMudarView={() => undefined}
        aoAbrirGravadorRapido={() => navigate('/?gravar=1')}
        aoSair={async () => { await criarContaWeb().sair(); navigate('/'); }}
        aoEntrar={() => navigate('/login?modo=entrar')}
      />
      <main className="od-arena-coming__main">
        <BarraSuperior busca="" estaAutenticado={autenticado} meuPerfil={meuPerfil} aoBuscar={() => undefined} aoEntrar={() => navigate('/login?modo=entrar')} mostrarBusca={false} />
        <section className="od-arena-coming__content" aria-labelledby="arena-em-breve-titulo">
          <header className="od-arena-coming__hero">
            <span className="od-arena-coming__badge">Arena · em breve</span>
            <div className="od-arena-coming__mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M6 10a6 6 0 0 0 12 0M12 16v5M8.5 21h7" />
              </svg>
            </div>
            <h1 id="arena-em-breve-titulo">Aqui o arroto vira jogo.</h1>
            <p>Você solta, o juiz confere e a nota sai na hora. Depois, a resenha é sua — publica se quiser ou chama alguém pro X1.</p>
          </header>

          <ol className="od-arena-coming__steps" aria-label="Como a Arena vai funcionar">
            <li>
              <span>01</span>
              <div><h2>Solta um</h2><p>A gravação só começa quando você pedir. Nada sai do seu microfone por conta própria.</p></div>
            </li>
            <li>
              <span>02</span>
              <div><h2>O juiz confere</h2><p>O som passa pela análise e vira uma nota de 0 a 100, com força, fôlego e grave na resenha.</p></div>
            </li>
            <li>
              <span>03</span>
              <div><h2>Escolhe o próximo passo</h2><p>Guarda pra você, publica na Tropa ou manda um desafio privado de X1 para alguém.</p></div>
            </li>
          </ol>

          <footer className="od-arena-coming__footer">
            <p>A Arena ainda está sendo preparada. Quando abrir, gravar para jogar não vai publicar nada sem o seu ok.</p>
            <Link to="/">Voltar pro feed</Link>
          </footer>
        </section>
      </main>
      <PainelDireito comunidades={comunidades} viewAtual="arena" estaAutenticado={autenticado} contaPerfil={meuPerfil} estadoDasComunidades={estadoDasComunidades} aoTentarComunidades={() => setTentativa((atual) => atual + 1)} aoAbrirComunidade={() => undefined} />
    </div>
  );
}
