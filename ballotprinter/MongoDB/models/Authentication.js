const mongoose = require('mongoose');

// create a new schema
const AuthenticationSchema = new mongoose.Schema({
	userID: {
		type: Number,
		required: true,
		unique: true,
		length: 9,
	},
	accountVerified: {
		type: Boolean,
		required: true,
	},
	idVerified: {
		type: String,
	},
	stripeSessionID: {
		type: String,
	},
	accountType: {
		type: String,
		required: true,
		enum: ['admin', 'voter'],
	},
	firstName: {
		type: String,
		required: true,
	},
	lastName: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		unique: true,
		required: true,
		lowercase: true,
	},
	password: {
		type: String,
		required: true,
	},
	salt: {
		type: String,
		required: true,
	},
	secret: {
		type: String,
	},
	address: {
		type: String,
		lowercase: true,
	},
	constituency: {
		type: String,
		lowercase: true,
	},
});

module.exports =
	mongoose.models.Authentication ||
	mongoose.model('Authentication', AuthenticationSchema); // export the schema if it exists or create a new one otherwise
