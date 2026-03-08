import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const normalizeUsername = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);

const generateCandidate = (base: string, attempt: number) => {
  if (attempt === 0) return base;
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base}_${suffix}`;
};

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, username: true },
  });

  for (const user of users.filter((item) => !item.username)) {
    const emailPrefix = user.email.split('@')[0] ?? 'user';
    const base = normalizeUsername(emailPrefix) || 'user';

    let candidate = base;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      candidate = generateCandidate(base, attempt);
      const exists = await prisma.user.findUnique({ where: { username: candidate } });
      if (!exists) {
        await prisma.user.update({
          where: { id: user.id },
          data: { username: candidate },
        });
        break;
      }
    }
  }
}

main()
  .catch((error) => {
    console.error('Backfill error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
