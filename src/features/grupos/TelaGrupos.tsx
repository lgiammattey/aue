import React from 'react';
import { LayoutPublico } from '../publico/LayoutPublico';
import { SecaoDeGrupos } from './SecaoDeGrupos';
import type { PortaDeGrupos } from '../../portas/grupos';

/**
 * `/grupos` — a página pública do diretório de grupos externos.
 *
 * Fica fora do login de propósito: quem chega do Google cadastra e entra em
 * grupo sem criar conta. Usa a moldura das outras páginas públicas.
 *
 * Nenhum estado da Arena nasce aqui.
 */
export const TelaGrupos: React.FC<{ porta?: PortaDeGrupos }> = ({ porta }) => (
  <LayoutPublico
    eyebrow="Diretório"
    titulo="Grupos de arroto e peido"
    resumo="Grupos de WhatsApp, Telegram e TikTok de quem arrota com orgulho. Entra num, ou cadastra o seu."
  >
    <div className="desktop-shell" style={{ paddingBottom: 48 }}>
      <SecaoDeGrupos porta={porta} titulo="Todos os grupos" />
    </div>
  </LayoutPublico>
);
