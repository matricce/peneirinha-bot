import { Bot, InlineKeyboard } from 'grammy';

export { Peneirinha };

const strIncludes = (str: string, list: string[]) =>
  list.some(item => str.match(new RegExp(`\\b${item}\\b`, 'i')));
const whitelistWords = process.env.WHITELIST?.split(',').map(word => word.trim()) || [];
const blacklistWords = process.env.BLACKLIST?.split(',').map(word => word.trim()) || [];

//deletar quando separar os bots
const prefix_v2 = 'v2_';
const menuMain_v2 = new InlineKeyboard()
  .text('👩‍💻Postar Vaga', prefix_v2 + 'menu-job-ask')
  .text('📰Postar Conteúdo', prefix_v2 + 'menu-content-ask')
  .row()
  .text('🗑️|♻️|👎Descartar', prefix_v2 + 'menu-discard-ask');
///////////////////////////////

const Peneirinha = async (bot: Bot, ctx: any, deliveryChatId: string) => {
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
    // await bot.api.copyMessage(deliveryChatId!, postChatId, postId); //copia as mensagens para o delivery
    await bot.api.copyMessage(deliveryChatId!, postChatId, postId, { reply_markup: menuMain_v2 }); //copia as mensagens para o delivery
    appendText([spacer, '#aprovado'].join(' '));
  } else {
    appendText([spacer, '#reprovado', '#ignorado'].join(' '));
  }
};
