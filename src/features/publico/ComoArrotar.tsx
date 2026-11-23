import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutArenaPublica as LayoutPublico } from './LayoutArenaPublica';
import './ComoArrotar.css';

interface Tecnica {
  readonly titulo: string;
  readonly intro: string;
  readonly passos: readonly string[];
  readonly erro?: string;
  readonly sinal: string;
  readonly arte?: { readonly src: string; readonly alt: string };
}

/* Técnicas em seção chapada, sem card (DESIGN §4.1). O texto também vive no <noscript> de paginas/como-arrotar.html. */
const TECNICAS: readonly Tecnica[] = [
  {
    titulo: 'Como arrotar de propósito: engolir ar no seco',
    intro: 'É o método que mais se repete nos guias, e funciona porque você manda o ar pro lugar certo. Pra não depender da sorte depois do almoço, começa por aqui.',
    passos: [
      'Senta com a coluna reta. Em pé também vale, mas sentado o ar junta no alto do estômago e sai melhor.',
      'Solta todo o ar dos pulmões.',
      'Puxa o ar pela boca e segura um instante.',
      'Solta, puxa de novo e engole esse ar como se fosse um gole de água, só que de ar.',
      'Sente o ar parar no alto da garganta, relaxa e deixa subir de boca aberta.',
    ],
    erro: 'Puxar o peito pra cima em vez de engolir. O movimento é de engolir, não de inflar.',
    sinal: 'O ar sobe e a barriga não estufa. No começo sai só um arroto baixinho. Com treino, precisa de menos ar pra sair mais som.',
  },
  {
    titulo: 'Bebida com gás: o combustível certo',
    intro: 'Água com gás, refri ou cerveja gelada dão pressão no estômago na hora.',
    passos: [
      'Pega a bebida bem gelada.',
      'Manda dois ou três goles rápidos. Golinho devagar não resolve.',
      'Fica cinco segundos de coluna reta, sem se encolher.',
      'Solta com a garganta aberta.',
    ],
    erro: 'Virar a garrafa inteira de uma vez. Isso não é técnica, é aposta, e a barriga cobra.',
    sinal: 'Arroto limpo em poucos segundos, sem a barriga pesada.',
    arte: {
      src: '/ilustracoes/como-arrotar-gas-codex.png',
      alt: 'Ilustração estilizada de amigo em postura reta com garrafa de bebida com gás soltando bolhas laranja',
    },
  },
  {
    titulo: 'Chiclete e bala: o ar que entra sem você ver',
    intro: 'Mascar chiclete ou chupar bala faz você engolir mais vezes, e junto vai ar. Serve de aquecimento, não de técnica principal.',
    passos: [
      'Masca ou chupa por alguns minutos antes.',
      'Engole devagar, sem forçar.',
      'Quando sentir o ar subir, deixa sair.',
    ],
    sinal: 'Um arroto baixinho que veio quase sozinho.',
  },
  {
    titulo: 'Arroto alto: postura e garganta solta',
    intro: 'Esse é pra quando você quer que o outro lado da sala escute.',
    passos: [
      'Coluna reta e peito aberto.',
      'Estica o pescoço levemente pra frente.',
      'Relaxa a garganta. Garganta dura abafa o som.',
      'Empurra com a barriga e abre a boca.',
    ],
    erro: 'Fechar a garganta e tentar compensar na força.',
    sinal: 'Alguém pergunta “quem foi?”.',
    arte: {
      src: '/ilustracoes/como-arrotar-postura-codex.png',
      alt: 'Ilustração estilizada de turma de amigos rindo enquanto um solta ondas sonoras laranja',
    },
  },
  {
    titulo: 'Arroto longo: segurar e dosar o ar',
    intro: 'Aqui não pode soltar tudo num estouro só. A saída tem que ser aos poucos.',
    passos: [
      'Junta bastante ar, do jeito da primeira técnica.',
      'Mantém a garganta aberta.',
      'Vai dosando a saída com a barriga, devagar.',
      'Para antes de ficar sem ar. O som precisa acabar, não engasgar.',
    ],
    erro: 'Soltar tudo no começo. Sobra silêncio no resto.',
    sinal: 'A galera começa a rir antes de você terminar.',
  },
  {
    titulo: 'Arroto explosivo: curto e grosso',
    intro: 'Sem enrolação. É um RÁ seco e acabou.',
    passos: [
      'Junta o ar na garganta.',
      'Segura meio segundo.',
      'Solta tudo de uma pancada só.',
    ],
    sinal: 'Você se assusta junto com o resto da mesa.',
  },
  {
    titulo: 'Arroto grave: o trovão de dentro',
    intro: 'Pra puxar o grave, o fundo da garganta vira caixa de som.',
    passos: [
      'Abaixa um pouco o queixo.',
      'Deixa a boca menos aberta.',
      'Solta o ar usando o fundo da garganta, sem forçar a voz.',
    ],
    erro: 'Forçar a voz pra fingir grave. Isso machuca a garganta e não adianta.',
    sinal: 'Alguém olha em volta procurando de onde veio o barulho.',
  },
  {
    titulo: 'Como arrotar o alfabeto',
    intro: 'O truque clássico. Exige muito ar e controle, então deixa por último.',
    passos: [
      'Junta bastante ar, ou manda uns goles de bebida com gás.',
      'Solta um arroto contínuo, sem cortar.',
      'Mexe lábios e língua pra formar as letras enquanto o ar sai.',
      'Começa pelas primeiras letras. O alfabeto inteiro vem com treino.',
    ],
    erro: 'Querer o alfabeto inteiro na primeira tentativa. Passar do G já é uma obra.',
    sinal: 'Passou do G sem perder o fôlego.',
  },
];

const LENDAS: readonly { readonly titulo: string; readonly texto: string }[] = [
  {
    titulo: 'Apertar um ponto na perna e arrotar na hora',
    texto: 'Lenda. Um vídeo viral promete arrotar e desinchar em segundos tocando uma área da perna. A gente só achou o relato de quem postou, sem teste nenhum. Fica como lenda até alguém provar.',
  },
  {
    titulo: 'Sacudir o corpo e arrotar toda vez',
    texto: 'Lenda. Outro vídeo garante arroto “toda vez” sacudindo o corpo. É relato de uma pessoa, sem evidência. “Toda vez” não existe: corpo não é botão.',
  },
  {
    titulo: 'Respirar fundo, engolir o ar e soltar',
    texto: 'Verdade, com limite. É o método do ar engolido lá em cima, o único dessa lista que se repete nos guias de saúde que a gente leu. Funciona melhor com treino e não é mágica.',
  },
  {
    titulo: 'Beber uma garrafa inteira de refri de uma vez',
    texto: 'Meia verdade. Entra mais gás, mas entra também barriga estufada e desconforto. Mais ar não quer dizer arroto melhor.',
  },
  {
    titulo: 'O desafio do refrigerante: beber a garrafa sem arrotar',
    texto: 'Isso é desafio, não técnica. E teve gente que descobriu por causa dele que não consegue arrotar, e um médico explicou que pode ser uma condição de saúde. Se você nunca consegue arrotar e isso incomoda, fala com um médico.',
  },
];

const FONTES: readonly { readonly nome: string; readonly url: string }[] = [
  { nome: 'Medical News Today: como fazer a si mesmo arrotar', url: 'https://www.medicalnewstoday.com/articles/320276.php' },
  { nome: 'Medical News Today: arroto supragástrico e aerofagia', url: 'https://www.medicalnewstoday.com/articles/325121.php' },
  { nome: 'Healthdirect: arroto', url: 'https://www.healthdirect.gov.au/amp/article/burping' },
  { nome: 'Guts UK: distúrbios do arroto', url: 'https://gutscharity.org.uk/advice-and-information/conditions/belching-disorders/' },
  { nome: 'Cleveland Clinic: arroto', url: 'https://my.clevelandclinic.org/health/symptoms/belching' },
  { nome: 'Dexerto: o desafio do Sprite no TikTok', url: 'https://dexerto.com/entertainment/what-is-tiktoks-viral-sprite-challenge-1806382' },
  { nome: 'BroBible: o vídeo do arroto pela perna', url: 'https://brobible.com/culture/article/burp-debloat-acupuncture-legs/' },
];

export const ComoArrotar: React.FC = () => (
  <LayoutPublico
    eyebrow=""
    titulo=""
    resumo=""
    mostrarCta={false}
    ocultarHeroPadrao
  >
    <section className="guia-arena__hero como-arrotar-hero">
      <div className="como-arrotar-hero__texto">
        <span>Manual prático</span>
        <h1>Como arrotar</h1>
        <p>
          <strong>Todo mundo arrota. Alguns fazem no comando e com técnica.</strong>{' '}
          Aqui tem oito técnicas passo a passo, o que é lenda de internet e a hora de parar. Depois testa direto no microfone.
        </p>
        <Link className="como-arrotar-hero__cta" to="/">
          Testar no microfone
        </Link>
      </div>
      <div className="como-arrotar-hero__arte">
        <img
          src="/ilustracoes/como-arrotar-comando-codex.png"
          alt="Ilustração estilizada de amigo de boné pra trás soltando ondas sonoras laranja"
        />
      </div>
    </section>

    <div className="guia-arena__secoes">
      <section className="como-arrotar-bloco" aria-label="Antes de começar">
        <span className="como-arrotar-rotulo">Antes de começar</span>
        <div className="como-arrotar-tecnica">
          <h2>Arrotar é pra dar risada, não pra se machucar</h2>
          <p>Arroto é ar que sobe do estômago ou da garganta. Todas as técnicas daqui jogam com isso: deixar entrar um pouco de ar, esperar ele subir e soltar com controle.</p>
          <p>Se doer, estufar ou der enjoo, para. Engolir ar demais deixa a barriga inchada e dá cólica. Isso aqui é brincadeira entre amigos, não orientação médica.</p>
        </div>
      </section>

      <section className="como-arrotar-bloco" aria-label="Técnicas passo a passo">
        <span className="como-arrotar-rotulo">Técnicas passo a passo</span>
        {TECNICAS.map((tecnica, indice) => (
          <article className="como-arrotar-tecnica" key={tecnica.titulo}>
            <div className="como-arrotar-tecnica__texto">
              <span className="como-arrotar-tecnica__num">Técnica {String(indice + 1).padStart(2, '0')}</span>
              <h2>{tecnica.titulo}</h2>
              <p>{tecnica.intro}</p>
              <ol className="como-arrotar-tecnica__passos">
                {tecnica.passos.map((passo) => <li key={passo}>{passo}</li>)}
              </ol>
              {tecnica.erro && <p><strong>Erro comum:</strong> {tecnica.erro}</p>}
              <p><strong>Bom sinal:</strong> {tecnica.sinal}</p>
            </div>
            {tecnica.arte && (
              <div className="como-arrotar-tecnica__arte">
                <img src={tecnica.arte.src} alt={tecnica.arte.alt} loading="lazy" />
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="como-arrotar-bloco" aria-label="Clickbait">
        <span className="como-arrotar-rotulo">Clickbait</span>
        <div className="como-arrotar-tecnica">
          <h2>Os truques de clickbait: o que é verdade e o que é lenda</h2>
          <p>Todo mês aparece um vídeo prometendo arroto na hora, em segundos, garantido. A gente olhou o que circula e separou. Onde não achamos prova, dizemos que não achamos.</p>
          {LENDAS.map((lenda) => (
            <div className="como-arrotar-lenda" key={lenda.titulo}>
              <h3>{lenda.titulo}</h3>
              <p>{lenda.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="como-arrotar-bloco" aria-label="Saúde">
        <span className="como-arrotar-rotulo">Saúde</span>
        <div className="como-arrotar-tecnica">
          <h2>Quando parar e falar com um médico</h2>
          <p>Arrotar de vez em quando é normal. Sem outros sintomas e sem atrapalhar o seu dia, em geral não precisa de médico.</p>
          <p>Procura atendimento se você arrota bem mais que o normal, se dói, ou se vem junto dor forte e que não passa na barriga, febre, desconforto no peito, diarreia, sensação de estar cheio rápido ou perda de peso sem querer. Dor forte no peito ou sintoma grave, vai direto pra emergência. Isso também não é orientação médica.</p>
        </div>
      </section>

      <section className="como-arrotar-bloco" aria-label="Etiqueta">
        <span className="como-arrotar-rotulo">Regras de convivência</span>
        <div className="como-arrotar-tecnica">
          <h2>Como perder a vergonha de arrotar em público</h2>
          <p>Escapou um entre amigos que entram na zoeira? Assume na hora: um “esse veio sincero” já resolve. Vergonha é não assumir uma obra quando ela sai.</p>
          <p>Num jantar formal, reunião ou perto de quem claramente não curte, segura a onda. E se ainda trava, começa na sua turma: todo mundo que manda bem já teve primeira plateia.</p>
        </div>
      </section>

      <section className="como-arrotar-bloco" aria-label="Fontes">
        <span className="como-arrotar-rotulo">Fontes</span>
        <div className="como-arrotar-tecnica">
          <h2>De onde veio esse conteúdo</h2>
          <p>Resumimos guias de saúde e relatos de vídeos virais. Os links estão aqui pra você conferir.</p>
          <ul className="como-arrotar-fontes">
            {FONTES.map((fonte) => (
              <li key={fonte.url}><a href={fonte.url} target="_blank" rel="noopener noreferrer">{fonte.nome}</a></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="guia-arena__cta">
        <h2>Treinou? Testa agora no microfone.</h2>
        <p>Não precisa baixar app nem criar conta. Abre a Arena direto no navegador, grava seu arroto, ouve o replay e confere a medição experimental na hora.</p>
        <p>Se a obra merecer plateia, manda pra galera.</p>
        <Link to="/">Gravar meu arroto</Link>
      </section>
    </div>
  </LayoutPublico>
);
