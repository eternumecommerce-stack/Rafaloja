-- Segurança: o Supabase expõe o schema "public" pela API REST (PostgREST) para os papéis
-- "anon" e "authenticated". A loja acessa o banco só pelo servidor (Prisma, papel "postgres"),
-- então esses papéis não precisam de acesso a nenhuma tabela.

-- 1) Remove todas as permissões dos papéis públicos (tabelas, sequências e funções)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- 2) Tabelas criadas no futuro (novas migrations) também nascem sem acesso público
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- 3) Row Level Security ligado em todas as tabelas, sem nenhuma policy = nega tudo para
--    papéis que não são donos. O dono ("postgres", usado pelo Prisma) não é afetado.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
