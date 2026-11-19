-- A vitrine de grupos volta à home. Esses três convites oficiais foram ocultados
-- apenas pela migration 20261022001000, quando foram movidos para uma comunidade.
-- Não altera grupos de terceiros, convites editados ou registros não oficiais.
UPDATE public.grupos_externos
   SET esta_escondido = false
 WHERE e_oficial
   AND esta_escondido
   AND (
     (slug = 'arroto-e-peido-dos-profissionais' AND link_do_convite = 'https://chat.whatsapp.com/JaC2ggM5mG12pioXJnOgHc') OR
     (slug = 'grupo-do-peido-e-arroto' AND link_do_convite = 'https://chat.whatsapp.com/GFpJXiIlWyFEXHTOjEW6eI') OR
     (slug = 'gym-arrotos' AND link_do_convite = 'https://chat.whatsapp.com/KrRzws9Xhlo4RmOq8TmVue')
   );
