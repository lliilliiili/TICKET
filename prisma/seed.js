const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const areas = [
    { id: 'rock', name: '搖滾區', price: 3800, remaining: 100 },
    { id: 'a', name: '座位區A', price: 3200, remaining: 200 },
    { id: 'b', name: '座位區B', price: 2800, remaining: 300 },
    { id: 'c', name: '座位區C', price: 2200, remaining: 400 }
  ];

  for (const area of areas) {
    await prisma.area.upsert({
      where: { id: area.id },
      update: {},
      create: area
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 