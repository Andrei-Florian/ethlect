import dbConnect from '../../../MongoDB/utils/backendConnection';
import Election from '../../../MongoDB/models/Election';

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

async function fetchBallots(_ballots, _userID) {
	try {
		let ballots = [];

		for (let i = 0; i < _ballots.length; i++) {
			if (_ballots[i].userID === _userID) {
				ballots.push(_ballots[i]);
			}
		}

		return { success: true, ballots: ballots };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function destructureElectionDocument(_election) {
	try {
		const response = {
			electionID: _election.electionID,
			electionVerified: _election.electionVerified,
			electionName: _election.electionName,
			electionDescription: _election.electionDescription,
			electionStart: _election.electionStart,
			electionEnd: _election.electionEnd,
			electoralPeriod: _election.electoralPeriod,
			constituencies: _election.constituencies.length,
			ballots: _election.ballots.length,
			electionTabulating: _election.electionTabulating,
			electionComplete: _election.electionComplete,
		};

		return { success: true, electionDetails: response };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function startElection(req, res) {
	if (req.method === 'POST') {
		const body = req.body;
		const session = body.session;
		const electionID = body.electionID;

		if (session && session.user) {
			// get the election with the provided ID
			const election = await getElection(electionID);

			if (election.success) {
				// fetch the ballots cast by the voter
				const ballots = await fetchBallots(
					election.election.ballotBox,
					session.user.userID
				);

				if (ballots.success) {
					// destructure the election document and only send back general data
					const electionDetails = await destructureElectionDocument(
						election.election
					);

					if (electionDetails.success) {
						res.status(200).json({
							success: true,
							electionDetails: electionDetails.electionDetails,
							ballots: ballots.ballots,
						});
					} else {
						res.status(500).json({
							success: false,
							error: 'Failed to destructure election document',
						});
					}
				} else {
					res.status(500).json({
						success: false,
						error: 'Failed to user fetch ballots from election object',
						electionAction: electionAction,
					});
				}
			} else {
				res.status(500).json({
					success: false,
					error: 'Could not find election with provided ID',
				});
			}
		} else if (body.simple) {
			// get the election with the provided ID
			const election = await getElection(electionID);

			if (election.success) {
				// destructure the election document and only send back general data
				const electionDetails = await destructureElectionDocument(
					election.election
				);

				if (electionDetails.success) {
					res.status(200).json({
						success: true,
						electionDetails: electionDetails.electionDetails,
					});
				} else {
					res.status(500).json({
						success: false,
						error: 'Failed to destructure election document',
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
				error: 'Unauthorized (not logged in)',
			});
		}
	} else {
		res.status(400).json({ success: false, error: 'Bad request' });
	}
}
