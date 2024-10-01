const Queue = require('bull');
const processPostback = require('../services/postbackProcessor');

const postbackQueue = new Queue('postbackQueue', {
    redis: { host: '127.0.0.1', port: 6379 }
});

exports.addPostbackToQueue = async (postData) => {
    await postbackQueue.add(postData);
};

postbackQueue.process(async (job) => {
    await processPostback(job.data);
    return Promise.resolve();
});

postbackQueue.on('completed', () => {
    console.log('Задание завершено');
});

postbackQueue.on('failed', (err) => {
    console.error(`Задание завершилось ошибкой: ${err}`);
});