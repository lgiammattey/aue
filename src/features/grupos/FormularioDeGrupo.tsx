import React, { useEffect, useRef, useState } from 'react';
import type { PlataformaDeGrupo, PortaDeGrupos } from '../../portas/grupos';
import { LIMITES, PLATAFORMAS, validarCadastro } from '../../nucleo/grupos/regras';
import { ROTULO_DA_PLATAFORMA } from './rotulos';

interface FormularioDeGrupoProps {
  aberto: boolean;
  porta: PortaDeGrupos;
  onFechar: () => void;
  /** Chamado quando o grupo foi salvo. `aviso` vem preenchido se algo ficou pela metade. */
  onCadastrado: (slug: string, aviso?: string) => void;
}

type Campo = 'nome' | 'descricao' | 'plataforma' | 'link' | 'imagem';

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];

const campoEstilo: React.CSSProperties = {
  minHeight: 44,
  borderRadius: 12,
  border: '1px solid var(--border-strong)',
  background: 'var(--bg)',
  color: 'var(--fg)',
  padding: '0 14px',
  fontSize: 16, // 16px evita o zoom automático do Safari iOS no foco
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  width: '100%',
};

const rotuloEstilo: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 13,
  color: 'var(--muted)',
};

export const FormularioDeGrupo: React.FC<FormularioDeGrupoProps> = ({ aberto, porta, onFechar, onCadastrado }) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [plataforma, setPlataforma] = useState<PlataformaDeGrupo>('whatsapp');
  const [link, setLink] = useState('');
  const [imagem, setImagem] = useState<File | null>(null);
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const primeiroCampo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto) primeiroCampo.current?.focus();
  }, [aberto]);

  if (!aberto) return null;

  const trocarImagem = (arquivo: File | null) => {
    setErros((e) => ({ ...e, imagem: undefined }));
    if (!arquivo) return setImagem(null);
    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      setImagem(null);
      return setErros((e) => ({ ...e, imagem: 'A imagem precisa ser JPG, PNG ou WebP.' }));
    }
    if (arquivo.size > LIMITES.imagemBytesMax) {
      setImagem(null);
      return setErros((e) => ({ ...e, imagem: 'A imagem passa de 1 MB. Escolha uma menor.' }));
    }
    setImagem(arquivo);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    setErroGeral('');

    // A tela confere cedo; quem decide é o servidor, que confere de novo.
    const conferido = validarCadastro({ nome, descricao, plataforma, link });
    if (!conferido.ok) {
      return setErros({ [conferido.campo]: conferido.mensagem });
    }
    if (erros.imagem) return;
    setErros({});

    setEnviando(true);
    const resultado = await porta.cadastrarGrupo({
      nome: conferido.grupo.nome,
      descricao: conferido.grupo.descricao,
      plataforma: conferido.grupo.plataforma,
      link: conferido.grupo.link,
      imagem,
    });
    setEnviando(false);

    if (!resultado.ok) {
      if (resultado.campo) setErros({ [resultado.campo]: resultado.mensagem });
      else setErroGeral(resultado.mensagem);
      return;
    }

    onCadastrado(
      resultado.slug,
      resultado.imagemSalva === false ? 'Grupo cadastrado, mas a imagem não subiu.' : undefined,
    );
    setNome('');
    setDescricao('');
    setLink('');
    setImagem(null);
    onFechar();
  };

  const mensagemDe = (campo: Campo) =>
    erros[campo] ? (
      <span role="alert" style={{ color: 'var(--danger, #ff5a5a)', fontSize: 13 }}>
        {erros[campo]}
      </span>
    ) : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-scrim)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 40,
      }}
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget && !enviando) onFechar();
      }}
    >
      <form
        onSubmit={enviar}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cadastro-grupo"
        noValidate
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '92dvh',
          overflowY: 'auto',
          background: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: '24px 24px 0 0',
          padding: '20px 16px calc(24px + env(safe-area-inset-bottom))',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span id="titulo-cadastro-grupo" style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>
            CADASTRAR GRUPO
          </span>
          <button
            type="button"
            onClick={onFechar}
            disabled={enviando}
            style={{ minHeight: 44, background: 'none', border: 0, color: 'var(--muted)', fontSize: 14, cursor: 'pointer' }}
          >
            Fechar
          </button>
        </div>

        <label style={rotuloEstilo}>
          Nome
          <input
            ref={primeiroCampo}
            value={nome}
            onChange={(ev) => setNome(ev.target.value)}
            maxLength={LIMITES.nomeMax}
            style={campoEstilo}
            autoComplete="off"
          />
          {mensagemDe('nome')}
        </label>

        <label style={rotuloEstilo}>
          Onde o grupo mora
          <select
            value={plataforma}
            onChange={(ev) => setPlataforma(ev.target.value as PlataformaDeGrupo)}
            style={campoEstilo}
          >
            {PLATAFORMAS.map((p) => (
              <option key={p} value={p}>
                {ROTULO_DA_PLATAFORMA[p]}
              </option>
            ))}
          </select>
          {mensagemDe('plataforma')}
        </label>

        <label style={rotuloEstilo}>
          {plataforma === 'tiktok' ? 'Link do perfil' : 'Link do convite'}
          <input
            value={link}
            onChange={(ev) => setLink(ev.target.value)}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={
              plataforma === 'whatsapp'
                ? 'https://chat.whatsapp.com/…'
                : plataforma === 'telegram'
                  ? 'https://t.me/…'
                  : 'https://www.tiktok.com/@…'
            }
            style={campoEstilo}
          />
          {mensagemDe('link')}
        </label>

        <label style={rotuloEstilo}>
          Descrição
          <textarea
            value={descricao}
            onChange={(ev) => setDescricao(ev.target.value)}
            maxLength={LIMITES.descricaoMax}
            rows={4}
            style={{ ...campoEstilo, height: 'auto', padding: '12px 14px', resize: 'none' }}
          />
          <span style={{ alignSelf: 'flex-end', fontSize: 12 }}>
            {descricao.length}/{LIMITES.descricaoMax}
          </span>
          {mensagemDe('descricao')}
        </label>

        <label style={rotuloEstilo}>
          Imagem (opcional, até 1 MB)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(ev) => trocarImagem(ev.target.files?.[0] ?? null)}
            style={{ ...campoEstilo, padding: '10px 14px', height: 'auto' }}
          />
          {mensagemDe('imagem')}
        </label>

        {erroGeral && (
          <span role="alert" style={{ color: 'var(--danger, #ff5a5a)', fontSize: 14 }}>
            {erroGeral}
          </span>
        )}

        <button
          type="submit"
          disabled={enviando}
          style={{
            minHeight: 48,
            border: 0,
            borderRadius: 999,
            background: 'var(--accent)',
            color: 'var(--accent-on)',
            fontWeight: 700,
            fontSize: 16,
            cursor: enviando ? 'default' : 'pointer',
            opacity: enviando ? 0.6 : 1,
          }}
        >
          {enviando ? 'Cadastrando…' : 'Cadastrar'}
        </button>
      </form>
    </div>
  );
};
