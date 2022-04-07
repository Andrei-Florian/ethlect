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
		return { success: false };
	}
}

async function checkBallots(_userID, _ballotID, _ballots) {
	try {
		for (let i = 0; i < _ballots.length; i++) {
			if (
				_ballots[i].ballotID == _ballotID &&
				_ballots[i].userID == _userID
			) {
				return { success: true, match: true, ballot: _ballots[i] };
			}
		}

		return { success: true, match: false };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function checkCandidates(_givenCandidates, _actualCandidates) {
	try {
		let count = 0;

		// ensure all fields are unique
		let reps = [];

		for (let i = 0; i < _givenCandidates.length; i++) {
			if (reps.includes(_givenCandidates[i])) {
				return { success: true, match: false };
			} else {
				reps.push(_givenCandidates[i]);
			}
		}

		for (let i = 0; i < _givenCandidates.length; i++) {
			for (let j = 0; j < _actualCandidates.length; j++) {
				if (_actualCandidates[j].candidateRep == _givenCandidates[i]) {
					count++;
				}
			}
		}

		if (count == _givenCandidates.length) {
			return { success: true, match: true };
		} else {
			return { success: true, match: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function checkCandidateIDs(req, res) {
	if (req.method === 'POST') {
		const session = await getSession({ req });

		if (session && session.user) {
			if (session.user.accountType === 'voter') {
				const data = req.body;

				// get the election document
				const election = await getElection(data.electionID);

				if (election.success) {
					// check if the voter has a ballot with the inputted ballot ID generated for them
					const presence = await checkBallots(
						session.user.userID,
						data.ballotID,
						election.election.ballots
					);

					if (presence.success && presence.match) {
						// check if the candidate IDs are valid
						const candidatesValid = await checkCandidates(
							data.candidates,
							presence.ballot.candidates
						);

						if (candidatesValid.success && candidatesValid.match) {
							res.status(200).json({
								success: true,
							});
						} else {
							res.status(500).json({
								success: false,
								error: 'Candidate IDs provided did not match ones in the ballot',
							});
						}
					} else {
						res.status(500).json({
							success: false,
							error: 'Failed to Find Ballots',
						});
					}
				} else {
					res.status(500).json({
						success: false,
						error: 'Could not find election',
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
