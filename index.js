const TelegramApi = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const token = process.env.TOKEN;
const ApiKey = process.env.API_KEY;

const bot = new TelegramApi(token, { polling: true });

const channelIdAll = '-1002191506094'; // ID канала для всех полученных данных
const channelIdNew = '-1002196076246'; // ID канала для новых данных без компании и оффера

let lastProcessedConversionTime = null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const start = async () => {
    bot.setMyCommands([
        { command: '/start', description: "Запустить бота заново" },
    ]);

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;
        const username = msg.from.username;
        const firstname = msg.from.first_name;
        console.log(`Пользователь ${username}, ${firstname} отправил сообщение в бот: ${text}`);

        if (text === '/start') {
            await bot.sendMessage(chatId, 'Бот запущен и начнет опрашивать трекер на наличие новых конверсий.');
            monitorConversions();
        }
    });

    // Функция для отправки сообщений в Telegram канал
    async function sendMessageToChannel(channelId, message) {
        let success = false;
        while (!success) {
            try {
                await bot.sendMessage(channelId, message);
                console.log(`Сообщение отправлено в канал с ID ${channelId}`);
                success = true;
            } catch (error) {
                if (error.response && error.response.statusCode === 429) {
                    const retryAfter = error.response.parameters.retry_after;
                    console.error(`Ошибка "Too Many Requests". Повторная попытка через ${retryAfter} секунд.`);
                    await sleep(retryAfter * 1000);
                } else {
                    console.error(`Ошибка при отправке сообщения в канал с ID ${channelId}:`, error);
                    success = true; // Прекратить повторные попытки на других ошибках
                }
            }
        }
    }

    // Функция для получения новых конверсий и отправки сообщений в каналы
    async function monitorConversions() {
        try {
            const response = await axios.get('https://silktraff.com/public/api/v1/conversions?datePreset=all_time&timezone=UTC&sortType=asc&limit=100&direction=next', {
                headers: {
                    'api-key': ApiKey
                }
            });

            const conversions = response.data.rows;

            // Фильтрация только новых конверсий
            const newConversions = conversions.filter(conversion => {
                const conversionTime = new Date(conversion.conversed_at).getTime();
                return !lastProcessedConversionTime || conversionTime > lastProcessedConversionTime;
            });

            // Обработка каждой новой конверсии
            for (const conversion of newConversions) {
                // Формирование сообщений для отправки в каналы
                const messageAll = `Новая конверсия:\nID: ${conversion.id}\nДоход: ${conversion.payout}\nСтатус: ${conversion.status}\nГео: ${conversion.geo}\nВремя клика: ${conversion.clicked_at}\nВремя конверсии: ${conversion.conversed_at}\nВремя с момента клика: ${conversion.time_since_click}\nКампания: ${conversion.campaign}\nОффер: ${conversion.offer}\nИсточник трафика: ${conversion.traffic_source}`;

                const messageNew = `Новая конверсия:\nID: ${conversion.id}\nДоход: ${conversion.payout}\nСтатус: ${conversion.status}\nГео: ${conversion.geo}\nВремя клика: ${conversion.clicked_at}\nВремя конверсии: ${conversion.conversed_at}\nВремя с момента клика: ${conversion.time_since_click}`;

                // Отправка сообщений в каналы
                await sendMessageToChannel(channelIdAll, messageAll);
                await sendMessageToChannel(channelIdNew, messageNew);

                // Обновление времени последней обработанной конверсии
                lastProcessedConversionTime = new Date(conversion.conversed_at).getTime();
            }
        } catch (error) {
            if (error.response && error.response.statusCode === 429) {
                const retryAfter = error.response.data.parameters.retry_after;
                console.error(`Ошибка "Too Many Requests". Повторная попытка через ${retryAfter} секунд.`);
                await sleep(retryAfter * 1000);
            } else {
                console.error('Ошибка при получении данных конверсий:', error);
            }
        }
    }

    // Запуск мониторинга с интервалом, например, каждые 5 минут
    setInterval(async () => {
        await monitorConversions();
    }, 5 * 60 * 1000); // 5 минут
};

start();