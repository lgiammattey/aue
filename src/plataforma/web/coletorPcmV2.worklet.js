/* Executado na thread de áudio; não envia amostras ao servidor. */
class ColetorPcmV2 extends AudioWorkletProcessor {
  constructor() {
    super();
    this.tamanhoAmbiente = Math.round(sampleRate * 0.5);
    this.limiteEmissao = Math.ceil(sampleRate * 10);
    this.maximoEmissao = Math.ceil(sampleRate * 10.5);
    this.ambiente = new Float32Array(this.tamanhoAmbiente);
    this.emissao = new Float32Array(this.maximoEmissao);
    this.quantidadeAmbiente = 0;
    this.quantidadeEmissao = 0;
    this.limiteAvisado = false;
    this.excedeu = false;
    this.finalizado = false;
    this.port.onmessage = (evento) => {
      if (evento.data !== 'finalizar' || this.finalizado) return;
      this.finalizado = true;
      const ambiente = this.ambiente.slice(0, this.quantidadeAmbiente);
      const emissao = this.emissao.slice(0, this.quantidadeEmissao);
      this.port.postMessage({ tipo: 'dados', ambiente, emissao, sampleRate, excedeu: this.excedeu }, [ambiente.buffer, emissao.buffer]);
    };
  }

  process(inputs) {
    if (this.finalizado) return false;
    const canal = inputs[0]?.[0];
    if (!canal) return true;
    for (const amostra of canal) {
      if (this.quantidadeAmbiente < this.tamanhoAmbiente) {
        this.ambiente[this.quantidadeAmbiente++] = amostra;
        if (this.quantidadeAmbiente === this.tamanhoAmbiente) this.port.postMessage({ tipo: 'calibrado' });
      } else if (this.quantidadeEmissao < this.maximoEmissao) {
        this.emissao[this.quantidadeEmissao++] = amostra;
        if (this.quantidadeEmissao === this.limiteEmissao && !this.limiteAvisado) {
          this.limiteAvisado = true;
          this.port.postMessage({ tipo: 'limite' });
        }
      } else {
        this.excedeu = true;
      }
    }
    return true;
  }
}
registerProcessor('aue-coletor-pcm-v2', ColetorPcmV2);
