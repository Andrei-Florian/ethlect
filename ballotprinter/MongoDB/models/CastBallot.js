const mongoose = require('mongoose');
let Candidates = require('./EncryptedCandidate');

// create a new schema
const CastBallotSchema = new mongoose.Schema({
	ballotID: {
		type: Number,
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
	userID: {
		type: Number,
	},
	constituency: {
		type: String,
	},
	candidates: {
		type: [Candidates.schema],
	},
});

module.exports =
	mongoose.models.CastBallot ||
	mongoose.model('CastBallot', CastBallotSchema); // export the schema if it exists or create a new one otherwise
