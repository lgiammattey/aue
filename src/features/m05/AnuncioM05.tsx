import { ADSTERRA_CONFIG } from '../../plataforma/web/adsterra';
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

export function AnuncioM05({ area, aposItem, lateral = false, idioma = 'pt' }: {
  readonly area: Area;
  readonly aposItem?: number;
  readonly lateral?: boolean;
  readonly idioma?: IdiomaM05;
}) {
  // A M06 decide a ativação dos criativos. Este modo nunca carrega a rede de anúncios.
  if (!import.meta.env.DEV || import.meta.env.VITE_M05_ANUNCIOS !== 'simular') return null;
  const { desktop, mobile, maximo } = configuracao[area];
  const cabeEm = (intervalo: number) => aposItem === undefined || (
    aposItem > 0 && aposItem % intervalo === 0 && aposItem / intervalo <= maximo
  );
  const emDesktop = cabeEm(desktop);
  const emMobile = !lateral && cabeEm(mobile);
  if (!emDesktop && !emMobile) return null;
  const visibilidade: Visibilidade = emDesktop && emMobile ? 'todas' : emDesktop ? 'desktop' : 'mobile';
  const rotulo = idioma === 'en' ? 'Simulated ad' : 'Publicidade simulada';

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
