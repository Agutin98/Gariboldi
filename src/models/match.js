const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const matchSchema = new Schema({
    eventStatus: { type: String, default: 'Completed' },
    startDate: { type: Date },
    teams: [{ type: Object }],
    location: {
        name: { type: String },
        city: { type: String } 
    },
    id: { type: Number, unique: true }
});

module.exports = mongoose.model('matches', matchSchema);