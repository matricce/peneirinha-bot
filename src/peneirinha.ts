import { Bot } from 'grammy';
import { string2array } from './helper';
import { sqliteDatabase } from './sqlite';

export { Peneirinha };

const database = sqliteDatabase();
const strIncludes = (str: string, list: string[]) =>
  list.some(item => str.match(new RegExp(`\\b${item}\\b`, 'i')));

const Peneirinha = async (bot: Bot, ctx: any) => {
  const whitelistWords = string2array(await database?.get('allowed'), ',');
  const blacklistWords = string2array(await database?.get('blocked'), ',');
  const postChatId: number = ctx.update?.channel_post?.chat?.id;
  const postText = ctx.update?.channel_post?.text;
  const postCaption = ctx.update?.channel_post?.caption;
  const postId = ctx.update?.channel_post?.message_id;
  const entities = ctx.update?.channel_post?.entities;
  const caption_entities = ctx.update?.channel_post?.caption_entities;
  const reply_markup = ctx.update?.channel_post?.reply_markup;
  const spacer = '\n------\n';

  if (!postText && !postCaption) {
    return;
  }

  const text: string = postText || postCaption || '';

  const editMessage = async (str: string, messageId: number) => {
    if (postText) {
      bot.api.editMessageText(postChatId, messageId, str, {
        disable_web_page_preview: true,
        entities,
      });
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
    appendText([spacer, '#aprovado'].join(' '));
  } else {
    appendText([spacer, '#reprovado', '#ignorado'].join(' '));
  }
};
