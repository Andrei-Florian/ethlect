const mongoose = require('mongoose');

// create a new schema
const EncryptedBallotSchema = new mongoose.Schema({
	ballot: {
		type: String,
	},
});

module.exports =
	mongoose.models.EncryptedBallot ||
	mongoose.model('EncryptedBallot', EncryptedBallotSchema); // export the schema if it exists or create a new one otherwise
