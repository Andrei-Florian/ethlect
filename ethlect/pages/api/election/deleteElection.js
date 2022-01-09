import dbConnect from '../../../MongoDB/utils/backendConnection';
import Election from '../../../MongoDB/models/Election';
import { getSession } from 'next-auth/react';

dbConnect(process.env.DB_CONNECTION);

async function deleteElectionDocument(_electionID) {
	try {
		const election = await Election.findOneAndDelete({
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

export default async function deleteElection(req, res) {
	if (req.method === 'DELETE') {
		const session = await getSession({ req });

		if (session && session.user) {
			if (session.user.accountType === 'admin') {
				const data = req.body;

				// delete the document with the electionID provided
				const result = await deleteElectionDocument(data.electionID);

				if (result.success) {
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
