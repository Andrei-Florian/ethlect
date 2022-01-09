import dbConnect from '../../../MongoDB/utils/backendConnection';
import Authentication from '../../../MongoDB/models/Authentication';

dbConnect(process.env.DB_CONNECTION);

async function checkDB(_userID) {
	try {
		const user = await Authentication.findOne({
			userID: _userID,
		});

		if (user && user.accountVerified && user.accountType === 'voter') {
			const idVerified = user.idVerified;

			return { success: true, idVerified: idVerified };
		} else {
			return {
				success: false,
			};
		}
	} catch (error) {
		return { success: false };
	}
}

export default async function auth(req, res) {
	if (req.method === 'POST') {
		const userID = req.body;

		// find the user in the db
		const user = await checkDB(userID);

		if (user.success) {
			return res
				.status(200)
				.json({ success: true, idVerified: user.idVerified });
		} else {
			res.status(400).json({
				success: false,
				error: 'failed to find a voter with the provided ID',
			});
		}
	} else {
		res.status(400).json({ success: false, error: 'invalid request' });
	}
}
