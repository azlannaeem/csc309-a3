'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const args = process.argv;

    if (args.length !== 5) {
        console.error("usage: node prisma/createsu.js utorid email password");
        process.exit(1);
    }

    const utorid = args[2];
    if (utorid.length !== 8) {
        console.error("error: utorid must be 8 characters long");
        process.exit(1);
    }

    if (!/^[a-zA-Z0-9]+$/.test(utorid)) {
        console.error("error: utorid must only contain alphanumeric characters");
        process.exit(1);
    }

    let user = await prisma.user.findUnique({
        where: { utorid }
    });

    if (user) {
        console.error("error: utorid must be unique");
        process.exit(1);
    }

    const email = args[3];
    if (!(email.length > "@mail.utoronto.ca".length && email.endsWith("@mail.utoronto.ca"))) {
        console.error("error: email must be a valid University of Toronto email");
        process.exit(1);
    }

    user = await prisma.user.findUnique({
        where: { email }
    });

    if (user) {
        console.error("error: email must be unique");
        process.exit(1);
    }

    const password = args[4];
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,20}$/;
    if (!regex.test(password)) {
        console.error("error: password must be 8-20 characters, at least one uppercase, one lowercase, one number, and one special character");
        process.exit(1);
    }

    await prisma.user.create({
        data: { utorid, name: "superuser", email, password, role: "superuser", verified: true }
    });

    console.log("Superuser created successfully!");

    await prisma.$disconnect();
}

main().catch(async (error) => {
    console.error("Unexpected error:", error);
    await prisma.$disconnect();
    process.exit(1);
});
