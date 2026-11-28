(() => {
  const panel = document.createElement('aside');
  panel.className = 'demo-ad-controls';
  panel.setAttribute('aria-label', 'Controles da demonstração');
  panel.innerHTML = '<label>Publicidade simulada <select aria-label="Estado da publicidade"><option value="preenchido">Disponível</option><option value="vazio">Vazia</option><option value="indisponivel">Indisponível</option></select></label><span role="status"></span>';
  document.body.append(panel);

  const placements = [
    { target: '#home .public-guide', position: 'afterend', area: 'Início', format: 'Banner horizontal', className: 'ad-horizontal' },
    { target: '#home-en .public-guide', position: 'afterend', area: 'Home', format: 'Horizontal banner', className: 'ad-horizontal', en: true },
    { target: '#mural .mural-guide', position: 'beforeend', area: 'Resenha', format: 'Retângulo · 300 × 250', className: 'ad-sidebar' },
    { target: '#mural .feed', position: 'beforeend', area: 'Resenha', format: 'Entre publicações · após 4 a 6 posts', className: 'ad-feed' },
    { target: '#disputas .disputes-board', position: 'beforeend', area: 'Disputas', format: 'Entre disputas', className: 'ad-battles' },
    { target: '#perfil .profile-content', position: 'afterend', area: 'Perfil', format: 'Banner contextual', className: 'ad-profile' },
    { target: '#result .result-workspace', position: 'afterend', area: 'Resultado solo', format: 'Banner após resultado', className: 'ad-result' },
  ];

  function createSlot({ area, format, className, en }) {
    const slot = document.createElement('aside');
    slot.className = 'demo-ad ' + className;
    slot.setAttribute('aria-label', en ? 'Simulated advertising' : 'Publicidade simulada');
    const label = document.createElement('small');
    label.textContent = en ? 'ADVERTISING · DEMO' : 'PUBLICIDADE · SIMULAÇÃO';
    const title = document.createElement('strong');
    title.textContent = en ? 'Ad space' : 'Espaço publicitário';
    const description = document.createElement('span');
    description.textContent = area + ' · ' + format;
    slot.append(label, title, description);
    return slot;
  }

  for (const placement of placements) {
    const target = document.querySelector(placement.target);
    if (target) target.insertAdjacentElement(placement.position, createSlot(placement));
  }

  const selection = panel.querySelector('select');
  const status = panel.querySelector('[role="status"]');
  function update() {
    const available = selection.value === 'preenchido';
    document.querySelectorAll('.demo-ad').forEach(slot => { slot.hidden = !available; });
    status.textContent = selection.value === 'vazio'
      ? 'Sem anúncio nesta simulação.'
      : selection.value === 'indisponivel'
        ? 'Publicidade indisponível nesta simulação.'
        : '';
  }
  selection.addEventListener('change', update);
  update();
})();
