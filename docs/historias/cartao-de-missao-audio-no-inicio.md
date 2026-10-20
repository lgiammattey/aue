# Cartão de Missão — áudio de comunidade no Início

- **Pista:** Hot lane.
- **Problema:** um áudio anexado a tópico de comunidade podia ser publicado, mas desaparecia do Início após recarregar o feed, parecendo que a publicação falhou.
- **Resultado para a pessoa:** o tópico continua com player no Início depois de uma recarga; se o envio for recusado, ela vê o motivo e nunca uma confirmação falsa.
- **Escopo:** reidratação de anexos do fórum no `InicioOpenDesign` e feedback de falha do compositor; sem Arena, migração, Storage, contrato ou componente legado.
- **Provas de aceite:** o teste cobre tópico com áudio reidratado e URL assinada; cobre recusa por falta de conta sem toast de sucesso; typecheck, lint, suíte e build passam.
- **Limite da prova:** a publicação e reprodução com Supabase/Storage reais, bem como em navegador real, continuam pendentes de validação manual.
