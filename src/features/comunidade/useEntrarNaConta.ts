import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { criarContaWeb } from '../../plataforma/web/conta';
import { criarPerfilRemoto } from '../../plataforma/web/perfilRemoto';
import { obterPerfilLocal, salvarPerfilLocal } from '../../plataforma/web/perfil';
import {
  emailParece,
  SENHA_MINIMA,
  type PortaDeConta,
  type ResultadoDaConta,
} from '../../portas/conta';

const MENSAGENS: Record<string, string> = {
  emailInvalido: 'E-mail inválido.',
  senhaFraca: `Senha com no mínimo ${SENHA_MINIMA} caracteres.`,
  emailEmUso: 'Este e-mail já está cadastrado. Entra com ele.',
  credenciaisInvalidas: 'E-mail ou senha incorretos.',
  handleEmUso: 'Esse @ já é de outra pessoa. Escolhe outro.',
  handleInvalido: '@: de 3 a 20 letras minúsculas, números ou _.',
  semServidor: 'Sem conexão com o servidor do Auê. Tenta de novo daqui a pouco.',
};

function mensagemDe(r: Extract<ResultadoDaConta, { ok: false }>): string {
  return r.motivo === 'falhou' ? 'Não deu certo agora. Tenta de novo.' : MENSAGENS[r.motivo];
}

/**
 * A entrada de quem já tem conta, usada pela landing (`/`) e pelo `/login`.
 *
 * O Auê está fechado pra quem não tem conta: criar conta e entrar com convite
 * não existem ainda, então esta é a única porta. A lógica mora aqui pra as duas
 * telas não terem cada uma a sua cópia dela.
 */
export function useEntrarNaConta(portaConta?: PortaDeConta) {
  const navigate = useNavigate();
  const [conta] = useState<PortaDeConta>(() => portaConta ?? criarContaWeb());
  const [erro, setErro] = useState('');
  const [info, setInfo] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Alinha o perfil guardado no aparelho com o do servidor, para o nome certo
  // aparecer no composer logo depois de entrar.
  const sincronizarPerfilLocal = async () => {
    try {
      const meu = await criarPerfilRemoto().obterMeuPerfil();
      if (!meu) return;
      const local = obterPerfilLocal();
      salvarPerfilLocal({ ...local, id: meu.id, nome: meu.apelido, handle: meu.handle });
    } catch {
      // o servidor é a fonte de verdade; o espelho local pode esperar
    }
  };

  const limpar = () => {
    setErro('');
    setInfo('');
  };

  const entrar = async (email: string, senha: string) => {
    limpar();
    if (!emailParece(email)) return setErro(MENSAGENS.emailInvalido);
    if (senha.length < SENHA_MINIMA) return setErro(MENSAGENS.senhaFraca);

    setCarregando(true);
    try {
      const r = await conta.entrar(email, senha);
      if (!r.ok) return setErro(mensagemDe(r));
      const estado = await conta.estado();
      if (estado.perfilSocialPendente) {
        navigate('/perfil?boas-vindas=1');
        return;
      }
      await sincronizarPerfilLocal();
      navigate('/');
    } finally {
      setCarregando(false);
    }
  };

  const mandarLinkDeSenha = async (email: string) => {
    limpar();
    if (!emailParece(email)) return setErro(MENSAGENS.emailInvalido);
    setCarregando(true);
    const r = await conta.enviarLinkDeRedefinicao(email);
    setCarregando(false);
    if (!r.ok) return setErro(mensagemDe(r));
    setInfo('Se esse e-mail tiver conta, o link de nova senha já está a caminho. Olha também o spam.');
  };

  return { erro, info, carregando, entrar, mandarLinkDeSenha, limpar, setErro };
}
