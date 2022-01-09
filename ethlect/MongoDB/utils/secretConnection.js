import mongoose from 'mongoose';

const connection = {};

async function dbConnect(_id) {
	// escape if already connected
	if (connection.isConnected) return;

	// connect to DB
	const db = await mongoose.connect(process.env._id, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	// check connection status
	connection.isConnected = db.connections[0].readyState;
}

export default dbConnect;
