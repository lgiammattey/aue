import { analisarArquivo } from './analise';

const arquivos = document.querySelector<HTMLInputElement>('#arquivos')!;
const iniciar = document.querySelector<HTMLButtonElement>('#iniciar')!;
const baixar = document.querySelector<HTMLButtonElement>('#baixar')!;
const progresso = document.querySelector<HTMLElement>('#progresso')!;
const resultado = document.querySelector<HTMLElement>('#resultado')!;
let relatorio = '';

iniciar.addEventListener('click', async () => {
  const lista = Array.from(arquivos.files ?? []);
  if (!lista.length) { progresso.textContent = 'Escolha pelo menos um áudio.'; return; }
  iniciar.disabled = true;
  baixar.disabled = true;
  const itens = [];
  for (const arquivo of lista) {
    progresso.textContent = `Analisando ${itens.length + 1} de ${lista.length}…`;
    itens.push(await analisarArquivo(arquivo));
    resultado.textContent = JSON.stringify(itens, null, 2);
  }
  relatorio = JSON.stringify({ criado_em: new Date().toISOString(), aviso: 'Estimativas retrospectivas locais; não são notas oficiais.', itens }, null, 2);
  progresso.textContent = `Análise concluída: ${itens.length} arquivo(s).`;
  iniciar.disabled = false;
  baixar.disabled = false;
});

baixar.addEventListener('click', () => {
  const endereco = URL.createObjectURL(new Blob([relatorio], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = endereco;
  link.download = 'notas-retrospectivas.json';
  link.click();
  URL.revokeObjectURL(endereco);
});
