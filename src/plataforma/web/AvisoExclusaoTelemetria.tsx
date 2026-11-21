import type { EstadoExclusaoTelemetria } from './exclusaoTelemetria';
import type { ReactNode } from 'react';

/** Não altera a geometria do app em visitas comuns. */
export function ComAvisoExclusaoTelemetria({ estado, children }: { readonly estado: EstadoExclusaoTelemetria; readonly children: ReactNode }) {
  if (estado === 'nenhuma') return children;
  return <div style={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <AvisoExclusaoTelemetria estado={estado} />{children}
  </div>;
}

/** Aparece apenas ao acessar os links de preferência, sem criar uma tela fixa. */
export function AvisoExclusaoTelemetria({ estado }: { readonly estado: EstadoExclusaoTelemetria }) {
  if (estado === 'nenhuma') return null;
  const ativou = estado === 'ativada' || estado === 'ativacao_nao_persistida';
  return <aside role="status" style={{ alignSelf: 'stretch', padding: '12px 16px', background: '#20201d', color: '#fff', lineHeight: 1.5 }}>
    {estado === 'ativada' && 'Este navegador foi excluído da contagem de telemetria. A preferência vale por até um ano ou até você apagar os cookies.'}
    {estado === 'ativacao_nao_persistida' && 'Esta visita não será contada, mas o navegador não confirmou o cookie. A exclusão pode não continuar nas próximas visitas.'}
    {estado === 'desativada' && 'A exclusão foi removida deste navegador. As próximas atividades poderão ser contadas.'}
    {estado === 'desativacao_nao_confirmada' && 'Não foi possível confirmar a remoção da exclusão. Verifique os cookies do navegador e tente novamente.'}
    {' '}<a style={{ color: '#ff5500', textDecoration: 'underline' }} href={ativou ? '/?voltar-a-contar=1' : '/?nao-contar=1'}>{ativou ? 'Voltar a contar neste navegador' : 'Excluir este navegador da contagem'}</a>
  </aside>;
}
