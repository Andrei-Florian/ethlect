const mongoose = require('mongoose');
let ShuffleProof = require('./ShuffleProof');

// create a new schema
const ShuffleSchema = new mongoose.Schema({
	shuffleID: {
		type: Number,
	},
	shuffleType: {
		type: String,
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
	inputBallots: {
		type: String,
	},
	outputBallots: {
		type: String,
	},
	proof: {
		type: ShuffleProof.schema,
	},
	approved: {
		type: Boolean,
	},
});

module.exports =
	mongoose.models.Shuffle || mongoose.model('Shuffle', ShuffleSchema); // export the schema if it exists or create a new one otherwise
