-- Loja de calçados: variações de cor/tamanho, coleções da home e valor do brinde nas ofertas
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "collection" TEXT,
ADD COLUMN     "colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ProductOffer" ADD COLUMN     "giftValue" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "Product_collection_active_position_idx" ON "Product"("collection", "active", "position");
