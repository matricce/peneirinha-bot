import { Bot, InlineKeyboard } from 'grammy';

export { Delivery };

const prefix_v2 = 'v2_';

const menuMain_v2 = new InlineKeyboard()
  .text('👩‍💻Postar Vaga', prefix_v2 + 'menu-job-ask')
  .text('📰Postar Conteúdo', prefix_v2 + 'menu-content-ask')
  .row()
  .text('🗑️|♻️|👎Descartar', prefix_v2 + 'menu-discard-ask');
const menuContent_v2 = new InlineKeyboard()
  .text('📰Conteúdo Postado', prefix_v2 + 'option-ok')
  .url('☕️Canal', 'http://telegram.me/CafeinaVagas')
  .row()
  .text('⬅️Voltar', prefix_v2 + 'menu-home');
const menuJob_v2 = new InlineKeyboard()
  .text('👩‍💻Vaga Postada', prefix_v2 + 'option-ok')
  .url('🤖Formatador', 'http://telegram.me/CafeinaVagasAdmBot')
  .url('☕️Canal', 'http://telegram.me/CafeinaVagas')
  .row()
  .text('⬅️Voltar', prefix_v2 + 'menu-home');

const menuDiscard_v2 = new InlineKeyboard()
  .text('🗑️Descartado', prefix_v2 + 'option-discard')
  .text('♻️Repetido', prefix_v2 + 'option-repeat')
  .text('👎NOK', prefix_v2 + 'option-nok')
  .row()
  .text('⬅️Voltar', prefix_v2 + 'menu-home');

const backButton_v2 = [
  {
    text: '⬅️Voltar',
    callback_data: prefix_v2 + 'menu-home',
  },
];

const deleteButton_v2 = [
  {
    text: '0x ⚠️Deletar',
    callback_data: prefix_v2 + 'option-delete-post',
  },
];

const objectOption = {
  swap: true,
  disable_preview: true,
  format: null,
  delete: false,
  action: null,
};

const Delivery = async (bot: Bot, ctx: any) => {
  {
    const postChatId: number = ctx.update?.channel_post?.chat?.id;
    const postId = ctx.update?.channel_post?.message_id;
    bot.api
      .editMessageReplyMarkup(postChatId, postId, { reply_markup: menuMain_v2 })
      .catch(err => console.error(err));
  }
};

export async function deliveryEvents(bot: Bot) {
  bot.callbackQuery(prefix_v2 + 'menu-home', async ctx => {
    const postChatId = ctx.update?.callback_query?.message?.chat?.id;
    const postId = ctx.update?.callback_query?.message?.message_id;
    if (postChatId && postId)
      bot.api
        .editMessageReplyMarkup(postChatId, postId, { reply_markup: menuMain_v2 })
        .catch(console.error);
    await ctx.answerCallbackQuery().catch(() => '');
  });
  bot.on('callback_query:data', async ctx => {
    const postChatId = ctx.update?.callback_query?.message?.chat?.id;
    const postId = ctx.update?.callback_query?.message?.message_id;
    const data: any = ctx.update?.callback_query?.data;
    const from: any = ctx.update?.callback_query?.from;

    interface ConfirmTypes {
      [key: string]: Function;
    }

    const confirmTypes: ConfirmTypes = {
      [prefix_v2 + 'menu-content-ask']: () => ({ gotoMenu: menuContent_v2 }),
      [prefix_v2 + 'menu-job-ask']: () => ({ gotoMenu: menuJob_v2 }),
      [prefix_v2 + 'menu-discard-ask']: () => ({ gotoMenu: menuDiscard_v2 }),
      [prefix_v2 + 'menu-home']: () => ({ gotoMenu: menuMain_v2 }),
      [prefix_v2 + 'option-ok']: () => ({ ...objectOption, format: 'strikethrough' }),
      [prefix_v2 + 'option-nok']: () => ({
        ...objectOption,
        format: 'strikethrough',
      }),
      [prefix_v2 + 'option-discard']: () => ({
        ...objectOption,
        format: 'strikethrough',
        delete: true,
      }),
      [prefix_v2 + 'option-repeat']: () => ({
        ...objectOption,
        format: 'strikethrough',
      }),
      [prefix_v2 + 'option-delete-post']: () => ({
        ...objectOption,
        swap: false,
        action: 'delete-post',
        format: 'strikethrough',
      }),
    };

    if (typeof confirmTypes[data] !== 'function') {
      await ctx.answerCallbackQuery().catch(() => '');
      return;
    }

    if (data.includes(prefix_v2)) {
      const setup = confirmTypes[data]();
      if (postChatId && postId) {
        if (data.includes(prefix_v2 + 'option-')) {
          const inlineKeyboard: any =
            ctx.update?.callback_query?.message?.reply_markup?.inline_keyboard;
          if (setup.action !== 'delete-post') {
            inlineKeyboard?.map((el: any) =>
              el?.map((e: any) => {
                if (e.callback_data === data) {
                  if (e.text.includes('✅')) {
                    e.text = e.text.replace('✅', '');
                  } else {
                    e.text = '✅' + e.text;
                  }
                  if (el.flat().some((e_: any) => e_.text.includes('✅'))) {
                    inlineKeyboard[1] =
                      e.text.includes('✅🗑️Descartado') && setup.delete ? deleteButton_v2 : [];
                  } else {
                    inlineKeyboard[1] = backButton_v2;
                  }
                }
              }),
            );
          }
          if (setup.action === 'delete-post') {
            const button = inlineKeyboard[1][0];
            if (button.callback_data === data) {
              let votes = Number(button.text.split('x')[0]);
              if (button.text.includes(from?.first_name)) {
                button.text = button.text.replace(` [${from?.first_name}]`, '');
                votes--;
                button.text = votes + 'x' + button.text.split('x').splice(1);
              } else {
                button.text = `${button.text} [${from?.first_name}]`;
                votes++;
                button.text = votes + 'x' + button.text.split('x').splice(1);
                if (votes === 2) {
                  await bot.api.deleteMessage(postChatId, postId).catch(console.error);
                }
              }
            }
            inlineKeyboard[1][0] = button;
            await ctx.answerCallbackQuery().catch(() => '');
          }
          setup.gotoMenu = new InlineKeyboard(inlineKeyboard);
        }
        const textLength =
          (
            ctx.update?.callback_query?.message?.text ||
            ctx.update?.callback_query?.message?.caption
          )?.length || 0;
        const entities = [
          ...(ctx.update?.callback_query?.message?.entities ||
            ctx.update?.callback_query?.message?.caption_entities ||
            []),
          setup.format && {
            type: setup.format,
            offset: 0,
            length: textLength,
          },
        ]
          .flat()
          .filter(e => !(!setup.format && e?.type === 'strikethrough'))
          .filter(Boolean);
        if (ctx.update?.callback_query?.message?.text) {
          await bot.api
            .editMessageText(postChatId, postId, ctx.update?.callback_query?.message?.text, {
              disable_web_page_preview: setup.disable_preview,
              entities,
              reply_markup: setup.gotoMenu,
            })
            .catch(console.error);
        } else if (ctx.update?.callback_query?.message?.caption) {
          await bot.api
            .editMessageCaption(postChatId, postId, {
              caption: ctx.update?.callback_query?.message?.caption,
              caption_entities: entities,
              reply_markup: setup.gotoMenu,
            })
            .catch(console.error);
        } else if (setup.gotoMenu) {
          await bot.api
            .editMessageReplyMarkup(postChatId, postId, { reply_markup: setup.gotoMenu })
            .catch(console.error);
        }
        await ctx.answerCallbackQuery().catch(() => '');
      }
      return;
    }
    await ctx.answerCallbackQuery().catch(() => '');
  });
}
