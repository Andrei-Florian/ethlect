const mongoose = require('mongoose');

// create a new schema
const CandidateSchema = new mongoose.Schema({
	candidateName: {
		type: String,
	},
	candidateID: {
		type: [Number],
	},
});

module.exports =
	mongoose.models.Candidate || mongoose.model('Candidate', CandidateSchema); // export the schema if it exists or create a new one otherwise
