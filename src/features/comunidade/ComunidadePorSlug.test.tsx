// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TelaComunidade } from './TelaComunidade';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import type { CausoPostado } from '../../portas/comunidade';

function causo(id: string, slug: string, texto: string): CausoPostado {
  return {
    id,
    comunidadeId: `id-${slug}`,
    comunidadeSlug: slug,
    autorNome: 'Ana',
    autorHandle: 'ana',
    conteudo: texto,
    reacoes: { fogo: 0, nojo: 0, trofeu: 0 },
    curtidas: 0,
    reposts: 0,
    totalComentarios: 0,
    criadoEm: '2026-10-18T10:00:00.000Z',
  };
}

const CAUSOS = [
  causo('1', 'eu-arroto-e-dai', 'Arroto na oficial.'),
  causo('2', 'reuniao-da-firma', 'Arroto na reunião da diretoria.'),
];

function abrir(slug: string) {
  const porta = criarComunidadeWeb({ causosIniciais: CAUSOS, forcarOffline: true });
  render(<TelaComunidade porta={porta} initialTab="comm" comunidadeSlugInicial={slug} />);
}

describe('/c/:slug mostra a comunidade pedida e só os causos dela', () => {
  afterEach(cleanup);

  it('eu-arroto-e-dai mostra a oficial e não os causos da reunião', async () => {
    abrir('eu-arroto-e-dai');
    expect(await screen.findByText('Arroto na oficial.')).toBeDefined();
    expect(screen.queryByText('Arroto na reunião da diretoria.')).toBeNull();
  });

  it('reuniao-da-firma mostra os dados e causos dela, não da oficial', async () => {
    abrir('reuniao-da-firma');
    expect(await screen.findByText('Arroto na reunião da diretoria.')).toBeDefined();
    expect(screen.queryByText('Arroto na oficial.')).toBeNull();
    expect(screen.getAllByText('Na reunião da firma').length).toBeGreaterThan(0);
    expect(screen.queryByText(/criada em 2004/)).toBeNull();
  });

  it('slug desconhecido diz que a comunidade não existe e não cai na oficial', async () => {
    abrir('nao-existe');
    expect(await screen.findByText('Comunidade não encontrada')).toBeDefined();
    expect(screen.queryByText('Arroto na oficial.')).toBeNull();
    expect(screen.queryByText(/Microfone aberto sem querer/)).toBeNull();
    expect(screen.queryByText(/A histórica comunidade mãe/)).toBeNull();
  });

  it('slug com maiúscula abre a mesma comunidade', async () => {
    abrir('Reuniao-Da-Firma');
    expect(await screen.findByText('Arroto na reunião da diretoria.')).toBeDefined();
  });

  it('bonde-geral abre o detalhe da comunidade geral', async () => {
    abrir('bonde-geral');
    expect(await screen.findAllByText('Bonde Geral')).toBeDefined();
    expect(screen.queryByText('Comunidade não encontrada')).toBeNull();
  });

  it('lista de comunidades que não veio diz que não carregou, não que o slug não existe', async () => {
    const base = criarComunidadeWeb({ causosIniciais: CAUSOS, forcarOffline: true });
    const porta = { ...base, listarComunidades: async () => [] };
    render(<TelaComunidade porta={porta} initialTab="comm" comunidadeSlugInicial="reuniao-da-firma" />);
    expect(await screen.findByText('Não deu pra carregar')).toBeDefined();
    expect(screen.queryByText('Comunidade não encontrada')).toBeNull();
  });
});
