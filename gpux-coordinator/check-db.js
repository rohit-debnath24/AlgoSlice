const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const gpus = await prisma.gPU.findMany();
    console.log(JSON.stringify(gpus, null, 2));
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
