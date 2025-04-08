const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Clearing existing data...');
    await prisma.transaction.deleteMany();
    await prisma.event.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.user.deleteMany();

    console.log('Creating users...');
    const users = [];
    const userPasswords = [];

    const roleDistribution = [
        ...Array(2).fill('superuser'),
        ...Array(2).fill('manager'),
        ...Array(2).fill('cashier'),
        ...Array(14).fill('regular'),
    ];

    const names = [
        'Ali Ahmad',
        'Maya Chen',
        'Noah Khan',
        'Leila Patel',
        'Omar Singh',
        'Zara Ali',
        'Yusuf Wang',
        'Amira Gomez',
        'Adam Lee',
        'Lina Costa',
        'Karim Diaz',
        'Sana Park',
        'Hassan Ford',
        'Alya Cruz',
        'Reza Wu',
        'Nora Kim',
        'Tariq Rose',
        'Ranya Noor',
        'Sam Zhu',
        'Hadi Tran',
    ];

    const passwords = [
        'Apple123!',
        'Banana456!',
        'Grape789!',
        'Lemon321!',
        'Melon999!',
    ];

    for (let i = 0; i < roleDistribution.length; i++) {
        const [first, last] = names[i].split(' ');
        const role = roleDistribution[i];
        const password = passwords[i % passwords.length];
        const utorid = `${role.slice(0, 4)}${(i + 1)
            .toString()
            .padStart(4, '0')}`;
        const email = `${first.toLowerCase()}.${last.toLowerCase()}@mail.utoronto.ca`;

        const user = await prisma.user.create({
            data: {
                utorid,
                name: names[i],
                email,
                password,
                role,
                verified: i % 3 !== 0, // make some unverified
            },
        });

        users.push(user);
        userPasswords.push({ utorid, role, password });
    }

    console.log('Creating promotions...');
    const promoTypes = ['automatic', 'one-time'];
    for (let i = 1; i <= 12; i++) {
        if (i <= 6) {
            startTime = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
            endTime = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // in 7 days
        } else {
            startTime = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // in 7 days
            endTime = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // in 14 days
        }
        await prisma.promotion.create({
            data: {
                name: `Promo ${i}`,
                description: `Earn or save with Promo ${i}`,
                type: promoTypes[i % 2],
                startTime,
                endTime,
                rate: 0.05 * i,
                points: i * 20,
                minSpending: 10 * i,
            },
        });
    }

    console.log('Creating events...');
    const events = [];
    const locations = ['BA 1230', 'SS 2108', 'MP 202', 'MY 280', 'MC 105'];
    const organizers = users.filter(
        (u) => u.role === 'manager' || u.role === 'superuser'
    );

    for (let i = 0; i < 12; i++) {
        const start = new Date(Date.now() + (i + 1) * 86400000);
        const end = new Date(start.getTime() + 2 * 3600000);
        const event = await prisma.event.create({
            data: {
                name: `Event ${i + 1}`,
                location: locations[i % locations.length],
                startTime: start,
                endTime: end,
                pointsRemain: (i + 1) * 50,
                pointsAwarded: 0,
                organizers: {
                    connect: [{ id: organizers[i % organizers.length].id }],
                },
                description: `This is the description for Event ${i + 1}`,
            },
        });
        events.push(event);
    }

    console.log('RSVPing regular users to 3 events...');
    const regulars = users.filter((u) => u.role === 'regular');
    const rsvpedEvents = events.slice(0, 3);

    for (const event of rsvpedEvents) {
        const attendees = regulars.sort(() => 0.5 - Math.random()).slice(0, 5);
        for (const user of attendees) {
            await prisma.event.update({
                where: { id: event.id },
                data: {
                    guests: { connect: { id: user.id } },
                },
            });
        }
    }

    console.log('Creating 10 redemption requests...');
    for (let i = 0; i < 10; i++) {
        const user = regulars[i];
        await prisma.transaction.create({
            data: {
                type: 'redemption',
                amount: 100 + i * 10,
                redeemed: 100 + i * 10,
                remark: `Reward ${i + 1}`,
                createdBy: user.utorid,
                processedBy: null,
                utorid: user.utorid,
            },
        });
    }

    console.log('Creating 40 varied transactions...');
    const txTypes = ['purchase', 'transfer', 'adjustment'];

    for (let i = 0; i < 40; i++) {
        const sender = users[(i + 1) % users.length];
        const receiver = users[(i + 2) % users.length];

        let type = txTypes[i % txTypes.length];
        if (sender.role === 'regular') {
            // restrict to valid types
            type = i % 2 === 0 ? 'transfer' : 'redemption';
        }

        if (
            (type === 'adjustment' || type === 'purchase') &&
            sender.role === 'regular'
        ) {
            continue;
        }

        const tx = {
            type,
            amount: 50 + i,
            createdBy: sender.utorid,
            utorid: sender.utorid,
            remark: `Transaction #${i + 1}`,
        };

        if (type === 'purchase') tx.spent = tx.amount;
        if (type === 'transfer' || type === 'adjustment')
            tx.relatedId = receiver.id;

        await prisma.transaction.create({ data: tx });
    }

    console.log('\nSEED COMPLETE. Login credentials:');
    userPasswords.forEach(({ utorid, role, password }) => {
        console.log(
            `utorid: ${utorid} | role: ${role.padEnd(
                10
            )} | password: ${password}`
        );
    });
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
