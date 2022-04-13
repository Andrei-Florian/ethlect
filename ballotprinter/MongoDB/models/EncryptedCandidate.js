const mongoose = require('mongoose');

// create a new schema
const EncryptedCandidateSchema = new mongoose.Schema({
	candidateRep: {
		type: Number,
	},
	encryptedCandidateID: {
		type: String,
	},
});

module.exports =
	mongoose.models.EncryptedCandidate ||
	mongoose.model('EncryptedCandidate', EncryptedCandidateSchema); // export the schema if it exists or create a new one otherwise
