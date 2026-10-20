import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { criarComunidadeWeb } from '../../plataforma/web/comunidade';
import { criarContaWeb } from '../../plataforma/web/conta';
import { criarPerfilRemoto } from '../../plataforma/web/perfilRemoto';
import type { CausoPostado, PortaDeComunidade } from '../../portas/comunidade';
import type { PortaDeConta } from '../../portas/conta';
import type { Conexao, DadosDoPerfil, PerfilPublico, PortaDePerfil } from '../../portas/perfil';
import './casca.css';
import './PerfilConectado.css';

const texto = {
  titulo: 'Meu perfil', subtitulo: 'Sua ficha no Auê.', navegar: 'Navegar', comunidades: 'Comunidades', explorar: 'Explorar', perfil: 'Perfil', sair: 'Sair',
  editar: 'Editar perfil', trocarFoto: 'Trocar foto', resenhas: 'Resenhas', carregando: 'Carregando seu perfil…',
  semPerfil: 'Seu perfil ainda não está pronto.', semPerfilTexto: 'Termina sua ficha para entrar nas comunidades.', criarConta: 'Criar conta',
  falha: 'Deu ruim pra abrir seu perfil.', falhaTexto: 'Nada foi inventado. Tenta de novo quando a conexão voltar.', tentar: 'Tentar de novo',
  semResenhas: 'Ainda não tem resenha por aqui.', semResenhasTexto: 'Quando você publicar numa comunidade, ela aparece aqui.',
  falhaResenhas: 'Não deu para carregar suas resenhas.', seguidores: 'seguidores', seguindo: 'seguindo', resenhasNumero: 'resenhas',
  atividade: 'Atividade', posts: 'Posts', comentarios: 'Comentários', comunidade: 'Comunidade', buscarIndisponivel: 'Busca ainda indisponível',
  editarTitulo: 'Editar perfil', nome: 'Nome', handle: 'Seu @', bio: 'Bio', cidade: 'Cidade', cancelar: 'Cancelar', salvar: 'Salvar',
  salvando: 'Salvando…', conexoes: 'Conexões', ninguem: 'Ninguém por aqui ainda.', fotoFalhou: 'Não deu para trocar a foto agora.',
  fotoTipo: 'Use uma foto JPG, PNG ou WebP.', fotoTamanho: 'Essa foto passa de 15 MB.', editarFalhou: 'Não deu para salvar agora. Nada mudou.',
  conexoesFalharam: 'Não deu para carregar as conexões agora.',
  lateralTitulo: 'Comunidades de verdade', lateralTexto: 'Quando você entrar numa comunidade, ela aparece onde a porta devolver.', chegouEm: (ano: number) => `Chegou em ${ano}`,
} as const;

interface Props {
  readonly portaPerfil?: PortaDePerfil;
  readonly portaComunidade?: PortaDeComunidade;
  readonly portaConta?: PortaDeConta;
  readonly aoEntrar: () => void;
}

type Formulario = Required<Pick<DadosDoPerfil, 'apelido' | 'handle' | 'bio' | 'cidade'>>;

function iniciais(perfil: PerfilPublico): string { return perfil.apelido.slice(0, 2).toUpperCase(); }
function dataCurta(iso: string): string { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso)); }

export function PerfilConectado({ portaPerfil, portaComunidade, portaConta, aoEntrar }: Props) {
  const [perfilPort] = useState(() => portaPerfil ?? criarPerfilRemoto());
  const [comunidadePort] = useState(() => portaComunidade ?? criarComunidadeWeb());
  const [contaPort] = useState(() => portaConta ?? criarContaWeb());
  const [perfil, setPerfil] = useState<PerfilPublico | null>();
  const [causos, setCausos] = useState<readonly CausoPostado[] | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [falhaNoFeed, setFalhaNoFeed] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [form, setForm] = useState<Formulario>({ apelido: '', handle: '', bio: '', cidade: '' });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [conexoes, setConexoes] = useState<{ titulo: string; lista: readonly Conexao[] } | null>(null);
  const dialogoEdicao = useRef<HTMLDialogElement>(null);
  const dialogoConexoes = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let ativo = true;
    setPerfil(undefined); setFalhou(false); setCausos(null); setFalhaNoFeed(false);
    contaPort.estado().then(async (conta) => {
      if (!ativo) return;
      if (!conta.podeParticiparSocialmente || conta.anonima) { setPerfil(null); return; }
      const meu = await perfilPort.obterMeuPerfil();
      if (ativo) setPerfil(meu);
    }).catch(() => { if (ativo) setFalhou(true); });
    return () => { ativo = false; };
  }, [contaPort, perfilPort, tentativa]);

  useEffect(() => {
    if (!perfil) return;
    let ativo = true;
    comunidadePort.listarFeed({ autorId: perfil.id, limite: 50 }).then(
      (lista) => { if (ativo) setCausos(lista); },
      () => { if (ativo) { setCausos([]); setFalhaNoFeed(true); } },
    );
    return () => { ativo = false; };
  }, [perfil, comunidadePort]);

  const abrirEdicao = () => {
    if (!perfil) return;
    setErro(''); setForm({ apelido: perfil.apelido, handle: perfil.handle, bio: perfil.bio ?? '', cidade: perfil.cidade ?? '' });
    dialogoEdicao.current?.showModal();
  };
  const salvar = async (evento: FormEvent) => {
    evento.preventDefault(); setSalvando(true); setErro('');
    const resultado = await perfilPort.atualizarMeuPerfil(form);
    setSalvando(false);
    if (!resultado.ok) { setErro(resultado.motivo === 'invalido' ? resultado.detalhe : texto.editarFalhou); return; }
    setPerfil(resultado.perfil); dialogoEdicao.current?.close();
  };
  const trocarFoto = async (arquivo?: File) => {
    if (!arquivo) return;
    setAviso('');
    try {
      const resultado = await perfilPort.enviarFoto(arquivo);
      if (resultado.ok) setPerfil(resultado.perfil);
      else setAviso(resultado.motivo === 'formatoInvalido' ? texto.fotoTipo : resultado.motivo === 'grandeDemais' ? texto.fotoTamanho : texto.fotoFalhou);
    } catch {
      setAviso(texto.fotoFalhou);
    }
  };
  const abrirConexoes = async (tipo: 'seguidores' | 'seguindo') => {
    if (!perfil) return;
    setConexoes({ titulo: tipo === 'seguidores' ? texto.seguidores : texto.seguindo, lista: [] }); dialogoConexoes.current?.showModal?.();
    try {
      const lista = await perfilPort.listarConexoes(perfil.handle, tipo);
      setConexoes({ titulo: tipo === 'seguidores' ? texto.seguidores : texto.seguindo, lista });
    } catch {
      setAviso(texto.conexoesFalharam);
      dialogoConexoes.current?.close?.();
    }
  };
  const sair = async () => { if (await contaPort.sair()) aoEntrar(); };

  const principal = (() => {
    if (perfil === undefined && !falhou) return <section className="novo-aue__card novo-aue__vazio"><p>{texto.carregando}</p></section>;
    if (falhou) return <section className="novo-aue__card novo-aue__vazio"><h2>{texto.falha}</h2><p>{texto.falhaTexto}</p><button className="novo-aue__acao" onClick={() => setTentativa((n) => n + 1)}>{texto.tentar}</button></section>;
    if (!perfil) return <section className="novo-aue__card novo-aue__vazio"><h2>{texto.semPerfil}</h2><p>{texto.semPerfilTexto}</p><button className="novo-aue__acao novo-aue__acao--principal" onClick={aoEntrar}>{texto.criarConta}</button></section>;
    return <>
      <article className="novo-perfil__hero">
        <div className="novo-perfil__capa" />
        <div className="novo-perfil__corpo">
          <label className="novo-perfil__avatar" title={texto.trocarFoto}><input aria-label={texto.trocarFoto} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void trocarFoto(e.target.files?.[0])} />{perfil.avatarUrl ? <img src={perfil.avatarUrl} alt="" /> : iniciais(perfil)}</label>
          <div className="novo-perfil__acoes"><button className="novo-aue__acao" onClick={abrirEdicao}>{texto.editar}</button></div>
          <div className="novo-perfil__copy"><h1>{perfil.apelido}</h1><p className="novo-perfil__handle">@{perfil.handle} · {texto.chegouEm(new Date(perfil.criadoEm).getFullYear())}</p>{perfil.bio && <p className="novo-perfil__bio">{perfil.bio}</p>}{perfil.cidade && <p className="novo-perfil__meta"><span>⌖ {perfil.cidade}</span></p>}{aviso && <p className="novo-perfil__erro" role="alert">{aviso}</p>}</div>
          <div className="novo-perfil__stats"><div className="novo-perfil__stat"><strong>{perfil.totalCausos}</strong><span>{texto.resenhasNumero}</span></div><button onClick={() => void abrirConexoes('seguidores')}><strong>{perfil.totalSeguidores}</strong><span>{texto.seguidores}</span></button><button onClick={() => void abrirConexoes('seguindo')}><strong>{perfil.totalSeguindo}</strong><span>{texto.seguindo}</span></button></div>
        </div>
      </article>
      <div className="novo-perfil__colunas">
        <section className="novo-perfil__painel" aria-labelledby="atividade"><div className="novo-perfil__atividade-topo"><h2 id="atividade">{texto.atividade}</h2><div className="novo-perfil__abas"><button aria-selected="true">{texto.posts}</button><button disabled>{texto.comentarios}</button></div></div><div className="novo-perfil__lista">{falhaNoFeed ? <section className="novo-aue__vazio"><p>{texto.falhaResenhas}</p></section> : causos === null ? <p className="novo-perfil__meta">{texto.carregando}</p> : causos.length === 0 ? <section className="novo-aue__vazio"><h2>{texto.semResenhas}</h2><p>{texto.semResenhasTexto}</p></section> : causos.map((causo) => <Link className="novo-perfil__resenha" key={causo.id} to={`/historia/${causo.id}`}><div className="novo-perfil__metadado"><span className="novo-perfil__selo">r/{causo.comunidadeSlug}</span><span>{dataCurta(causo.criadoEm)}</span></div><h3>{causo.conteudo}</h3><div className="novo-perfil__rodape"><span>▢ {causo.totalComentarios}</span><span>♥ {causo.curtidas}</span></div></Link>)}</div></section>
        <aside className="novo-perfil__painel"><h2>{texto.conexoes}</h2><div className="novo-perfil__conexoes-resumo"><button className="novo-perfil__conexao-acao" onClick={() => void abrirConexoes('seguidores')}><span className="novo-perfil__mini-avatar">◎</span><span><strong>{texto.seguidores}</strong><span>{perfil.totalSeguidores}</span></span></button><button className="novo-perfil__conexao-acao" onClick={() => void abrirConexoes('seguindo')}><span className="novo-perfil__mini-avatar">→</span><span><strong>{texto.seguindo}</strong><span>{perfil.totalSeguindo}</span></span></button></div></aside>
      </div>
    </>;
  })();

  return <div className="novo-aue"><div className="novo-aue__grade">
    <aside className="novo-aue__lateral"><Link className="novo-aue__marca" to="/comunidades">auê<span>!</span></Link><p className="novo-aue__rotulo">{texto.navegar}</p><nav className="novo-aue__nav" aria-label="Principal"><Link to="/comunidades"><span className="novo-aue__nav-icone">◉</span>{texto.comunidades}</Link><Link to="/explorar"><span className="novo-aue__nav-icone">⌕</span>{texto.explorar}</Link><Link to="/perfil" aria-current="page"><span className="novo-aue__nav-icone">●</span>{texto.perfil}</Link></nav><button className="novo-aue__sair" onClick={() => void sair()}>{texto.sair}</button></aside>
    <main className="novo-aue__miolo"><header className="novo-aue__topo"><input className="novo-aue__busca" aria-label={texto.buscarIndisponivel} placeholder={texto.buscarIndisponivel} disabled /><Link className="novo-aue__perfil-mini" to="/perfil"><span className="novo-aue__avatar-mini">●</span>{texto.perfil}</Link></header>{principal}</main>
    <aside className="novo-aue__painel-lateral"><section className="novo-aue__card novo-aue__vazio"><h2>{texto.lateralTitulo}</h2><p>{texto.lateralTexto}</p></section></aside>
  </div><nav className="novo-aue__mobile-nav" aria-label="Principal"><Link to="/comunidades">{texto.comunidades}</Link><Link to="/explorar">{texto.explorar}</Link><Link to="/perfil" aria-current="page">{texto.perfil}</Link></nav>
  <dialog ref={dialogoEdicao} className="novo-perfil__dialogo"><form onSubmit={(e) => void salvar(e)}><h2>{texto.editarTitulo}</h2>{erro && <p className="novo-perfil__erro" role="alert">{erro}</p>}<label className="novo-perfil__campo">{texto.nome}<input value={form.apelido} onChange={(e) => setForm({ ...form, apelido: e.target.value })} required /></label><label className="novo-perfil__campo">{texto.handle}<input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} required /></label><label className="novo-perfil__campo">{texto.bio}<textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label><label className="novo-perfil__campo">{texto.cidade}<input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></label><div className="novo-perfil__botoes"><button type="button" className="novo-aue__acao" onClick={() => dialogoEdicao.current?.close()}>{texto.cancelar}</button><button className="novo-aue__acao novo-aue__acao--principal" disabled={salvando}>{salvando ? texto.salvando : texto.salvar}</button></div></form></dialog>
  <dialog ref={dialogoConexoes} className="novo-perfil__dialogo"><form method="dialog"><h2>{conexoes?.titulo ?? texto.conexoes}</h2>{conexoes?.lista.length ? conexoes.lista.map((pessoa) => <div className="novo-perfil__conexao" key={pessoa.id}><span className="novo-perfil__mini-avatar">{pessoa.avatarUrl ? <img src={pessoa.avatarUrl} alt="" /> : pessoa.apelido.slice(0, 2).toUpperCase()}</span><span>{pessoa.apelido}<br /><small>@{pessoa.handle}</small></span></div>) : <p>{texto.ninguem}</p>}<div className="novo-perfil__botoes"><button className="novo-aue__acao">{texto.cancelar}</button></div></form></dialog>
  </div>;
}
