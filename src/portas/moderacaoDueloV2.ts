export interface DenunciaDueloV2 { readonly id: string; readonly motivo: 'ofensivo' | 'outro'; readonly criadoEm: string; readonly audioDisponivel: boolean }
export interface ModeracaoDueloV2 {
  listar(): Promise<readonly DenunciaDueloV2[]>;
  ouvir(id: string): Promise<Blob>;
  decidir(id: string, decisao: 'mantida' | 'restaurada'): Promise<void>;
}
