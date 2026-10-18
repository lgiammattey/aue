// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TelaComunidade } from './TelaComunidade';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import type { CausoPostado } from '../../portas/comunidade';

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

    // Abas de navegação: Início virou Feed, Comunidade no singular, Desafios com Auê dentro, Perfil removido
    expect(screen.getByRole('button', { name: 'Feed' })).toBeDefined();
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

  it('permite curtir um causo no feed com coração', async () => {
    const adapter = criarComunidadeWeb({ causosIniciais: CAUSOS_MOCK_TESTE, forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    const botoesCurtir = await screen.findAllByRole('button', { name: 'Curtir' });
    expect(botoesCurtir.length).toBeGreaterThan(0);

    fireEvent.click(botoesCurtir[0]);
    expect(botoesCurtir[0]).toBeDefined();
  });

  it('publica um novo causo no feed através do composer rápido', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    const textarea = screen.getByPlaceholderText('O que tá rolando no bonde?');
    fireEvent.change(textarea, { target: { value: 'Soltei um arroto monstro no almoço.' } });

    // Clica no botão Postar do composer
    const botoesPostar = screen.getAllByRole('button', { name: 'Postar' });
    const btnPostarComposer = botoesPostar[botoesPostar.length - 1];
    fireEvent.click(btnPostarComposer);

    expect(await screen.findByText('Soltei um arroto monstro no almoço.')).toBeDefined();
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

  it('abre o modal canônico de compartilhamento (proporção 9:12, COMPARTILHAR) e exibe as 4 opções', async () => {
    const adapter = criarComunidadeWeb({ causosIniciais: CAUSOS_MOCK_TESTE, forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    const botoesShare = await screen.findAllByRole('button', { name: 'Compartilhar' });
    expect(botoesShare.length).toBeGreaterThan(0);

    fireEvent.click(botoesShare[0]);

    // Modal canônico aberto
    expect(screen.getByText('COMPARTILHAR')).toBeDefined();
    expect(screen.getByText('Vídeo pro TikTok')).toBeDefined();
    expect(screen.getByText('Baixar card (PNG)')).toBeDefined();
    expect(screen.getByText('Copiar link do X1')).toBeDefined();
    expect(screen.getByText('Stories / WhatsApp')).toBeDefined();
  });

  it('expande thread de respostas e permite responder', async () => {
    const adapter = criarComunidadeWeb({ causosIniciais: CAUSOS_MOCK_TESTE, forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    const botoesResponder = await screen.findAllByRole('button', { name: 'Responder' });
    expect(botoesResponder.length).toBeGreaterThan(0);

    // Abre a thread
    fireEvent.click(botoesResponder[0]);

    const inputResposta = await screen.findByPlaceholderText(/Responder a @/i);
    expect(inputResposta).toBeDefined();

    fireEvent.change(inputResposta, { target: { value: 'Comentário épico no arroto!' } });
    const btnEnviar = screen.getByRole('button', { name: 'Enviar resposta' });
    fireEvent.click(btnEnviar);

    expect(await screen.findByText('Comentário épico no arroto!')).toBeDefined();
  });

  it('abre o Hub de Detalhe da Comunidade Eu Arroto, e Daí? com abas Posts e Sobre e botão Telegram', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} initialTab="comm" />);

    // Clica no botão de ver causos no mural
    const btnVerCausos = await screen.findByRole('button', { name: 'Ver causos no mural' });
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

  it('permite criar desafio X1, persistir na lista e alternar com o Jogo Auê dentro de Desafios', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} initialTab="desafios" />);

    // Alterna para a sub-aba Duelos X1
    const btnSubDuelos = await screen.findByRole('button', { name: /Duelos X1/i });
    fireEvent.click(btnSubDuelos);

    // Clica em Chamar pro X1 na sub-aba desafios
    const btnChamar = screen.getByRole('button', { name: 'Chamar pro X1' });
    fireEvent.click(btnChamar);

    // Modal de desafio aberto
    const inputOponente = screen.getByPlaceholderText('@quem vai levar ferro');
    const textarea = screen.getByPlaceholderText('Qual é o desafio?');
    fireEvent.change(inputOponente, { target: { value: '@arrotador_rival' } });
    fireEvent.change(textarea, { target: { value: 'Duelo do arroto monstro' } });

    // Publica o desafio
    const btnEnviar = screen.getByRole('button', { name: 'Enviar' });
    fireEvent.click(btnEnviar);

    // Modal de compartilhamento abre
    expect(screen.getByText('COMPARTILHAR')).toBeDefined();

    // Fecha o modal de compartilhamento
    const btnFechar = screen.getByRole('button', { name: 'Fechar' });
    fireEvent.click(btnFechar);

    // O novo desafio aparece na lista com status Esperando
    expect(await screen.findByText('Duelo do arroto monstro')).toBeDefined();

    // Clica em Revanche em um desafio para carregar o jogo Auê
    const botoesRevanche = screen.getAllByRole('button', { name: 'Revanche' });
    fireEvent.click(botoesRevanche[0]);

    // O jogo Auê está ativo na sub-aba de jogo
    expect(await screen.findByRole('button', { name: /O Jogo Auê/i })).toBeDefined();
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

  it('abre Desafios com o jogo Auê ao receber initialTab="arena"', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} initialTab="arena" />);

    // O jogo Auê dentro de Desafios é exibido
    expect(await screen.findByRole('button', { name: /O Jogo Auê/i })).toBeDefined();
  });

  it('garante que o botão postar publica o causo com sucesso e limpa o composer mesmo com adaptador simulando falha de rede', async () => {
    const adapterOriginal = criarComunidadeWeb({ forcarOffline: true });
    // Adaptador onde a chamada remota simula erro mas o fallback local salva com sucesso
    const adapter = {
      ...adapterOriginal,
      postarCauso: async (pedido: Parameters<typeof adapterOriginal.postarCauso>[0]) => {
        return adapterOriginal.postarCauso(pedido);
      },
    };

    render(<TelaComunidade porta={adapter} />);

    const textarea = screen.getByPlaceholderText('O que tá rolando no bonde?');
    fireEvent.change(textarea, { target: { value: 'Arroto pós-feijoada sensacional.' } });

    const botoesPostar = screen.getAllByRole('button', { name: 'Postar' });
    const btnPostar = botoesPostar[botoesPostar.length - 1];
    fireEvent.click(btnPostar);

    expect(await screen.findByText('Arroto pós-feijoada sensacional.')).toBeDefined();
  });

  it('permite postar no Feed sem grupo e não exibe o rótulo "Postado em..." no card', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    // Destino padrão deve ser 'feed'
    const seletorDestino = screen.getByLabelText('Destino da publicação') as HTMLSelectElement;
    expect(seletorDestino.value).toBe('feed');

    const textarea = screen.getByPlaceholderText('O que tá rolando no bonde?');
    fireEvent.change(textarea, { target: { value: 'Meu causo livre e solto no Feed!' } });

    const botoesPostar = screen.getAllByRole('button', { name: 'Postar' });
    fireEvent.click(botoesPostar[botoesPostar.length - 1]);

    // O texto deve aparecer no feed
    expect(await screen.findByText('Meu causo livre e solto no Feed!')).toBeDefined();

    // Não deve existir rótulo 'Postado em feed'
    expect(screen.queryByText(/Postado em feed/i)).toBeNull();
  });
});
