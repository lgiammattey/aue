-- O slug continua por compatibilidade com links publicados; só o nome visível muda.
UPDATE public.grupos
   SET nome = 'Arrotos do YouTube',
       descricao = 'Vídeos de arroto que a comunidade trouxe do YouTube.'
 WHERE slug = 'arrotos-youtube';
