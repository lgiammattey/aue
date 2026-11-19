/** Um convite de teste deve voltar ao mesmo ambiente em que foi criado. */
export function origemDoConviteV2(): string {
  return window.location.origin;
}
