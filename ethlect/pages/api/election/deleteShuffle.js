import dbConnect from '../../../MongoDB/utils/backendConnection';
import Election from '../../../MongoDB/models/Election';
import { getSession } from 'next-auth/react';
import cryptosystem from '../../../Cryptosystem/index';

dbConnect(process.env.DB_CONNECTION);

async function getElection(_electionID) {
	try {
		const election = await Election.findOne({
			electionID: _electionID,
		});

		if (election) {
			return { success: true, election: election };
		} else {
			return { success: false };
		}
	} catch (error) {
		return { success: false };
	}
}

async function deleteShuffle(_electionID, _shuffleID) {
	try {
		const election = await Election.findOneAndUpdate(
			{
				electionID: _electionID,
			},
			{
				$pull: {
					shuffles: {
						shuffleID: _shuffleID,
					},
				},
			}
		);

		if (election) {
			return { success: true };
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function startTabulation(req, res) {
	if (req.method === 'POST') {
		const session = await getSession({ req });

		if (session && session.user) {
			if (session.user.accountType === 'admin') {
				const data = req.body;

				// get election document
				const election = await getElection(data.electionID);

				if (election.success) {
					// delete shuffle
					const deleted = await deleteShuffle(
						data.electionID,
						data.shuffleID
					);

					if (deleted.success) {
						res.status(200).json({
							success: true,
						});
					} else {
						res.status(500).json({
							success: false,
							error: 'Could not delete election',
						});
					}
				} else {
					res.status(500).json({
						success: false,
						error: 'Failed to Find an Election with the Provided ID',
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
