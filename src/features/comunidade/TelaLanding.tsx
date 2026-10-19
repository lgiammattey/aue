import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import '../../shared/publico/tema-claro.css';
import './TelaLanding.css';
import { useEntrarNaConta } from './useEntrarNaConta';
import type { PortaDeConta } from '../../portas/conta';

/**
 * A landing de `/`, fiel a `docs/design/prototipo/Landing.dc.html`.
 *
 * O Auê está fechado pra quem não tem conta, e é isso que a tela diz:
 * - só entra quem já tem conta (e-mail e senha, a mesma entrada do `/login`);
 * - "Tenho convite" e "Pedir convite" aparecem desabilitados, porque o convite
 *   ainda não existe no backend. Botão sem backend não finge que funciona;
 * - não há "Criar conta" nem "Continuar com Google";
 * - quem só quer ouvir vai direto pras comunidades, sem conta.
 *
 * Tema claro fixo, como as páginas públicas. O cartão de exemplo é marcado como
 * exemplo: o que está nele não é conversa de verdade.
 */
interface TelaLandingProps {
  onEntrarSemConta?: () => void;
  onArrotar?: () => void;
  portaConta?: PortaDeConta;
}

const ONDA = Array.from({ length: 30 }, (_, i) => 5 + Math.abs(Math.sin(i * 1.7 + 4)) * 18);

const PASSOS = [
  {
    n: '01',
    t: 'Ache sua turma',
    d: 'Entre nas comunidades. Tem gente que arrota, gente que quer aprender e gente que só gosta de ouvir.',
  },
  {
    n: '02',
    t: 'Participe da resenha',
    d: 'Conte uma história, ouça os áudios e responda quem está na conversa.',
  },
  {
    n: '03',
    t: 'Teste na Arena',
    d: 'Grave um arroto, veja a nota e chame alguém pro X1.',
  },
];

export const TelaLanding: React.FC<TelaLandingProps> = ({ onEntrarSemConta, onArrotar, portaConta }) => {
  const { erro, info, carregando, entrar, mandarLinkDeSenha, limpar } = useEntrarNaConta(portaConta);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [esqueci, setEsqueci] = useState(false);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (carregando) return;
    void (esqueci ? mandarLinkDeSenha(email) : entrar(email, senha));
  };

  return (
    <div className="publico-site landing">
      <header className="landing-topo">
        <span className="publico-marca" aria-label="Auê!">
          auê<span>!</span>
        </span>
        <Link className="landing-olhada" to="/comunidades" onClick={() => onEntrarSemConta?.()}>
          Só quero ouvir
        </Link>
      </header>

      <main>
        <section className="landing-miolo">
          <div className="landing-texto">
            <div>
              <h1>Arrotar é um dom. Aqui, ele tem turma.</h1>
              <p>
                O Auê é a comunidade de quem gosta de arrotar: histórias, áudios e desafios.
                Arrota, aprende ou só vem ouvir. O importante é participar da resenha.
              </p>
            </div>

            <div className="landing-previa" aria-label="Exemplo de conversa">
              <div className="landing-previa-topo">
                <span>Eu arroto, e daí?</span>
                <span>Exemplo</span>
              </div>
              <div className="landing-previa-corpo">
                <b>Arrotos em lugares proibidos</b>
                <div className="landing-fala">
                  <span className="landing-avatar">CA</span>
                  <div>
                    <b>@camillo</b> Já arrotei no banheiro do shopping e acharam que tinha explodido
                    alguma coisa.
                  </div>
                </div>
                <div className="landing-fala">
                  <span className="landing-avatar">DA</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div>
                      <b>@danigas</b> Minha tentativa na Arena, igreja ao fundo.
                    </div>
                    <div className="landing-audio" aria-hidden="true">
                      <span className="landing-play">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7 4l13 8-13 8z" />
                        </svg>
                      </span>
                      <div className="landing-onda">
                        {ONDA.map((altura, i) => (
                          <i key={i} style={{ height: altura }} />
                        ))}
                      </div>
                      <span className="landing-nota">91</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="landing-cartao">
            <div className="landing-abas" role="tablist" aria-label="Como entrar">
              <button type="button" role="tab" className="landing-aba" aria-selected="true">
                Entrar
              </button>
              <button
                type="button"
                role="tab"
                className="landing-aba"
                aria-selected="false"
                disabled
                title="Em breve"
              >
                Tenho convite
              </button>
              <button
                type="button"
                role="tab"
                className="landing-aba"
                aria-selected="false"
                disabled
                title="Em breve"
              >
                Pedir convite
              </button>
            </div>

            <div>
              <h2>{esqueci ? 'Esqueceu a senha?' : 'Entrar'}</h2>
              <p className="publico-aviso" style={{ marginTop: 4 }}>
                {esqueci
                  ? 'Mandamos um link pro seu e-mail.'
                  : 'Para quem já tem conta. Convites e novos cadastros chegam em breve.'}
              </p>
            </div>

            <form onSubmit={enviar} noValidate>
              <input
                className="publico-campo"
                type="email"
                placeholder="E-mail"
                autoComplete="username"
                aria-label="E-mail"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  limpar();
                }}
              />
              {!esqueci && (
                <input
                  className="publico-campo"
                  type="password"
                  placeholder="Senha"
                  autoComplete="current-password"
                  aria-label="Senha"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    limpar();
                  }}
                />
              )}
              {erro && (
                <p className="publico-erro" role="alert">
                  {erro}
                </p>
              )}
              {info && (
                <p className="publico-aviso" role="status">
                  {info}
                </p>
              )}
              <button
                type="submit"
                className="publico-pilula publico-pilula-escura publico-pilula-grande"
                disabled={carregando}
              >
                {esqueci ? 'Mandar o link' : 'Entrar'}
              </button>
              <button
                type="button"
                className="landing-link"
                onClick={() => {
                  setEsqueci((v) => !v);
                  limpar();
                }}
              >
                {esqueci ? 'Voltar pra entrada' : 'Esqueci minha senha'}
              </button>
            </form>

            <p className="landing-nota-rodape">
              Só quer ouvir? Fica à vontade: qualquer pessoa lê e ouve sem conta. A piada é com o
              arroto, nunca com a pessoa.
            </p>
          </div>
        </section>

        <section className="landing-passos">
          <div className="landing-passos-inner">
            {PASSOS.map(({ n, t, d }) => (
              <div className="landing-passo" key={n}>
                <span>{n}</span>
                <b>{t}</b>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-arena">
          <div className="landing-arena-inner">
            <div className="landing-arena-texto">
              <h2>Acha que arrota bem?</h2>
              <p>Solta um e vê a nota. Publicar o resultado é sempre escolha sua.</p>
            </div>
            <Link
              className="publico-pilula publico-pilula-accent"
              to="/arena"
              onClick={() => onArrotar?.()}
            >
              Ir pra Arena
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-rodape">
        <span>© 2026 Auê!</span>
        <nav aria-label="Links institucionais">
          <Link to="/como-jogar">Como funciona</Link>
          <Link to="/comunidade">Comunidades</Link>
          <Link to="/grupos">Grupos externos</Link>
          <Link to="/videos-de-arroto">Vídeos</Link>
          <Link to="/termos">Termos</Link>
          <Link to="/privacidade">Privacidade</Link>
        </nav>
      </footer>
    </div>
  );
};
