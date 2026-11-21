-- O painel /admin passou a ter login próprio (credenciais no .env); contas de clientes não têm mais papel de admin.
-- AlterTable
ALTER TABLE "user" DROP COLUMN "role";

-- DropEnum
DROP TYPE "UserRole";

