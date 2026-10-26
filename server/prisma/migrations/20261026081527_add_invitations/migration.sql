-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "hrName" TEXT NOT NULL,
    "hrEmail" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
