(() => {
  function mount(root, en = false) {
  const source = document.querySelector('[data-rafa-post]');
  const samples = [
    ['Rafa Ronco', '@rafaronco', 'Agora é sua vez de responder.', 'amostra-curta.wav', '2 min', '12', '2'],
    ['Bel da Roda', '@beldaroda', 'Esse aqui foi de primeira.', 'amostra-longa.wav', '1 h', '8', '3'],
    ['Deni', '@denidaarea', 'O pessoal pediu replay.', 'amostra-curta.wav', 'Ontem', '6', '1'],
    ['Cadu', '@cadu', 'Vai encarar esse?', 'amostra-longa.wav', '2 dias', '4', '2'],
    ['Lu da Roda', '@ludaroda', 'Escuta essa tentativa.', 'amostra-curta.wav', '5 dias', '3', '0'],
  ];
  const newcomer = ['Bia', '@bia', 'Cheguei pra resenha.', 'amostra-longa.wav', 'Agora', '0', '0'];

  root.innerHTML = `
    <section class="home-live" aria-label="Na Resenha">
      <div class="home-live-main home-live-feed">
        <header class="home-live-header home-live-heading">
          <h2 >Na Resenha <span class="demo">Exemplos</span></h2>
          <button class="text-btn" data-view="mural">Ver toda a Resenha →</button>
        </header>
        <button class="home-live-new outline" type="button" hidden>Novos na Resenha</button>
        <p class="home-live-message" role="status" aria-live="polite"></p>
        <div class="home-live-posts"></div>
        <div class="home-live-empty" hidden>
          <p>A resenha tá vazia. Solta o primeiro.</p>
          <button class="outline" data-view="arena">Arrotar</button>
        </div>
      </div>
      <aside class="home-live-side home-live-aside">
        <section><h2>Disputas</h2><p>Chame alguém pro X1.</p><button class="text-btn" data-view="disputas">Ver disputas →</button></section>
        <section><h2>Talentos em destaque</h2><p>Áudios públicos aparecem aqui quando disponíveis.</p></section>
      </aside>
    </section>
    <details class="home-live-demo home-live-controls">
      <summary>Simular estados da Resenha</summary>
      <button type="button" data-demo-feed="arrival">Chegar publicação</button>
      <button type="button" data-demo-feed="empty">Sem publicações</button>
      <button type="button" data-demo-feed="restore">Restaurar exemplos</button>
    </details>`;

  if (en) {
    root.setAttribute('lang', 'en');
    root.querySelector('.home-live').setAttribute('aria-label', 'In the Hangout');
    root.querySelector('.home-live-header h2').innerHTML = 'In the Hangout <span class="demo">Examples</span>';
    root.querySelector('.home-live-header button').textContent = 'See the Hangout →';
    root.querySelector('.home-live-new').textContent = 'New in the Hangout';
    root.querySelector('.home-live-empty p').textContent = 'The Hangout is quiet. Start the fun.';
    root.querySelector('.home-live-empty button').textContent = 'Burp';
    root.querySelector('.home-live-demo summary').textContent = 'Simulate Hangout states';
    const demoButtons = root.querySelectorAll('[data-demo-feed]');
    ['New post', 'Empty', 'Restore examples'].forEach((label, index) => { demoButtons[index].textContent = label; });
    const side = root.querySelectorAll('.home-live-side section');
    side[0].querySelector('h2').textContent = 'Battles';
    side[0].querySelector('p').textContent = 'Challenge a friend.';
    side[0].querySelector('button').textContent = 'See battles →';
    side[1].querySelector('h2').textContent = 'Featured talent';
    side[1].querySelector('p').textContent = 'Public audio appears here when available.';
    ['Your turn to respond.', 'Got it on the first try.', 'The crew wanted a replay.', 'Think you can beat this?', 'Listen to this one.'].forEach((text, index) => { samples[index][2] = text; });
    newcomer[2] = 'Joining the Hangout.';
  }

  const list = root.querySelector('.home-live-posts');
  const empty = root.querySelector('.home-live-empty');
  const indicator = root.querySelector('.home-live-new');
  const message = root.querySelector('.home-live-message');
  let visible = samples.slice();
  let pending = false;

  function card(data) {
    const [name, handle, copy, src, time, reactions, comments] = data;
    const post = source.cloneNode(true);
    post.removeAttribute('data-rafa-post');
    post.removeAttribute('data-post-kind');
    post.removeAttribute('data-post-author');
    post.querySelector('header b').textContent = name;
    post.querySelector('header div span').textContent = handle + ' · ' + (en ? 'example' : time + ' · exemplo');
    post.querySelector('.post-lead').textContent = copy;
    if (en) post.querySelector('.post-tag').textContent = 'Burp';
    const audio = post.querySelector('audio');
    audio.src = src;
    audio.preload = 'none';
    audio.setAttribute('aria-label', (en ? 'Synthetic audio by ' : 'Áudio sintético de ') + name);
    audio.removeAttribute('data-aue-player-pronto');
    audio.classList.remove('m05-player__nativo');
    post.querySelectorAll('.m05-player').forEach(player => player.remove());
    const footer = post.querySelector('footer');
    footer.innerHTML = '<button data-action="react" aria-pressed="false">Apoiar <span></span></button><button data-action="comment">Comentários <span></span></button><button data-action="home-profile">Ver perfil</button>';
    if (en) {
      footer.children[0].firstChild.textContent = 'Like ';
      footer.children[1].firstChild.textContent = 'Comments ';
      footer.children[2].textContent = 'View profile';
    }
    footer.children[0].querySelector('span').textContent = reactions;
    footer.children[1].querySelector('span').textContent = comments;
    footer.children[2].dataset.authorName = name;
    footer.children[2].dataset.authorHandle = handle;
    return post;
  }

  function render() {
    list.replaceChildren(...visible.map(card));
    empty.hidden = visible.length > 0;
    if (window.iniciarPlayersAue) window.iniciarPlayersAue();
  }

  root.addEventListener('click', event => {
    const profile = event.target.closest('[data-action="home-profile"]');
    if (profile) {
      event.stopPropagation();
      document.querySelector('#perfil-title').textContent = profile.dataset.authorName;
      document.querySelector('#perfil .profile-hero p').textContent = profile.dataset.authorHandle + ' · exemplo';
      show('perfil');
      return;
    }
    const operation = event.target.closest('[data-demo-feed]')?.dataset.demoFeed;
    if (operation === 'arrival') {
      pending = true;
      indicator.hidden = false;
      message.textContent = en ? 'An example post arrived. The feed stays where it is.' : 'Uma publicação de exemplo chegou. O conteúdo continua no lugar.';
    }
    if (operation === 'empty' || operation === 'restore') {
      list.querySelectorAll('audio').forEach(audio => audio.pause());
      visible = operation === 'empty' ? [] : samples.slice();
      pending = false;
      indicator.hidden = true;
      message.textContent = '';
      render();
    }
  });

  indicator.addEventListener('click', () => {
    if (!pending) return;
    if ([...list.querySelectorAll('audio')].some(audio => !audio.paused)) {
      message.textContent = en ? 'Finish or pause the audio before refreshing.' : 'Termine ou pause o áudio para atualizar a Resenha.';
      return;
    }
    visible = [newcomer, ...visible].slice(0, 5);
    pending = false;
    indicator.hidden = true;
    message.textContent = en ? 'Hangout updated with an example post.' : 'Resenha atualizada com uma publicação de exemplo.';
    render();
  });
  render();
  }
  mount(document.querySelector('[data-home-live]'));
  mount(document.querySelector('[data-home-live-en]'), true);
})();
