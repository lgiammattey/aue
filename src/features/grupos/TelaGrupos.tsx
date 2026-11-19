import React from 'react';
import { LayoutArenaPublica } from '../publico/LayoutArenaPublica';
import { SecaoDeGrupos } from './SecaoDeGrupos';
import type { PortaDeGrupos } from '../../portas/grupos';
import './TelaGrupos.css';

/** Diretório público: ver convites e cadastrar grupos não exige conta no Auê. */
export const TelaGrupos: React.FC<{ porta?: PortaDeGrupos }> = ({ porta }) => (
  <LayoutArenaPublica
    eyebrow="A tropa no zap e além"
    titulo="Grupos de arroto"
    resumo="Tem arroto que merece uma plateia. Encontre os grupos que a galera cadastrou e entre na resenha."
  >
    <div className="grupos-arena">
      <SecaoDeGrupos porta={porta} titulo="Grupos da galera" variante="publica" />
    </div>
  </LayoutArenaPublica>
);
