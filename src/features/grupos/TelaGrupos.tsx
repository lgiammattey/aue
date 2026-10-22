import React from 'react';
import { LayoutPublico, LinksPublicos } from '../publico/LayoutPublico';
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
    eyebrow="Fora do Auê"
    titulo="Grupos externos de arroto"
    resumo="Grupos de WhatsApp, Telegram e TikTok que a galera cadastrou. As comunidades do Auê ficam dentro do app; aqui você só acha o convite pra outras plataformas."
  >
    <div style={{ paddingBottom: 48 }}>
      <div style={{ paddingBottom: 24 }}>
        <LinksPublicos links={[{ para: '/comunidades', rotulo: 'Conhecer as comunidades do Auê' }]} />
      </div>
      <SecaoDeGrupos porta={porta} titulo="Todos os grupos" variante="publica" />
    </div>
  </LayoutPublico>
);
