import { createHash, createHmac } from 'crypto';
import express from 'express';
import { sqliteDatabase } from './sqlite';
import path from 'path';

export let updates: { author: number; username?: string; type: string; list: string }[] = [];

export const authorized = process.env.USERS?.split(',').map(Number).filter(Boolean) || [];

const isAuth = (id: number) => id && authorized.includes(id);

const database = sqliteDatabase();
export default function () {
  const app = express();
  app.use(express.json());

  app.use('/', express.static('public'));

  app.get('/login', (req, res) => {
    return res.sendFile(path.join(__dirname, '/../public/login.html'));
  });

  app.post('/login', (req: express.Request, res: express.Response) => {
    if (!checkSignature(req.body)) return res.sendStatus(401);
    if (!isAuth(req.body?.id)) return res.sendStatus(403);
    res.sendStatus(200);
  });

  app.post('/words', async (req: express.Request, res: express.Response) => {
    if (!checkSignature(req.body)) return res.sendStatus(401);
    if (!isAuth(req.body?.id)) return res.sendStatus(403);
    const queryType = req.query?.type as string;
    if (queryType && ['allowed', 'blocked'].includes(queryType)) {
      const words = await (await database)?.get(queryType);
      return res.send(words || '');
    }
    if (req.query?.allowed) {
      await (await database)?.insert('allowed', req.query?.allowed);
      updates.push({
        author: req.body?.id,
        username: req.body?.username,
        type: 'allowed',
        list: req.query?.allowed as string,
      });
      return res.sendStatus(200);
    }
    if (req.query?.blocked) {
      await (await database)?.insert('blocked', req.query?.blocked);
      updates.push({
        author: req.body?.id,
        username: req.body?.username,
        type: 'blocked',
        list: req.query?.blocked as string,
      });
      return res.sendStatus(200);
    }
  });

  app.listen(Number(process.env.SERVER_PORT), () => {
    console.log(`Server is running on port ${process.env.SERVER_PORT}`);
  });
}

function checkSignature({ hash, ...userData }: any): boolean {
  const secretKey = createHash('sha256').update(process.env.BOT_TOKEN!).digest();
  const dataCheckString = Object.keys(userData)
    .sort()
    .map(key => `${key}=${userData[key]}`)
    .join('\n');
  const hmac = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return hmac === hash;
}

export const removeItem = (obj: {
  author: number;
  username?: string;
  type: string;
  list: string;
}) => {
  updates = updates.filter(item => !(JSON.stringify(item) === JSON.stringify(obj)));
};
