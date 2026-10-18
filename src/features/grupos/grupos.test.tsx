// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GrupoExterno, PortaDeGrupos, ResultadoDoCadastroDeGrupo } from '../../portas/grupos';
import { SecaoDeGrupos } from './SecaoDeGrupos';

const OFICIAL: GrupoExterno = {
  id: 'g1',
  slug: 'gym-arrotos',
  nome: 'GYM Arrotos',
  descricao: 'Grupo pra quem tem talento em arrotar.',
  plataforma: 'whatsapp',
  linkDoConvite: 'https://chat.whatsapp.com/KrRzws9Xhlo4RmOq8TmVue',
  imagemUrl: null,
  oficial: true,
};

const DA_GALERA: GrupoExterno = {
  ...OFICIAL,
  id: 'g2',
  slug: 'zoeira-tiktok',
  nome: 'Zoeira no TikTok',
  plataforma: 'tiktok',
  linkDoConvite: 'https://www.tiktok.com/@zoeira',
  oficial: false,
};

function porta(parcial: Partial<PortaDeGrupos> = {}): PortaDeGrupos {
  return {
    listarGrupos: vi.fn().mockResolvedValue({ ok: true, grupos: [OFICIAL, DA_GALERA] }),
    cadastrarGrupo: vi.fn().mockResolvedValue({ ok: true, slug: 'novo', imagemSalva: null }),
    denunciarGrupo: vi.fn().mockResolvedValue('registrada'),
    ...parcial,
  };
}

function preencher(link = 'https://chat.whatsapp.com/JaC2ggM5mG12pioXJnOgHc') {
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Arroto Trovão' } });
  fireEvent.change(screen.getByLabelText('Link do convite'), { target: { value: link } });
  fireEvent.change(screen.getByLabelText(/^Descrição/), { target: { value: 'Grupo de quem arrota alto.' } });
}

describe('SecaoDeGrupos', () => {
  afterEach(cleanup);

  it('lista os grupos do servidor e abre o convite com nofollow', async () => {
    render(<SecaoDeGrupos porta={porta()} />);
    expect(await screen.findByText('GYM Arrotos')).toBeDefined();
    const entrar = screen.getByRole('link', { name: 'Entrar no grupo' });
    expect(entrar.getAttribute('href')).toBe(OFICIAL.linkDoConvite);
    expect(entrar.getAttribute('rel')).toContain('nofollow');
    expect(entrar.getAttribute('rel')).toContain('noopener');
    expect(screen.getByRole('link', { name: 'Abrir o perfil' })).toBeDefined();
  });

  it('não oferece denunciar grupo oficial', async () => {
    render(<SecaoDeGrupos porta={porta()} />);
    await screen.findByText('GYM Arrotos');
    expect(screen.queryByRole('button', { name: 'Denunciar o grupo GYM Arrotos' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Denunciar o grupo Zoeira no TikTok' })).toBeDefined();
  });

  it('some da tela de quem denunciou e avisa', async () => {
    const p = porta();
    render(<SecaoDeGrupos porta={p} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Denunciar o grupo Zoeira no TikTok' }));
    await waitFor(() => expect(screen.queryByText('Zoeira no TikTok')).toBeNull());
    expect(p.denunciarGrupo).toHaveBeenCalledWith('g2', 'Conteúdo impróprio');
    expect(screen.getByText(/Denúncia enviada/)).toBeDefined();
  });

  it('não diz que denunciou quando o servidor falhou', async () => {
    render(<SecaoDeGrupos porta={porta({ denunciarGrupo: vi.fn().mockResolvedValue('falhou') })} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Denunciar o grupo Zoeira no TikTok' }));
    expect(await screen.findByText(/Não consegui registrar a denúncia/)).toBeDefined();
    expect(screen.getByText('Zoeira no TikTok')).toBeDefined();
  });

  it('sem servidor, diz isso e não mostra grupo inventado', async () => {
    render(<SecaoDeGrupos porta={porta({ listarGrupos: vi.fn().mockResolvedValue({ ok: false, motivo: 'semServidor' }) })} />);
    expect(await screen.findByText(/não está configurado/)).toBeDefined();
    expect(screen.queryByRole('article')).toBeNull();
  });

  it('falha de leitura oferece tentar de novo', async () => {
    const listar = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, motivo: 'falhou' })
      .mockResolvedValueOnce({ ok: true, grupos: [OFICIAL] });
    render(<SecaoDeGrupos porta={porta({ listarGrupos: listar })} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByText('GYM Arrotos')).toBeDefined();
  });

  it('lista vazia não vira lista falsa', async () => {
    render(<SecaoDeGrupos porta={porta({ listarGrupos: vi.fn().mockResolvedValue({ ok: true, grupos: [] }) })} />);
    expect(await screen.findByText(/Nenhum grupo cadastrado/)).toBeDefined();
  });
});

describe('cadastro de grupo', () => {
  afterEach(cleanup);

  it('recusa na tela, sem ir ao servidor, link que não é do WhatsApp', async () => {
    const p = porta();
    render(<SecaoDeGrupos porta={p} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Cadastrar grupo' }));
    preencher('https://evil.example.com/golpe');
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/não é de convite do WhatsApp/);
    expect(p.cadastrarGrupo).not.toHaveBeenCalled();
  });

  it('cadastra, fecha o formulário, relê a lista e avisa', async () => {
    const p = porta();
    render(<SecaoDeGrupos porta={p} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Cadastrar grupo' }));
    preencher();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(p.cadastrarGrupo).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Arroto Trovão', plataforma: 'whatsapp', link: 'https://chat.whatsapp.com/JaC2ggM5mG12pioXJnOgHc' }),
    );
    expect(screen.getByText('Grupo cadastrado.')).toBeDefined();
    await waitFor(() => expect(p.listarGrupos).toHaveBeenCalledTimes(2));
  });

  it('conta a verdade quando o grupo salvou e a imagem não', async () => {
    const p = porta({ cadastrarGrupo: vi.fn().mockResolvedValue({ ok: true, slug: 'x', imagemSalva: false }) });
    render(<SecaoDeGrupos porta={p} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Cadastrar grupo' }));
    preencher();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(await screen.findByText('Grupo cadastrado, mas a imagem não subiu.')).toBeDefined();
  });

  it('mantém o formulário aberto e mostra o erro do servidor', async () => {
    const recusa: ResultadoDoCadastroDeGrupo = {
      ok: false,
      motivo: 'repetido',
      mensagem: 'Esse grupo já está cadastrado.',
      campo: 'link',
    };
    render(<SecaoDeGrupos porta={porta({ cadastrarGrupo: vi.fn().mockResolvedValue(recusa) })} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Cadastrar grupo' }));
    preencher();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(await screen.findByText('Esse grupo já está cadastrado.')).toBeDefined();
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('recusa imagem que não é JPG, PNG ou WebP', async () => {
    const p = porta();
    render(<SecaoDeGrupos porta={p} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Cadastrar grupo' }));
    const arquivo = new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' });
    fireEvent.change(screen.getByLabelText(/^Imagem/), { target: { files: [arquivo] } });
    expect((await screen.findByRole('alert')).textContent).toMatch(/JPG, PNG ou WebP/);
  });
});
