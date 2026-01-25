/*
  Warnings:

  - You are about to drop the column `userId` on the `Track` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Track" DROP CONSTRAINT "Track_userId_fkey";

-- AlterTable
ALTER TABLE "Track" DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "_TrackToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TrackToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TrackToUser_B_index" ON "_TrackToUser"("B");

-- AddForeignKey
ALTER TABLE "_TrackToUser" ADD CONSTRAINT "_TrackToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TrackToUser" ADD CONSTRAINT "_TrackToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
