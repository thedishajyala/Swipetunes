-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT;

-- CreateTable
CREATE TABLE "Artist" (
    "id" SERIAL NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "genres" TEXT,
    "popularity" INTEGER,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArtistToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ArtistToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Artist_spotifyId_key" ON "Artist"("spotifyId");

-- CreateIndex
CREATE INDEX "_ArtistToUser_B_index" ON "_ArtistToUser"("B");

-- AddForeignKey
ALTER TABLE "_ArtistToUser" ADD CONSTRAINT "_ArtistToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToUser" ADD CONSTRAINT "_ArtistToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
