export const config = {
	api: {
		bodyParser: false,
	},
};

import { buffer } from 'micro';
import Stripe from 'stripe';
import Authentication from '../../MongoDB/models/Authentication';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function updateUser(_userID, _verifiedCode) {
	try {
		let user;

		if (_verifiedCode === 'pending') {
			user = await Authentication.findOneAndUpdate(
				{ userID: _userID },
				{
					idVerified: 'pending',
				}
			);
		} else if (_verifiedCode === 'true') {
			user = await Authentication.findOneAndUpdate(
				{ userID: _userID },
				{
					idVerified: 'true',
					stripeSessionID: null,
				}
			);
		} else if (_verifiedCode === 'rejected') {
			user = await Authentication.findOneAndUpdate(
				{ userID: _userID },
				{
					idVerified: 'rejected',
					stripeSessionID: null,
				}
			);
		}

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

async function findUser(_userID) {
	try {
		const user = await Authentication.findOne({ userID: _userID });

		if (user) {
			if (user.idVerified === 'pending') {
				return { success: true, pending: true, user: user };
			} else {
				return { success: true, pending: false, user: user };
			}
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function handlePending(_event) {
	try {
		const userID = _event.data.object.metadata.userID;
		const user = await updateUser(userID, 'pending');

		if (user.success) {
			return { success: true };
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function handleRequiresInput(_event) {
	try {
		const userID = _event.data.object.metadata.userID;

		// check if idVerified is pending
		const pending = await findUser(userID);

		if (pending.success && pending.pending) {
			// if pending, mark the field as rejected
			const user = await updateUser(userID, 'rejected');

			if (user.success) {
				return { success: true };
			} else {
				return { success: false };
			}
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function verifyName(_db, _stripe) {
	try {
		if (
			_db.firstName.toLowerCase() === _stripe.first_name.toLowerCase() &&
			_db.lastName.toLowerCase() === _stripe.last_name.toLowerCase()
		) {
			return { success: true, match: true };
		} else {
			return { success: true, match: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function handleSuccess(_event) {
	try {
		const userID = _event.data.object.metadata.userID;

		// get the user document with the provided userID
		const user = await findUser(userID);

		if (user.success) {
			// get the details from the document scanned
			const details = await stripe.identity.verificationSessions.retrieve(
				_event.data.object.id,
				{
					expand: ['verified_outputs'],
				}
			);

			if (details.verified_outputs) {
				// check if the name on the document matches the name in the db
				const verification = await verifyName(
					user.user,
					details.verified_outputs
				);

				if (verification.success && verification.match) {
					// set idVerified to true for the user
					const user = await updateUser(userID, 'true');

					if (user.success) {
						return { success: true };
					} else {
						return { success: false };
					}
				} else {
					// set isVerified to rejected for the user
					const user = await updateUser(userID, 'rejected');
					return { success: false };
				}
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

export default async function handler(req, res) {
	if (req.method === 'POST') {
		const buf = await buffer(req);
		const sig = req.headers['stripe-signature'];
		let event;

		try {
			event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
		} catch (err) {
			res.status(400).send(`Webhook Error: ${err.message}`);
			return;
		}

		console.log('[INFO] Received event from stripe');

		// switch through the event types
		switch (event.type) {
			case 'identity.verification_session.processing':
				const handlingPending = await handlePending(event);

				if (!handlingPending.success) {
					res.status(400).send(
						`Webhook Error: ${handlingPending.error}`
					);
				} else {
					res.json({ received: true });
				}
				break;
			case 'identity.verification_session.requires_input':
				const handlingRequiresInput = await handleRequiresInput(event);

				if (!handlingRequiresInput.success) {
					res.status(400).send(
						`Webhook Error: ${handlingRequiresInput.error}`
					);
				} else {
					res.json({ received: true });
				}
				break;
			case 'identity.verification_session.verified':
				const handlingSuccess = await handleSuccess(event);

				if (!handlingSuccess.success) {
					res.status(400).send(
						`Webhook Error: ${handlingSuccess.error}`
					);
				} else {
					res.json({ received: true });
				}
				break;
			default:
				console.log('[INFO] Unhandled event type');
				res.json({ received: true });
				break;
		}
	} else {
		res.setHeader('Allow', 'POST');
		res.status(405).end('Method Not Allowed');
	}
}
