-- AlterTable
ALTER TABLE "ContentBlock" ADD COLUMN     "mediaPoster" TEXT,
ADD COLUMN     "mediaRatio" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "ProductMedia" ADD COLUMN     "poster" TEXT;

