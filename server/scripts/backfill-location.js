require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
  const resumes = await prisma.resume.findMany();

  console.log(`Найдено резюме: ${resumes.length}`);

  for (const resume of resumes) {
    const personalInfo = JSON.parse(resume.personalInfo);
    const location = (personalInfo.location || '').trim();

    await prisma.resume.update({
      where: { id: resume.id },
      data: { location },
    });

    console.log(`✓ ${resume.id}: "${location}"`);
  }

  console.log('Готово!');
  await prisma.$disconnect();
}

backfill().catch((e) => {
  console.error(e);
  process.exit(1);
});