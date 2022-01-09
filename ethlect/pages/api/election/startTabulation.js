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

async function prepareBallot(_ballot) {
	try {
		let ballot = [];

		for (let j = 0; j < _ballot.candidates.length; j++) {
			console.log(`[INFO] Appending candidate ${j}`);

			// append the candidate ID to the ballot
			const candidate = JSON.parse(
				_ballot.candidates[j].encryptedCandidateID
			);

			ballot.push(candidate);
		}

		return { success: true, ballot: ballot };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function prepareBallots(_ballots) {
	try {
		let ballots = [];
		let voterIDs = [];

		for (let i = _ballots.length - 1; i >= 0; i--) {
			if (!voterIDs.includes(_ballots[i].userID)) {
				voterIDs.push(_ballots[i].userID);

				const ballot = await prepareBallot(_ballots[i]);

				if (ballot.success) {
					ballots.push(ballot.ballot);

					console.log(`[ADD] Ballot ${_ballots.length - i} added`);
					console.log('');
				} else {
					console.log(
						`[ERROR] Could not prepare ballot ${
							_ballots.length - i
						}`
					);

					return { success: false };
				}
			} else {
				console.log(
					`[INFO] Could not prepare ballot ${
						_ballots.length - i
					} because voter ${_ballots[i].userID} cast a newer ballot`
				);
			}
		}

		return { success: true, ballots: ballots };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function getShuffleID(_shuffles) {
	try {
		if (_shuffles && _shuffles.length > 0) {
			const lastID = _shuffles[_shuffles.length - 1].shuffleID;
			const shuffleID = lastID + 1;

			return { success: true, shuffleID: shuffleID };
		} else {
			return { success: true, shuffleID: 1 };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function updateElectionDocument(_electionID, _ballots, _shuffleID) {
	try {
		const ballotSetObj = {
			shuffleID: _shuffleID,
			inputBallots: null,
			outputBallots: JSON.stringify(_ballots),
			approved: true,
			shuffleType: 'transfer',
		};

		const election = await Election.findOneAndUpdate(
			{
				electionID: _electionID,
			},
			{
				electoralPeriod: false,
				electionTabulating: true,
				$push: { shuffles: ballotSetObj },
			}
		);

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

export default async function startTabulation(req, res) {
	if (req.method === 'POST') {
		const session = await getSession({ req });

		if (session && session.user) {
			if (session.user.accountType === 'admin') {
				const data = req.body;

				// get election document
				const election = await getElection(data.electionID);

				if (election.success) {
					// tramsfer each ballot
					const ballots = await prepareBallots(
						election.election.ballotBox
					);

					if (ballots.success) {
						// get shuffleID
						const shuffleID = await getShuffleID(
							election.election.shuffles
						);

						if (shuffleID.success) {
							// add ballots to database
							const result = await updateElectionDocument(
								data.electionID,
								ballots.ballots,
								shuffleID.shuffleID
							);

							if (result.success) {
								res.status(200).json({
									success: true,
								});
							} else {
								res.status(500).json({
									success: false,
									error: 'Could not update election document',
								});
							}
						} else {
							res.status(500).json({
								success: false,
								error: 'Could not generate a shuffle ID',
							});
						}
					} else {
						res.status(500).json({
							success: false,
							error: 'Failed to Generate Ballots',
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
