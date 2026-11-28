(() => {
  'use strict';

  const alturas = [7, 13, 9, 18, 11, 22, 15, 9, 17, 25, 12, 19, 8, 16, 24, 14, 10, 20, 27, 13, 18, 9, 15, 23, 11, 19, 28, 14, 8, 17, 24, 12, 20, 9, 16, 26, 13, 21, 10, 18, 25, 14, 8, 19, 27, 12, 21, 9, 17, 24, 13, 20, 11, 16, 23, 8];

  function tempo(segundos, comCentimos = false) {
    if (!Number.isFinite(segundos) || segundos < 0) return '0:00';
    const total = Math.floor(segundos);
    const base = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
    if (!comCentimos) return base;
    const centimos = Math.floor((segundos - total) * 100 + 1e-6);
    return `${base},${String(centimos).padStart(2, '0')}`;
  }

  function progresso(audio) {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return 0;
    return Math.min(1, Math.max(0, audio.currentTime / audio.duration));
  }

  function montar(audio) {
    if (audio.dataset.auePlayerPronto === 'true') return;
    audio.dataset.auePlayerPronto = 'true';

    const en = audio.closest('[lang="en"]') !== null;
    const caixa = document.createElement('div');
    caixa.className = 'm05-player';
    caixa.dataset.estado = 'parado';
    caixa.setAttribute('role', 'group');
    caixa.setAttribute('aria-label', audio.getAttribute('aria-label') || 'Player do áudio');

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'm05-player__botao';
    botao.textContent = en ? 'Play' : 'Ouvir';
    botao.setAttribute('aria-label', en ? 'Play audio' : 'Ouvir áudio');

    const trilho = document.createElement('div');
    trilho.className = 'm05-player__trilho';
    trilho.tabIndex = 0;
    trilho.setAttribute('role', 'slider');
    trilho.setAttribute('aria-label', en ? 'Seek audio' : 'Avançar no áudio');
    trilho.setAttribute('aria-valuemin', '0');
    trilho.setAttribute('aria-valuenow', '0');
    trilho.setAttribute('aria-valuemax', '0');
    trilho.setAttribute('aria-valuetext', '0:00');

    const barras = alturas.map((altura) => {
      const barra = document.createElement('i');
      barra.style.setProperty('--m05-altura', `${altura}px`);
      trilho.append(barra);
      return barra;
    });

    const relogio = document.createElement('time');
    relogio.className = 'm05-player__tempo';
    relogio.textContent = '0:00';
    relogio.dateTime = 'PT0S';

    const aviso = document.createElement('span');
    aviso.className = 'm05-player__aviso';
    aviso.setAttribute('aria-live', 'polite');

    caixa.append(botao, trilho, relogio, aviso);
    audio.insertAdjacentElement('afterend', caixa);
    audio.classList.add('m05-player__nativo');

    function atualizar() {
      const percentual = progresso(audio);
      const duracaoConhecida = Number.isFinite(audio.duration) && audio.duration > 0;
      const ativo = !audio.paused && !audio.ended;
      caixa.dataset.estado = ativo ? 'tocando' : 'parado';
      botao.textContent = ativo ? (en ? 'Pause' : 'Pausar') : (en ? 'Play' : 'Ouvir');
      botao.setAttribute('aria-label', ativo ? (en ? 'Pause audio' : 'Pausar áudio') : (en ? 'Play audio' : 'Ouvir áudio'));
      const mostraCentimos = duracaoConhecida && audio.duration < 10;
      const tempoMostrado = ativo || !duracaoConhecida ? audio.currentTime : audio.duration;
      relogio.textContent = tempo(tempoMostrado, mostraCentimos);
      relogio.dateTime = `PT${Math.floor(ativo ? audio.currentTime : audio.duration || 0)}S`;
      trilho.setAttribute('aria-valuenow', String(audio.currentTime || 0));
      trilho.setAttribute('aria-valuemax', String(duracaoConhecida ? audio.duration : 0));
      trilho.setAttribute('aria-valuetext', duracaoConhecida ? `${tempo(audio.currentTime, mostraCentimos)} de ${tempo(audio.duration, mostraCentimos)}` : tempo(audio.currentTime));
      barras.forEach((barra, indice) => barra.classList.toggle('is-tocada', duracaoConhecida && indice < Math.floor(percentual * barras.length)));
    }

    function buscar(evento) {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const limites = trilho.getBoundingClientRect();
      const percentual = Math.min(1, Math.max(0, (evento.clientX - limites.left) / limites.width));
      audio.currentTime = percentual * audio.duration;
    }

    botao.addEventListener('click', () => {
      if (audio.paused || audio.ended) {
        audio.play().catch(() => { aviso.textContent = 'Não deu para tocar esse áudio.'; });
      } else {
        audio.pause();
      }
    });

    trilho.addEventListener('click', buscar);
    trilho.addEventListener('keydown', (evento) => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const salto = evento.shiftKey
        ? Math.max(0.1, Math.min(10, audio.duration / 4))
        : Math.max(0.1, Math.min(5, audio.duration / 10));
      if (evento.key === 'ArrowRight' || evento.key === 'ArrowUp') audio.currentTime = Math.min(audio.duration, audio.currentTime + salto);
      else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowDown') audio.currentTime = Math.max(0, audio.currentTime - salto);
      else if (evento.key === 'Home') audio.currentTime = 0;
      else if (evento.key === 'End') audio.currentTime = audio.duration;
      else return;
      evento.preventDefault();
    });

    ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'pause', 'ended', 'seeked'].forEach((nome) => audio.addEventListener(nome, atualizar));
    audio.addEventListener('play', () => {
      document.querySelectorAll('audio[data-aue-player]').forEach((outro) => {
        if (outro !== audio) outro.pause();
      });
    });
    audio.addEventListener('error', () => {
      aviso.textContent = 'Áudio indisponível. Use os controles padrão se aparecerem.';
      caixa.dataset.falhou = 'true';
      audio.classList.remove('m05-player__nativo');
      audio.controls = true;
    });
    atualizar();
  }

  function iniciar() {
    document.querySelectorAll('audio[data-aue-player]').forEach(montar);
  }

  window.iniciarPlayersAue = iniciar;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  else iniciar();
})();
