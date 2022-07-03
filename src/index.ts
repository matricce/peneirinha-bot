import { Bot, Context } from 'grammy';
import 'dotenv/config';
import { apiThrottler } from '@grammyjs/transformer-throttler';

const botToken = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

if (!botToken) {
  throw Error('Token do bot não encontrado nas variáveis de ambiente');
}
if (!chatId) {
  throw Error('É necessário informar o chatId (para onde serão encaminhadas as mensagens');
}

const bot = new Bot(botToken);

const throttler = apiThrottler();
bot.api.config.use(throttler);

const whitelistWords = process.env.WHITELIST?.split(',').map(word => word.trim()) || [];
const blacklistWords = process.env.BLACKLIST?.split(',').map(word => word.trim()) || [];

const strIncludes = (str: string, list: string[]) =>
  list.some(item => str.match(new RegExp(`\\b${item}\\b`, 'i')));

const isSameChannel = (ctx: Context) => ctx?.update?.channel_post?.chat?.id === Number(chatId);

bot.on('channel_post').on('msg::url', async ctx => {
  const postChatId = ctx.update?.channel_post?.chat?.id;
  const postText = ctx.update?.channel_post?.text;
  const postCaption = ctx.update?.channel_post?.caption;
  const postId = ctx.update?.channel_post?.message_id;
  const entities = ctx.update?.channel_post?.entities;
  const caption_entities = ctx.update?.channel_post?.caption_entities;
  const reply_markup = ctx.update?.channel_post?.reply_markup;
  const spacer = '\n------\n';

  if ((!postText && !postCaption) || isSameChannel(ctx)) {
    return;
  }

  const text: string = postText || postCaption || '';

  const editMessage = async (str: string, messageId: number) => {
    if (postText) {
      bot.api.editMessageText(postChatId, messageId, str, { entities });
    } else if (postCaption) {
      bot.api.editMessageCaption(postChatId, messageId, { caption: str, caption_entities });
    }
  };

  const appendText = async (str: string) => {
    if (str) {
      if (reply_markup) {
        bot.api
          .copyMessage(postChatId, postChatId, postId, {
            caption_entities: entities || caption_entities,
          })
          .then(({ message_id }) => editMessage(`${postText || postCaption}${str}`, message_id))
          .then(() => ctx.api.deleteMessage(postChatId, postId))
          .catch(err => console.error(err));
      } else {
        editMessage(`${postText || postCaption}${str}`, postId);
      }
    }
  };

  if (strIncludes(text, blacklistWords)) {
    appendText([spacer, '#blacklist', '#ignorado'].join(' '));
  } else if (strIncludes(text, whitelistWords)) {
    await bot.api.copyMessage(chatId, postChatId, postId);
    appendText([spacer, '#aprovado'].join(' '));
  } else {
    appendText([spacer, '#reprovado', '#ignorado'].join(' '));
  }
});

bot.start();
