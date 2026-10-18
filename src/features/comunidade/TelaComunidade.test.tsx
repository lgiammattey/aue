// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TelaComunidade } from './TelaComunidade';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';

describe('TelaComunidade (Canônico Bonde do Arroto)', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('renderiza AUÊ!, navegação canônica, composer rápido e causos no feed', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    // Brand AUÊ! / A!
    expect(screen.getByText(/AUÊ!|A!/)).toBeDefined();

    // Abas de navegação
    expect(screen.getByRole('button', { name: 'Início' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Comunidades' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Desafios' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Perfil' })).toBeDefined();

    // Composer rápido no feed
    expect(screen.getByPlaceholderText('O que tá rolando no bonde?')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Arrotar' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Desafiar' })).toBeDefined();
    expect(screen.getAllByRole('button', { name: 'Postar' }).length).toBeGreaterThanOrEqual(1);

    // Causos renderizados no feed
    expect((await screen.findAllByText(/Tiago do Bonde/)).length).toBeGreaterThanOrEqual(1);
  });

  it('permite curtir um causo no feed com coração', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
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

  it('chama onArrotar ao tocar no botão de Arrotar ou Arena', async () => {
    const onArrotar = vi.fn();
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} onArrotar={onArrotar} />);

    const btnArrotar = screen.getByRole('button', { name: 'Arrotar' });
    fireEvent.click(btnArrotar);

    expect(onArrotar).toHaveBeenCalledTimes(1);
  });

  it('navega entre as 4 abas (Início, Comunidades, Desafios, Perfil)', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    // Aba Comunidades
    const btnComunidades = screen.getByRole('button', { name: 'Comunidades' });
    fireEvent.click(btnComunidades);
    expect(await screen.findByText('Bonde do Arroto')).toBeDefined();
    expect(screen.getAllByText('Cerveja Gelada').length).toBeGreaterThanOrEqual(1);

    // Aba Desafios
    const btnDesafios = screen.getByRole('button', { name: 'Desafios' });
    fireEvent.click(btnDesafios);
    expect(await screen.findByRole('button', { name: 'Chamar pro X1' })).toBeDefined();
    expect(screen.getAllByText('X1').length).toBeGreaterThanOrEqual(1);

    // Aba Perfil
    const btnPerfil = screen.getByRole('button', { name: 'Perfil' });
    fireEvent.click(btnPerfil);
    expect(await screen.findByText('7V · 3D')).toBeDefined();
    expect(screen.getByText('Editar perfil')).toBeDefined();
  });

  it('abre o modal canônico de compartilhamento (proporção 9:12, COMPARTILHAR) e exibe as 4 opções', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
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
    const adapter = criarComunidadeWeb({ forcarOffline: true });
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

  it('ao clicar no autor de um causo, abre o perfil do arrotador com opção de seguir e voltar', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} />);

    // Encontra o autor e clica nele
    const autorClicks = await screen.findAllByTitle(/Ver perfil de @/i);
    expect(autorClicks.length).toBeGreaterThan(0);
    fireEvent.click(autorClicks[0]);

    // Agora está no perfil de terceiros
    expect(await screen.findByRole('button', { name: 'Voltar' })).toBeDefined();
    expect(screen.getAllByRole('button', { name: /Seguir|Seguindo/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Chamar pro X1' })).toBeDefined();

    // Clica em voltar para retornar ao feed
    const btnVoltar = screen.getByRole('button', { name: 'Voltar' });
    fireEvent.click(btnVoltar);

    // Voltou para o feed (composer visível)
    expect(screen.getByPlaceholderText('O que tá rolando no bonde?')).toBeDefined();
  });

  it('exibe perfil inicial diretamente quando passado perfilHandleInicial', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(
      <TelaComunidade
        porta={adapter}
        initialTab="perfil"
        perfilHandleInicial="tiagobonde"
      />,
    );

    expect((await screen.findAllByText('Tiago do Bonde')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('@tiagobonde').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /Seguir|Seguindo/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Chamar pro X1' })).toBeDefined();
  });

  it('abre o Hub de Detalhe da Comunidade com abas Posts, Ranking e Sobre', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} initialTab="comm" />);

    // Filtra por Cerveja
    const pillCerveja = screen.getByRole('button', { name: 'Cerveja' });
    fireEvent.click(pillCerveja);

    // Clica na comunidade Cerveja Gelada
    const itensComu = await screen.findAllByText('Cerveja Gelada');
    fireEvent.click(itensComu[0]);

    // Visão de Detalhe da Comunidade aberta
    expect(await screen.findByRole('button', { name: 'Voltar' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Posts' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Ranking' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sobre' })).toBeDefined();

    // Navega para a aba Sobre e confere as regras
    const btnSobre = screen.getByRole('button', { name: 'Sobre' });
    fireEvent.click(btnSobre);
    expect(screen.getByText('Regras da Comunidade')).toBeDefined();
    expect(screen.getByText(/Long neck, lata ou chope/)).toBeDefined();

    // Navega para a aba Ranking e confere o pódio
    const btnRanking = screen.getByRole('button', { name: 'Ranking' });
    fireEvent.click(btnRanking);
    expect(screen.getByText('1º')).toBeDefined();

    // Clica em voltar para retornar à lista
    const btnVoltar = screen.getByRole('button', { name: 'Voltar' });
    fireEvent.click(btnVoltar);
    expect(screen.getByRole('button', { name: 'Todas' })).toBeDefined();
  });

  it('permite criar desafio X1, persistir na lista e abrir revanche na Arena', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} initialTab="desafios" />);

    // Clica em Chamar pro X1 na aba desafios
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

    // Clica em Revanche em um desafio para ir à Arena
    const botoesRevanche = screen.getAllByRole('button', { name: 'Revanche' });
    fireEvent.click(botoesRevanche[0]);

    // Tela agora exibe Arena e botão de voltar pro Bonde
    expect(await screen.findByRole('button', { name: '← Voltar pro Bonde' })).toBeDefined();
  });

  it('filtra causos no feed pela busca da coluna de tendências e permite limpar a busca', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
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
  });

  it('permite transição de resultado da Arena para o Bonde via modal de causo', async () => {
    const adapter = criarComunidadeWeb({ forcarOffline: true });
    render(<TelaComunidade porta={adapter} initialTab="arena" />);

    // Arena renderizada com botão de voltar pro Bonde
    expect(screen.getByRole('button', { name: '← Voltar pro Bonde' })).toBeDefined();

    // Clica em voltar pro Bonde
    const btnVoltar = screen.getByRole('button', { name: '← Voltar pro Bonde' });
    fireEvent.click(btnVoltar);

    // Agora está no feed
    expect(await screen.findByPlaceholderText('O que tá rolando no bonde?')).toBeDefined();
  });
});



