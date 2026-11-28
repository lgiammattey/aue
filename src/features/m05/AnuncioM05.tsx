import { useSyncExternalStore } from 'react';
import { ADSTERRA_CONFIG, larguraDesktopParaPublicidade, observarLarguraParaPublicidade } from '../../plataforma/web/adsterra';
import { AdsterraBanner300x250 } from '../../shared/components/AdsterraBanner300x250';
import { AdsterraNativeBanner } from '../../shared/components/AdsterraNativeBanner';
import { usePublicidadeAdsterra } from '../../shared/components/usePublicidadeAdsterra';
import type { IdiomaM05 } from './NavegacaoM05';
import './anuncioM05.css';

type Area = 'inicio' | 'resenha' | 'disputas' | 'perfil' | 'resultado';
type Visibilidade = 'desktop' | 'mobile' | 'todas';

const configuracao = {
  inicio: { desktop: 1, mobile: 1, maximo: 1 },
  resenha: { desktop: 5, mobile: 6, maximo: 3 },
  disputas: { desktop: 5, mobile: 6, maximo: 1 },
  perfil: { desktop: 1, mobile: 1, maximo: 1 },
  resultado: { desktop: 1, mobile: 1, maximo: 1 },
} satisfies Record<Area, { desktop: number; mobile: number; maximo: number }>;

const frequencias = {
  inicio: import.meta.env.VITE_ADSTERRA_FREQUENCIA_INICIO,
  resenha: import.meta.env.VITE_ADSTERRA_FREQUENCIA_RESENHA,
  disputas: import.meta.env.VITE_ADSTERRA_FREQUENCIA_DISPUTAS,
  perfil: import.meta.env.VITE_ADSTERRA_FREQUENCIA_PERFIL,
  resultado: import.meta.env.VITE_ADSTERRA_FREQUENCIA_RESULTADO,
} satisfies Record<Area, string | undefined>;

function frequenciaConfigurada(area: Area, padrao: number): number {
  const valor = Number(frequencias[area]);
  return Number.isInteger(valor) && valor >= 1 && valor <= 12 ? valor : padrao;
}

export function AnuncioM05({ area, aposItem, lateral = false, idioma = 'pt' }: {
  readonly area: Area;
  readonly aposItem?: number;
  readonly lateral?: boolean;
  readonly idioma?: IdiomaM05;
}) {
  const publicidadePermitida = usePublicidadeAdsterra();
  const emLarguraDesktop = useSyncExternalStore(observarLarguraParaPublicidade, larguraDesktopParaPublicidade, () => false);
  const { desktop: desktopPadrao, mobile: mobilePadrao, maximo } = configuracao[area];
  const desktop = frequenciaConfigurada(area, desktopPadrao);
  const mobile = frequenciaConfigurada(area, mobilePadrao);
  const cabeEm = (intervalo: number) => aposItem === undefined || (
    aposItem > 0 && aposItem % intervalo === 0 && aposItem / intervalo <= maximo
  );
  const emDesktop = cabeEm(desktop);
  const emMobile = !lateral && cabeEm(mobile);
  if (!emDesktop && !emMobile) return null;
  const visibilidade: Visibilidade = emDesktop && emMobile ? 'todas' : emDesktop ? 'desktop' : 'mobile';
  const rotulo = idioma === 'en' ? 'Simulated ad' : 'Publicidade simulada';

  if (publicidadePermitida) {
    if (!(emLarguraDesktop ? emDesktop : emMobile)) return null;
    const rotuloAnuncio = idioma === 'en' ? 'Sponsored' : 'Patrocinado';
    return (
      <div className="m05-anuncio--real" data-placement={area}>
        {area === 'inicio'
          ? <AdsterraNativeBanner rotulo={rotuloAnuncio} />
          : <AdsterraBanner300x250 rotulo={rotuloAnuncio} />}
      </div>
    );
  }

  // A simulação nunca chama a rede e mantém o espaço visível durante a prova local.
  if (!import.meta.env.DEV || import.meta.env.VITE_M05_ANUNCIOS !== 'simular') return null;

  return (
    <aside
      className={`m05-anuncio m05-anuncio--${visibilidade}${lateral ? ' m05-anuncio--lateral' : ''}`}
      data-placement={area}
      aria-label={rotulo}
    >
      <span>{rotulo}</span>
      {lateral && <small>{ADSTERRA_CONFIG.banner300x250Width} × {ADSTERRA_CONFIG.banner300x250Height}</small>}
    </aside>
  );
}
