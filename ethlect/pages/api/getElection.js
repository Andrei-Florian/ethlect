import dbConnect from '../../MongoDB/utils/backendConnection';
import Election from '../../MongoDB/models/Election';

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

export default async function getElection(req, res) {
	if (req.method === 'POST') {
		const data = req.body;

		// retrieve the electionID from the request
		const electionID = data.electionID;

		// find an election document with the given electionID
		const election = await getElectionDocument(electionID);

		if (election.success) {
			const response = {
				electionID: election.election.electionID,
				electionVerified: election.election.electionVerified,
				electionName: election.election.electionName,
				electionDescription: election.election.electionDescription,
				electionStart: election.election.electionStart,
				electionEnd: election.election.electionEnd,
				electoralPeriod: election.election.electoralPeriod,
				constituencies: election.election.constituencies.length,
				ballots: election.election.ballots.length,
				electionTabulating: election.election.electionTabulating,
				electionComplete: election.election.electionComplete,
			};

			res.status(200).json({
				success: true,
				electionDetails: response,
			});
		} else {
			res.status(500).json({
				success: false,
				error: 'Election not found',
			});
		}
	} else {
		res.status(400).json({ success: false, error: 'Bad request' });
	}
}
