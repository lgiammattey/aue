import { useEffect, useState, type FormEvent } from 'react';
import { normalizarRede, type RedeSocial } from '../../nucleo/perfil/redesSociais';

interface Props {
  readonly aberto: boolean;
  readonly nomeInicial: string;
  readonly handleInicial: string;
  readonly bioInicial: string;
  readonly cidadeInicial: string;
  readonly redesIniciais: {
    readonly instagram?: string;
    readonly tiktok?: string;
    readonly youtube?: string;
    readonly twitter?: string;
  };
  readonly aoFechar: () => void;
  readonly aoSalvar: (dados: {
    apelido: string;
    handle: string;
    bio: string;
    cidade: string;
    instagram: string;
    tiktok: string;
    youtube: string;
    twitter: string;
  }) => Promise<void>;
}

export function ModalEditarPerfil({
  aberto,
  nomeInicial,
  handleInicial,
  bioInicial,
  cidadeInicial,
  redesIniciais,
  aoFechar,
  aoSalvar,
}: Props) {
  const [apelido, setApelido] = useState(nomeInicial);
  const [handle, setHandle] = useState(handleInicial);
  const [bio, setBio] = useState(bioInicial);
  const [cidade, setCidade] = useState(cidadeInicial);
  const [instagram, setInstagram] = useState(redesIniciais.instagram ?? '');
  const [tiktok, setTiktok] = useState(redesIniciais.tiktok ?? '');
  const [youtube, setYoutube] = useState(redesIniciais.youtube ?? '');
  const [twitter, setTwitter] = useState(redesIniciais.twitter ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setApelido(nomeInicial);
    setHandle(handleInicial);
    setBio(bioInicial);
    setCidade(cidadeInicial);
    setInstagram(redesIniciais.instagram ?? '');
    setTiktok(redesIniciais.tiktok ?? '');
    setYoutube(redesIniciais.youtube ?? '');
    setTwitter(redesIniciais.twitter ?? '');
    setErro(null);
    // Enquanto o diálogo está aberto, a pessoa é dona do rascunho. Atualizações
    // assíncronas do perfil não podem sobrescrever o que ela acabou de digitar.
  // Os valores iniciais são capturados a cada nova abertura.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  if (!aberto) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!apelido.trim() || !handle.trim()) return;
    const redes: Record<RedeSocial, string> = { instagram: '', tiktok: '', youtube: '', twitter: '' };
    for (const [rede, valor] of [['instagram', instagram], ['tiktok', tiktok], ['youtube', youtube], ['twitter', twitter]] as const) {
      const r = normalizarRede(rede, valor);
      if (!r.ok) {
        setErro(r.mensagem);
        return;
      }
      redes[rede] = r.valor ?? '';
    }
    setSalvando(true);
    setErro(null);
    try {
      await aoSalvar({
        apelido: apelido.trim(),
        handle: handle.trim().replace(/^@/, '').toLowerCase(),
        bio: bio.trim(),
        cidade: cidade.trim(),
        ...redes,
      });
      aoFechar();
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Não foi possível salvar seu perfil agora.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="modal open"
      id="profileModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogProfileTitle"
    >
      <div className="dialog">
        <div className="dialog-head">
          <h2 id="dialogProfileTitle">Editar perfil</h2>
          <button type="button" className="close" onClick={aoFechar} aria-label="Fechar modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <label>
            Nome de exibição
            <input
              type="text"
              id="profileNameInput"
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              required
              aria-label="Nome de exibição"
            />
          </label>

          <label>
            @ do Auê
            <input
              type="text"
              id="profileHandleInput"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              required
              aria-label="@ do Auê"
              autoCapitalize="none"
              spellCheck={false}
            />
          </label>

          <label>
            Bio
            <textarea
              id="profileBioInput"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              aria-label="Bio do perfil"
            />
          </label>

          <label>
            Cidade
            <input
              type="text"
              id="profileCityInput"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              aria-label="Cidade"
            />
          </label>

          <fieldset className="profile-form__redes">
            <legend>Onde te achar <span>(opcional)</span></legend>
            <label>
              Instagram
              <input placeholder="@seu_perfil ou o link" value={instagram} onChange={(e) => setInstagram(e.target.value)} aria-label="Instagram" autoCapitalize="none" />
            </label>
            <label>
              TikTok
              <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} aria-label="TikTok" autoCapitalize="none" />
            </label>
            <label>
              YouTube
              <input value={youtube} onChange={(e) => setYoutube(e.target.value)} aria-label="YouTube" autoCapitalize="none" />
            </label>
            <label>
              X / Twitter
              <input value={twitter} onChange={(e) => setTwitter(e.target.value)} aria-label="X / Twitter" autoCapitalize="none" />
            </label>
          </fieldset>

          {erro && <p className="profile-form__erro" role="alert">{erro}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button
              type="button"
              className="tab"
              onClick={aoFechar}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="submit"
              id="saveProfileBtn"
              disabled={salvando || !apelido.trim() || !handle.trim()}
            >
              {salvando ? 'Salvando…' : 'Salvar mudanças'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
