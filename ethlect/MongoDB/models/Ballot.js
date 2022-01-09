const mongoose = require('mongoose');
let Candidates = require('./EncryptedCandidate');

// create a new schema
const BallotSchema = new mongoose.Schema({
	ballotID: {
		type: Number,
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
	mongoose.models.Ballot || mongoose.model('Ballot', BallotSchema); // export the schema if it exists or create a new one otherwise
