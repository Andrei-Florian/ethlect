import dbConnect from '../../../MongoDB/utils/backendConnection';
import Authentication from '../../../MongoDB/models/Authentication';
import speakeasy from 'speakeasy';
import crypto from 'crypto';

dbConnect(process.env.DB_CONNECTION);

async function checkAccount(_firstName, _lastName, _eircode) {
	try {
		const match = await Authentication.findOne({
			firstName: _firstName.toLowerCase(),
			lastName: _lastName.toLowerCase(),
			address: _eircode.toLowerCase(),
			accountType: 'voter',
		});

		if (match) {
			return { success: true, match: true, data: match };
		} else {
			return { success: true, match: false };
		}
	} catch {
		console.log(error);
		return { success: false };
	}
}

async function checkRegister(_firstName, _lastName, _eircode) {
	try {
		const fetchString = process.env.API_REGISTER_CHECK;

		const postRequest = JSON.stringify({
			firstName: _firstName,
			lastName: _lastName,
			eircode: _eircode,
		});

		// send the request
		const res = await fetch(fetchString, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: postRequest,
		});

		const resJSON = await res.json();

		if (resJSON.success && resJSON.match) {
			return { success: true, match: resJSON.match, data: resJSON.data };
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function generate2FASecret(_firstName, _lastName) {
	try {
		const secret = speakeasy.generateSecret({
			name: `ethlect. 2FA:${_firstName} ${_lastName}`,
		});

		return { success: true, secret: secret };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function getUserID() {
	try {
		const lastUser = await Authentication.findOne({})
			.sort({
				_id: -1,
			})
			.limit(1);

		if (lastUser === null) {
			return { success: true, documentCount: 1 };
		} else {
			return {
				success: true,
				documentCount: lastUser.userID + 1,
			};
		}
	} catch (error) {
		console.log(error);
		return { success: false, error: error };
	}
}

async function makeHash(val) {
	return crypto.createHash('sha384').update(val, 'utf8').digest();
}

async function hashPassword(_password) {
	try {
		const salt = crypto.randomBytes(16).toString('hex');
		const hashedPassword = crypto
			.createHash('sha384')
			.update(_password, 'utf8')
			.update(await makeHash(salt))
			.digest('base64');
		return { success: true, hashedPassword: hashedPassword, salt: salt };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function createUserInstance(
	_userID,
	_firstName,
	_lastName,
	_email,
	_password,
	_salt,
	_secret,
	_eircode,
	_constituency
) {
	try {
		let requireStripeID = false;
		if (process.env.NEXT_PUBLIC_ENABLE_STRIPEIDENTITY == 'false')
			requireStripeID = true;

		const userObject = {
			userID: _userID,
			accountVerified: false,
			idVerified: requireStripeID,
			stripeSessionID: null,
			accountType: 'voter',
			firstName: _firstName.toLowerCase(),
			lastName: _lastName.toLowerCase(),
			email: _email,
			password: _password,
			salt: _salt,
			secret: _secret,
			address: _eircode,
			constituency: _constituency,
		};

		const res = await Authentication.create(userObject);

		if (res) {
			return { success: true };
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function createUser(req, res) {
	if (req.method === 'POST') {
		const data = req.body;

		// check if all data sent
		if (
			data.firstName &&
			data.lastName &&
			data.eircode &&
			data.email &&
			data.password
		) {
			// check if account already exists
			const checkAccountRes = await checkAccount(
				data.firstName,
				data.lastName,
				data.eircode
			);

			if (checkAccountRes.success && !checkAccountRes.match) {
				// hash the password
				const hashedPassword = await hashPassword(data.password);

				if (hashedPassword.success) {
					let register;

					// check the register if integration is enabled
					if (
						process.env.NEXT_PUBLIC_ENABLE_VOTERREGISTRY == 'true'
					) {
						register = await checkRegister(
							data.firstName,
							data.lastName,
							data.eircode
						);
					} else {
						register = {
							success: true,
							match: true,
							data: {
								eircode: data.eircode,
								address: {
									region: {
										longDescription: data.constituency,
									},
								},
							},
						};
					}

					if (register.success && register.match) {
						// generate 2FA key
						const secretKey = await generate2FASecret(
							data.firstName,
							data.lastName
						);

						if (secretKey.success) {
							// get a user ID
							const userID = await getUserID();

							if (userID.success) {
								// add user to database
								const instance = await createUserInstance(
									userID.documentCount,
									data.firstName,
									data.lastName,
									data.email,
									hashedPassword.hashedPassword,
									hashedPassword.salt,
									secretKey.secret.ascii,
									register.data.eircode,
									register.data.address.region.longDescription
								);

								if (instance.success) {
									res.status(200).json({
										success: true,
										key2FA: secretKey.secret.otpauth_url,
										userID: userID.documentCount,
									});
								} else {
									res.status(500).json({
										success: false,
										error: 'Error adding user to database',
									});
								}
							} else {
								res.status(500).json({
									success: false,
									error: 'Failed to get user ID',
								});
							}
						} else {
							res.status(500).json({
								success: false,
								error: 'Error generating 2FA key',
							});
						}
					} else {
						res.status(500).json({
							success: false,
							error: 'Error checking the voter register',
						});
					}
				} else {
					res.status(500).json({
						success: false,
						error: 'Error hashing provided password',
					});
				}
			} else {
				res.status(401).json({
					success: false,
					error: 'Incomplete data sent',
				});
			}
		} else {
			res.status(500).json({
				success: false,
				error: 'Account already exists',
			});
		}
	} else {
		res.status(400).json({ success: false, error: 'Bad request' });
	}
}
