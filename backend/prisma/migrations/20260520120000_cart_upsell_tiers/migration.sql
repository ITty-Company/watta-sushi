-- Cart upsell tiers: admin-configured order-total thresholds with fixed € discount per product

CREATE TABLE "CartUpsellTier" (
    "id" SERIAL NOT NULL,
    "minOrderTotal" DOUBLE PRECISION NOT NULL,
    "maxOrderTotal" DOUBLE PRECISION,
    "discountEur" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartUpsellTier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CartUpsellTierProduct" (
    "id" SERIAL NOT NULL,
    "tierId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CartUpsellTierProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CartUpsellTierProduct_tierId_productId_key" ON "CartUpsellTierProduct"("tierId", "productId");

ALTER TABLE "CartUpsellTierProduct" ADD CONSTRAINT "CartUpsellTierProduct_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "CartUpsellTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartUpsellTierProduct" ADD CONSTRAINT "CartUpsellTierProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
