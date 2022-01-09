import dbConnect from '../../MongoDB/utils/backendConnection';
import Election from '../../MongoDB/models/Election';

dbConnect(process.env.DB_CONNECTION);

async function getElectionDocuments() {
	try {
		const elections = await Election.find();

		if (elections) {
			return { success: true, elections: elections };
		} else {
			return { success: false };
		}
	} catch (error) {
		return { success: false };
	}
}

async function deconstructDocuments(_elections) {
	try {
		let newElections = [];

		for (let i = 0; i < _elections.length; i++) {
			newElections.push({
				electionID: _elections[i].electionID,
				electionVerified: _elections[i].electionVerified,
				electionName: _elections[i].electionName,
				electionDescription: _elections[i].electionDescription,
				electionStart: _elections[i].electionStart,
				electionEnd: _elections[i].electionEnd,
				electoralPeriod: _elections[i].electoralPeriod,
				constituencies: _elections[i].constituencies.length,
				ballots: _elections[i].ballots.length,
				ballotsCast: _elections[i].ballotBox.length,
				electionTabulating: _elections[i].electionTabulating,
				electionComplete: _elections[i].electionComplete,
			});
		}

		return { success: true, electionObject: newElections };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function getElection(req, res) {
	if (req.method === 'GET') {
		const elections = await getElectionDocuments();

		if (elections.success) {
			const newElections = await deconstructDocuments(
				elections.elections
			);

			if (newElections.success) {
				res.status(200).json({
					success: true,
					elections: newElections.electionObject,
				});
			} else {
				res.status(500).json({
					success: false,
					message: 'Could not deconstruct election documents',
				});
			}
		} else {
			res.status(500).json({
				success: false,
				message: 'Could not get elections',
			});
		}
	} else {
		res.status(400).json({ success: false, error: 'Bad request' });
	}
}
