import React from 'react';
import { LayoutArenaPublica } from '../publico/LayoutArenaPublica';
import { SecaoDeGrupos } from './SecaoDeGrupos';
import type { PortaDeGrupos } from '../../portas/grupos';
import './TelaGrupos.css';

/** Diretório público: ver convites e cadastrar grupos não exige conta no Auê. */
export const TelaGrupos: React.FC<{ porta?: PortaDeGrupos }> = ({ porta }) => (
  <LayoutArenaPublica
    eyebrow="NO ZAP"
    titulo="Grupos de arroto"
    resumo="Cola num grupo ou bota o seu na lista."
  >
    <div className="grupos-arena">
      <SecaoDeGrupos porta={porta} titulo="Grupos da galera" variante="publica" />
    </div>
  </LayoutArenaPublica>
);
