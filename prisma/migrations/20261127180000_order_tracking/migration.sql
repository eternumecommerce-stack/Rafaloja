-- UTMify: UTMs do pedido e datas de pagamento/reembolso
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "tracking" JSONB;
