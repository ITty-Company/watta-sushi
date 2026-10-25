-- Prisma 6: неявні зв'язки many-to-many використовують PRIMARY KEY замість унікального індексу.
-- AlterTable
ALTER TABLE "_IngredientToProduct" ADD CONSTRAINT "_IngredientToProduct_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_IngredientToProduct_AB_unique";
