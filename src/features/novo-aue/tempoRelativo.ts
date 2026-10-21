/**
 * Tempo do post no cabeçalho do card (feed, comunidade, thread e perfil).
 * Minutos, horas e dias até 6 ("3d", e "ontem" para 1); de 7 a 29 dias em
 * semanas ("1sem", "2sem"); data absoluta só a partir de 30 dias.
 * `null` quando não há data válida: o card omite o tempo em vez de dizer "agora".
 */
export function formatarTempoRelativo(isoOuData: string, agora: number = Date.now()): string | null {
  if (!isoOuData) return null;
  const data = new Date(isoOuData);
  if (Number.isNaN(data.getTime())) return null;
  const segundos = Math.max(0, Math.floor((agora - data.getTime()) / 1000));
  if (segundos < 60) return 'agora';
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `${minutos}m`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ontem';
  if (dias < 7) return `${dias}d`;
  if (dias < 30) return `${Math.floor(dias / 7)}sem`;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(data);
}
