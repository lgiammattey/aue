import type { PlataformaDeGrupo } from '../../portas/grupos';

export const ROTULO_DA_PLATAFORMA: Readonly<Record<PlataformaDeGrupo, string>> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  tiktok: 'TikTok',
};

/** Rótulo do botão que abre o convite. Cada plataforma tem o seu verbo. */
export const ROTULO_DO_BOTAO: Readonly<Record<PlataformaDeGrupo, string>> = {
  whatsapp: 'Entrar no grupo',
  telegram: 'Entrar no grupo',
  tiktok: 'Abrir o perfil',
};
