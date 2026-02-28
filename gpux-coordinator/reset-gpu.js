const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GPU_ID = 'e5030d84-9782-4e91-a7b7-5713d63fc4e8';

async function main() {
    const updated = await prisma.gPU.update({
        where: { id: GPU_ID },
        data: { status: 'available' }
    });
    console.log(`✅ GPU reset: ${updated.gpu_model} → ${updated.status}`);
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
