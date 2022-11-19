import { Bot, Context, InlineKeyboard } from 'grammy';
import 'dotenv/config';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import { Delivery, deliveryEvents } from './delivery';
import { Peneirinha } from './peneirinha';

const botToken = process.env.BOT_TOKEN;
const peneirinhaChatIds = process.env.PENEIRINHA_CHAT_IDS?.split(',').map(id => id.trim()) || [];
const deliveryChatId = process.env.DELIVERY_CHAT_ID;

if (!botToken) {
  throw Error('Token do bot não encontrado nas variáveis de ambiente');
}
if (!peneirinhaChatIds.length || !deliveryChatId) {
  throw Error('É necessário informar o peneirinhaChatIds e deliveryChatId');
}

const bot = new Bot(botToken);

const throttler = apiThrottler();
bot.api.config.use(throttler);

const isSameChannel = (ctx: Context, _chatId?: string | string[]): Boolean =>
  [_chatId].flat().filter(Boolean).includes(ctx?.update?.channel_post?.chat?.id?.toString());

deliveryEvents(bot);

bot.on('channel_post').on('msg', async ctx => {
  const entities = ctx.update?.channel_post?.entities || ctx.update?.channel_post?.caption_entities;
  if (
    isSameChannel(ctx, peneirinhaChatIds) &&
    entities?.some(entity => ['url', 'text_link'].includes(entity.type))
  ) {
    Peneirinha(bot, ctx, deliveryChatId);
  } else if (isSameChannel(ctx, deliveryChatId)) {
    Delivery(bot, ctx);
  }
});

bot.start();
