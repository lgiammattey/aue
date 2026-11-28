const find = (selector) => document.querySelector(selector);
const screens = document.querySelectorAll('.screen');
const toast = find('.toast');
const arenaStage = find('.arena-stage');
const publishDialog = find('#publish-dialog');
const consentCheckbox = publishDialog.querySelector('input[type="checkbox"]');
const sessionDialog = find('#session-dialog');
const publishButton = find('[data-action="confirm-publish"]');
const consentAudio = publishDialog.querySelector('audio');
const soloAudio = 'amostra-curta.wav';
const responseAudio = 'amostra-longa.wav';

let language = 'pt';
let session = false;
let activeView = 'home';
let captureMode = 'solo';
let captureTimer;
let toastTimer;
let inviteCreated = false;
let inviteState = 'pending';
let followingRafa = false;
let filter = 'all';
let published = false;
let pendingSessionAction;
let emptyReturn = 'arena';

const captureSteps = {
  ready: ['Preparado?', 'A tentativa só começa quando você aciona o gravador.', 'Gravar tentativa'],
  permission: ['Permissão de microfone', 'No jogo, o navegador pede acesso. Aqui a permissão é simulada.', 'Continuar na demo'],
  calibrating: ['Calibrando', 'A Arena mede o ruído do ambiente antes da tentativa.', 'Começar gravação'],
  recording: ['Gravando', 'O gravador está em demonstração. Você pode parar quando quiser.', 'Parar e revisar'],
  review: ['Ouça sua tentativa', 'Essa amostra sintética representa a gravação. Você decide se quer enviar.', 'Mandar pro juiz'],
  finalizing: ['Julgando…', 'Aguarde a confirmação da tentativa.', 'Aguarde'],
  fallback: ['Áudio pronto, sem laudo', 'Você ainda pode ouvir a amostra. Uma tentativa sem análise fica sem nota.', 'Tentar de novo'],
};

const inviteSteps = {
  pending: ['AGUARDANDO RESPOSTA', '…', 'Convite disponível por 7 dias.', '?'],
  responded: ['RESPONDIDO', '1,83 s', 'Comparação experimental. A disputa fica sem vencedor.', 'B'],
  expired: ['EXPIRADO', '—', 'O prazo acabou. Este convite não aceita resposta.', '?'],
  revoked: ['REVOGADO', '—', 'Quem criou retirou o convite.', '?'],
};

function pauseAudio(container = document) {
  for (const audio of container.querySelectorAll('audio')) audio.pause();
}

function show(view) {
  clearTimeout(captureTimer);
  pauseAudio();
  activeView = view === 'home' && language === 'en' ? 'home-en' : view;

  for (const screen of screens) {
    const active = screen.id === activeView;
    screen.hidden = !active;
    screen.classList.toggle('active', active);
  }

  for (const button of document.querySelectorAll('nav [data-view]')) {
    if (button.dataset.view === view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }

  const heading = find(`#${activeView} h1`);
  heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function speak(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('on');
  toastTimer = setTimeout(() => toast.classList.remove('on'), 3200);
}

function setCapture(step) {
  const [title, copy, label] = captureSteps[step];
  arenaStage.dataset.state = step;
  find('[data-arena-title]').textContent = title;
  find('[data-arena-copy]').textContent = copy;
  find('[data-record-label]').textContent = step === 'review' && captureMode === 'reply' ? 'Enviar resposta' : label;
  find('[data-action="record"]').disabled = step === 'finalizing';
  find('[data-action="cancel-capture"]').hidden = step === 'ready';

  const audio = find('[data-capture-audio]');
  audio.hidden = step !== 'review' && step !== 'fallback';
  if (audio.hidden) audio.pause();
}

function openCapture(mode = 'solo') {
  captureMode = mode;
  const x1 = mode === 'reply';
  find('[data-capture-mode]').textContent = x1 ? 'Resposta do X1' : 'Tentativa solo';
  const audio = find('[data-capture-audio]');
  audio.src = x1 ? responseAudio : soloAudio;
  setCapture('ready');
  show('arena');
}

function advanceCapture() {
  const current = arenaStage.dataset.state;
  const next = {
    ready: 'permission',
    permission: 'calibrating',
    calibrating: 'recording',
    recording: 'review',
    review: 'finalizing',
    fallback: 'ready',
  }[current];
  if (!next) return;

  setCapture(next);
  if (next === 'finalizing') {
    captureTimer = setTimeout(() => {
      if (captureMode === 'reply') {
        showInvite('responded');
      } else {
        show('result');
      }
    }, 700);
  }
}

function showInvite(state, fromCreator = false) {
  inviteState = state;
  const [status, second, copy, avatar] = inviteSteps[state];
  const available = state === 'pending' || state === 'responded';

  find('[data-invite-panel]').hidden = !fromCreator || state !== 'pending';
  find('[data-x1-first]').textContent = available ? '1,20 s' : '—';
  find('[data-x1-status]').textContent = status;
  find('[data-x1-second]').textContent = second;
  find('[data-x1-copy]').textContent = copy;
  find('[data-x1-avatar]').textContent = avatar;
  find('[data-x1-audio]').hidden = !available;
  find('[data-x1-response]').hidden = state !== 'responded';
  find('[data-action="start-reply"]').hidden = state !== 'pending';
  show('x1');
}

function updateSession() {
  find('.login').textContent = session ? 'Sair da demo' : 'Entrar';
  find('[data-profile-session]').textContent = session ? 'VOCÊ ESTÁ NA DEMO' : 'VOCÊ ESTÁ COMO VISITANTE';
  find('[data-profile-session-copy]').textContent = session
    ? 'Ações feitas aqui valem apenas nesta demonstração.'
    : 'Dá pra ouvir e acompanhar. Entre na demo para experimentar ações de conta.';
  find('#perfil [data-action="login"]').hidden = session;
}

function withSession(then) {
  if (session) {
    then();
    return;
  }

  pendingSessionAction = then;
  sessionDialog.showModal();
}

function startPublish() {
  consentCheckbox.checked = false;
  publishButton.disabled = true;
  publishDialog.showModal();
  consentCheckbox.focus();
}

function setMuralFilter(next) {
  filter = next;
  pauseAudio(find('#mural'));
  for (const button of find('.tabs').querySelectorAll('button')) {
    const current = button.dataset.action === (filter === 'all' ? 'all-posts' : 'following');
    button.setAttribute('aria-pressed', String(current));
    button.classList.toggle('selected', current);
  }
  find('[data-following-empty]').hidden = filter === 'all' || followingRafa;
  find('[data-rafa-post]').hidden = filter !== 'all' && !followingRafa;
  find('[data-demo-post]').hidden = filter !== 'all' || !published;
  find('[data-proposal-post]').hidden = filter !== 'all';
}

function toggleFollow() {
  followingRafa = !followingRafa;
  const button = find('[data-action="follow"]');
  button.textContent = followingRafa ? 'Seguindo' : 'Seguir';
  button.setAttribute('aria-pressed', String(followingRafa));
  setMuralFilter(filter);
}

function chooseLanguage(next) {
  language = next;
  for (const button of document.querySelectorAll('[data-language]')) {
    button.setAttribute('aria-pressed', String(button.dataset.language === next));
  }
  show('home');
}

function showEmpty(origin) {
  emptyReturn = origin;
  const mural = origin === 'mural';
  find('#empty-title').textContent = mural ? 'O MURAL ESTÁ VAZIO.' : 'NENHUM X1 POR AQUI.';
  find('[data-empty-copy]').textContent = mural
    ? 'Quando a galera publicar, a resenha aparece aqui.'
    : 'Os seus convites e respostas aparecem aqui.';
  find('[data-action="back-empty"]').textContent = mural ? 'Voltar pro Mural' : 'Voltar pra Arena';
  show('empty');
}

function showError(network) {
  find('#error-title').textContent = network ? 'FALHOU NA HORA DE ENVIAR.' : 'O MICROFONE NÃO ABRIU.';
  find('[data-error-copy]').textContent = network
    ? 'O envio ficou sem confirmação. Você pode voltar para a revisão.'
    : 'A tentativa ficou sem áudio. Confira a permissão e tente outra vez.';
  find('[data-action="retry-capture"]').dataset.retry = network ? 'review' : 'ready';
  show('error');
}

function openInviteFromHash() {
  if (window.location.hash === '#convite') {
    showInvite('pending');
  }
}

const actions = {
  login: () => {
    if (session) {
      session = false;
      updateSession();
      speak('Voltou ao modo visitante.');
    } else {
      withSession(() => speak('Modo conta demonstrativo ativo.'));
    }
  },
  'confirm-session': () => {
    const then = pendingSessionAction;
    session = true;
    sessionDialog.close();
    updateSession();
    then?.();
  },
  'close-dialog': (button) => button.closest('dialog').close(),
  record: advanceCapture,
  'cancel-capture': () => {
    if (captureMode === 'reply') showInvite('pending');
    else openCapture();
  },
  'permission-error': () => showError(false),
  'network-error': () => showError(true),
  'retry-capture': (button) => {
    openCapture(captureMode);
    if (button.dataset.retry === 'review') setCapture('review');
  },
  fallback: () => setCapture('fallback'),
  'see-invite': () => showInvite('pending'),
  'create-link': () => withSession(() => {
    inviteCreated = true;
    find('[data-link-message]').textContent = 'Use este link para abrir a tela de quem recebe.';
    showInvite('pending', true);
  }),
  'copy-link': async () => {
    const link = new URL('#convite', window.location.href).href;
    const message = find('[data-link-message]');
    try {
      await navigator.clipboard.writeText(link);
      message.textContent = 'Link do protótipo copiado.';
    } catch {
      message.textContent = link;
    }
  },
  'open-invite': () => {
    if (window.location.hash === '#convite') openInviteFromHash();
    else window.location.hash = 'convite';
  },
  'start-reply': () => withSession(() => openCapture('reply')),
  pending: () => showInvite('pending'),
  responded: () => showInvite('responded'),
  expired: () => showInvite('expired'),
  revoked: () => showInvite('revoked'),
  history: () => {
    if (session && inviteCreated) showInvite(inviteState, true);
    else showEmpty('arena');
  },
  publish: () => withSession(startPublish),
  'confirm-publish': () => {
    if (!consentCheckbox.checked) return;
    published = true;
    publishDialog.close();
    setMuralFilter('all');
    show('mural');
    speak('A publicação entrou neste Mural de demonstração.');
  },
  empty: () => showEmpty('mural'),
  'back-empty': () => emptyReturn === 'arena' ? openCapture() : show('mural'),
  comment: () => find('#thread-dialog').showModal(),
  react: (button) => withSession(() => {
    const pressed = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', String(!pressed));
    button.querySelector('span').textContent = pressed ? '12' : '13';
  }),
  follow: () => withSession(toggleFollow),
  following: () => withSession(() => setMuralFilter('following')),
  'all-posts': () => setMuralFilter('all'),
};

document.addEventListener('click', (event) => {
  const control = event.target.closest('[data-view], [data-language], [data-action]');
  if (!control) return;

  const { view, language: lang, action } = control.dataset;
  if (view === 'arena') openCapture();
  else if (view) show(view);
  else if (lang) chooseLanguage(lang);
  else {
    if (control.matches('a')) event.preventDefault();
    actions[action]?.(control);
  }
});

consentCheckbox.addEventListener('change', () => {
  publishButton.disabled = !consentCheckbox.checked;
});
publishDialog.addEventListener('close', () => consentAudio.pause());
sessionDialog.addEventListener('close', () => {
  pendingSessionAction = undefined;
});

window.addEventListener('hashchange', openInviteFromHash);
openInviteFromHash();
