const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const areas = [
    { id: 'rock', name: '�n�u��', price: 3800, remaining: 100 },
    { id: 'a', name: '�y���A', price: 3200, remaining: 200 },
    { id: 'b', name: '�y���B', price: 2800, remaining: 300 },
    { id: 'c', name: '�y���C', price: 2200, remaining: 400 }
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