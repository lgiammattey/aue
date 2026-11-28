export function consultarEnquantoVisivel(consultar: () => void, intervaloMs: number): () => void {
  const intervalo = window.setInterval(() => {
    if (document.visibilityState === 'visible' && navigator.onLine) consultar();
  }, intervaloMs);

  return () => window.clearInterval(intervalo);
}
