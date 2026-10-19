import { configuracaoAusente, supabase, updateProfile } from '../../db/supabase';
import { limparDadosLocaisDaConta } from './perfil';
import {
  emailParece,
  handleValido,
  SENHA_MINIMA,
  type EstadoDaConta,
  type PedidoDeCadastro,
  type PortaDeConta,
  type ResultadoDaConta,
} from '../../portas/conta';

function traduzirErro(mensagem: string): ResultadoDaConta {
  const m = mensagem.toLowerCase();
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('email_exists')) {
    return { ok: false, motivo: 'emailEmUso' };
  }
  if (m.includes('invalid login credentials')) return { ok: false, motivo: 'credenciaisInvalidas' };
  if (m.includes('password') && (m.includes('weak') || m.includes('at least') || m.includes('short'))) {
    return { ok: false, motivo: 'senhaFraca' };
  }
  return { ok: false, motivo: 'falhou', detalhe: mensagem };
}

/** Adaptador web da porta de conta. */
export function criarContaWeb(): PortaDeConta {
  return {
    async estado(): Promise<EstadoDaConta> {
      if (configuracaoAusente) return { temSessao: false, anonima: false, podeParticiparSocialmente: false };
      const { data } = await supabase.auth.getSession();
      const usuario = data.session?.user;
      if (!usuario) return { temSessao: false, anonima: false, podeParticiparSocialmente: false };
      return {
        temSessao: true,
        anonima: Boolean(usuario.is_anonymous),
        podeParticiparSocialmente: !usuario.is_anonymous,
        email: usuario.email || undefined,
      };
    },

    async cadastrar(pedido: PedidoDeCadastro): Promise<ResultadoDaConta> {
      if (configuracaoAusente) return { ok: false, motivo: 'semServidor' };
      const email = pedido.email.trim();
      if (!emailParece(email)) return { ok: false, motivo: 'emailInvalido' };
      if (pedido.senha.length < SENHA_MINIMA) return { ok: false, motivo: 'senhaFraca' };
      const handle = pedido.handle?.trim().replace(/^@/, '').toLowerCase();
      if (handle && !handleValido(handle)) return { ok: false, motivo: 'handleInvalido' };

      try {
        const { data: sessao } = await supabase.auth.getSession();
        const atual = sessao.session?.user;

        // Sessão anônima: PROMOVE a mesma conta. O uid não muda, então os
        // arrotes, causos e comentários já feitos continuam seus.
        if (atual?.is_anonymous) {
          // O @ e o apelido primeiro: se o @ já é de outra pessoa, nada mudou
          // na conta e a tela pede outro.
          const { error: erroDoPerfil } = await supabase.rpc('preparar_promocao_social', {
            p_apelido: pedido.apelido.trim(),
            p_handle: handle ?? null,
          });
          if (erroDoPerfil) {
            if ((erroDoPerfil as { code?: string }).code === '23505') return { ok: false, motivo: 'handleEmUso' };
            return { ok: false, motivo: 'handleInvalido' };
          }
          const { error } = await supabase.auth.updateUser({
            email,
            password: pedido.senha,
            data: { apelido: pedido.apelido.trim() },
          });
          if (error) return traduzirErro(error.message);
          return { ok: true, aviso: 'confirmeNoEmail' };
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password: pedido.senha,
          options: { data: { apelido: pedido.apelido.trim() } },
        });
        if (error) return traduzirErro(error.message);
        if (data.user && data.session) {
          try {
            await updateProfile(data.user.id, { apelido: pedido.apelido.trim() });
          } catch {
            // segue; dá para acertar no perfil
          }
          const { error: erroDaPromocao } = await supabase.rpc('preparar_promocao_social', {
            p_apelido: pedido.apelido.trim(),
            p_handle: handle ?? null,
          });
          if (erroDaPromocao) {
            if ((erroDaPromocao as { code?: string }).code === '23505') return { ok: false, motivo: 'handleEmUso' };
            return { ok: false, motivo: 'handleInvalido' };
          }
          return { ok: true };
        }
        return { ok: true, aviso: 'confirmeNoEmail' };
      } catch (erro) {
        return { ok: false, motivo: 'falhou', detalhe: erro instanceof Error ? erro.message : String(erro) };
      }
    },

    async entrar(email: string, senha: string): Promise<ResultadoDaConta> {
      if (configuracaoAusente) return { ok: false, motivo: 'semServidor' };
      if (!emailParece(email)) return { ok: false, motivo: 'emailInvalido' };
      try {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
        return error ? traduzirErro(error.message) : { ok: true };
      } catch (erro) {
        return { ok: false, motivo: 'falhou', detalhe: erro instanceof Error ? erro.message : String(erro) };
      }
    },

    async enviarLinkDeRedefinicao(email: string): Promise<ResultadoDaConta> {
      if (configuracaoAusente) return { ok: false, motivo: 'semServidor' };
      if (!emailParece(email)) return { ok: false, motivo: 'emailInvalido' };
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        });
        // Não distingue e-mail que existe do que não existe: não vira consulta de cadastro.
        return error && !/not found/i.test(error.message) ? traduzirErro(error.message) : { ok: true };
      } catch (erro) {
        return { ok: false, motivo: 'falhou', detalhe: erro instanceof Error ? erro.message : String(erro) };
      }
    },

    async redefinirSenha(novaSenha: string): Promise<ResultadoDaConta> {
      if (configuracaoAusente) return { ok: false, motivo: 'semServidor' };
      if (novaSenha.length < SENHA_MINIMA) return { ok: false, motivo: 'senhaFraca' };
      try {
        const { error } = await supabase.auth.updateUser({ password: novaSenha });
        return error ? traduzirErro(error.message) : { ok: true };
      } catch (erro) {
        return { ok: false, motivo: 'falhou', detalhe: erro instanceof Error ? erro.message : String(erro) };
      }
    },

    async sair(): Promise<boolean> {
      if (configuracaoAusente) return true;
      const { error } = await supabase.auth.signOut();
      if (error) return false;
      limparDadosLocaisDaConta();
      return true;
    },
  };
}
