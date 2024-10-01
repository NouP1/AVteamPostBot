const countryCodes = require('../data/country');

const getCountryCode = (country) => {
    return countryCodes[country] || 'Unknown';
};
module.exports = getCountryCode;