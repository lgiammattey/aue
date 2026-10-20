// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeForum } from '../../portas/forum';
import type { PortaDeArrotosDoPerfil } from '../../portas/arrotosDoPerfil';
import type { CapturaDeAudio } from '../../portas/captura';
import type { PortaDeConta } from '../../portas/conta';
import type { PortaDePerfil } from '../../portas/perfil';
import { InicioOpenDesign } from './InicioOpenDesign';

describe('InicioOpenDesign (1:1 com protótipo Open Design)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const mockForum: PortaDeForum = {
    listarComunidadesDoForum: vi.fn(async () => ({
      ok: true as const,
      valor: [
        {
          id: '1',
          slug: 'arena-do-arroto',
          nome: 'Arena do Arroto',
          descricao: 'Roda oficial da arena',
          icone: null,
          membrosTotal: 120,
          topicosTotal: 10,
          ultimaAtividadeEm: '2026-01-01',
          souMembro: false,
        },
        {
          id: '2',
          slug: 'arroto-em-video',
          nome: 'Arroto em Vídeo',
          descricao: 'Vídeos da comunidade',
          icone: null,
          membrosTotal: 80,
          topicosTotal: 5,
          ultimaAtividadeEm: '2026-01-01',
          souMembro: false,
        },
      ],
    })),
    obterComunidadeDoForum: vi.fn(),
    listarTopicos: vi.fn(),
    obterTopico: vi.fn(),
    listarRespostasDoTopico: vi.fn(async () => ({
      ok: true as const,
      valor: {
        itens: [
          {
            id: 'resp-1',
            topicoId: 'topico-1',
            paiId: null,
            nivel: 0 as const,
            autor: { id: 'autor-2', handle: 'pedro_som', apelido: 'Pedro Som', avatarUrl: null },
            corpo: 'Esse som foi histórico na firma!',
            status: 'visivel' as const,
            criadoEm: '2026-10-19T11:00:00Z',
            editadoEm: null,
            souAutor: false,
          },
        ],
        proximo: null,
      },
    })),
    explorarTopicos: vi.fn(async () => ({
      ok: true as const,
      valor: {
        itens: [
          {
            id: 'topico-1',
            comunidade: { id: '1', slug: 'arena-do-arroto', nome: 'Arena do Arroto' },
            titulo: 'Arroto que quebrou a taça da sala',
            autor: { id: 'autor-1', handle: 'ze_do_eco', apelido: 'Zé do Eco', avatarUrl: null },
            status: 'aberto' as const,
            fixado: false,
            criadoEm: '2026-10-19T10:00:00Z',
            ultimaAtividadeEm: '2026-10-19T10:00:00Z',
            respostasTotal: 12,
          },
        ],
        proximo: null,
      },
    })),
    listarTopicosDoAutor: vi.fn(),
    listarRespostasDoAutor: vi.fn(),
    criarTopico: vi.fn(async (pedido) => ({
      ok: true as const,
      valor: {
        id: 'novo-123',
        comunidade: { slug: pedido.comunidadeSlug },
        titulo: pedido.titulo,
        criadoEm: new Date().toISOString(),
      },
    })),
    responderTopico: vi.fn(),
    editarTopico: vi.fn(),
    editarResposta: vi.fn(),
    apagarTopico: vi.fn(),
    apagarResposta: vi.fn(),
    denunciarTopico: vi.fn(),
    denunciarResposta: vi.fn(),
  };

  const mockComunidade: PortaDeComunidade = {
    listarComunidades: vi.fn(async () => []),
    listarFeed: vi.fn(async () => []),
    obterCauso: vi.fn(),
    postarCauso: vi.fn(),
    alternarReacao: vi.fn(),
    alternarCurtida: vi.fn(),
    alternarRepost: vi.fn(),
    listarRespostas: vi.fn(async () => []),
    adicionarResposta: vi.fn(),
    apagarCauso: vi.fn(),
    entrarComunidade: vi.fn(async () => true),
    sairComunidade: vi.fn(async () => true),
    listarMinhasComunidades: vi.fn(async () => []),
    denunciarCauso: vi.fn(),
  };

  const contaAutenticada: PortaDeConta = {
    estado: vi.fn(async () => ({ temSessao: true, anonima: false, perfilSocialPendente: false, podeParticiparSocialmente: true })),
    entrar: vi.fn(),
    cadastrar: vi.fn(),
    enviarLinkDeRedefinicao: vi.fn(),
    redefinirSenha: vi.fn(),
    sair: vi.fn(),
  };

  it('renderiza os elementos principais da casca 1:1 e consome portas reais', async () => {
    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
          autenticado={false}
          aoEntrar={vi.fn()}
        />
      </MemoryRouter>,
    );

    // Marca Auê — wordmark brutalista (AUÊ! expandido, A! compacto)
    const brand = screen.getByLabelText('Auê, página inicial');
    expect(brand).toBeTruthy();
    expect(brand.querySelector('.brand-full')?.textContent).toBe('AUÊ!');
    expect(brand.querySelector('.brand-compact')?.textContent).toBe('A!');

    // Botão Soltar Arroto na sidebar
    expect(screen.getByRole('button', { name: '+ Soltar um arroto' })).toBeTruthy();

    // Hero 1:1
    expect(await screen.findByRole('heading', { level: 1, name: 'A comunidade dos arrotadores.' })).toBeTruthy();

    // Feed com tópico real carregado da porta
    expect(await screen.findByText('Arroto que quebrou a taça da sala')).toBeTruthy();
    expect(screen.getByText('u/ze_do_eco')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Abrir perfil de u/ze_do_eco' }).getAttribute('href')).toBe('/u/ze_do_eco');
    expect(screen.queryByLabelText('Votar positivo')).toBeNull();
    expect(screen.getByRole('button', { name: 'Curtir' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '🔥' })).toBeTruthy();

    // Comunidades reais na sidebar e rightbar
    expect(screen.getAllByText('r/arena-do-arroto').length).toBeGreaterThan(0);
  });

  it('reidrata o anexo de áudio do tópico no Início depois da leitura do feed', async () => {
    const forumComAudio: PortaDeForum = {
      ...mockForum,
      listarAnexosDoForum: vi.fn(async () => ({
        ok: true as const,
        valor: [{
          alvo: 'topico' as const,
          alvoId: 'topico-1',
          tipo: 'audio' as const,
          caminho: 'autor-1/forum/arroto.webm',
          mime: 'audio/webm',
          tamanhoBytes: 321,
          duracaoMs: 7000,
          urlVideo: null,
        }],
      })),
      assinarAnexoDoForum: vi.fn(async () => ({ ok: true as const, valor: 'https://audio.exemplo/arroto.webm' })),
    };

    render(
      <MemoryRouter>
        <InicioOpenDesign portaForum={forumComAudio} portaComunidade={mockComunidade} autenticado={false} />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Arroto que quebrou a taça da sala')).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'Ouvir áudio' })).toBeTruthy();
    expect(forumComAudio.listarAnexosDoForum).toHaveBeenCalledWith({ topicoIds: ['topico-1'] });
    expect(forumComAudio.assinarAnexoDoForum).toHaveBeenCalledWith('autor-1/forum/arroto.webm');
  });

  it('não anuncia publicação quando o upload de áudio é recusado por falta de conta', async () => {
    const forumComUploadRecusado: PortaDeForum = {
      ...mockForum,
      criarGravacaoLivreDoForum: vi.fn(() => ({
        iniciar: vi.fn(async () => ({
          ok: true as const,
          conclusao: Promise.resolve({
            ok: true as const,
            audio: {
              dados: new Blob(['arroto'], { type: 'audio/webm' }),
              formato: 'audio/webm',
              mimeParaEnvio: 'audio/webm',
              duracaoMs: 1200,
            },
            encerramento: 'manual' as const,
          }),
        })),
        parar: vi.fn(),
        cancelar: vi.fn(),
        estaGravando: vi.fn(() => false),
      })),
      enviarAnexoDoForum: vi.fn(async () => ({ ok: false as const, motivo: 'precisaEntrar' as const })),
    };

    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={forumComUploadRecusado}
          portaComunidade={mockComunidade}
          autenticado
          abrirCompositor
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Gravar áudio' }));
    expect(await screen.findByText('🎙️ Áudio de 2s gravado')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));

    expect((await screen.findByRole('status')).textContent).toContain('Entre na sua conta antes de anexar o áudio.');
    expect(screen.queryByText('Publicado com sucesso.')).toBeNull();
    expect(forumComUploadRecusado.criarTopico).not.toHaveBeenCalled();
  });

  it('permite alternar abas de ordenação Quentes, Novos e Top', async () => {
    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
          autenticado={true}
        />
      </MemoryRouter>,
    );

    const abaNovos = screen.getByRole('button', { name: 'Novos' });
    fireEvent.click(abaNovos);
    expect(screen.getByText('Comunidade · Novos')).toBeTruthy();

    const abaTop = screen.getByRole('button', { name: 'Top' });
    fireEvent.click(abaTop);
    expect(screen.getByText('Comunidade · Top')).toBeTruthy();
  });

  it('abre o diálogo de gravação direta ao clicar em Soltar um arroto', async () => {
    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
          autenticado={true}
        />
      </MemoryRouter>,
    );

    const btnSoltar = screen.getByRole('button', { name: '+ Soltar um arroto' });
    fireEvent.click(btnSoltar);

    expect(screen.getByRole('heading', { level: 2, name: 'Gravar um arroto' })).toBeTruthy();
    expect(screen.getByText('Gravação direta: não passa pelo motor e não recebe nota.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Gravar agora/ })).toBeTruthy();
    expect(screen.queryByLabelText('Título da publicação')).toBeNull();
  });

  it('grava, torna a visibilidade explícita e entrega o áudio para o perfil marcado', async () => {
    const captura: CapturaDeAudio = {
      pedir: vi.fn(async () => ({ ok: true as const })),
      comecar: vi.fn(() => true),
      parar: vi.fn(async () => ({
        dados: new Blob(['arroto'], { type: 'audio/webm' }),
        formato: 'audio/webm',
        duracaoMs: 1200,
        resumo: { rms: 0.2, pico: 0.4 },
      })),
      nivelAtual: vi.fn(() => 0),
      soltar: vi.fn(),
      estaVivo: vi.fn(() => false),
      estaGravando: vi.fn(() => false),
    };
    const arrotos: PortaDeArrotosDoPerfil = {
      prepararArroto: vi.fn(async () => ({
        ok: true as const,
        rascunho: {
          id: 'arroto-1', caminhoDoAudio: 'eu/arroto-1', perfilDestinoId: 'destino',
          perfilDestinoHandle: 'bia', perfilDestinoApelido: 'Bia',
        },
      })),
      publicarArroto: vi.fn(async () => ({
        ok: true as const,
        arroto: {
          id: 'arroto-1', perfilId: 'destino', autorId: 'eu', autorHandle: 'gio', autorApelido: 'Gio',
          duracaoSegundos: 1.2, criadoEm: '2026-10-20T12:00:00Z', meu: true, possoOcultar: true,
          enderecoDoAudio: vi.fn(async () => 'https://audio.test/arroto-1'),
        },
      })),
      listarArrotos: vi.fn(async () => []),
      ocultarArroto: vi.fn(async () => true),
    };

    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
          portaArrotosDoPerfil={arrotos}
          capturaDireta={captura}
          autenticado
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Soltar um arroto' }));
    fireEvent.click(screen.getByRole('button', { name: /Gravar agora/ }));
    await waitFor(() => expect(captura.comecar).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole('button', { name: /Parar gravação/ }));
    expect(await screen.findByText(/visível no grupo Arrotos do perfil escolhido/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: /Perfil de outra pessoa/i }));
    fireEvent.change(screen.getByLabelText('@ de quem vai receber o arroto'), { target: { value: '@Bia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar arroto' }));

    await waitFor(() => {
      expect(arrotos.prepararArroto).toHaveBeenCalledWith('bia');
      expect(arrotos.publicarArroto).toHaveBeenCalledWith(
        expect.objectContaining({ perfilDestinoHandle: 'bia' }), expect.any(Blob), 1.2,
      );
    });
  });

  it('mostra o atalho de arroto só no perfil próprio e o trava nesse destino', async () => {
    const meuPerfil = {
      id: 'eu', handle: 'gio', apelido: 'Gio', fundador: false, daCasa: false,
      criadoEm: '2026-10-20T12:00:00Z', totalCausos: 0, totalSeguidores: 0,
      totalSeguindo: 0, euSigo: false, souEu: true,
    };
    const conta: PortaDeConta = {
      estado: vi.fn(async () => ({ temSessao: true, anonima: false, perfilSocialPendente: false })),
      cadastrar: vi.fn(), entrar: vi.fn(), enviarLinkDeRedefinicao: vi.fn(), redefinirSenha: vi.fn(), sair: vi.fn(),
    };
    const perfil: PortaDePerfil = {
      obterMeuPerfil: vi.fn(async () => meuPerfil),
      obterPerfil: vi.fn(async () => meuPerfil),
      obterMeuPerfilParaEdicao: vi.fn(), alternarSeguir: vi.fn(), concluirMeuPerfilSocial: vi.fn(), atualizarMeuPerfil: vi.fn(),
      enviarFoto: vi.fn(), removerFoto: vi.fn(), enviarCapa: vi.fn(), removerCapa: vi.fn(), listarConexoes: vi.fn(),
    };
    const captura: CapturaDeAudio = {
      pedir: vi.fn(async () => ({ ok: true as const })),
      comecar: vi.fn(() => true),
      parar: vi.fn(async () => ({
        dados: new Blob(['arroto'], { type: 'audio/webm' }), formato: 'audio/webm', duracaoMs: 1200,
        resumo: { rms: 0.2, pico: 0.4 },
      })),
      nivelAtual: vi.fn(() => 0), soltar: vi.fn(), estaVivo: vi.fn(() => false), estaGravando: vi.fn(() => false),
    };
    const arrotos: PortaDeArrotosDoPerfil = {
      prepararArroto: vi.fn(async () => ({ ok: true as const, rascunho: {
        id: 'arroto-1', caminhoDoAudio: 'eu/arroto-1', perfilDestinoId: 'eu', perfilDestinoHandle: 'gio', perfilDestinoApelido: 'Gio',
      } })),
      publicarArroto: vi.fn(async () => ({ ok: true as const, arroto: {
        id: 'arroto-1', perfilId: 'eu', autorId: 'eu', autorHandle: 'gio', autorApelido: 'Gio',
        duracaoSegundos: 1.2, criadoEm: '2026-10-20T12:00:00Z', meu: true, possoOcultar: true,
        enderecoDoAudio: vi.fn(async () => 'https://audio.test/arroto-1'),
      } })),
      listarArrotos: vi.fn(async () => []), ocultarArroto: vi.fn(async () => true),
    };

    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
          portaConta={conta}
          portaPerfil={perfil}
          portaArrotosDoPerfil={arrotos}
          capturaDireta={captura}
          viewInicial="perfil"
        />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('tab', { name: /Arrotos 0/ }));
    const atalho = await screen.findByRole('button', { name: 'Gravar um arroto no meu perfil' });
    fireEvent.click(atalho);
    fireEvent.click(screen.getByRole('button', { name: /Gravar agora/ }));
    await waitFor(() => expect(captura.comecar).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole('button', { name: /Parar gravação/ }));

    expect(await screen.findByText('Este áudio vai ficar no grupo Arrotos do seu perfil.')).toBeTruthy();
    expect(screen.queryByRole('radio', { name: /Perfil de outra pessoa/i })).toBeNull();
    expect(screen.queryByRole('radio', { name: /Feed de uma comunidade/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar arroto' }));
    await waitFor(() => {
      expect(arrotos.prepararArroto).toHaveBeenCalledWith();
      expect(arrotos.publicarArroto).toHaveBeenCalledWith(
        expect.objectContaining({ perfilDestinoId: 'eu', perfilDestinoHandle: 'gio' }), expect.any(Blob), 1.2,
      );
    });
    expect(await screen.findByText('Arroto direto · 2s')).toBeTruthy();
  });

  it('não mostra o atalho de arroto ao visitar o perfil de outra pessoa', async () => {
    const outraPessoa = {
      id: 'bia', handle: 'bia', apelido: 'Bia', fundador: false, daCasa: false,
      criadoEm: '2026-10-20T12:00:00Z', totalCausos: 0, totalSeguidores: 0,
      totalSeguindo: 0, euSigo: false, souEu: false,
    };
    const conta: PortaDeConta = {
      estado: vi.fn(async () => ({ temSessao: true, anonima: false, perfilSocialPendente: false })),
      cadastrar: vi.fn(), entrar: vi.fn(), enviarLinkDeRedefinicao: vi.fn(), redefinirSenha: vi.fn(), sair: vi.fn(),
    };
    const perfil = {
      obterMeuPerfil: vi.fn(async () => ({ ...outraPessoa, id: 'eu', handle: 'gio', souEu: true })),
      obterPerfil: vi.fn(async () => outraPessoa),
    } as unknown as PortaDePerfil;

    render(
      <MemoryRouter initialEntries={['/u/bia']}>
        <InicioOpenDesign portaForum={mockForum} portaComunidade={mockComunidade} portaConta={conta} portaPerfil={perfil} viewInicial="perfil" handleInicial="bia" />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('tab', { name: /Arrotos 0/ }));
    expect(screen.queryByRole('button', { name: 'Gravar um arroto no meu perfil' })).toBeNull();
  });

  it('mantém o ajuste aberto e explica a recusa quando salvar a foto falha', async () => {
    const meuPerfil = {
      id: 'eu', handle: 'gio', apelido: 'Gio', fundador: false, daCasa: false,
      criadoEm: '2026-10-20T12:00:00Z', totalCausos: 0, totalSeguidores: 0,
      totalSeguindo: 0, euSigo: false, souEu: true,
    };
    const conta: PortaDeConta = {
      estado: vi.fn(async () => ({ temSessao: true, anonima: false, perfilSocialPendente: false })),
      cadastrar: vi.fn(), entrar: vi.fn(), enviarLinkDeRedefinicao: vi.fn(), redefinirSenha: vi.fn(), sair: vi.fn(),
    };
    const enviarFoto = vi.fn(async () => ({ ok: false as const, motivo: 'falhou' as const }));
    const perfil: PortaDePerfil = {
      obterMeuPerfil: vi.fn(async () => meuPerfil), obterPerfil: vi.fn(async () => meuPerfil),
      obterMeuPerfilParaEdicao: vi.fn(), alternarSeguir: vi.fn(), concluirMeuPerfilSocial: vi.fn(), atualizarMeuPerfil: vi.fn(),
      enviarFoto, removerFoto: vi.fn(), enviarCapa: vi.fn(), removerCapa: vi.fn(), listarConexoes: vi.fn(),
    };
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 512, height: 512, close: vi.fn() })));
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:foto'), revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as never);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['foto'], { type: 'image/jpeg' })));

    render(
      <MemoryRouter>
        <InicioOpenDesign portaForum={mockForum} portaComunidade={mockComunidade} portaConta={conta} portaPerfil={perfil} viewInicial="perfil" />
      </MemoryRouter>,
    );

    const entrada = await screen.findByLabelText('Escolher nova foto de perfil');
    fireEvent.change(entrada, { target: { files: [new File(['foto'], 'foto.jpg', { type: 'image/jpeg' })] } });
    const dialogo = await screen.findByRole('dialog', { name: 'Ajustar foto' });
    fireEvent.load(dialogo.querySelector('img')!);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(enviarFoto).toHaveBeenCalledOnce());
    expect(screen.getByRole('dialog', { name: 'Ajustar foto' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Não foi possível trocar a foto agora.');
  });

  it('abre modal institucional ao clicar nos links do rodapé', async () => {
    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
          autenticado={true}
        />
      </MemoryRouter>,
    );

    const btnSobre = screen.getByRole('button', { name: 'Sobre o Auê' });
    fireEvent.click(btnSobre);

    expect(await screen.findByRole('heading', { level: 2, name: 'Sobre o Auê' })).toBeTruthy();
    expect(screen.getByText(/O Auê é uma comunidade brasileira/)).toBeTruthy();
  });

  it('renderiza a tela de login 1:1 e permite alternar entre os painéis de autenticação', async () => {
    const mockConta = {
      estado: vi.fn(async () => ({ temSessao: false, anonima: false, perfilSocialPendente: false, podeParticiparSocialmente: false })),
      cadastrar: vi.fn(async () => ({ ok: true as const })),
      entrar: vi.fn(async () => ({ ok: true as const })),
      enviarLinkDeRedefinicao: vi.fn(async () => ({ ok: true as const })),
      redefinirSenha: vi.fn(),
      sair: vi.fn(async () => true),
    };

    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
          portaConta={mockConta}
          viewInicial="auth"
        />
      </MemoryRouter>,
    );

    // Painel Login 1:1
    expect(screen.getByRole('heading', { level: 1, name: 'Entra na roda' })).toBeTruthy();
    expect(screen.queryByLabelText('Navegação lateral')).toBeNull();
    expect(screen.queryByLabelText('Painel complementar')).toBeNull();
    expect(screen.getByLabelText('E-mail')).toBeTruthy();
    expect(screen.getByLabelText('Senha')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Entrar no Auê' })).toBeTruthy();

    // Alterna para Esqueci minha senha (recover)
    const btnEsqueci = screen.getByRole('button', { name: 'Esqueci minha senha' });
    fireEvent.click(btnEsqueci);
    expect(screen.getByRole('heading', { level: 1, name: 'Recuperar senha' })).toBeTruthy();

    // Cadastro aberto: não há lista de convite.
    const btnVoltar = screen.getByRole('button', { name: 'Voltar para entrar' });
    fireEvent.click(btnVoltar);
    const btnCriarConta = screen.getByRole('button', { name: 'Criar conta' });
    fireEvent.click(btnCriarConta);
    expect(screen.getByRole('heading', { level: 1, name: 'Cria sua conta' })).toBeTruthy();
    expect(screen.getByLabelText('Apelido')).toBeTruthy();
    expect(screen.getByLabelText('@')).toBeTruthy();
    expect(screen.getByLabelText('E-mail para cadastro')).toBeTruthy();
    expect(screen.getByLabelText('Senha para cadastro')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Apelido'), { target: { value: 'Luiz' } });
    fireEvent.change(screen.getByLabelText('@'), { target: { value: 'luiz_arrota' } });
    fireEvent.change(screen.getByLabelText('E-mail para cadastro'), { target: { value: 'luiz@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha para cadastro'), { target: { value: 'senha-segura' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() => expect(mockConta.cadastrar).toHaveBeenCalledWith({
      apelido: 'Luiz', handle: 'luiz_arrota', email: 'luiz@example.com', senha: 'senha-segura',
    }));
  });

  it('fecha a ficha social pendente antes de liberar o perfil', async () => {
    const conta: PortaDeConta = {
      estado: vi.fn(async () => ({ temSessao: true, anonima: false, perfilSocialPendente: true, podeParticiparSocialmente: false })),
      cadastrar: vi.fn(), entrar: vi.fn(), enviarLinkDeRedefinicao: vi.fn(), redefinirSenha: vi.fn(), sair: vi.fn(),
    };
    const perfil = {
      obterMeuPerfilParaEdicao: vi.fn(async () => ({ apelido: 'Luiz', handle: 'luiz' })),
      concluirMeuPerfilSocial: vi.fn(async () => ({ ok: true as const, perfil: {
        id: 'eu', apelido: 'Luiz', handle: 'luiz', fundador: false, daCasa: false, criadoEm: '2026-10-20', totalCausos: 0, totalSeguidores: 0, totalSeguindo: 0, euSigo: false, souEu: true,
      } })),
    } as unknown as PortaDePerfil;
    render(<MemoryRouter><InicioOpenDesign portaForum={mockForum} portaComunidade={mockComunidade} portaConta={conta} portaPerfil={perfil} viewInicial="perfil" /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Termina sua ficha.' })).toBeTruthy();
    expect(screen.getByDisplayValue('Luiz')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Entrar no Bonde' }));
    await waitFor(() => expect(perfil.concluirMeuPerfilSocial).toHaveBeenCalledWith(expect.objectContaining({ apelido: 'Luiz', handle: 'luiz' })));
  });

  it('permite abrir o modal de comentários, ler a conversa e responder na roda', async () => {
    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={mockComunidade}
          autenticado={true}
        />
      </MemoryRouter>,
    );

    // Espera o post carregar
    expect(await screen.findByText('Arroto que quebrou a taça da sala')).toBeTruthy();

    // Clica no botão de comentários
    const btnComentarios = screen.getByRole('button', { name: /12 comentários/i });
    fireEvent.click(btnComentarios);

    // Diálogo aberto com cabeçalho
    expect(await screen.findByRole('heading', { level: 2, name: 'Resenha na roda' })).toBeTruthy();

    // Comentário da porta carregado
    expect(await screen.findByText('Esse som foi histórico na firma!')).toBeTruthy();
    expect(screen.getByText('Pedro Som')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Abrir perfil de Zé do Eco' }).getAttribute('href')).toBe('/u/ze_do_eco');
    expect(screen.getByRole('link', { name: 'Abrir perfil de Pedro Som' }).getAttribute('href')).toBe('/u/pedro_som');

    // Digita e envia uma resposta
    const inputResposta = screen.getByPlaceholderText('Responder para a roda…');
    fireEvent.change(inputResposta, { target: { value: 'Eu estava lá e confirmo o eco!' } });

    const btnEnviar = screen.getByRole('button', { name: 'Responder' });
    fireEvent.click(btnEnviar);

    await waitFor(() => {
      expect(mockForum.responderTopico).toHaveBeenCalledWith(
        expect.objectContaining({
          corpo: 'Eu estava lá e confirmo o eco!',
        }),
      );
    });

    // Nova resposta renderizada na lista
    expect(await screen.findByText('Eu estava lá e confirmo o eco!')).toBeTruthy();
  });

  it('mantém a comunidade fora da roda quando a porta recusa a entrada', async () => {
    const comunidadeQueRecusa: PortaDeComunidade = {
      ...mockComunidade,
      entrarComunidade: vi.fn(async () => false),
    };

    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={comunidadeQueRecusa}
          portaConta={contaAutenticada}
          autenticado
          viewInicial="comunidades"
        />
      </MemoryRouter>,
    );

    const entrar = await screen.findAllByRole('button', { name: 'Entrar' });
    fireEvent.click(entrar[0]);

    expect((await screen.findByRole('status')).textContent).toContain('Não deu para atualizar sua participação agora.');
    expect(screen.getAllByRole('button', { name: 'Entrar' }).length).toBeGreaterThan(0);
  });

  it('mantém a comunidade fora da roda quando a porta falha', async () => {
    const comunidadeIndisponivel: PortaDeComunidade = {
      ...mockComunidade,
      entrarComunidade: vi.fn(async () => { throw new Error('rede indisponível'); }),
    };

    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={comunidadeIndisponivel}
          portaConta={contaAutenticada}
          autenticado
          viewInicial="comunidades"
        />
      </MemoryRouter>,
    );

    const entrar = await screen.findAllByRole('button', { name: 'Entrar' });
    fireEvent.click(entrar[0]);

    expect((await screen.findByRole('status')).textContent).toContain('Não deu para atualizar sua participação agora.');
    expect(screen.getAllByRole('button', { name: 'Entrar' }).length).toBeGreaterThan(0);
  });

  it('leva o visitante para entrar antes de tentar participar da comunidade', async () => {
    const pedirEntrada = vi.fn();
    const comunidadeDoVisitante: PortaDeComunidade = {
      ...mockComunidade,
      entrarComunidade: vi.fn(async () => true),
    };
    render(
      <MemoryRouter>
        <InicioOpenDesign
          portaForum={mockForum}
          portaComunidade={comunidadeDoVisitante}
          autenticado={false}
          aoEntrar={pedirEntrada}
          viewInicial="comunidades"
        />
      </MemoryRouter>,
    );

    const entrar = await screen.findAllByRole('button', { name: 'Entrar' });
    fireEvent.click(entrar[0]);

    expect((await screen.findByRole('status')).textContent).toContain('Entre na sua conta para participar da roda.');
    expect(pedirEntrada).toHaveBeenCalledOnce();
    expect(comunidadeDoVisitante.entrarComunidade).not.toHaveBeenCalled();
  });
});
