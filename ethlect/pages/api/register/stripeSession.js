import dbConnect from '../../../MongoDB/utils/backendConnection';
import Authentication from '../../../MongoDB/models/Authentication';
import { getSession } from 'next-auth/react';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

async function addSessionIDToUser(_sessionID, _userID) {
	try {
		const user = await Authentication.findOneAndUpdate(
			{ userID: _userID },
			{
				stripeSessionID: _sessionID,
			}
		);

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

async function newSession(_userID) {
	try {
		// create a new stripe session
		const verificationSession =
			await stripe.identity.verificationSessions.create({
				type: 'document',
				metadata: {
					userID: _userID,
				},
				options: {
					document: {
						require_matching_selfie: true,
						allowed_types: ['passport'],
						require_live_capture: true,
					},
				},
			});

		if (verificationSession.status === 'requires_input') {
			// add the session id to the user document
			const status = await addSessionIDToUser(
				verificationSession.id,
				_userID
			);

			if (status.success) {
				return { success: true, session: verificationSession };
			} else {
				return { success: false };
			}
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function createVerificationSession(_user) {
	try {
		// check if the voter has already started a verification session
		if (_user.stripeSessionID) {
			console.log('[INFO] User already has a verification session');

			// retrieve the stripe session using the session id
			const verificationSession =
				await stripe.identity.verificationSessions.retrieve(
					_user.stripeSessionID
				);

			if (verificationSession.status === 'requires_input') {
				console.log('[INFO] Found verification session');

				return { success: true, session: verificationSession };
			} else {
				console.log(
					'[INFO] Did not find verification session, creating new one'
				);

				const newVerificationSession = await newSession(_user.userID);

				if (newVerificationSession.success) {
					return {
						success: true,
						session: newVerificationSession.session,
					};
				} else {
					return { success: false };
				}
			}
		} else {
			console.log('[INFO] Creating a new verification session');
			const verificationSession = await newSession(_user.userID);

			if (verificationSession.success) {
				return { success: true, session: verificationSession.session };
			} else {
				return { success: false };
			}
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function checkVoter(req, res) {
	if (req.method === 'GET') {
		const session = await getSession({ req });

		if (session && session.user) {
			if (session.user.accountType === 'voter') {
				// get the user document from the db
				const user = await findUser(session.user.userID);

				if (user.success) {
					// check if the idVerified field is false or rejected
					if (
						user.user.accountVerified === true &&
						(user.user.idVerified === 'false' ||
							user.user.idVerified === 'rejected')
					) {
						// create a new verification session or retrieve an existing one
						const verificationSession =
							await createVerificationSession(user.user);

						if (verificationSession.success) {
							// return the client secret to the frontend
							res.status(200).json({
								success: true,
								clientSecret:
									verificationSession.session.client_secret,
							});
						} else {
							res.status(500).json({
								success: false,
								error: 'Failed to Find Ballots',
							});
						}
					} else {
						res.status(500).json({
							success: false,
							error: 'User already started a session that is either pending or successful.',
						});
					}
				} else {
					res.status(500).json({
						success: false,
						error: 'Failed to find user in DB',
					});
				}
			} else {
				res.status(401).json({
					success: false,
					error: 'Unauthorized (not Admin)',
				});
			}
		} else {
			res.status(401).json({
				success: false,
				error: 'Unauthorized (not logged in)',
			});
		}
	} else {
		res.status(400).json({ success: false, error: 'Bad request' });
	}
}
