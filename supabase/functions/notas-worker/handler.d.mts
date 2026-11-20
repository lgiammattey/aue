export function criarHandler(portas: {
  segredo: string;
  reivindicar: (limite: number) => Promise<unknown>;
  obter: (tipo: string, id: string, token: string) => Promise<{ bucket: string; caminho: string; etag: string; mime?: string } | null>;
  baixar: (bucket: string, caminho: string, etag: string) => Promise<Blob | null>;
  concluir: (resultado: { tipo: string; id: string; etag: string; token: string; estado: string; nota?: number }) => Promise<boolean>;
}): (request: Request) => Promise<Response>;
