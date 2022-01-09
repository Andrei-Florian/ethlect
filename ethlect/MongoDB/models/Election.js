const mongoose = require('mongoose');
let Constituencies = require('./Constituency');
let Ballots = require('./Ballot');
let CastBallots = require('./CastBallot');
let Shuffle = require('./Shuffle');

// create a new schema
const ElectionSchema = new mongoose.Schema({
	electionID: {
		type: Number,
		required: true,
		unique: true,
	},
	electionVerified: {
		type: Boolean,
	},
	electionName: {
		type: String,
		required: true,
	},
	electionDescription: {
		type: String,
		required: true,
	},
	electionStart: {
		type: Date,
		required: true,
	},
	electionEnd: {
		type: Date,
		required: true,
	},
	electoralPeriod: {
		type: Boolean,
	},
	electionTabulating: {
		type: Boolean,
	},
	electionComplete: {
		type: Boolean,
	},
	elGamal: {
		type: String,
	},
	rsaKeypair: {
		type: String,
	},
	constituencies: {
		type: [Constituencies.schema],
	},
	ballots: {
		type: [Ballots.schema],
	},
	ballotBox: {
		type: [CastBallots.schema],
	},
	shuffles: {
		type: [Shuffle.schema],
	},
	electionResults: {
		type: [String],
	},
});

module.exports =
	mongoose.models.Election || mongoose.model('Election', ElectionSchema); // export the schema if it exists or create a new one otherwise
