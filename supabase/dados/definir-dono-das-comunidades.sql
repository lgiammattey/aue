-- Pedido do Luiz: @giamzinn_aue como dono de todas as comunidades existentes.
-- Dono e moderadores já gerem avatar e capa por aue_pode_gerir_midia_da_comunidade.
-- Preserva os demais moderadores e não altera a regra de comunidades futuras.
SET LOCAL lock_timeout = '5s';

DO $$
DECLARE
  v_dono uuid;
BEGIN
  -- Falha inteira se a conta estiver ausente ou duplicada; nunca conclui sem efeito.
  SELECT p.id INTO STRICT v_dono
    FROM public.perfis p WHERE p.handle = 'giamzinn_aue';

  IF NOT public.aue_e_conta_promovida(v_dono) THEN
    RAISE EXCEPTION 'A conta @giamzinn_aue precisa estar habilitada antes da transferência';
  END IF;

  UPDATE public.grupos SET created_by = v_dono
   WHERE created_by IS DISTINCT FROM v_dono;

  INSERT INTO public.membros_grupo (group_id, user_id, role)
  SELECT g.id, v_dono, 'admin' FROM public.grupos g
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'admin';

  IF EXISTS (
    SELECT 1 FROM public.grupos g
    LEFT JOIN public.membros_grupo m ON m.group_id = g.id AND m.user_id = v_dono
    WHERE g.created_by IS DISTINCT FROM v_dono OR m.role IS DISTINCT FROM 'admin'
  ) THEN
    RAISE EXCEPTION 'A transferência das comunidades ficou incompleta';
  END IF;
END;
$$;
