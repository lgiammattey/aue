// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { TelaComunidade } from './TelaComunidade';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import type { CausoPostado } from '../../portas/comunidade';
import type { PortaDeConta } from '../../portas/conta';

function contaFalsa(anonima: boolean, sairOk = true): PortaDeConta {
  return {
    estado: vi.fn(async () => ({ temSessao: true, anonima, email: anonima ? undefined : 'a@aue.com' })),
    cadastrar: vi.fn(),
    entrar: vi.fn(),
    enviarLinkDeRedefinicao: vi.fn(),
    redefinirSenha: vi.fn(),
    sair: vi.fn(async () => sairOk),
  };
}

const CAUSOS_MOCK_TESTE: readonly CausoPostado[] = [
  {
    id: 'causo-teste-tiago',
    comunidadeId: 'comu-cerveja-gelada',
    comunidadeSlug: 'cerveja-gelada',
    autorNome: 'Tiago do Bonde',
    autorHandle: 'tiagobonde',
    conteudo: 'Almoço de domingo na sogra com reunião e tubaína.',
    nota: 94,
    duracaoSegundos: 4.8,
    origem: 'refrigerante',
    reacoes: { fogo: 284, nojo: 12, trofeu: 198 },
    curtidas: 284,
    reposts: 76,
    totalComentarios: 1,
    comentarios: [
      {
        id: 'resp-t-1',
        causoId: 'causo-teste-tiago',
        autorNome: 'Iury da Oficina',
        autorHandle: 'iury_oficina',
        conteudo: 'Isso não é arroto de visita, Tiago.',
        criadoEm: '2026-10-17T18:10:00.000Z',
      },
    ],
    criadoEm: '2026-10-17T18:00:00.000Z',
  },
];

describe('TelaComunidade (Canônico Bonde do Arroto - Feed, Comunidade e Desafios)', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('exibe estado de lista vazia quando não há posts na semente', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);
    expect(await screen.findByText('Nada por aqui ainda')).toBeDefined();
    expect(screen.getByText(/Nenhum arroto encontrado nesta lista/)).toBeDefined();
  });

  it('renderiza AUÊ!, navegação canônica (Feed, Comunidade, Desafios), composer rápido e causos no feed', async () => {
    const adapter = criarComunidadeWeb({ causosIniciais: CAUSOS_MOCK_TESTE, forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    // Brand AUÊ! / A!
    expect(screen.getByText(/AUÊ!|A!/)).toBeDefined();

    // Abas de navegação: Início virou Feed, Auê (Arena), Comunidade no singular, Desafios com Auê dentro, Perfil removido
    expect(screen.getByRole('button', { name: 'Feed' })).toBeDefined();
    expect(screen.getAllByRole('button', { name: 'Auê' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Comunidade' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Desafios' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Perfil' })).toBeNull();

    // Composer rápido no feed com Jogar o Auê e Desafiar
    expect(screen.getByPlaceholderText('O que tá rolando no bonde?')).toBeDefined();
    expect(screen.getAllByRole('button', { name: 'Jogar o Auê' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Desafiar' })).toBeDefined();
    expect(screen.getAllByRole('button', { name: 'Postar' }).length).toBeGreaterThanOrEqual(1);

    // Causos renderizados no feed
    expect((await screen.findAllByText(/Tiago do Bonde/)).length).toBeGreaterThanOrEqual(1);
  });

  it('visitante não curte: pede promoção e não dá sucesso local', async () => {
    const adapter = criarComunidadeWeb({ causosIniciais: CAUSOS_MOCK_TESTE, forcarOffline: true });
    const aoEntrar = vi.fn();
    render(<TelaComunidade porta={adapter} portaConta={contaFalsa(true)} aoEntrar={aoEntrar} />);

    const botoesCurtir = await screen.findAllByRole('button', { name: 'Curtir' });
    expect(botoesCurtir.length).toBeGreaterThan(0);

    fireEvent.click(botoesCurtir[0]);
    expect(aoEntrar).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Crie sua conta para entrar no Bonde.')).toBeDefined();
  });

  it('visitante não ganha uma aba Seguindo inventada', async () => {
    const aoEntrar = vi.fn();
    render(
      <TelaComunidade
        porta={criarComunidadeWeb({ causosIniciais: CAUSOS_MOCK_TESTE, forcarOffline: true })}
        portaConta={contaFalsa(true)}
        aoEntrar={aoEntrar}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Seguindo' }));
    expect(aoEntrar).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Crie sua conta para entrar no Bonde.')).toBeDefined();
  });

  it('visitante não publica pelo composer: a ação leva para promoção', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    const aoEntrar = vi.fn();
    render(<TelaComunidade porta={adapter} portaConta={contaFalsa(true)} aoEntrar={aoEntrar} />);

    const textarea = screen.getByPlaceholderText('O que tá rolando no bonde?');
    fireEvent.change(textarea, { target: { value: 'Soltei um arroto monstro no almoço.' } });

    // Clica no botão Postar do composer
    const botoesPostar = screen.getAllByRole('button', { name: 'Postar' });
    const btnPostarComposer = botoesPostar[botoesPostar.length - 1];
    fireEvent.click(btnPostarComposer);

    expect(aoEntrar).toHaveBeenCalledTimes(1);
  });

  it('chama onArrotar ao tocar no botão de Jogar o Auê', async () => {
    const onArrotar = vi.fn();
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} onArrotar={onArrotar} />);

    const btnArrotar = screen.getAllByRole('button', { name: 'Jogar o Auê' })[0];
    fireEvent.click(btnArrotar);

    expect(onArrotar).toHaveBeenCalledTimes(1);
  });

  it('navega entre as 3 abas (Feed, Comunidade, Desafios) com somente Eu Arroto, e Daí? e link do Telegram', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    // Aba Comunidade
    const btnComunidade = screen.getByRole('button', { name: 'Comunidade' });
    fireEvent.click(btnComunidade);
    expect((await screen.findAllByText('Eu Arroto, e Daí?')).length).toBeGreaterThanOrEqual(1);
    const linksTelegram = await screen.findAllByRole('link', { name: /Entrar no grupo do Telegram/i });
    expect(linksTelegram[0].getAttribute('href')).toBe('https://t.me/+KQjRJFCibjliYzRh');

    // Aba Desafios (onde entra o jogo Auê)
    const btnDesafios = screen.getByRole('button', { name: 'Desafios' });
    fireEvent.click(btnDesafios);
    expect(await screen.findByRole('button', { name: /O Jogo Auê/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Duelos X1/i })).toBeDefined();
  });

  it('abre o modal de compartilhamento só com ações que existem e com link real', async () => {
    const adapter = criarComunidadeWeb({ causosIniciais: CAUSOS_MOCK_TESTE, forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    const botoesShare = await screen.findAllByRole('button', { name: 'Compartilhar' });
    expect(botoesShare.length).toBeGreaterThan(0);

    fireEvent.click(botoesShare[0]);

    expect(screen.getByText('COMPARTILHAR')).toBeDefined();
    expect(screen.getByText('Copiar link da resenha')).toBeDefined();
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'WhatsApp' })).toBeDefined();
    // Nada de exportação fictícia nem código de X1 forjado
    expect(screen.queryByText('Vídeo pro TikTok')).toBeNull();
    expect(screen.queryByText('Baixar card (PNG)')).toBeNull();
    expect(screen.queryByText(/\/x1\//)).toBeNull();
    expect(screen.getByText(/aue\.web\.app\/historia\//)).toBeDefined();
  });

  it('causo que só existe neste aparelho não abre o compartilhar com link que daria 404', async () => {
    const causoLocal = { ...CAUSOS_MOCK_TESTE[0], somenteNesteAparelho: true };
    const adapter = criarComunidadeWeb({ causosIniciais: [causoLocal], forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    const botoesShare = await screen.findAllByRole('button', { name: 'Compartilhar' });
    fireEvent.click(botoesShare[0]);

    expect(screen.queryByText('COMPARTILHAR')).toBeNull();
    expect(await screen.findByText(/ainda não subiu pro Auê/)).toBeDefined();
  });

  it('copiar link falha com aviso de erro, sem dizer que copiou', async () => {
    const adapter = criarComunidadeWeb({ causosIniciais: CAUSOS_MOCK_TESTE, forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('negado')) },
    });

    const botoesShare = await screen.findAllByRole('button', { name: 'Compartilhar' });
    fireEvent.click(botoesShare[0]);
    fireEvent.click(screen.getByText('Copiar link da resenha'));

    expect(await screen.findByText(/Não deu pra copiar/)).toBeDefined();
    expect(screen.queryByText('Link copiado.')).toBeNull();
  });

  it('visitante lê thread, mas responder pede promoção', async () => {
    const adapter = criarComunidadeWeb({ causosIniciais: CAUSOS_MOCK_TESTE, forcarOffline: true });
    const aoEntrar = vi.fn();
    render(<TelaComunidade porta={adapter} portaConta={contaFalsa(true)} aoEntrar={aoEntrar} />);

    const botoesResponder = await screen.findAllByRole('button', { name: 'Responder' });
    expect(botoesResponder.length).toBeGreaterThan(0);

    // Abre a thread
    fireEvent.click(botoesResponder[0]);

    const inputResposta = await screen.findByPlaceholderText(/Responder a @/i);
    expect(inputResposta).toBeDefined();

    fireEvent.change(inputResposta, { target: { value: 'Comentário épico no arroto!' } });
    const btnEnviar = screen.getByRole('button', { name: 'Enviar resposta' });
    fireEvent.click(btnEnviar);

    expect(aoEntrar).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Comentário épico no arroto!')).toBeNull();
  });

  it('abre o Hub de Detalhe da Comunidade Eu Arroto, e Daí? com abas Posts e Sobre e botão Telegram', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} initialTab="comm" />);

    // Clica no botão de ver resenhas no mural
    const btnVerCausos = await screen.findByRole('button', { name: 'Ver resenhas no mural' });
    fireEvent.click(btnVerCausos);

    // Visão de Detalhe da Comunidade aberta
    expect(await screen.findByRole('button', { name: 'Voltar' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Posts' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sobre' })).toBeDefined();
    expect(screen.getByRole('link', { name: /Entrar no grupo do Telegram/i })).toBeDefined();

    // Navega para a aba Sobre e confere as regras
    const btnSobre = screen.getByRole('button', { name: 'Sobre' });
    fireEvent.click(btnSobre);
    expect(screen.getByText('Regras da Comunidade')).toBeDefined();

    // Clica em voltar para retornar ao card principal
    const btnVoltar = screen.getByRole('button', { name: 'Voltar' });
    fireEvent.click(btnVoltar);
    expect(screen.getByText(/A histórica comunidade mãe dos arrotadores/)).toBeDefined();
  });

  it('X1 não é montado nesta tela: chamar pro X1 leva à Arena e a lista não inventa duelo', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    const onArrotar = vi.fn();
    render(<TelaComunidade porta={adapter} initialTab="desafios" onArrotar={onArrotar} />);

    fireEvent.click(await screen.findByRole('button', { name: /Duelos X1/i }));

    // Sem semente: nenhum duelo de mentira com placar e handles inventados.
    expect(screen.getByText(/Nenhum X1 por aqui ainda/i)).toBeDefined();
    expect(screen.queryByText('Churrasco de domingo')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Chamar pro X1' }));
    expect(onArrotar).toHaveBeenCalledTimes(1);
  });

  it('filtra causos no feed pela busca da coluna lateral e exibe o card da comunidade no Telegram', async () => {
    const adapter = criarComunidadeWeb({ causosIniciais: CAUSOS_MOCK_TESTE, forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    // Localiza o campo de busca
    const inputBusca = screen.getByPlaceholderText('Buscar no bonde');
    fireEvent.change(inputBusca, { target: { value: 'reunião' } });

    // Barra indicadora de busca ativa aparece
    expect(await screen.findByText(/Buscando por:/)).toBeDefined();

    // Clica em Limpar busca
    const btnLimpar = screen.getByRole('button', { name: 'Limpar busca' });
    fireEvent.click(btnLimpar);

    // Barra de busca ativa some
    expect(screen.queryByText(/Buscando por:/)).toBeNull();

    // Card oficial da comunidade no Telegram está presente na coluna lateral
    expect(screen.getByText('Comunidade oficial no Telegram')).toBeDefined();
  });

  it('abre a Arena integrada ao receber initialTab="arena"', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} initialTab="arena" />);

    // A Arena de arrotos é exibida dentro da coluna central
    expect(await screen.findByRole('button', { name: /arrotar|toque para começar/i })).toBeDefined();
  });

  it('offline não inventa postagem local para uma conta promovida', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} portaConta={contaFalsa(false)} />);
    await screen.findAllByRole('button', { name: 'Sair da conta' });

    const textarea = screen.getByPlaceholderText('O que tá rolando no bonde?');
    fireEvent.change(textarea, { target: { value: 'Arroto pós-feijoada sensacional.' } });

    const botoesPostar = screen.getAllByRole('button', { name: 'Postar' });
    const btnPostar = botoesPostar[botoesPostar.length - 1];
    fireEvent.click(btnPostar);

    expect(await screen.findByText('Não foi possível postar.')).toBeDefined();
  });

  it('conta promovida mantém Feed como destino padrão, mas offline não finge publicação', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} portaConta={contaFalsa(false)} />);
    await screen.findAllByRole('button', { name: 'Sair da conta' });

    // Feed é a praça real Bonde Geral, não um destino fictício no cliente.
    const seletorDestino = screen.getByLabelText('Destino da publicação') as HTMLSelectElement;
    expect(seletorDestino.value).toBe('bonde-geral');

    const textarea = screen.getByPlaceholderText('O que tá rolando no bonde?');
    fireEvent.change(textarea, { target: { value: 'Meu causo livre e solto no Feed!' } });

    const botoesPostar = screen.getAllByRole('button', { name: 'Postar' });
    fireEvent.click(botoesPostar[botoesPostar.length - 1]);

    expect(await screen.findByText('Não foi possível postar.')).toBeDefined();
  });

  it('conta com e-mail tem Sair; sair chama a porta e leva ao login', async () => {
    const conta = contaFalsa(false);
    const aoSair = vi.fn();
    render(
      <TelaComunidade porta={criarComunidadeWeb({ forcarOffline: true })} portaConta={conta} aoSair={aoSair} />,
    );
    const botoes = await screen.findAllByRole('button', { name: 'Sair da conta' });
    fireEvent.click(botoes[0]);
    await vi.waitFor(() => expect(aoSair).toHaveBeenCalledTimes(1));
    expect(conta.sair).toHaveBeenCalledTimes(1);
  });

  it('sessão anônima não mostra Sair (sairia da única identidade do aparelho): mostra Entrar', async () => {
    render(
      <TelaComunidade
        porta={criarComunidadeWeb({ forcarOffline: true })}
        portaConta={contaFalsa(true)}
        aoEntrar={vi.fn()}
      />,
    );
    expect((await screen.findAllByRole('button', { name: 'Entrar na conta' })).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Sair da conta' })).toBeNull();
  });

  it('se o servidor não deixa sair, a tela avisa e não navega', async () => {
    const aoSair = vi.fn();
    render(
      <TelaComunidade
        porta={criarComunidadeWeb({ forcarOffline: true })}
        portaConta={contaFalsa(false, false)}
        aoSair={aoSair}
      />,
    );
    fireEvent.click((await screen.findAllByRole('button', { name: 'Sair da conta' }))[0]);
    expect(await screen.findByText(/Não deu para sair agora/)).toBeDefined();
    expect(aoSair).not.toHaveBeenCalled();
  });
});
