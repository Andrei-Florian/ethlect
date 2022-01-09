import dbConnect from '../../../MongoDB/utils/backendConnection';
import Election from '../../../MongoDB/models/Election';
import { getSession } from 'next-auth/react';

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
		console.log(error);
		return { success: false };
	}
}

async function toggleElection(_electionID, _action) {
	try {
		const res = await Election.findOneAndUpdate(
			{
				electionID: _electionID,
			},
			{
				electoralPeriod: _action,
			}
		);

		if (res) {
			return { success: true };
		} else {
			return { success: false };
		}
	} catch (error) {
		return { success: false };
	}
}

export default async function startElection(req, res) {
	if (req.method === 'POST') {
		const session = await getSession({ req });

		if (session && session.user) {
			if (session.user.accountType === 'admin') {
				const data = req.body;
				const electionID = data.electionID;

				// get the election with the provided ID
				const election = await getElection(electionID);

				if (election.success) {
					// check if the election is terminated
					if (!election.election.electionTabulating) {
						const electionAction =
							!election.election.electoralPeriod;

						// toggle the state of the election's electoral period
						const result = await toggleElection(
							electionID,
							electionAction
						);

						if (result.success) {
							res.status(200).json({
								success: true,
								electionAction: electionAction,
							});
						} else {
							res.status(500).json({
								success: false,
								error: 'Could not update election',
								electionAction: electionAction,
							});
						}
					} else {
						res.status(500).json({
							success: false,
							error: 'The Election is terminated and Ballots can no longer be Generated!',
						});
					}
				} else {
					res.status(500).json({
						success: false,
						error: 'Could not find election with provided ID',
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
