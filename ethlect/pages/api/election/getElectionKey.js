import dbConnect from '../../../MongoDB/utils/backendConnection';
import Election from '../../../MongoDB/models/Election';
import { getSession } from 'next-auth/react';

dbConnect(process.env.DB_CONNECTION);

async function getElectionDocument(_electionID) {
	try {
		const election = await Election.findOne({ electionID: _electionID });

		if (election) {
			return { success: true, election: election };
		} else {
			return { success: false };
		}
	} catch (error) {
		return { success: false };
	}
}

async function getElectionKey(_rsaObject) {
	try {
		const rsa = JSON.parse(_rsaObject);

		return { success: true, key: rsa.publicKey };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function getElection(req, res) {
	if (req.method === 'POST') {
		const session = await getSession({ req });

		if (session && session.user) {
			if (session.user.accountType === 'admin') {
				const data = req.body;

				if (data.electionID) {
					// find election with provided electionID
					const electionDocument = await getElectionDocument(
						data.electionID
					);

					if (electionDocument.success) {
						// Extract the election public key from the election document
						const electionKey = await getElectionKey(
							electionDocument.election.rsaKeypair
						);

						if (electionKey.success) {
							// return the public key to the client
							res.status(200).json({
								success: true,
								publicKey: electionKey.key,
							});
						} else {
							res.status(500).json({
								success: false,
								error: 'Failed to get election public key from document',
							});
						}
					} else {
						res.status(500).json({
							success: false,
							error: 'Error finding election with provided ID',
						});
					}
				} else {
					res.status(400).json({
						success: false,
						error: 'Incomplete data sent',
					});
				}
			} else {
				res.status(401).json({
					success: false,
					error: 'Unauthorized (not admin)',
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
