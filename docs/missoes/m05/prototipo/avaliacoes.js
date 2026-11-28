(() => {
  const icons = {
    up: '<path d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Zm0 10h9a2 2 0 0 0 2-1.6l1.2-6A2 2 0 0 0 17.2 10H13l.6-3.2c.2-1.2-.4-2.4-1.5-2.9L11 3 7 10v10Z"/>',
    down: '<path d="M7 14V4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h3Zm0-10h9a2 2 0 0 1 2 1.6l1.2 6a2 2 0 0 1-2 2.4H13l.6 3.2c.2 1.2-.4 2.4-1.5 2.9L11 21l-4-7V4Z"/>',
    comment: '<path d="M20 11a7 7 0 0 1-7 7H7l-4 3v-5a7 7 0 1 1 17-5Z"/>',
    share: '<path d="M12 16V3m-4 4 4-4 4 4M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>',
    save: '<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
  };

  function button(kind, label, count = '') {
    return `<button type="button" data-evaluation="${kind}" title="${label}" aria-label="${label}"${['up','down','save'].includes(kind) ? ' aria-pressed="false"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[kind]}</svg>${count !== '' ? `<span>${count}</span>` : ''}</button>`;
  }

  function mount() {
    document.querySelectorAll('#mural .post audio, #perfil-publicacoes audio, .home-live-posts audio').forEach(audio => {
      if (audio.closest('.publication-audio')) return;
      const player = audio.nextElementSibling;
      if (!player || !player.classList.contains('m05-player')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'publication-audio';
      audio.before(wrapper);
      wrapper.append(audio, player);
      if (audio.dataset.publicationScore) {
        const score = document.createElement('span');
        score.className = 'publication-score';
        score.setAttribute('aria-label', 'Nota ' + audio.dataset.publicationScore + ', exemplo');
        score.textContent = audio.dataset.publicationScore;
        wrapper.append(score);
      }
    });

    document.querySelectorAll('#mural .audio-post, .home-live-posts .audio-post, #perfil-publicacoes').forEach(post => {
      if (post.querySelector('.post-actions')) return;
      let footer = post.querySelector('footer');
      const oldCount = footer?.querySelector('[data-action="react"] span')?.textContent || '0';
      const commentCount = footer?.querySelector('[data-action="comment"] span')?.textContent || '0';
      if (!footer) {
        footer = document.createElement('footer');
        post.append(footer);
      }
      const profileButton = footer.querySelector('[data-action="home-profile"]');
      footer.className = 'post-actions';
      footer.innerHTML = button('up', 'Avaliar positivamente', oldCount) + button('down', 'Avaliar negativamente', '0') + button('comment', 'Comentários', commentCount) + button('share', 'Compartilhar') + button('save', 'Salvar');
      if (profileButton) footer.append(profileButton);
    });
  }

  document.addEventListener('click', event => {
    const control = event.target.closest('[data-evaluation]');
    if (!control) return;
    const kind = control.dataset.evaluation;
    if (kind === 'comment') {
      document.querySelector('#thread-dialog').showModal();
      return;
    }
    if (kind === 'share') {
      const link = new URL('index.html', window.location.href).href;
      navigator.clipboard.writeText(link)
        .then(() => speak('Link da demonstração copiado.'))
        .catch(() => speak('Não foi possível copiar o link da demonstração.'));
      return;
    }
    withSession(() => {
      if (kind === 'save') {
        control.setAttribute('aria-pressed', String(control.getAttribute('aria-pressed') !== 'true'));
        return;
      }
      const group = control.closest('.post-actions');
      const wasSelected = control.getAttribute('aria-pressed') === 'true';
      for (const item of group.querySelectorAll('[data-evaluation="up"], [data-evaluation="down"]')) {
        const active = item.getAttribute('aria-pressed') === 'true';
        if (active) item.querySelector('span').textContent = String(Number(item.querySelector('span').textContent) - 1);
        item.setAttribute('aria-pressed', 'false');
      }
      if (!wasSelected) {
        control.setAttribute('aria-pressed', 'true');
        control.querySelector('span').textContent = String(Number(control.querySelector('span').textContent) + 1);
      }
    });
  });

  window.montarAvaliacoesAue = mount;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
