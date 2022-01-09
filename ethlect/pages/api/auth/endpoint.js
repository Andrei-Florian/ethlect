import dbConnect from '../../../MongoDB/utils/backendConnection';
import Authentication from '../../../MongoDB/models/Authentication';
import speakeasy from 'speakeasy';
import crypto from 'crypto';

dbConnect(process.env.DB_CONNECTION);

async function makeHash(val) {
	return crypto.createHash('sha256').update(val, 'utf8').digest();
}

async function hashPassword(_password, _salt) {
	try {
		const hashedPassword = crypto
			.createHash('sha256')
			.update(_password, 'utf8')
			.update(await makeHash(_salt))
			.digest('base64');
		return { success: true, hashedPassword: hashedPassword };
	} catch (error) {
		return { success: false };
	}
}

async function checkDB(_details) {
	try {
		const auth = await Authentication.findOne({
			email: _details.username,
		});

		if (auth && auth.accountVerified && auth.salt) {
			const hashedPassword = await hashPassword(
				_details.password,
				auth.salt
			);

			if (
				hashedPassword.success &&
				auth.password === hashedPassword.hashedPassword
			) {
				return {
					success: true,
					user: auth,
				};
			} else {
				return {
					success: false,
				};
			}
		} else {
			return {
				success: false,
			};
		}
	} catch (error) {
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

		return result;
	} catch (error) {
		return false;
	}
}

export default async function auth(req, res) {
	if (req.method === 'POST') {
		try {
			const details = req.body;
			const dbRes = await checkDB(details);

			if (dbRes.success) {
				if (await checkToken(details.token, dbRes.user.secret)) {
					console.log(`[INFO] ${dbRes.user.email} logged in`);
					res.status(200).json({
						success: true,
						user: {
							userID: dbRes.user.userID,
							accountVerified: dbRes.user.accountVerified,
							idVerified: dbRes.user.idVerified,
							accountType: dbRes.user.accountType,
							firstName: dbRes.user.firstName,
							lastName: dbRes.user.lastName,
							email: dbRes.user.email,
						},
					});
				} else {
					res.status(401).json({ success: false });
				}
			} else {
				res.status(401).json({ success: false });
			}
		} catch (error) {
			res.status(400).json({ success: false });
		}
	} else {
		res.status(400).json({ success: false });
	}
}
