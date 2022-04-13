import dbConnect from '../../MongoDB/utils/backendConnection';
import Election from '../../MongoDB/models/Election';

async function getElection(_electionID) {
	try {
		const election = await Election.findOne({ electionID: _electionID });

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

async function getElectionDetails(_election) {
	try {
		const electionName = _election.electionName;
		const keypair = JSON.parse(_election.rsaKeypair);

		return {
			success: true,
			electionName: electionName,
			publicKey: keypair.publicKey,
		};
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function verifyConnectionString(req, res) {
	try {
		if (req.method === 'POST') {
			const connectionString = req.body.connectionString;
			const electionID = req.body.electionID;

			if (connectionString && electionID) {
				// connect to DB
				const connection = await dbConnect(connectionString);

				if (connection.success) {
					// attempt to read the election document
					const election = await getElection(electionID);

					if (election.success) {
						// deconstruct the election name and public key
						const electionDetails = await getElectionDetails(
							election.election
						);

						if (electionDetails.success) {
							res.status(200).json({
								success: true,
								electionName: electionDetails.electionName,
								publicKey: electionDetails.publicKey,
							});
						} else {
							res.status(500).json({
								success: false,
								error: 'Failed to Retrieve Election Details',
							});
						}
					} else {
						res.status(500).json({
							success: false,
							error: 'Connection to DB Failed',
						});
					}
				} else {
					res.status(500).json({
						success: false,
						error: 'Connection to DB Failed',
					});
				}
			} else {
				res.status(400).json({
					success: false,
					error: 'Missing Data',
				});
			}
		} else {
			res.status(400).json({ success: false, error: 'Bad request' });
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({ success: false, error: 'Server Error' });
	}
}
