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
		let candidates = [];

		// ensure all fields are unique
		let reps = [];

		for (let i = 0; i < _givenCandidates.length; i++) {
			if (reps.includes(_givenCandidates[i].key)) {
				return { success: true, match: false };
			} else {
				reps.push(_givenCandidates[i].key);
			}
		}

		for (let i = 0; i < _givenCandidates.length; i++) {
			for (let j = 0; j < _actualCandidates.length; j++) {
				if (_actualCandidates[j].candidateRep == _givenCandidates[i]) {
					candidates.push(_actualCandidates[j]);
				}
			}
		}

		if (candidates.length == _givenCandidates.length) {
			return { success: true, match: true, candidateList: candidates };
		} else {
			return { success: true, match: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function checkDuplicates(_ballotBox, _ballotID) {
	try {
		for (let i = 0; i < _ballotBox.length; i++) {
			if (_ballotBox[i].ballotID == _ballotID) {
				return { success: true, duplicate: true };
			}
		}

		return { success: true, duplicate: false };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function addVote(
	_electionID,
	_ballotID,
	_voterID,
	_candidates,
	_constituency
) {
	try {
		const ballotObj = {
			ballotID: _ballotID,
			userID: _voterID,
			constituency: _constituency,
			candidates: _candidates,
		};

		const res = await Election.findOneAndUpdate(
			{ electionID: _electionID },
			{ $push: { ballotBox: ballotObj } }
		);

		if (res) {
			return { success: true };
		} else {
			return { success: false };
		}
	} catch (error) {}
}

export default async function castVote(req, res) {
	if (req.method === 'POST') {
		const session = await getSession({ req });

		if (session && session.user) {
			if (session.user.accountType === 'voter') {
				const data = req.body;

				// check if the voter has verified their ID
				if (session.user.idVerified === 'true') {
					// get the election document
					const election = await getElection(data.electionID);

					if (election.success) {
						// check if the electoral period is still open and if the tabulation process is not ongoing
						if (
							election.election.electoralPeriod &&
							!election.election.electionTabulating
						) {
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

								if (
									candidatesValid.success &&
									candidatesValid.match
								) {
									// check if the ballot has already been cast
									const checkDuplicate =
										await checkDuplicates(
											election.election.ballotBox,
											data.ballotID
										);

									if (
										checkDuplicate.success &&
										!checkDuplicate.duplicate
									) {
										// cast the vote
										const result = await addVote(
											data.electionID,
											data.ballotID,
											session.user.userID,
											candidatesValid.candidateList,
											presence.ballot.constituency
										);

										if (result.success) {
											res.status(200).json({
												success: true,
											});
										} else {
											res.status(500).json({
												success: false,
												error: 'Failed to add vote to ballot box in database',
											});
										}
									} else {
										res.status(500).json({
											success: false,
											error: 'The Ballot ID entered has already been cast',
										});
									}
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
								error: 'The electoral period is not open',
							});
						}
					} else {
						res.status(500).json({
							success: false,
							error: 'Could not find election',
						});
					}
				} else {
					res.status(500).json({
						success: false,
						error: 'Voter cannot cast their ballot unless they verified their ID',
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
