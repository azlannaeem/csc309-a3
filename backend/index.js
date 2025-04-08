#!/usr/bin/env node
'use strict';

const port = (() => {
  const args = process.argv;

  if (args.length !== 3) {
    console.error('usage: node index.js port');
    process.exit(1);
  }

  const num = parseInt(args[2], 10);
  if (isNaN(num)) {
    console.error('error: argument must be an integer.');
    process.exit(1);
  }

  return num;
})();

const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const SECRET_KEY = '110ec58a-a0f2-4ac4-8393-c866d813b8d1';

app.use(express.json());

const jwtAuth = require('./middleware/jwtAuth');
// ADD YOUR WORK HERE
const storage = multer.diskStorage({
  destination: 'uploads/avatars/',
  filename: (req, file, cb) => {
    cb(null, `${req.user.utorid}.png`);
  },
});

const upload = multer({ storage });

const rateLimitMap = new Map();
app.use('/uploads', express.static('uploads'));

app.post('/users', jwtAuth, async (req, res) => {
  try {
    const clearance = ['cashier', 'manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { utorid, name, email, ...rest } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }

    if (utorid === undefined || name === undefined || email === undefined) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    if (typeof utorid !== 'string') {
      return res.status(400).json({ error: 'utorid must be string' });
    }

    if (utorid.length !== 8) {
      return res
        .status(400)
        .json({ error: 'utorid must be 8 characters long' });
    }

    if (!/^[a-zA-Z0-9]+$/.test(utorid)) {
      return res
        .status(400)
        .json({ error: 'utorid must only contain alphanumeric characters' });
    }

    let user = await prisma.user.findUnique({
      where: { utorid },
    });

    if (user) {
      return res.status(409).json({ error: 'utorid must be unique' });
    }

    if (typeof name !== 'string') {
      return res.status(400).json({ error: 'name must be a string' });
    }

    if (name.length < 1 || name.length > 50) {
      return res.status(400).json({ error: 'name must be 1-50 characters' });
    }

    if (typeof email !== 'string') {
      return res.status(400).json({ error: 'email must be a string' });
    }

    if (
      !(
        email.length > '@mail.utoronto.ca'.length &&
        email.endsWith('@mail.utoronto.ca')
      )
    ) {
      return res
        .status(400)
        .json({ error: 'email must be a valid University of Toronto email' });
    }

    user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      return res.status(400).json({ error: 'email must be unique' });
    }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    user = await prisma.user.create({
      data: {
        utorid,
        name,
        email,
        password: uuidv4(),
        role: 'regular',
        expiresAt,
        resetToken: uuidv4(),
      },
    });
    let response = {
      id: user.id,
      utorid: user.utorid,
      name: user.name,
      email: user.email,
      verified: user.verified,
      expiresAt: user.expiresAt,
      resetToken: user.resetToken,
    };
    return res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.get('/users', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    let { name, role, verified, activated, page, limit, ...rest } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: 'Page and limit must be positive integers.' });
    }

    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }

    const skip = (page - 1) * limit;
    const where = {};
    if (name) {
      where.OR = [{ utorid: name }, { name }];
    }

    if (role) {
      where.role = role;
    }

    if (verified !== undefined) {
      if (verified !== 'true' && verified !== 'false') {
        return res
          .status(400)
          .json({ error: "Query parameter 'verified' must be a boolean." });
      }
      where.verified = verified === 'true';
    }

    if (activated !== undefined) {
      if (activated !== 'true' && activated !== 'false') {
        return res
          .status(400)
          .json({ error: "Query parameter 'activated' must be a boolean." });
      }
      where.activated = activated === 'true';
    }

    const results = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        utorid: true,
        name: true,
        email: true,
        birthday: true,
        role: true,
        points: true,
        createdAt: true,
        lastLogin: true,
        verified: true,
        avatarUrl: true,
      },
    });

    const count = await prisma.user.count({ where });
    res.json({ count, results });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.all('/users', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.patch('/users/me', jwtAuth, upload.single('avatar'), async (req, res) => {
  try {
    const id = req.user.id;

    const avatarPath = req.file
      ? `/uploads/avatars/${req.user.utorid}.png`
      : undefined;
    const { name, email, birthday, avatar, ...rest } = req.body;
    if (
      name === null &&
      email === null &&
      birthday === null &&
      avatar === null
    ) {
      return res.status(400).json({ error: 'Request body cannot be empty' });
    }
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }
    if (name && (name.length < 1 || name.length > 50)) {
      return res.status(400).json({ error: 'name must be 1-50 characters' });
    }
    if (email !== undefined && email !== null) {
      if (typeof email !== 'string') {
        return res.status(400).json({ error: 'email must be a string' });
      }

      if (
        !(
          email.length > '@mail.utoronto.ca'.length &&
          email.endsWith('@mail.utoronto.ca')
        )
      ) {
        return res
          .status(400)
          .json({ error: 'email must be a valid University of Toronto email' });
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (user && user.id !== req.user.id) {
        return res.status(400).json({ error: 'email must be unique' });
      }
    }

    if (birthday) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      if (!dateRegex.test(birthday)) {
        return res
          .status(400)
          .json({ error: 'Invalid birthday format. Use YYYY-MM-DD' });
      }

      const [year, month, day] = birthday.split('-').map(Number);
      const date = new Date(year, month - 1, day); // Month is 0-indexed in JS Date

      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return res
          .status(400)
          .json({ error: 'Invalid birthday. Please check the month and day.' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(birthday && { birthday }),
        ...(avatarPath && { avatarUrl: avatarPath }),
      },
      select: {
        id: true,
        utorid: true,
        name: true,
        email: true,
        birthday: true,
        role: true,
        points: true,
        createdAt: true,
        lastLogin: true,
        verified: true,
        avatarUrl: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('user/me patch: ', error);
    res.status(500).json({ error });
  }
});

app.get('/users/me', jwtAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    const now = new Date();
    const promotions = await prisma.promotion.findMany({
      where: {
        id: { notIn: user.used },
        type: 'one-time',
        startTime: { lte: now },
        endTime: { gt: now },
      },
      select: {
        id: true,
        name: true,
        minSpending: true,
        rate: true,
        points: true,
      },
    });
    res.json({
      id: user.id,
      utorid: user.utorid,
      name: user.name,
      email: user.email,
      birthday: user.birthday,
      role: user.role,
      points: user.points,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      verified: user.verified,
      avatarUrl: user.avatarUrl,
      promotions,
    });
  } catch (error) {
    console.error('user/me get: ', error);
    res.status(500).json({ error });
  }
});

app.all('/users/me', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.patch('/users/me/password', jwtAuth, async (req, res) => {
  try {
    const { old, new: newPassword, ...rest } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }

    if (
      old === undefined ||
      old === null ||
      newPassword === null ||
      newPassword === undefined
    ) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (old !== user.password) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,20}$/;
    if (!regex.test(newPassword)) {
      return res.status(400).json({
        error:
          'New password must be 8-20 characters, at least one uppercase, one lowercase, one number, and one special character',
      });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newPassword },
    });
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.all('/users/me/password', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.get('/users/:userId', jwtAuth, async (req, res) => {
  try {
    const clearance = ['cashier', 'manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const id = parseInt(req.params.userId);

    if (isNaN(id)) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const now = new Date();
    const promotions = await prisma.promotion.findMany({
      where: {
        id: { notIn: user.used },
        type: 'one-time',
        startTime: { lte: now },
        endTime: { gt: now },
      },
      select: {
        id: true,
        name: true,
        minSpending: true,
        rate: true,
        points: true,
      },
    });
    const response = {
      id: user.id,
      utorid: user.utorid,
      name: user.name,
      points: user.points,
      verified: user.verified,
      promotions,
    };
    if (req.user.role === 'cashier') {
      return res.json(response);
    }
    response.email = user.email;
    response.suspicious = user.suspicious;
    response.birthday = user.birthday;
    response.role = user.role;
    response.createdAt = user.createdAt;
    response.lastLogin = user.lastLogin;
    response.avatarUrl = user.avatarUrl;
    res.json(response);
  } catch (error) {
    console.error('userid get: ', error);
    res.status(500).json({ error });
  }
});

app.patch('/users/:userId', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body cannot be empty' });
    }
    const { email, verified, suspicious, role, ...rest } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }
    const id = parseInt(req.params.userId);
    const data = {};
    if (email !== undefined && email !== null) {
      if (typeof email !== 'string') {
        return res.status(400).json({ error: 'email must be a string' });
      }

      if (
        !(
          email.length > '@mail.utoronto.ca'.length &&
          email.endsWith('@mail.utoronto.ca')
        )
      ) {
        return res
          .status(400)
          .json({ error: 'email must be a valid University of Toronto email' });
      }
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== id) {
        return res.status(400).json({ error: 'email must be unique' });
      }
      data.email = email;
    }

    if (verified !== undefined && verified !== null) {
      if (typeof verified !== 'boolean' || verified !== true) {
        return res.status(400).json({ error: 'verified must be set to true.' });
      }
      data.verified = true;
    }

    if (suspicious !== undefined && suspicious !== null) {
      if (typeof suspicious !== 'boolean') {
        return res.status(400).json({ error: 'suspicious must be a boolean.' });
      }
      data.suspicious = suspicious;
    }

    if (role !== undefined && role !== null) {
      if (typeof role !== 'string') {
        return res.status(400).json({ error: 'role must be a string' });
      }
      if (role === 'cashier' && suspicious === true) {
        return res.status(400).json({ error: 'suspicious should be false.' });
      }
      if (
        req.user.role === 'manager' &&
        !['cashier', 'regular'].includes(role)
      ) {
        return res
          .status(403)
          .json({ error: 'role should either cashier or regular.' });
      }
      if (!['regular', 'cashier', 'manager', 'superuser'].includes(role)) {
        return res.status(400).json({
          error: 'role should any of cashier, regular, manager, or superuser',
        });
      }
      data.role = role;
    }

    if (isNaN(id)) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });
    res.json({
      id: updatedUser.id,
      utorid: updatedUser.utorid,
      name: updatedUser.name,
      ...data,
    });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.all('/users/:userId', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.post('/auth/tokens', async (req, res) => {
  try {
    const { utorid, password, ...rest } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }

    if (utorid === undefined || password === undefined) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const user = await prisma.user.findUnique({
      where: { utorid },
    });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid Credentials.' });
    }
    const lastLogin = new Date();
    const data = { lastLogin };
    if (!user.activated) {
      data.activated = true;
    }
    const userId = user.id;
    await prisma.user.update({
      where: { utorid },
      data,
    });
    const token = jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1hr' });
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    res.json({ token, expiresAt });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.all('/auth/tokens', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.post('/auth/resets', async (req, res) => {
  try {
    const { utorid, ...rest } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }
    if (utorid === undefined) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const user = await prisma.user.findUnique({
      where: { utorid },
    });
    if (!user) {
      return res.status(404).json({ error: 'Not found' });
    }
    const now = Date.now();

    const lastRequestTime = rateLimitMap.get(utorid);

    if (lastRequestTime) {
      const timeSinceLastRequest = (now - lastRequestTime) / 1000;

      if (timeSinceLastRequest < 60) {
        return res.status(429).json({ error: 'Too Many Requests' });
      }
    }
    rateLimitMap.set(utorid, now);
    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, expiresAt },
    });
    res.status(202).json({ expiresAt, resetToken });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.all('/auth/resets', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.post('/auth/resets/:resetToken', async (req, res) => {
  try {
    const { utorid, password, ...rest } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }
    if (!utorid || !password) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const user = await prisma.user.findUnique({
      where: { utorid },
    });
    if (!user) {
      return res.status(400).json({ error: 'Invalid utorid' });
    }
    if (typeof password !== 'string') {
      return res.status(400).json({ error: 'password must be string' });
    }
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,20}$/;
    if (!regex.test(password)) {
      return res.status(400).json({
        error:
          'New password must be 8-20 characters, at least one uppercase, one lowercase, one number, and one special character',
      });
    }
    const resetToken = req.params.resetToken;
    if (resetToken !== user.resetToken) {
      const existingToken = await prisma.user.findFirst({
        where: { resetToken },
      });
      if (existingToken) {
        return res.status(401).json({ error: 'Not Authenticated' });
      }
      return res.status(404).json({ error: 'Not found' });
    }
    const now = Date.now();

    if (now >= user.expiresAt) {
      return res.status(410).json({ error: 'Gone' });
    }
    await prisma.user.update({ where: { id: user.id }, data: { password } });
    res.status(200).send();
  } catch (error) {
    console.error('reset password error:', error);
    res.status(500).json({ error });
  }
});

app.all('/auth/resets/:resetToken', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.post('/transactions', jwtAuth, async (req, res) => {
  try {
    const clearance = ['cashier', 'manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const type = req.body.type;
    if (type === undefined || type === null) {
      return res.status(400).json({ error: 'type must be provided' });
    }
    if (req.user.role === 'cashier' && type !== 'purchase') {
      return res.status(400).json({ error: 'type must be purchase' });
    }
    if (!['purchase', 'adjustment'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }
    if (type === 'purchase') {
      const { utorid, spent, promotionIds, remark, ...rest } = req.body;
      if (Object.keys(rest).length > 1) {
        return res.status(400).json({
          error: `Unexpected fields: ${Object.keys(rest).join(', ')}`,
        });
      }
      if (utorid === undefined || utorid === null) {
        return res.status(400).json({ error: 'utorid must be provided' });
      }
      if (spent === undefined || spent === null) {
        return res.status(400).json({ error: 'spent must be provided' });
      }
      const user = await prisma.user.findUnique({
        where: { utorid },
      });
      if (!user) {
        return res.status(400).json({ error: 'Invalid utorid' });
      }
      if (typeof spent !== 'number' || isNaN(spent) || spent <= 0) {
        return res
          .status(400)
          .json({ error: 'spent must be a positive numeric value' });
      }
      const data = { utorid, type, spent };
      if (remark !== undefined && remark !== null) {
        if (typeof remark !== 'string') {
          return res.status(400).json({ error: 'remark must be a string' });
        }
        data.remark = remark;
      }
      const userData = {};
      let extra = 0;
      if (promotionIds !== undefined && promotionIds !== null) {
        if (!Array.isArray(promotionIds)) {
          return res
            .status(400)
            .json({ error: 'promotionIds must be an array' });
        }
        if (promotionIds.length > 0) {
          if (user.used.some((id) => promotionIds.includes(id))) {
            return res.status(400).json({ error: 'promotion already used' });
          }
          const now = new Date();
          const validPromotions = await prisma.promotion.findMany({
            where: {
              id: { in: promotionIds },
              startTime: { lte: now },
              endTime: { gt: now },
            },
          });
          if (validPromotions.length !== promotionIds.length) {
            return res
              .status(400)
              .json({ error: 'One or more promotions are invalid, expired' });
          }
          if (validPromotions.some((p) => p.minSpending > spent)) {
            return res
              .status(400)
              .json({ error: 'promotion MIN_SPEND_NOT_MET' });
          }
          data.promotionIds = promotionIds;
          userData.used = user.used.concat(
            validPromotions
              .filter((p) => p.type === 'one-time')
              .map((p) => p.id)
          );
          validPromotions.forEach((p) => {
            extra += Math.round(spent * 100 * p.rate);
            extra += p.points;
          });
          let automaticPromotions = await prisma.promotion.findMany({
            where: {
              type: 'automatic',
              startTime: { lte: now },
              endTime: { gt: now },
            },
          });
          automaticPromotions = automaticPromotions.filter(
            (p) => !promotionIds.includes(p.id)
          );
          automaticPromotions.forEach((p) => {
            extra += Math.round(spent * 100 * p.rate);
            extra += p.points;
          });
        }
      }
      const amount = Math.round(spent / 0.25);
      data.suspicious = true;
      let earned = 0;
      if (!req.user.suspicious) {
        earned = amount + extra;
        data.suspicious = false;
        userData.points = { increment: earned };
      }
      await prisma.user.update({
        where: { utorid },
        data: userData,
      });
      data.amount = amount;
      data.createdBy = req.user.utorid;

      const transaction = await prisma.transaction.create({ data });
      return res.status(201).json({
        id: transaction.id,
        utorid,
        type,
        spent: transaction.spent,
        earned,
        remark: transaction.remark,
        promotionIds: transaction.promotionIds,
        createdBy: transaction.createdBy,
      });
    }
    const { utorid, amount, relatedId, promotionIds, remark, ...rest } =
      req.body;
    if (Object.keys(rest).length > 1) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }
    if (utorid === undefined || utorid === null) {
      return res.status(400).json({ error: 'utorid must be provided' });
    }
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'amount must be provided' });
    }
    if (relatedId === undefined || relatedId === null) {
      return res.status(400).json({ error: 'relatedId must be provided' });
    }
    const user = await prisma.user.findUnique({
      where: { utorid },
    });
    if (!user) {
      return res.status(400).json({ error: 'Invalid utorid' });
    }
    if (!Number.isInteger(amount)) {
      return res.status(400).json({ error: 'amount must be an integer' });
    }
    if (!Number.isInteger(relatedId)) {
      return res.status(400).json({ error: 'relatedID must be an integer' });
    }
    const related = await prisma.transaction.findUnique({
      where: { id: relatedId },
    });
    if (!related || related.utorid !== utorid) {
      return res.status(404).json({ error: 'Invalid relatedID' });
    }
    const data = { utorid, type, amount, relatedId };
    if (remark !== undefined && remark !== null) {
      if (typeof remark !== 'string') {
        return res.status(400).json({ error: 'remark must be a string' });
      }
      data.remark = remark;
    }
    const userData = { points: { increment: amount } };
    if (promotionIds !== undefined && promotionIds !== null) {
      if (!Array.isArray(promotionIds)) {
        return res.status(400).json({ error: 'promotionIds must be an array' });
      }
      if (promotionIds.length > 0) {
        if (user.used.some((id) => promotionIds.includes(id))) {
          return res.status(400).json({ error: 'promotion already used' });
        }
        const now = new Date();
        const validPromotions = await prisma.promotion.findMany({
          where: {
            id: { in: promotionIds },
            startTime: { lte: now },
            endTime: { gt: now },
          },
        });
        if (validPromotions.length !== promotionIds.length) {
          return res
            .status(400)
            .json({ error: 'One or more promotions are invalid, expired' });
        }
        data.promotionIds = promotionIds;
        userData.used = user.used.concat(
          validPromotions.filter((p) => p.type === 'one-time').map((p) => p.id)
        );
      }
    }
    await prisma.user.update({
      where: { utorid },
      data: userData,
    });
    data.createdBy = req.user.utorid;
    data.suspicious = false;
    const transaction = await prisma.transaction.create({ data });
    res.status(201).json({
      id: transaction.id,
      utorid,
      amount,
      type,
      relatedId,
      remark: transaction.remark,
      promotionIds: transaction.promotionIds,
      createdBy: transaction.createdBy,
    });
  } catch (error) {
    console.error('purchase error:', error);
    res.status(500).json({ error });
  }
});

app.get('/transactions', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    const { name, createdBy, type, operator } = req.query;
    if (operator && operator !== 'gte' && operator !== 'lte') {
      return res.status(400).json({ error: 'Invalid operator' });
    }
    if (req.query.relatedId && !type) {
      return res
        .status(400)
        .json({ error: 'relatedId must be used with type' });
    }

    if (req.query.amount && !operator) {
      return res
        .status(400)
        .json({ error: 'amount must be used with operator' });
    }
    const suspicious =
      req.query.suspicious === 'true'
        ? true
        : req.query.suspicious === 'false'
        ? false
        : undefined;
    const promotionId = parseInt(req.query.promotionId);
    const relatedId = parseInt(req.query.relatedId);
    const amount = parseInt(req.query.amount);

    const where = {
      utorid: name || undefined,
      createdBy: createdBy || undefined,
      suspicious,
      promotionIds: isNaN(promotionId) ? undefined : { has: promotionId },
      type: type || undefined,
      relatedId: isNaN(relatedId) ? undefined : relatedId,
      amount: isNaN(amount) ? undefined : { [operator]: amount },
    };
    const transactions = await prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        utorid: true,
        amount: true,
        type: true,
        relatedId: true,
        spent: true,
        redeemed: true,
        promotionIds: true,
        suspicious: true,
        remark: true,
        createdBy: true,
      },
    });
    const results = transactions.map((transaction) => {
      return Object.fromEntries(
        Object.entries(transaction).filter(([_, value]) => value !== null)
      );
    });
    const count = await prisma.transaction.count({ where });
    res.json({ count, results });
  } catch (error) {
    console.error('transaction get error:', error);
    res.status(500).json({ error });
  }
});

app.all('/transactions', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.get('/transactions/:transactionId', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const id = parseInt(req.params.transactionId);
    if (isNaN(id)) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: {
        id: true,
        utorid: true,
        amount: true,
        type: true,
        relatedId: true,
        spent: true,
        redeemed: true,
        promotionIds: true,
        suspicious: true,
        remark: true,
        createdBy: true,
      },
    });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    const result = Object.fromEntries(
      Object.entries(transaction).filter(([_, value]) => value !== null)
    );
    res.json(result);
  } catch (error) {
    console.error('transaction get error:', error);
    res.status(500).json({ error });
  }
});

app.all('/transactions/:transactionId', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.patch(
  '/transactions/:transactionId/suspicious',
  jwtAuth,
  async (req, res) => {
    try {
      const clearance = ['manager', 'superuser'];
      if (!clearance.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const { suspicious, ...rest } = req.body;
      if (Object.keys(rest).length > 0) {
        return res.status(400).json({
          error: `Unexpected fields: ${Object.keys(rest).join(', ')}`,
        });
      }
      if (typeof suspicious !== 'boolean') {
        return res.status(400).json({ error: 'suspicious must be boolean' });
      }
      const id = parseInt(req.params.transactionId);
      if (isNaN(id)) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      const transaction = await prisma.transaction.findUnique({
        where: { id },
      });
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      let amount = 0;
      if (suspicious && !transaction.suspicious) {
        amount = -transaction.amount;
      }
      if (!suspicious && transaction.suspicious) {
        amount = transaction.amount;
      }
      const updated = await prisma.transaction.update({
        where: { id },
        data: { suspicious },
        select: {
          id: true,
          utorid: true,
          amount: true,
          type: true,
          relatedId: true,
          spent: true,
          redeemed: true,
          promotionIds: true,
          suspicious: true,
          remark: true,
          createdBy: true,
        },
      });
      const result = Object.fromEntries(
        Object.entries(updated).filter(([_, value]) => value !== null)
      );
      await prisma.user.update({
        where: { utorid: transaction.utorid },
        data: { points: { increment: amount } },
      });
      res.json(result);
    } catch (error) {
      console.error('transaction patch error:', error);
      res.status(500).json({ error });
    }
  }
);

app.all('/transactions/:transactionId/suspicious', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.post('/users/me/transactions', jwtAuth, async (req, res) => {
  try {
    if (!req.user.verified) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { type, amount, remark, ...rest } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }
    if (type !== 'redemption') {
      return res.status(400).json({ error: 'type must be redemption' });
    }
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'amount must be provided' });
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ error: 'amount must be a positive integer' });
    }
    if (remark !== undefined && remark !== null) {
      if (typeof remark !== 'string') {
        return res.status(400).json({ error: 'remark must be a string' });
      }
    }
    const user = req.user;
    if (user.points < amount) {
      return res.status(400).json({ error: 'Not enough points' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        utorid: user.utorid,
        amount: -amount,
        type,
        redeemed: amount,
        remark: remark || undefined,
        createdBy: user.utorid,
      },
    });

    return res.status(201).json({
      id: transaction.id,
      utorid: user.utorid,
      type,
      processedBy: null,
      amount,
      remark: transaction.remark,
      createdBy: user.utorid,
    });
  } catch (error) {
    console.error('redemption error:', error);
    res.status(500).json({ error });
  }
});

app.get('/users/me/transactions', jwtAuth, async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    const { type, operator } = req.query;
    if (operator && operator !== 'gte' && operator !== 'lte') {
      return res.status(400).json({ error: 'Invalid operator' });
    }
    if (req.query.relatedId && !type) {
      return res
        .status(400)
        .json({ error: 'relatedId must be used with type' });
    }

    if (req.query.amount && !operator) {
      return res
        .status(400)
        .json({ error: 'amount must be used with operator' });
    }
    const suspicious =
      req.query.suspicious === 'true'
        ? true
        : req.query.suspicious === 'false'
        ? false
        : undefined;
    const promotionId = parseInt(req.query.promotionId);
    const relatedId = parseInt(req.query.relatedId);
    const amount = parseInt(req.query.amount);

    const where = {
      promotionIds: isNaN(promotionId) ? undefined : { has: promotionId },
      type: type || undefined,
      relatedId: isNaN(relatedId) ? undefined : relatedId,
      amount: isNaN(amount) ? undefined : { [operator]: amount },
    };
    const transactions = await prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        type: true,
        relatedId: true,
        spent: true,
        redeemed: true,
        promotionIds: true,
        remark: true,
        createdBy: true,
      },
    });
    const results = transactions.map((transaction) => {
      return Object.fromEntries(
        Object.entries(transaction).filter(([_, value]) => value !== null)
      );
    });
    const count = await prisma.transaction.count({ where });
    res.json({ count, results });
  } catch (error) {
    console.error('transaction get error:', error);
    res.status(500).json({ error });
  }
});

app.all('/users/me/transactions', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.post('/users/:userId/transactions', jwtAuth, async (req, res) => {
  try {
    if (!req.user.verified) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { type, amount, remark, ...rest } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }
    if (type !== 'transfer') {
      return res.status(400).json({ error: 'type must be transfer' });
    }
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'amount must be provided' });
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ error: 'amount must be a positive integer' });
    }
    if (remark !== undefined && remark !== null) {
      if (typeof remark !== 'string') {
        return res.status(400).json({ error: 'remark must be a string' });
      }
    }
    const sender = req.user;
    if (sender.points < amount) {
      return res.status(400).json({ error: 'Not enough points' });
    }
    const id = parseInt(req.params.userId);
    if (isNaN(id)) {
      return res.status(404).json({ error: 'User not found' });
    }
    const recipient = await prisma.user.findUnique({
      where: { id },
    });
    if (!recipient) {
      return res.status(404).json({ error: 'User not found' });
    }
    await prisma.user.update({
      where: { id: sender.id },
      data: { points: { decrement: amount } },
    });

    await prisma.user.update({
      where: { id: recipient.id },
      data: { points: { increment: amount } },
    });
    const transactionSender = await prisma.transaction.create({
      data: {
        utorid: sender.utorid,
        amount: -amount,
        type,
        remark: remark || undefined,
        relatedId: recipient.id,
        createdBy: sender.utorid,
      },
    });

    const transactionRecipient = await prisma.transaction.create({
      data: {
        utorid: recipient.utorid,
        amount: amount,
        type,
        remark: remark || undefined,
        relatedId: sender.id,
        createdBy: sender.utorid,
      },
    });
    return res.status(201).json({
      id: transactionSender.id,
      sender: sender.utorid,
      recipient: recipient.utorid,
      type,
      sent: amount,
      remark: transactionRecipient.remark,
      createdBy: sender.utorid,
    });
  } catch (error) {
    console.error('transfer error:', error);
    res.status(500).json({ error });
  }
});

app.all('/users/:userId/transactions', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.patch(
  '/transactions/:transactionId/processed',
  jwtAuth,
  async (req, res) => {
    try {
      const clearance = ['cashier', 'manager', 'superuser'];
      if (!clearance.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const { processed, ...rest } = req.body;
      if (Object.keys(rest).length > 0) {
        return res.status(400).json({
          error: `Unexpected fields: ${Object.keys(rest).join(', ')}`,
        });
      }
      if (processed !== true) {
        return res.status(400).json({ error: 'processed must be true' });
      }
      const id = parseInt(req.params.transactionId);
      if (isNaN(id)) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      const transaction = await prisma.transaction.findUnique({
        where: { id },
      });
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      if (
        transaction.type !== 'redemption' ||
        transaction.processedBy !== null
      ) {
        return res.status(400).json({ error: 'Bad request' });
      }
      const amount = transaction.amount;

      const updated = await prisma.transaction.update({
        where: { id },
        data: { processedBy: req.user.utorid },
        select: {
          id: true,
          utorid: true,
          type: true,
          processedBy: true,
          redeemed: true,
          remark: true,
          createdBy: true,
        },
      });
      await prisma.user.update({
        where: { utorid: transaction.utorid },
        data: { points: { increment: amount } },
      });
      res.json(updated);
    } catch (error) {
      console.error('transaction patch error:', error);
      res.status(500).json({ error });
    }
  }
);

app.all('/transactions/:transactionId/processed', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.post('/events', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const {
      name,
      description,
      location,
      startTime,
      endTime,
      capacity,
      points,
      ...rest
    } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }
    if (name === undefined || name === null) {
      return res.status(400).json({ error: 'name must be given' });
    }
    if (description === undefined || description === null) {
      return res.status(400).json({ error: 'description must be given' });
    }
    if (startTime === undefined || startTime === null) {
      return res.status(400).json({ error: 'startTime must be given' });
    }
    if (endTime === undefined || endTime === null) {
      return res.status(400).json({ error: 'endTime must be given' });
    }
    if (points === undefined || points === null) {
      return res.status(400).json({ error: 'points must be given' });
    }
    if (typeof name !== 'string' || !name) {
      return res.status(400).json({ error: 'name must be a non-empty string' });
    }
    if (typeof description !== 'string' || !description) {
      return res
        .status(400)
        .json({ error: 'description must be a non-empty string' });
    }
    if (typeof location !== 'string' || !location) {
      return res
        .status(400)
        .json({ error: 'location must be a non-empty string' });
    }
    if (typeof startTime !== 'string' || !startTime) {
      return res
        .status(400)
        .json({ error: 'startTime must be a non-empty string' });
    }
    if (typeof endTime !== 'string' || !endTime) {
      return res
        .status(400)
        .json({ error: 'endTime must be a non-empty string' });
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();
    if (
      isNaN(start.getTime()) ||
      isNaN(end.getTime()) ||
      end <= start ||
      start < now
    ) {
      return res.status(400).json({ error: 'Invalid startTime, endTime' });
    }
    if (!Number.isInteger(points) || points <= 0) {
      return res
        .status(400)
        .json({ error: 'points must be a positive integer' });
    }
    const data = {
      name,
      description,
      location,
      startTime: start,
      endTime: end,
      pointsRemain: points,
      pointsAwarded: 0,
    };
    if (capacity !== undefined && capacity !== null) {
      if (!Number.isInteger(capacity) || capacity <= 0) {
        return res
          .status(400)
          .json({ error: 'capacity must be a positive integer' });
      }
      data.capacity = capacity;
    }

    const event = await prisma.event.create({
      data,
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        startTime: true,
        endTime: true,
        capacity: true,
        pointsRemain: true,
        pointsAwarded: true,
        published: true,
        organizers: true,
        guests: true,
      },
    });
    res.status(201).json(event);
  } catch (error) {
    console.error('events post error:', error);
    res.status(500).json({ error });
  }
});

app.get('/events', jwtAuth, async (req, res) => {
  try {
    let { name, location, started, ended, showFull, published, page, limit } =
      req.query;
    const where = {
      name: name || undefined,
      location: location || undefined,
    };
    const clearance = ['manager', 'superuser'];
    if (published) {
      if (!clearance.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      published =
        req.query.published === 'true'
          ? true
          : req.query.published === 'false'
          ? false
          : undefined;
      where.published = published;
    }
    if (!clearance.includes(req.user.role)) {
      where.published = true;
    }
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: 'Page and limit must be positive integers.' });
    }
    const skip = (page - 1) * limit;
    const now = new Date();
    if (started === 'true') {
      where.startTime = { lte: now };
    }
    if (started === 'false') {
      where.startTime = { gt: now };
    }
    if (ended === 'true') {
      where.endTime = { lte: now };
    }
    if (ended === 'false') {
      where.endTime = { gt: now };
    }

    if (showFull !== 'true') {
      where.full = false;
    }

    const events = await prisma.event.findMany({
      where,
      skip,
      take: limit,
      include: { guests: true },
    });
    const count = await prisma.event.count({ where });
    if (!clearance.includes(req.user.role)) {
      const results = events.map((e) => {
        return {
          id: e.id,
          name: e.name,
          location: e.location,
          startTime: e.startTime,
          endTime: e.endTime,
          capacity: e.capacity,
          numGuests: e.guests.length,
        };
      });
      return res.json({ count, results });
    } else {
      const results = events.map((e) => {
        return {
          id: e.id,
          name: e.name,
          location: e.location,
          startTime: e.startTime,
          endTime: e.endTime,
          capacity: e.capacity,
          pointsRemain: e.pointsRemain,
          pointsAwarded: e.pointsAwarded,
          published: e.published,
          numGuests: e.guests.length,
        };
      });
      return res.json({ count, results });
    }
  } catch (error) {
    console.error('events get error', error);
    res.status(500).json({ error });
  }
});

app.all('/events', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.get('/events/:eventId', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];

    const id = parseInt(req.params.eventId);
    if (isNaN(id)) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = await prisma.event.findUnique({
      where: { id },
      include: { guests: true, organizers: true },
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const organizers = event.organizers.map((o) => {
      return { id: o.id, utorid: o.utorid, name: o.name };
    });
    const guests = event.guests.map((g) => {
      return { id: g.id, utorid: g.utorid, name: g.name };
    });
    if (
      clearance.includes(req.user.role) ||
      event.organizers.filter((o) => o.id === req.user.id).length > 0
    ) {
      return res.json({
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        capacity: event.capacity,
        pointsRemain: event.pointsRemain,
        pointsAwarded: event.pointsAwarded,
        published: event.published,
        organizers,
        guests,
      });
    } else {
      return res.json({
        id: event.id,
        name: event.name,
        description: event.description,
        location: event.location,
        startTime: event.startTime,
        endTime: event.endTime,
        capacity: event.capacity,
        organizers,
        numGuests: event.guests.length,
      });
    }
  } catch (error) {
    console.error('eventid get error:', error);
    res.status(500).json({ error });
  }
});

app.patch('/events/:eventId', jwtAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.eventId);
    if (isNaN(id)) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = await prisma.event.findUnique({
      where: { id },
      include: { guests: true, organizers: true },
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const clearance = ['manager', 'superuser'];
    if (
      !clearance.includes(req.user.role) &&
      event.organizers.filter((o) => o.id === req.user.id).length === 0
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body cannot be empty' });
    }
    const {
      name,
      description,
      location,
      startTime,
      endTime,
      capacity,
      points,
      published,
      ...rest
    } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }
    const data = {};
    const select = { id: true, name: true, location: true };
    if (name !== undefined && name !== null) {
      if (typeof name !== 'string' || !name) {
        return res
          .status(400)
          .json({ error: 'name must be a non-empty string' });
      }
      data.name = name;
    }
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string' || !description) {
        return res
          .status(400)
          .json({ error: 'description must be a non-empty string' });
      }
      data.description = description;
      select.description = true;
    }

    const now = new Date();
    const oldEnd = new Date(event.endTime);
    let start = undefined;
    let end = undefined;
    if (startTime !== undefined && startTime !== null) {
      if (typeof startTime !== 'string' || !startTime) {
        return res
          .status(400)
          .json({ error: 'startTime must be a non-empty string' });
      }
      start = new Date(startTime);
      if (isNaN(start.getTime()) || start < now) {
        return res.status(400).json({ error: 'Invalid startTime' });
      }
      data.startTime = startTime;
      select.startTime = true;
    }
    if (endTime !== undefined && endTime !== null) {
      if (typeof endTime !== 'string' || !endTime) {
        return res
          .status(400)
          .json({ error: 'endTime must be a non-empty string' });
      }
      end = new Date(endTime);
      if (isNaN(end.getTime()) || end < now ) {
        return res.status(400).json({ error: 'Invalid endTime' });
      }
      if (now >= oldEnd) {
        return res.status(400).json({ error: 'Cannot change after event has ended' });
      }
      data.endTime = endTime;
      select.endTime = true;
    }
    if (points !== undefined && points !== null) {
      if (req.user.role !== 'manager') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (!Number.isInteger(points) || points <= 0) {
        return res
          .status(400)
          .json({ error: 'points must be a positive integer' });
      }
      if (points < event.pointsAwarded) {
        return res.status(400).json({ error: 'Not enough points' });
      }
      data.pointsRemain = points - event.pointsAwarded;
      select.pointsRemain = true;
    }

    if (location !== undefined && location !== null) {
      if (typeof location !== 'string' || !location) {
        return res
          .status(400)
          .json({ error: 'location must be a non-empty string' });
      }
      data.location = location;
    }
    const numGuests = event.guests.length;
    if (capacity !== undefined && capacity !== null) {
      if (!Number.isInteger(capacity) || capacity <= 0) {
        return res
          .status(400)
          .json({ error: 'capacity must be a positive integer' });
      }
      if (capacity < numGuests) {
        return res
          .status(400)
          .json({ error: 'capacity cannot be less than guests' });
      }
      data.capacity = capacity;
      if (capacity === numGuests) {
        data.full = true;
      }
      select.capacity = true;
    }

    if (published !== undefined && published !== null) {
      if (req.user.role !== 'manager') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (published !== true) {
        return res.status(400).json({ error: 'published must be true' });
      }
      data.published = published;
      select.published = true;
    }
    const oldStart = new Date(event.startTime);
    if (
      (name || description || location || startTime || capacity) &&
      now >= oldStart
    ) {
      return res.status(400).json({ error: 'Cannot change after event has started' });
    }
    if (start && end && start >= end) {
      return res.status(400).json({ error: 'Invalid startTime, endTime' });
    }
    if (start && !end && start >= oldEnd) {
      return res.status(400).json({ error: 'Invalid startTime' });
    }

    if (!start && end && oldStart >= end) {
      return res.status(400).json({ error: 'Invalid endTime' });
    }
    const updated = await prisma.event.update({
      where: { id },
      data,
      select,
    });
    res.json(updated);
  } catch (error) {
    console.error('eventid patch error:', error);
    res.status(500).json({ error });
  }
});

app.delete('/events/:eventId', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const id = parseInt(req.params.eventId);
    if (isNaN(id)) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = await prisma.event.findUnique({
      where: { id },
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.published) {
      return res
        .status(400)
        .json({ error: 'Event has already been published' });
    }
    await prisma.event.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('eventid delete error:', error);
    res.status(500).json({ error });
  }
});

app.all('/events/:eventId', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.post('/events/:eventId/organizers', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { utorid, ...rest } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }
    if (typeof utorid !== 'string' || !utorid) {
      return res.status(400).json({ error: 'utorid must be string' });
    }
    const user = await prisma.user.findUnique({ where: { utorid } });
    if (!user) {
      return res.status(404).json({ error: 'Invalid utorid' });
    }
    const id = parseInt(req.params.eventId);
    if (isNaN(id)) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = await prisma.event.findUnique({
      where: { id },
      include: { guests: true },
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.guests.some((guest) => guest.id === user.id)) {
      return res.status(400).json({
        error:
          'user is registered as a guest to the event (remove user as guest first, then retry)',
      });
    }
    const now = new Date();
    const end = new Date(event.endTime);
    if (now >= end) {
      return res.status(410).json({ error: 'Gone' });
    }

    const updated = await prisma.event.update({
      where: { id: id },
      data: { organizers: { connect: { id: user.id } } },
      include: { organizers: true },
    });
    const organizers = updated.organizers.map((o) => {
      return { id: o.id, utorid: o.utorid, name: o.name };
    });
    return res.status(201).json({
      id: updated.id,
      name: updated.name,
      location: updated.location,
      organizers,
    });
  } catch (error) {
    console.error('eventid organizer error:', error);
    res.status(500).json({ error });
  }
});

app.all('/events/:eventId/organizers', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.delete('/events/:eventId/organizers/:userId', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { organizers: true },
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!event.organizers.some((org) => org.id === userId)) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.event.update({
      where: {
        id: eventId,
      },
      data: {
        organizers: {
          disconnect: {
            id: userId,
          },
        },
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('eventid delete error:', error);
    res.status(500).json({ error });
  }
});

app.all('/events/:eventId/organizers/:userId', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.post('/events/:eventId/guests/me', jwtAuth, async (req, res) => {
  try {
    if (req.user.role !== 'regular') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const id = parseInt(req.params.eventId);
    if (isNaN(id)) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = await prisma.event.findUnique({
      where: { id },
      include: { organizers: true, guests: true },
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.organizers.some((o) => o.id === req.user.id)) {
      return res
        .status(400)
        .json({ error: 'user is registered as an organizer' });
    }
    if (event.guests.some((g) => g.id === req.user.id)) {
      return res.status(400).json({ error: 'user is already guest' });
    }
    const now = new Date();
    const end = new Date(event.endTime);
    if (now >= end || event.full) {
      return res.status(410).json({ error: 'Gone' });
    }
    const data = { guests: { connect: { id: req.user.id } } };
    if (event.guests.length + 1 === event.capacity) {
      data.full = true;
    }
    const updated = await prisma.event.update({
      where: { id: id },
      data,
      include: { guests: true },
    });
    const guestAdded = {
      id: req.user.id,
      utorid: req.user.utorid,
      name: req.user.name,
    };
    const numGuests = updated.guests.length;
    return res.status(201).json({
      id: updated.id,
      name: updated.name,
      location: updated.location,
      guestAdded,
      numGuests,
    });
  } catch (error) {
    console.error('eventid organizer error:', error);
    res.status(500).json({ error });
  }
});

app.delete('/events/:eventId/guests/me', jwtAuth, async (req, res) => {
  try {
    if (req.user.role !== 'regular') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { guests: true },
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.guests.some((g) => g.id === req.user.id)) {
      return res.status(404).json({ error: 'User not found' });
    }
    const now = new Date();
    const end = new Date(event.endTime);
    if (now >= end) {
      return res.status(410).json({ error: 'Gone' });
    }

    await prisma.event.update({
      where: {
        id: eventId,
      },
      data: {
        guests: {
          disconnect: {
            id: req.user.id,
          },
        },
        full: false,
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('eventid delete error:', error);
    res.status(500).json({ error });
  }
});

app.all('/events/:eventId/guests/me', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.post('/events/:eventId/guests', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];

    const { utorid, ...rest } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }
    if (typeof utorid !== 'string' || !utorid) {
      return res.status(400).json({ error: 'utorid must be string' });
    }
    const user = await prisma.user.findUnique({ where: { utorid } });
    if (!user) {
      return res.status(404).json({ error: 'Invalid utorid' });
    }
    const id = parseInt(req.params.eventId);
    if (isNaN(id)) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = await prisma.event.findUnique({
      where: { id },
      include: { organizers: true, guests: true },
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (
      !clearance.includes(req.user.role) &&
      !event.organizers.some((o) => o.id === req.user.id)
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (event.organizers.some((org) => org.id === user.id)) {
      return res
        .status(400)
        .json({ error: 'user is registered as an organizer' });
    }
    if (!event.published && !clearance.includes(req.user.role)) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const now = new Date();
    const end = new Date(event.endTime);
    if (now >= end || event.full) {
      return res.status(410).json({ error: 'Gone' });
    }
    const data = { guests: { connect: { id: user.id } } };
    if (event.guests.length + 1 === event.capacity) {
      data.full = true;
    }
    const updated = await prisma.event.update({
      where: { id: id },
      data,
      include: { guests: true },
    });
    const guestAdded = { id: user.id, utorid: user.utorid, name: user.name };
    const numGuests = updated.guests.length;
    return res.status(201).json({
      id: updated.id,
      name: updated.name,
      location: updated.location,
      guestAdded,
      numGuests,
    });
  } catch (error) {
    console.error('eventid organizer error:', error);
    res.status(500).json({ error });
  }
});

app.all('/events/:eventId/guests/', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.delete('/events/:eventId/guests/:userId', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];

    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { organizers: true, guests: true },
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (
      !clearance.includes(req.user.role) ||
      event.organizers.some((o) => o.id === req.user.id)
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!event.guests.some((g) => g.id === userId)) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.event.update({
      where: {
        id: eventId,
      },
      data: {
        guests: {
          disconnect: {
            id: userId,
          },
        },
        full: false,
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('eventid delete error:', error);
    res.status(500).json({ error });
  }
});

app.all('/events/:eventId/guests/:userId', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.post('/events/:eventId/transactions', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { type, utorid, amount, ...rest } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }
    if (type !== 'event') {
      return res.status(400).json({ error: 'type must be event' });
    }
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'amount must be provided' });
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ error: 'amount must be a positive integer' });
    }
    let user = undefined;
    if (utorid !== undefined && utorid !== null) {
      if (typeof utorid !== 'string' || !utorid) {
        return res.status(400).json({ error: 'utorid must be string' });
      }
      user = await prisma.user.findUnique({ where: { utorid } });
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }
    }

    const id = parseInt(req.params.eventId);
    if (isNaN(id)) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = await prisma.event.findUnique({
      where: { id },
      include: { guests: true },
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (user && !event.guests.some((g) => g.id === user.id)) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user) {
      if (amount > event.pointsRemain) {
        return res.status(400).json({ error: 'not enough points' });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { points: { increment: amount } },
      });
      await prisma.event.update({
        where: { id },
        data: {
          pointsRemain: { decrement: amount },
          pointsAwarded: { increment: amount },
        },
      });
      const transaction = await prisma.transaction.create({
        data: {
          utorid: user.utorid,
          amount: amount,
          type,
          relatedId: event.id,
          createdBy: req.user.utorid,
        },
      });
      return res.status(201).json({
        id: transaction.id,
        recipient: user.utorid,
        awarded: amount,
        type,
        relatedId: event.id,
        remark: event.description,
        createdBy: transaction.createdBy,
      });
    } else {
      const total = amount * event.guests.length;
      if (total > event.pointsRemain) {
        return res.status(400).json({ error: 'not enough points' });
      }
      const userIds = event.guests.map((g) => g.id);
      await prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { points: { increment: amount } },
      });
      await prisma.event.update({
        where: { id },
        data: {
          pointsRemain: { decrement: total },
          pointsAwarded: { increment: total },
        },
      });
      const dataArray = event.guests.map((g) => {
        return {
          utorid: g.utorid,
          amount: amount,
          type,
          relatedId: event.id,
          createdBy: req.user.utorid,
        };
      });
      let t = undefined;
      const results = [];
      for (const data of dataArray) {
        t = await prisma.transaction.create({
          data,
        });
        results.push({
          id: t.id,
          recipient: t.utorid,
          awarded: amount,
          type,
          relatedId: event.id,
          remark: event.description,
          createdBy: t.createdBy,
        });
      }
      return res.status(201).json(results);
    }
  } catch (error) {
    console.error('event transaction error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.all('/events/:eventId/transactions', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.post('/promotions', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const {
      name,
      description,
      type,
      startTime,
      endTime,
      minSpending,
      rate,
      points,
      ...rest
    } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }
    if (name === undefined || name === null) {
      return res.status(400).json({ error: 'name must be given' });
    }
    if (description === undefined || description === null) {
      return res.status(400).json({ error: 'description must be given' });
    }
    if (type === undefined || type === null) {
      return res.status(400).json({ error: 'type must be given' });
    }
    if (startTime === undefined || startTime === null) {
      return res.status(400).json({ error: 'startTime must be given' });
    }
    if (endTime === undefined || endTime === null) {
      return res.status(400).json({ error: 'endTime must be given' });
    }

    if (typeof name !== 'string' || !name) {
      return res.status(400).json({ error: 'name must be a non-empty string' });
    }
    if (typeof description !== 'string' || !description) {
      return res
        .status(400)
        .json({ error: 'description must be a non-empty string' });
    }
    if (type !== 'automatic' && type !== 'one-time') {
      return res.status(400).json({ error: 'Invalid type' });
    }
    if (typeof startTime !== 'string' || !startTime) {
      return res
        .status(400)
        .json({ error: 'startTime must be a non-empty string' });
    }
    if (typeof endTime !== 'string' || !endTime) {
      return res
        .status(400)
        .json({ error: 'endTime must be a non-empty string' });
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();
    if (
      isNaN(start.getTime()) ||
      isNaN(end.getTime()) ||
      end <= start ||
      start < now
    ) {
      return res.status(400).json({ error: 'Invalid startTime, endTime' });
    }
    const data = { name, description, type, startTime: start, endTime: end };
    if (points !== undefined && points !== null) {
      if (!Number.isInteger(points) || points < 0) {
        return res
          .status(400)
          .json({ error: 'points must be a positive integer' });
      }
      data.points = points;
    }
    if (minSpending !== undefined && minSpending !== null) {
      if (
        typeof minSpending !== 'number' ||
        isNaN(minSpending) ||
        minSpending < 0
      ) {
        return res
          .status(400)
          .json({ error: 'minSpending must be a positive numeric value' });
      }
      data.minSpending = minSpending;
    }
    if (rate !== undefined && rate !== null) {
      if (typeof rate !== 'number' || isNaN(rate) || rate < 0) {
        return res
          .status(400)
          .json({ error: 'rate must be a positive numeric value' });
      }
      data.rate = rate;
    }

    const promotion = await prisma.promotion.create({
      data,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        startTime: true,
        endTime: true,
        minSpending: true,
        rate: true,
        points: true,
      },
    });
    res.status(201).json(promotion);
  } catch (error) {
    console.error('promotions post error:', error);
    res.status(500).json({ error });
  }
});

app.get('/promotions', jwtAuth, async (req, res) => {
  try {
    let { name, type, started, ended, page, limit } = req.query;
    const where = {
      name: name || undefined,
      type: type || undefined,
    };
    const clearance = ['manager', 'superuser'];
    if (started || ended) {
      if (!clearance.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    if (started && ended) {
      return res.status(400).json({ error: 'Bad Request' });
    }
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: 'Page and limit must be positive integers.' });
    }
    const skip = (page - 1) * limit;
    const now = new Date();
    if (started === 'true' || !clearance.includes(req.user.role)) {
      where.startTime = { lte: now };
    }
    if (started === 'false') {
      where.startTime = { gt: now };
    }
    if (ended === 'true') {
      where.endTime = { lte: now };
    }
    if (ended === 'false' || !clearance.includes(req.user.role)) {
      where.endTime = { gt: now };
    }

    const promotions = await prisma.promotion.findMany({
      where,
      skip,
      take: limit,
    });
    const count = await prisma.promotion.count({ where });
    if (!clearance.includes(req.user.role)) {
      const results = promotions.map((p) => {
        return {
          id: p.id,
          name: p.name,
          type: p.type,
          endTime: p.endTime,
          minSpending: p.minSpending,
          rate: p.rate,
          points: p.points,
        };
      });
      return res.json({ count, results });
    } else {
      const results = promotions.map((p) => {
        return {
          id: p.id,
          name: p.name,
          type: p.type,
          startTime: p.startTime,
          endTime: p.endTime,
          minSpending: p.minSpending,
          rate: p.rate,
          points: p.points,
        };
      });
      return res.json({ count, results });
    }
  } catch (error) {
    console.error('promotions get error', error);
    res.status(500).json({ error });
  }
});

app.all('/promotions', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.get('/promotions/:promotionId', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];
    const id = parseInt(req.params.promotionId);
    if (isNaN(id)) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    const promotion = await prisma.promotion.findUnique({
      where: { id },
    });
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    const now = new Date();
    const start = new Date(promotion.startTime);
    const end = new Date(promotion.endTime);
    if (!clearance.includes(req.user.role) && (now < start || now >= end)) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    const p = promotion;
    if (!clearance.includes(req.user.role)) {
      return res.json({
        id: p.id,
        name: p.name,
        description: p.description,
        type: p.type,
        endTime: p.endTime,
        minSpending: p.minSpending,
        rate: p.rate,
        points: p.points,
      });
    } else {
      return res.json({
        id: p.id,
        name: p.name,
        description: p.description,
        type: p.type,
        startTime: p.startTime,
        endTime: p.endTime,
        minSpending: p.minSpending,
        rate: p.rate,
        points: p.points,
      });
    }
  } catch (error) {
    console.error('promotionid get error:', error);
    res.status(500).json({ error });
  }
});

app.patch('/promotions/:promotionId', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const id = parseInt(req.params.promotionId);
    if (isNaN(id)) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    const promotion = await prisma.promotion.findUnique({
      where: { id },
    });
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body cannot be empty' });
    }
    const {
      name,
      description,
      type,
      startTime,
      endTime,
      minSpending,
      rate,
      points,
      ...rest
    } = req.body;
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .json({ error: `Unexpected fields: ${Object.keys(rest).join(', ')}` });
    }
    const data = {};
    const select = { id: true, name: true, type: true };
    if (name !== undefined && name !== null) {
      if (typeof name !== 'string' || !name) {
        return res
          .status(400)
          .json({ error: 'name must be a non-empty string' });
      }
      data.name = name;
    }
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string' || !description) {
        return res
          .status(400)
          .json({ error: 'description must be a non-empty string' });
      }
      data.description = description;
      select.description = true;
    }

    const now = new Date();
    const oldEnd = new Date(promotion.endTime);
    let start = undefined;
    let end = undefined;
    if (startTime !== undefined && startTime !== null) {
      if (typeof startTime !== 'string' || !startTime) {
        return res
          .status(400)
          .json({ error: 'startTime must be a non-empty string' });
      }
      start = new Date(startTime);
      if (isNaN(start.getTime()) || start < now) {
        return res.status(400).json({ error: 'Invalid startTime' });
      }
      data.startTime = startTime;
      select.startTime = true;
    }
    if (endTime !== undefined && endTime !== null) {
      if (typeof endTime !== 'string' || !endTime) {
        return res
          .status(400)
          .json({ error: 'endTime must be a non-empty string' });
      }
      end = new Date(endTime);
      if (isNaN(end.getTime()) || end < now) {
        return res.status(400).json({ error: 'Invalid endTime' });
      }
      if (now >= oldEnd) {
        return res.status(400).json({ error: 'Cannot change after promotion has ended' });
      }
      data.endTime = endTime;
      select.endTime = true;
    }
    if (points !== undefined && points !== null) {
      if (req.user.role !== 'manager') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (!Number.isInteger(points) || points < 0) {
        return res
          .status(400)
          .json({ error: 'points must be a positive integer' });
      }
      data.points = points;
      select.points = true;
    }
    if (minSpending !== undefined && minSpending !== null) {
      if (
        typeof minSpending !== 'number' ||
        isNaN(minSpending) ||
        minSpending < 0
      ) {
        return res
          .status(400)
          .json({ error: 'minSpending must be a positive numeric value' });
      }
      data.minSpending = minSpending;
      select.minSpending = true;
    }
    if (rate !== undefined && rate !== null) {
      if (typeof rate !== 'number' || isNaN(rate) || rate < 0) {
        return res
          .status(400)
          .json({ error: 'rate must be a positive numeric value' });
      }
      data.rate = rate;
      select.rate = true;
    }

    if (type !== undefined && type !== null) {
      if (type !== 'automatic' && type !== 'one-time') {
        return res.status(400).json({ error: 'Invalid type' });
      }
      data.type = type;
    }

    const oldStart = new Date(promotion.startTime);
    if (
      (name ||
        description ||
        type ||
        startTime ||
        minSpending ||
        rate ||
        points) &&
      now >= oldStart
    ) {
      return res.status(400).json({ error: "Cannot change after promotion has started" });
    }
    if (start && end && start >= end) {
      return res.status(400).json({ error: 'Invalid startTime, endTime' });
    }
    if (start && !end && start >= oldEnd) {
      return res.status(400).json({ error: 'Invalid startTime' });
    }

    if (!start && end && oldStart >= end) {
      return res.status(400).json({ error: 'Invalid endTime' });
    }
    const updated = await prisma.promotion.update({
      where: { id },
      data,
      select,
    });
    res.json(updated);
  } catch (error) {
    console.error('promotionid patch error:', error);
    res.status(500).json({ error });
  }
});

app.delete('/promotions/:promotionId', jwtAuth, async (req, res) => {
  try {
    const clearance = ['manager', 'superuser'];
    if (!clearance.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const id = parseInt(req.params.promotionId);
    if (isNaN(id)) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    const promotion = await prisma.promotion.findUnique({
      where: { id },
    });
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }
    const now = new Date();
    const start = new Date(promotion.startTime);
    if (now >= start) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await prisma.promotion.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('eventid delete error:', error);
    res.status(500).json({ error });
  }
});

app.all('/promotions/:promotionId', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
  console.error(`cannot start server: ${err.message}`);
  process.exit(1);
});
