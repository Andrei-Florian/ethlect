import mongoose from 'mongoose';

const connection = {};

async function dbConnect(_connectionString) {
	// escape if already connected
	if (connection.isConnected) return { success: true };

	// connect to DB
	const db = await mongoose.connect(_connectionString, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	// check connection status
	connection.isConnected = db.connections[0].readyState;

	if (connection.isConnected) {
		return { success: true };
	} else {
		return { success: false };
	}
}

export default dbConnect;
