import { useEffect, useState } from 'react';
import { gerarMatrizQr, ladoComMargem, matrizParaPath, type MatrizQr } from '../../shared/desktop/qr';

type AppDaCasa = {
  readonly nome: string;
  readonly loja: 'Google Play' | 'App Store';
  readonly urlDaLoja: string;
  readonly urlDoSite: string;
  readonly logo: string;
  readonly variacao: 'sinal' | 'lag' | 'linka';
};

type Campanha = AppDaCasa & {
  readonly chamada: string;
  readonly descricao: string;
  readonly cta: string;
};

const SIGNALLQ: AppDaCasa = {
  nome: 'SignallQ',
  loja: 'Google Play',
  urlDaLoja: 'https://play.google.com/store/apps/details?id=io.signallq.app',
  urlDoSite: 'https://signallq.com',
  logo: '/ecossistema/signallq.png',
  variacao: 'sinal',
};

const LAGCHECK: AppDaCasa = {
  nome: 'Lagcheck',
  loja: 'App Store',
  urlDaLoja: 'https://apps.apple.com/app/id6818706960',
  urlDoSite: 'https://lagcheck.signallq.com',
  logo: '/ecossistema/lagcheck.png',
  variacao: 'lag',
};

const LINKA: AppDaCasa = {
  nome: 'Linka',
  loja: 'App Store',
  urlDaLoja: 'https://apps.apple.com/br/app/linka-wi-fi-e-internet/id6808479321',
  urlDoSite: 'https://linka.signallq.com',
  logo: '/ecossistema/linka.png',
  variacao: 'linka',
};

const CAMPANHAS: readonly Campanha[] = [
  {
    ...SIGNALLQ,
    chamada: 'A conexão tá uma merda?',
    descricao: 'O SignallQ separa Wi-Fi ruim de provedor ruim.',
    cta: 'Investigar agora',
  },
  {
    ...SIGNALLQ,
    chamada: 'Internet boa não é sorte.',
    descricao: 'Vê o que está ferrando a tua conexão antes de xingar.',
    cta: 'Entender a rede',
  },
  {
    ...SIGNALLQ,
    chamada: 'Caiu de novo?',
    descricao: 'Diagnóstico claro do teu sinal, sem conversa de técnico.',
    cta: 'Checar sinal',
  },
  {
    ...LAGCHECK,
    chamada: 'Foi lag ou foi braço?',
    descricao: 'Mede ping e jitter antes de culpar o servidor.',
    cta: 'Testar o lag',
  },
  {
    ...LAGCHECK,
    chamada: 'Rage sem prova não vale.',
    descricao: 'Descobre onde a partida começou a engasgar.',
    cta: 'Medir agora',
  },
  {
    ...LAGCHECK,
    chamada: 'Ping alto dá desgosto.',
    descricao: 'Vê se a culpa é da rede ou do teu jogo.',
    cta: 'Abrir Lagcheck',
  },
  {
    ...LINKA,
    chamada: 'Seu Wi-Fi fala.',
    descricao: 'O Linka traduz a bagunça da tua conexão.',
    cta: 'Ler minha rede',
  },
  {
    ...LINKA,
    chamada: 'Wi-Fi não tem que ser mistério.',
    descricao: 'Mede tua conexão sem dar voltas.',
    cta: 'Ver a conexão',
  },
  {
    ...LINKA,
    chamada: 'Antes de reiniciar tudo…',
    descricao: 'Descobre o que rolou na rede com o Linka.',
    cta: 'Abrir Linka',
  },
];

function sortearCampanha(): Campanha {
  return CAMPANHAS[Math.floor(Math.random() * CAMPANHAS.length)];
}

function QrDaLoja({ url, nome }: { readonly url: string; readonly nome: string }) {
  const [matriz, setMatriz] = useState<MatrizQr | null>(null);

  useEffect(() => {
    let ativo = true;
    void gerarMatrizQr(url).then((proximaMatriz) => {
      if (ativo) setMatriz(proximaMatriz);
    });

    return () => {
      ativo = false;
    };
  }, [url]);

  if (!matriz) return <span className="vitrine-apps__qr vitrine-apps__qr--carregando" aria-label={`Carregando QR para ${nome}`} />;

  const lado = ladoComMargem(matriz);
  return (
    <svg className="vitrine-apps__qr" viewBox={`0 0 ${lado} ${lado}`} role="img" aria-label={`QR para baixar ${nome}`}>
      <rect width={lado} height={lado} fill="#fff" />
      <path d={matrizParaPath(matriz)} fill="#0d0d0d" />
    </svg>
  );
}

export function VitrineDeApps({ posicionamento = 'sidebar' }: { readonly posicionamento?: 'sidebar' | 'feed' }) {
  const [campanha] = useState(sortearCampanha);

  return (
    <section className={`vitrine-apps vitrine-apps--${campanha.variacao} vitrine-apps--${posicionamento}`} aria-label={`Anúncio do ${campanha.nome}`}>
      <span className="vitrine-apps__identificador">Anúncio</span>
      <div className="vitrine-apps__conteudo">
        <a className="vitrine-apps__site" href={campanha.urlDoSite} target="_blank" rel="noreferrer" aria-label={`${campanha.cta}: conhecer ${campanha.nome}`}>
          <img className="vitrine-apps__logo" src={campanha.logo} alt={`Logo oficial do ${campanha.nome}`} />
          <span className="vitrine-apps__copy">
            <strong>{campanha.chamada}</strong>
            <span>{campanha.descricao}</span>
            <small>{campanha.nome} · Conhecer ↗</small>
          </span>
        </a>
        <a className="vitrine-apps__qr-wrap" href={campanha.urlDaLoja} target="_blank" rel="noreferrer" aria-label={`Baixar ${campanha.nome} na ${campanha.loja}`}>
          <QrDaLoja url={campanha.urlDaLoja} nome={campanha.nome} />
          <span>Loja</span>
        </a>
      </div>
    </section>
  );
}
