const dayjs = require('dayjs');
const BuyerModel = require('../models/Buyer')

exports.formatTimestamp = (timestamp) => {
    return dayjs.unix(timestamp).add(3, 'hour').format('YYYY-MM-DD HH:mm:ss');
};

exports.transformOfferName = (offerName) => {
    const parts = offerName.split('|');
    if (parts.length >= 5) {
        return parts.slice(2, -2).map(part => part.trim()).join(' ');
    }
    return offerName;
};

exports.formatedRatingMessage = async (postData, responsiblePerson) => {
    try {
        const [buyer, created] = await BuyerModel.findOrCreate({
            where: { nameBuyer: responsiblePerson },
            defaults: { nameBuyer: responsiblePerson, countRevenue: postData.payout, countFirstdeps: 1 }
        });

        if (!created) {
            buyer.countRevenue += postData.payout;
            buyer.countFirstdeps += 1;
            await buyer.save();
        }

        const buyers = await BuyerModel.findAll({
            order: [['countRevenue', 'DESC']]
        });

        const message = 'Buyers:\n' + buyers.map(b => `${b.nameBuyer} => $${b.countRevenue} / FD ${b.countFirstdeps}`).join('\n');
        return message
    } catch (error) {
        console.log("Ошибка в отправке сообщения с рейтингом \n" + error)
    }

};