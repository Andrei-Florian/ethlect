const mongoose = require('mongoose');

// create a new schema
const ShuffleProofSchema = new mongoose.Schema({
	elGamal: {
		type: String,
	},
	inputBallots: {
		type: String,
	},
	generatedBallots: {
		type: [String],
	},
	outputBallots: {
		type: String,
	},
	interactiveProof: {
		type: String,
	},
});

module.exports =
	mongoose.models.ShuffleProof ||
	mongoose.model('ShuffleProof', ShuffleProofSchema); // export the schema if it exists or create a new one otherwise
