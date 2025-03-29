const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const SECRET_KEY = "110ec58a-a0f2-4ac4-8393-c866d813b8d1";

const jwtAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    jwt.verify(token, SECRET_KEY, async (err, data) => {
        if (err) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        try {
            const user = await prisma.user.findUnique({
                where: {id: data.userId}
            });
            if (!user) {
                return res.status(401).json({ message: "Not authenticated" });
            }
            req.user = user;
            next();
        }
        catch (error) {
            res.status(500).json({ error });
        }
    });
};
module.exports = jwtAuth;
