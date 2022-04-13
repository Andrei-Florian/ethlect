const mongoose = require('mongoose');
var Candidate = require('./Candidate');

// create a new schema
const ConstituencySchema = new mongoose.Schema({
	constituency: {
		type: String,
		length: 9,
	},
	seats: {
		type: String,
	},
	candidates: {
		type: [Candidate.schema],
	},
});

module.exports =
	mongoose.models.Constituency ||
	mongoose.model('Constituency', ConstituencySchema); // export the schema if it exists or create a new one otherwise
