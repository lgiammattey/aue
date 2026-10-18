-- BASELINE do histórico de migrações — para colar no SQL Editor do painel do
-- Supabase (projeto "Auê"), uma única vez. Só mexe na tabela de histórico
-- (supabase_migrations.schema_migrations). Não cria, altera nem apaga nada do
-- schema nem dos dados do jogo.
--
-- Conferido em 18/10/2026: o banco já tem tudo o que estas versões criam
-- (17 funções, 17 tabelas, colunas da 036, bucket audio_records).
--
-- Efeito: o histórico passa a bater com supabase/migrations/, e a integração
-- GitHub -> Supabase deixa de falhar com "Remote migration versions not found in
-- local migrations directory". Só as migrações a partir da 20261018000002 serão
-- aplicadas no próximo merge na main.
--
-- Desfazer, se precisar: apagar estas linhas e reinserir as 7 originais:
--   20260809233820 revanche_melhor_tentativa
--   20260811020708 aue_nota_v2_calibrada
--   20260812030703 a_faixa_fala_como_gente
--   20260812030923 a_revanche_vira_round
--   20260812031236 fecha_a_porta_das_funcoes_internas
--   20260812031256 fecha_a_porta_do_vencedor_do_round
--   20260826130828 telemetria_de_eventos

begin;

delete from supabase_migrations.schema_migrations
 where version in (
   '20260809233820', '20260811020708', '20260812030703', '20260812030923',
   '20260812031236', '20260812031256', '20260826130828'
 );

insert into supabase_migrations.schema_migrations (version, name) values
('20260807000000','initial_schema'),
('20260807000001','auth_profiles'),
('20260807000002','gamification'),
('20260807000003','storage_avatars'),
('20260807000004','oauth_providers'),
('20260807000005','community'),
('20260807000006','groups_championships'),
('20260807000007','championship_leaderboard'),
('20260807000008','push_subscriptions'),
('20260807000009','global_ranking_view'),
('20260807000010','fix_xp_accrual_and_rls_roles'),
('20260807000011','server_side_score_and_duel'),
('20260807000012','push_notification_webhook'),
('20260807000013','storage_audio_records'),
('20260807000014','report_system'),
('20260807000015','global_ranking_authenticated_only'),
('20260807000016','desafios_insert_ownership'),
('20260807000017','profile_social_followers_settings'),
('20260807000018','conquistas_and_achievements'),
('20260807000019','community_posts_social_links_topics'),
('20260807000020','championship_turn_lobby_favorites'),
('20260807000021','security_and_ui_helpers'),
('20260807000022','founder_status'),
('20260807000023','corrige_regressao_xp_e_endurecimento'),
('20260807000024','corte_fundador_500'),
('20260807000025','reacoes_em_posts'),
('20260807000026','comentarios_em_posts'),
('20260807000027','audio_do_resultado'),
('20260807000028','moderacao_de_audio'),
('20260807000029','login_anonimo'),
('20260807000030','batalhas_em_sessao'),
('20260807000031','disputa_presencial'),
('20260807000032','audio_do_iphone'),
('20260807000033','ordem_dos_turnos'),
('20260807000034','fecha_leitura_de_resultados'),
('20260807000035','origem_outro'),
('20260807000036','nomenclatura_ptbr_mvp1'),
('20260809000001','revanche_melhor_tentativa'),
('20260811000001','aue_nota_v2_calibrada'),
('20260811000002','a_faixa_fala_como_gente'),
('20260811000003','a_revanche_vira_round'),
('20260812000001','fecha_a_porta_das_funcoes_internas'),
('20260826000001','telemetria_de_eventos'),
('20261018000001','semente_causo_shopping')
on conflict (version) do nothing;

commit;

-- Conferência: deve devolver 44 linhas, de 20260807000000 a 20261018000001.
select count(*) as total, min(version) as primeira, max(version) as ultima
  from supabase_migrations.schema_migrations;
