import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
}

async function main() {
  const apply = process.argv.includes('--apply');

  const links = await prisma.affiliateLink.findMany({
    orderBy: [{ affiliateId: 'asc' }, { createdAt: 'asc' }],
    include: {
      affiliate: {
        select: { id: true, username: true, email: true },
      },
    },
  });

  if (links.length === 0) {
    console.log('No affiliate links found.');
    return;
  }

  const existingCodes = new Set(links.map((l) => l.code));
  const planned: Array<{ id: string; oldCode: string; newCode: string; newTargetUrl: string }> = [];

  // Keep track of usernames used per affiliate to keep first link as exact username.
  const perAffiliateSeq = new Map<string, number>();

  for (const link of links) {
    const raw = link.affiliate.username || link.affiliate.email.split('@')[0] || 'user';
    const base = normalizeUsername(raw) || 'user';

    const seq = perAffiliateSeq.get(link.affiliateId) ?? 0;
    perAffiliateSeq.set(link.affiliateId, seq + 1);

    let candidate = seq === 0 ? base : `${base}_${seq + 1}`;
    if (candidate.length > 24) {
      candidate = candidate.slice(0, 24);
    }

    if (candidate !== link.code) {
      existingCodes.delete(link.code);
      let finalCode = candidate;
      let salt = 1;
      while (existingCodes.has(finalCode)) {
        const suffix = `_${salt}`;
        const limit = Math.max(1, 24 - suffix.length);
        finalCode = `${candidate.slice(0, limit)}${suffix}`;
        salt += 1;
      }
      existingCodes.add(finalCode);
      candidate = finalCode;
    }

    const newTargetUrl = `https://app.aishe.pro/ref/${base}`;
    const needsUpdate = candidate !== link.code || newTargetUrl !== link.targetUrl;

    if (needsUpdate) {
      planned.push({
        id: link.id,
        oldCode: link.code,
        newCode: candidate,
        newTargetUrl,
      });
    }
  }

  console.log(`Total links: ${links.length}`);
  console.log(`Planned updates: ${planned.length}`);

  if (planned.length > 0) {
    console.log('Sample (first 20):');
    for (const row of planned.slice(0, 20)) {
      console.log(`- ${row.id}: ${row.oldCode} -> ${row.newCode} | ${row.newTargetUrl}`);
    }
  }

  if (!apply) {
    console.log('Dry run complete. Use --apply to execute updates.');
    return;
  }

  for (const row of planned) {
    await prisma.affiliateLink.update({
      where: { id: row.id },
      data: {
        code: row.newCode,
        targetUrl: row.newTargetUrl,
      },
    });
  }

  console.log(`Applied updates: ${planned.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
