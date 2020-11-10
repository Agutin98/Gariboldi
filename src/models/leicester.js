const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LeicestersSchema = new Schema({
    label: { type: String }, 
    startSeason: { type: Date },
    points: { type: Number }
});

module.exports = mongoose.model('leicesters', LeicestersSchema);