const mongoose = require('mongoose');

/**
 * Escapes special characters for safe use in RegExp to prevent ReDoS / Regex Injection.
 * @param {string} str - Input string
 * @returns {string} - Regex-safe escaped string
 */
const escapeRegex = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Validates whether a given string is a valid MongoDB ObjectId
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
    if (!id || typeof id !== 'string') return false;
    return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
};

module.exports = {
    escapeRegex,
    isValidObjectId,
};
