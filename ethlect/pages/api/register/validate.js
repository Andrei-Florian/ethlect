import dbConnect from '../../../MongoDB/utils/backendConnection';
import Authentication from '../../../MongoDB/models/Authentication';
import speakeasy from 'speakeasy';

dbConnect(process.env.DB_CONNECTION);

async function findUser(_userID) {
	try {
		const user = await Authentication.findOne({ userID: _userID });

		if (user) {
			return { success: true, user: user };
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function checkToken(_token, _secret) {
	try {
		const result = speakeasy.totp.verify({
			secret: _secret,
			encoding: 'ascii',
			token: _token,
		});

		return { success: true, match: result };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function validateUserDocument(_userID) {
	try {
		const result = await Authentication.findOneAndUpdate(
			{
				userID: _userID,
			},
			{
				accountVerified: true,
			}
		);

		if (result) {
			return { success: true };
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function validateUser(req, res) {
	if (req.method === 'POST') {
		const data = req.body;

		// check if all data is present
		if (data.userID && data.token) {
			// get user from db
			const user = await findUser(data.userID);

			if (user.success) {
				// verify token
				const tokenMatch = await checkToken(
					data.token,
					user.user.secret
				);

				if (tokenMatch.success && tokenMatch.match) {
					// set the user as verified
					const updatedUser = await validateUserDocument(data.userID);

					if (updatedUser.success) {
						res.status(200).json({
							success: true,
						});
					} else {
						res.status(500).json({
							success: false,
							error: 'Error updating user document in database',
						});
					}
				} else {
					res.status(500).json({
						success: false,
						error: '2FA token is invalid',
					});
				}
			} else {
				res.status(500).json({
					success: false,
					error: 'Failed to find user in database',
				});
			}
		} else {
			res.status(401).json({
				success: false,
				error: 'Not all data is present',
			});
		}
	} else {
		res.status(400).json({ success: false, error: 'Bad request' });
	}
}
