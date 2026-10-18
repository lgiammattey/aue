import React, { useState, useRef, useEffect } from 'react';
import type { PerfilUsuario } from '../../../nucleo/usuario/perfil';

export interface DadosNovoPost {
  texto: string;
  autorNome?: string;
  audioUrl?: string;
  duracaoSegundos?: number;
  comunidadeSlug?: string;
}

interface ComposerCausoProps {
  aoPostar: (dados: string | DadosNovoPost) => Promise<boolean> | boolean;
  aoAbrirArrotar: () => void;
  aoAbrirDesafio: () => void;
  perfil: PerfilUsuario;
  comunidades?: readonly string[] | string[];
  comunidadeInicial?: string;
}

export const ComposerCauso: React.FC<ComposerCausoProps> = ({
  aoPostar,
  aoAbrirArrotar,
  aoAbrirDesafio,
  perfil,
  comunidades,
  comunidadeInicial = 'feed',
}) => {
  const [texto, setTexto] = useState('');
  const [nickname, setNickname] = useState(perfil.nome || '');
  const [comunidadeDestino, setComunidadeDestino] = useState(comunidadeInicial);
  const [enviando, setEnviando] = useState(false);

  // Gravação de áudio no composer (até 2 minutos)
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [tempoGravacao, setTempoGravacao] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [duracaoAudioFinal, setDuracaoAudioFinal] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerGravacaoRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerGravacaoRef.current) {
        window.clearInterval(timerGravacaoRef.current);
      }
    };
  }, []);

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setGravandoAudio(true);
      setTempoGravacao(0);

      const startTime = Date.now();
      timerGravacaoRef.current = window.setInterval(() => {
        const decorrido = Math.floor((Date.now() - startTime) / 1000);
        setTempoGravacao(decorrido);

        // Teto de 2 minutos (120 segundos)
        if (decorrido >= 120) {
          pararGravacao();
        }
      }, 500);
    } catch {
      alert('Não foi possível acessar o microfone para gravar o áudio.');
    }
  };

  const pararGravacao = () => {
    if (timerGravacaoRef.current) {
      window.clearInterval(timerGravacaoRef.current);
      timerGravacaoRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setDuracaoAudioFinal(tempoGravacao);
    setGravandoAudio(false);
  };

  const descartarAudio = () => {
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    setAudioBlobUrl(null);
    setTempoGravacao(0);
    setDuracaoAudioFinal(0);
  };

  const iniciais = (perfil.nome?.trim().split(/\s+/).length > 1
    ? (perfil.nome.trim().split(/\s+/)[0][0] + perfil.nome.trim().split(/\s+/)[1][0])
    : (perfil.nome?.slice(0, 2) || 'VC')
  ).toUpperCase();

  const podePostar = Boolean(texto.trim() || audioBlobUrl);

  const handlePostar = async () => {
    if (!podePostar || enviando) return;
    setEnviando(true);
    try {
      const payload: DadosNovoPost = {
        texto: texto.trim(),
        autorNome: nickname.trim() || perfil.nome || 'Arrotador',
        audioUrl: audioBlobUrl || undefined,
        duracaoSegundos: duracaoAudioFinal > 0 ? duracaoAudioFinal : undefined,
        comunidadeSlug: comunidadeDestino,
      };

      const res = await aoPostar(payload);
      if (res) {
        setTexto('');
        descartarAudio();
      }
    } finally {
      setEnviando(false);
    }
  };

  const formatarTempo = (s: number) => {
    const min = Math.floor(s / 60);
    const seg = s % 60;
    return `${min}:${String(seg).padStart(2, '0')}`;
  };

  const chipBtnStyle: React.CSSProperties = {
    height: '36px',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: 0,
    borderRadius: '999px',
    background: 'none',
    color: 'var(--fg)',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
      }}
    >
      {/* Avatar 44px */}
      <div
        style={{
          width: '44px',
          height: '44px',
          flex: 'none',
          borderRadius: '50%',
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '14px',
          position: 'relative',
          overflow: 'hidden',
          color: 'var(--fg)',
        }}
      >
        {perfil.avatarUrl ? (
          <img
            src={perfil.avatarUrl}
            alt={perfil.nome}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          iniciais
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Linha de Apelido (Nickname) e Destino do Causo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Seu apelido (nickname)"
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '13px',
              color: 'var(--fg)',
              outline: 'none',
              maxWidth: '180px',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>Destino:</span>
            <select
              value={comunidadeDestino}
              onChange={(e) => setComunidadeDestino(e.target.value)}
              aria-label="Destino da publicação"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '999px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--fg)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="feed">Feed</option>
              {comunidades &&
                comunidades
                  .filter((c) => c.toLowerCase() !== 'feed')
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
            </select>
          </div>
        </div>

        {/* Campo de Texto do Causo */}
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="O que tá rolando no bonde?"
          rows={2}
          style={{
            background: 'none',
            border: 0,
            outline: 'none',
            resize: 'none',
            color: 'var(--fg)',
            fontFamily: 'inherit',
            fontSize: '18px',
            padding: '8px 0',
            width: '100%',
          }}
        />

        {/* Feedback de Gravação de Áudio Ativa (até 2 min) */}
        {gravandoAudio && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 77, 79, 0.1)',
              border: '1px solid var(--danger, #ff4d4f)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger, #ff4d4f)', fontWeight: 700, fontSize: '14px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              Gravando arroto: {formatarTempo(tempoGravacao)} / 2:00
            </div>
            <button
              type="button"
              onClick={pararGravacao}
              style={{
                background: 'var(--danger, #ff4d4f)',
                color: '#fff',
                border: 0,
                borderRadius: '999px',
                padding: '4px 12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Parar
            </button>
          </div>
        )}

        {/* Preview do Áudio Gravado */}
        {audioBlobUrl && !gravandoAudio && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              borderRadius: '12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <audio src={audioBlobUrl} controls style={{ height: '32px' }} />
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {formatarTempo(duracaoAudioFinal)}
              </span>
            </div>
            <button
              type="button"
              onClick={descartarAudio}
              style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', fontSize: '13px' }}
            >
              Descartar
            </button>
          </div>
        )}

        {/* Barra de Ações do Composer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border)',
            paddingTop: '10px',
          }}
        >
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {/* Gravar Áudio (até 2 min) */}
            <button
              type="button"
              onClick={gravandoAudio ? pararGravacao : iniciarGravacao}
              style={{
                ...chipBtnStyle,
                color: gravandoAudio ? 'var(--danger, #ff4d4f)' : 'var(--fg)',
              }}
              aria-label="Gravar áudio"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
              </svg>
              <span>{gravandoAudio ? 'Gravando...' : 'Gravar áudio'}</span>
            </button>

            {/* Botão rápido para o jogo Auê */}
            <button
              type="button"
              onClick={aoAbrirArrotar}
              style={chipBtnStyle}
              aria-label="Jogar o Auê"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              <span>Jogar o Auê</span>
            </button>

            {/* Botão Desafiar */}
            <button
              type="button"
              onClick={aoAbrirDesafio}
              style={chipBtnStyle}
              aria-label="Desafiar"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3" />
              </svg>
              <span>Desafiar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePostar}
            disabled={!podePostar || enviando}
            style={{
              height: '36px',
              padding: '0 20px',
              border: 0,
              borderRadius: '999px',
              background: 'var(--accent, #c6ff00)',
              color: 'var(--accent-on, #000)',
              fontWeight: 700,
              fontSize: '15px',
              cursor: (!podePostar || enviando) ? 'default' : 'pointer',
              opacity: (!podePostar || enviando) ? 0.6 : 1,
            }}
          >
            {enviando ? 'Postando...' : 'Postar'}
          </button>
        </div>
      </div>
    </div>
  );
};
