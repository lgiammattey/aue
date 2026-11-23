import './conteudoDaHome.css';
import { AdsterraBanner300x250 } from '../../shared/components/AdsterraBanner300x250';
import { GruposNaHome } from './GruposNaHome';

const TIPOS_DE_ARROTO = [
  {
    numero: '01',
    nome: 'O Trovão',
    criterio: 'Impacto bruto',
    descricao:
      'Volume absurdo, pancada seca e grave no peito. Aquele arroto que interrompe a conversa na mesa inteira.',
  },
  {
    numero: '02',
    nome: 'O Trator',
    criterio: 'Resistência',
    descricao:
      'Arroto longo que parece motor ligado e não acaba nunca. Passar de 3 segundos pede ar guardado e garganta bem solta.',
  },
  {
    numero: '03',
    nome: 'A Rajada',
    criterio: 'Cadência',
    descricao:
      'Vários mini-arrotos picotados um atrás do outro, sem respirar no meio.',
  },
  {
    numero: '04',
    nome: 'O Fraseado',
    criterio: 'Controle vocal',
    descricao:
      'Quando o cara consegue falar uma palavra inteira ou mandar o alfabeto arrotando enquanto o gás sobe.',
  },
  {
    numero: '05',
    nome: 'O Sopro Oco',
    criterio: 'Só vento',
    descricao:
      'Muito esforço pra sair só ar fino. Sem vibração de verdade, o medidor nem conta como arroto.',
  },
] as const;

/** Conteúdo público indexável exibido abaixo da Arena na página inicial, sem cards. */
export function ConteudoDaHome() {
  return (
    <div className="conteudo-home" aria-label="Guia e comunidade do Auê">
      <div className="conteudo-home__interno">
        <section id="como-arrotar" className="conteudo-home__bloco" aria-labelledby="home-como-arrotar">
          <div className="conteudo-home__cabeca">
            <span>MANUAL PRÁTICO</span>
            <h2 id="home-como-arrotar">Como arrotar</h2>
            <p>
              Do básico pra arrotar de propósito até mandar o alfabeto sem passar mal.
            </p>
          </div>

          <div className="conteudo-home__passo">
            <div className="conteudo-home__passo-texto">
              <span className="conteudo-home__etiqueta">01 · NO COMANDO</span>
              <h3>Como arrotar de propósito</h3>
              <p>
                Fecha a boca, junta um pouco de ar e engole no seco, como se fosse uma pílula invisível. O ar fica preso ali no alto da garganta.
              </p>
              <p>
                Na hora de soltar, dá uma contraída leve na barriga, relaxa a garganta e abre a boca pro som sair encorpado. Se começar a ficar estufado, para e toma água.
              </p>
            </div>
            <img
              className="conteudo-home__arte"
              src="/ilustracoes/como-arrotar-comando-codex.png"
              alt="Ilustração estilizada de amigo de boné pra trás soltando ondas sonoras laranja"
              loading="lazy"
            />
          </div>

          <div className="conteudo-home__passo conteudo-home__passo--invertido">
            <div className="conteudo-home__passo-texto">
              <span className="conteudo-home__etiqueta">02 · COMBUSTÍVEL</span>
              <h3>Bebida com gás e postura reta</h3>
              <p>
                Água com gás, refri ou cerveja gelada dão pressão na hora. Dois ou três goles rápidos e cinco segundos com a coluna reta já resolvem. Não precisa virar a garrafa inteira de uma vez.
              </p>
            </div>
            <img
              className="conteudo-home__arte"
              src="/ilustracoes/como-arrotar-gas-codex.png"
              alt="Ilustração estilizada de amigo em postura reta com garrafa de bebida com gás soltando bolhas laranja"
              loading="lazy"
            />
          </div>

          <div className="conteudo-home__passo">
            <div className="conteudo-home__passo-texto">
              <span className="conteudo-home__etiqueta">03 · VOLUME E ALFABETO</span>
              <h3>Garganta solta e controle do ar</h3>
              <p>
                Estica leve o pescoço pra frente, abre o peito e não trava a garganta. Garganta dura abafa o som.
              </p>
              <p>
                Pro <strong>arroto alto</strong>, empurra o ar todo de uma vez. Pro <strong>arroto longo</strong> ou pra <strong>arrotar o alfabeto</strong>, vai soltando aos poucos e mexendo os lábios e a língua pra formar cada letra sem cortar o gás.
              </p>
            </div>
            <img
              className="conteudo-home__arte"
              src="/ilustracoes/como-arrotar-postura-codex.png"
              alt="Ilustração estilizada de turma de amigos rindo enquanto um solta ondas sonoras laranja"
              loading="lazy"
            />
          </div>
        </section>

        <section id="tipos-de-arroto" className="conteudo-home__bloco" aria-labelledby="home-tipos-arroto">
          <div className="conteudo-home__cabeca">
            <span>CLASSIFICAÇÃO</span>
            <h2 id="home-tipos-arroto">Tipos de arroto</h2>
            <p>
              Cada jeito de soltar o gás bate diferente no microfone.
            </p>
          </div>

          <ol className="conteudo-home__lista-tipos">
            {TIPOS_DE_ARROTO.map((tipo) => (
              <li key={tipo.numero} className="conteudo-home__tipo-item">
                <span className="conteudo-home__tipo-num">{tipo.numero}</span>
                <div className="conteudo-home__tipo-info">
                  <div className="conteudo-home__tipo-topo">
                    <h3>{tipo.nome}</h3>
                    <span>{tipo.criterio}</span>
                  </div>
                  <p>{tipo.descricao}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="conteudo-home__anuncio">
          <AdsterraBanner300x250 />
        </div>

        <section id="grupos" className="conteudo-home__secao" aria-label="Grupos de WhatsApp">
          <span>MANDE A NOTA NOS GRUPOS</span>
          <div>
            <h2>Arrote aqui e jogue a nota no grupo</h2>
            <p>
              Testou no microfone lá em cima? Copia o link ou manda o resultado direto pro grupo do WhatsApp e vê quem tem coragem de responder.
            </p>
            <GruposNaHome />
            <div className="conteudo-home__atalhos">
              <a className="conteudo-home__cta-mural" href="/feed">
                Abrir Mural <span aria-hidden="true">↗</span>
              </a>
              <a href="/grupos">Ver todos os grupos</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
