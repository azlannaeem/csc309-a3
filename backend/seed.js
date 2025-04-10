const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { faker } = require('@faker-js/faker');

function generateSecurePassword() {
    const fruits = [
        'Apple',
        'Banana',
        'Cherry',
        'Mango',
        'Grape',
        'Peach',
        'Pear',
        'Plum',
        'Kiwi',
        'Melon',
        'Lychee',
        'Orange',
        'Lemon',
        'Papaya',
        'Coconut',
        'Fig',
        'Guava',
        'Date',
        'Berry',
        'Apricot',
    ];
    const specialChars = ['!', '@', '#', '$', '%', '&'];

    const fruit = faker.helpers.arrayElement(fruits);
    const number = faker.number.int({ min: 100, max: 999 });
    const special = faker.helpers.arrayElement(specialChars);

    return `${fruit}${number}${special}`;
}

function generateEmail(firstName, lastName) {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mail.utoronto.ca`;
}

async function main() {
    // Clear existing data
    await prisma.transaction.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await prisma.promotion.deleteMany();

    const roles = ['regular', 'cashier', 'manager', 'superuser'];
    const users = [];
    const userPasswords = [];

    console.log('Creating users...');
    for (let i = 0; i < 100; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const password = generateSecurePassword();
        const role =
            i < 70 ? 'regular' : faker.helpers.arrayElement(roles.slice(1)); // Majority regular

        const points = faker.number.int({ min: 0, max: 1000 });
        const email = generateEmail(firstName, lastName);
        const utorid = `${role.slice(0, 4)}${(i + 1)
            .toString()
            .padStart(4, '0')}`;

        users.push(
            prisma.user.create({
                data: {
                    utorid: utorid,
                    name: `${firstName} ${lastName}`,
                    email,
                    password: password,
                    role,
                    points,
                },
            })
        );
        userPasswords.push({
            utorid,
            role,
            password,
        });
    }

    const createdUsers = await Promise.all(users);

    console.log('Creating promotions...');
    const promoTypes = ['automatic', 'one-time'];
    const promos = [];
    for (let i = 1; i <= 100; i++) {
        if (i <= 50) {
            startTime = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
            endTime = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // in 7 days
        } else {
            startTime = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // in 7 days
            endTime = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // in 14 days
        }
        promos.push(
            prisma.promotion.create({
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
            })
        );
    }

    await Promise.all(promos);

    console.log('Creating events...');
    const events = [];
    const locations = [
        'BA 1230',
        'SS 2108',
        'MP 202',
        'MY 280',
        'MC 105',
        'BA 1240',
        'SS 2110',
        'MP 204',
        'MY 285',
        'MC 110',
    ];
    const organizers = createdUsers.filter(
        (u) => u.role === 'manager' || u.role === 'superuser'
    );
    for (let i = 0; i < 50; i++) {
        const start = new Date(
            Date.now() + faker.number.int({ min: 1, max: 5 }) * 86400000
        );
        const end = new Date(
            start.getTime() + faker.number.int({ min: 1, max: 3 }) * 86400000
        );

        events.push(
            prisma.event.create({
                data: {
                    name: `Event ${i + 1}`,
                    location: faker.helpers.arrayElement(locations),
                    description: `This is the description for Event ${i + 1}`,
                    startTime: start,
                    endTime: end,
                    pointsRemain: (i + 1) * 50,
                    pointsAwarded: 0,
                    organizers: {
                        connect: [{ id: organizers[i % organizers.length].id }],
                    },
                    guests: {
                        connect: createdUsers
                            .filter((u) => u.role === 'regular')
                            .sort(() => 0.5 - Math.random())
                            .slice(0, 10)
                            .map((u) => ({ id: u.id })),
                    },
                },
            })
        );
    }

    await Promise.all(events);

    console.log('Creating 100 varied transactions...');

    const transactionTypes = [
        'purchase',
        'transfer',
        'adjustment',
        'redemption',
    ];

    const transactions = [];

    for (let i = 0; i < 100; i++) {
        const user = faker.helpers.arrayElement(createdUsers);
        const type = faker.helpers.arrayElement(transactionTypes);

        let transactionData = {
            type,
            amount: faker.number.int({ min: 10, max: 100 }),
            createdBy: user.utorid,
            utorid: user.utorid,
            remark: `Transaction ${i + 1}`,
        };

        // Customize per type
        if (type === 'redemption') {
            transactionData.type = 'redemption';
            transactionData.amount *= -1; // Make it negative
            transactionData.redeemed = 100 + i * 10;
            transactionData.processedBy = null;
            transactionData.remark = `Reward ${i + 1}`;
        } else if (type === 'transfer') {
            const receiver = faker.helpers.arrayElement(
                users.filter((u) => u.id !== user.id)
            );
            transactionData.relatedId = receiver.id;
        } else if (type === 'adjustment') {
            const related = faker.helpers.arrayElement(
                users.filter((u) => u.id !== user.id)
            );
            transactionData.relatedId = related.id;
        } else if (type === 'purchase') {
            transactionData.spent = transactionData.amount;
        }

        transactions.push(prisma.transaction.create({ data: transactionData }));
    }

    await Promise.all(transactions);

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
