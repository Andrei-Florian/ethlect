import cryptosystem from '../../../Cryptosystem/index.js';

async function countBallots(_constituency, _largestUserID, _ballotsPerVoter) {
	try {
		const count = parseInt(process.env.NUMBER_OF_AUDITABLE_BALLOTS);
		const realCount = count * _ballotsPerVoter;

		let userID = _largestUserID;
		let voters = [];

		for (let i = 0; i < count; i++) {
			userID++;
			voters.push({ userID: userID, constituency: _constituency });
		}

		return {
			success: true,
			count: realCount,
			voters: voters,
			largestUserID: userID,
		};
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

function randomIntFromInterval(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

async function generatePlaintextBallots(_candidateIDs, _count) {
	try {
		let ballots = [];

		for (let i = 0; i < _count; i++) {
			let ballot = [];

			for (let j = 0; j < _candidateIDs.length; j++) {
				const candidateID = _candidateIDs[j].candidateID[i];
				ballot.push(candidateID);
			}

			ballots.push(ballot);
		}

		return { success: true, ballots: ballots };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function encryptCandidate(_candidate, _elgamal, x) {
	try {
		const encryptedCandidate = await cryptosystem.encryptMessage(
			_elgamal.g,
			_elgamal.p,
			_elgamal.y,
			x,
			_candidate.toString()
		);

		if (encryptedCandidate.success) {
			return {
				success: true,
				candidate: {
					encryptedCandidateID: JSON.stringify(
						encryptedCandidate.encryptedMessage
					),
					candidateID: _candidate,
				},
			};
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function shuffleArray(_candidates) {
	try {
		const shuffledCandidates = _candidates.sort();
		return { success: true, candidates: shuffledCandidates };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function parseObject(_candidates) {
	try {
		let ballots = [];

		for (let i = 0; i < _candidates.length; i++) {
			ballots.push(JSON.parse(_candidates[i]));
		}

		return { success: true, ballots: ballots };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function stringifyAndShuffle(_array) {
	try {
		let newArray = [];

		// stringify
		for (let i = 0; i < _array.length; i++) {
			newArray.push(JSON.stringify(_array[i]));
		}

		// shuffle
		const shuffledArray = await shuffleArray(newArray);

		if (shuffledArray.success) {
			// parse
			const parsedArray = await parseObject(shuffledArray.candidates);

			if (parsedArray.success) {
				return { success: true, shuffledArray: parsedArray.ballots };
			}
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function generateCandidateRep(_existingValues) {
	let candidateRep = randomIntFromInterval(100, 999);

	while (_existingValues.includes(candidateRep)) {
		candidateRep = randomIntFromInterval(100, 999);
	}

	return candidateRep;
}

async function generateBallotID(_existingValues) {
	let ballot = randomIntFromInterval(100000000, 999999999);

	while (_existingValues.includes(ballot)) {
		ballot = randomIntFromInterval(100000000, 999999999);
	}

	return ballot;
}

async function formatBallots(_ballots, _voters, _ballotsPerVoter, _ballotIDs) {
	try {
		let ballotIDs = _ballotIDs;
		let ballots = [];
		let plaintextBallots = [];

		const shuffledBallotSet = await stringifyAndShuffle(_ballots);

		if (shuffledBallotSet.success) {
			for (let i = 0; i < _voters.length; i++) {
				for (let j = 0; j < _ballotsPerVoter; j++) {
					const encryptedCandidates =
						shuffledBallotSet.shuffledArray[ballots.length];
					let candidateReps = [];
					let plaintextCandidates = [];
					let candidates = [];

					// generate a candidate rep for each candidate
					for (let k = 0; k < encryptedCandidates.length; k++) {
						const candidateRep = await generateCandidateRep(
							candidateReps
						);

						candidateReps.push(candidateRep);
						candidates.push({
							candidateRep: candidateRep,
							encryptedCandidateID:
								encryptedCandidates[k].encryptedCandidateID,
						});

						plaintextCandidates.push({
							candidateRep: candidateRep,
							candidateID: encryptedCandidates[k].candidateID,
						});
					}

					// shuffle the arrays
					const shuffledCandidates = await stringifyAndShuffle(
						candidates
					);
					if (!shuffledCandidates.success) return { success: false };

					const shuffledPlaintextCandidates =
						await stringifyAndShuffle(plaintextCandidates);
					if (!shuffledPlaintextCandidates.success)
						return { success: false };

					// get the ballot ID
					const ballotID = await generateBallotID(ballotIDs);
					ballotIDs.push(ballotID);

					// create the ballots
					const ballot = {
						ballotID: ballotID,
						userID: _voters[i].userID,
						constituency: _voters[i].constituency,
						candidates: shuffledCandidates.shuffledArray,
					};

					const plaintextBallot = {
						ballotID: ballotID,
						userID: _voters[i].userID,
						constituency: _voters[i].constituency,
						candidates: shuffledPlaintextCandidates.shuffledArray,
					};

					ballots.push(ballot);
					plaintextBallots.push(plaintextBallot);
				}
			}
		} else {
			return { success: false };
		}

		return {
			success: true,
			ballots: ballots,
			plaintextBallots: plaintextBallots,
			ballotIDs: ballotIDs,
		};
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function encryptBallot(_ballot, _elgamal, x) {
	try {
		let ballot = [];

		for (let i = 0; i < _ballot.length; i++) {
			console.log(`[INFO] Encrypting candidate ${i + 1}`);
			const candidate = await encryptCandidate(_ballot[i], _elgamal, x);

			if (candidate.success) {
				ballot.push(candidate.candidate);
			} else {
				return { success: false };
			}
		}

		return { success: true, ballot: ballot };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function encryptBallots(_ballots, _elgamal, x) {
	try {
		console.log(`[INFO] Encrypting ${_ballots.length} ballots`);
		let ballots = [];

		for (let i = 0; i < _ballots.length; i++) {
			console.log('');
			console.log(`[INFO] Encrypting ballot ${i + 1}`);
			const ballot = await encryptBallot(_ballots[i], _elgamal, x);

			if (ballot.success) {
				ballots.push(ballot.ballot);
			} else {
				return { success: false };
			}
		}

		return { success: true, ballots: ballots };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function generateCandidateIDs(_candidates, _count, _existingIDs) {
	try {
		let candidateDump = _existingIDs;
		let candidateIDs = [];

		for (let i = 0; i < _candidates.length; i++) {
			let ids = [];

			for (let j = 0; j < _count; j++) {
				let candidateID = randomIntFromInterval(100000000, 999999999);

				while (candidateDump.includes(candidateID)) {
					candidateID = randomIntFromInterval(100000000, 999999999);
				}

				ids.push(candidateID);
			}

			candidateDump = candidateDump.concat(ids);
			candidateIDs.push({
				candidateName: _candidates[i],
				candidateID: ids,
			});
		}

		return {
			success: true,
			candidateIDs: candidateIDs,
			candidateDump: candidateDump,
		};
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function createBallots(
	_elgamal,
	_constituencies,
	_ballotIDs,
	_candidateIDs,
	_largestUserID,
	x
) {
	try {
		const ballotsPerVoter = 2;
		let existingIDs = _candidateIDs;
		let existingBallotIDs = _ballotIDs;
		let largestUserID = _largestUserID;

		let inputBallots = [];
		let outputBallots = [];
		let ballots = [];
		let constituencies = [];

		// loop through the constituencies
		for (let i = 0; i < _constituencies.length; i++) {
			// define the number of ballots to generate per constituency
			const ballotsPerConstituency = await countBallots(
				_constituencies[i].constituency,
				largestUserID,
				ballotsPerVoter
			);

			if (ballotsPerConstituency.success) {
				if (ballotsPerConstituency.count > 0) {
					largestUserID = ballotsPerConstituency.largestUserID;

					console.log(
						`[INFO] Generating ${ballotsPerConstituency.count} ballots for ${_constituencies[i].constituency}`
					);

					// generate candidate IDs for all candidates in the election
					const candidateIDs = await generateCandidateIDs(
						_constituencies[i].candidates,
						ballotsPerConstituency.count,
						existingIDs
					);

					if (candidateIDs.success) {
						// add generated IDs to existingIDs array
						existingIDs = candidateIDs.candidateDump;

						// generate the plaintext ballots
						const plaintextBallots = await generatePlaintextBallots(
							candidateIDs.candidateIDs,
							ballotsPerConstituency.count
						);

						if (plaintextBallots.success) {
							// encrypt the ballots
							const encryptedBallots = await encryptBallots(
								plaintextBallots.ballots,
								_elgamal,
								x
							);

							if (encryptedBallots.success) {
								// format the ballots
								const formattedBallots = await formatBallots(
									encryptedBallots.ballots,
									ballotsPerConstituency.voters,
									ballotsPerVoter,
									existingBallotIDs
								);

								if (formattedBallots.success) {
									existingBallotIDs =
										formattedBallots.ballotIDs;

									// append data to the global arrays
									const formattedConstituency = {
										constituency:
											_constituencies[i].constituency,
										seats: _constituencies[i].seats,
										candidates: candidateIDs.candidateIDs,
									};

									ballots = [
										...ballots,
										...formattedBallots.ballots,
									];
									inputBallots = [
										...inputBallots,
										...formattedBallots.plaintextBallots,
									];
									outputBallots = [
										...outputBallots,
										...encryptedBallots.ballots,
									];
									constituencies.push(formattedConstituency);
								} else {
									return { success: false };
								}
							} else {
								return { success: false };
							}
						} else {
							return { success: false };
						}
					} else {
						return { success: false };
					}
				}
			} else {
				return { success: false };
			}
		}

		return {
			success: true,
			ballots: ballots,
			inputBallots: inputBallots,
			outputBallots: outputBallots,
			candidateIDs: constituencies,
		};
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function generateAuditableBallots(req, res) {
	try {
		if (req.method === 'POST') {
			const data = req.body.data;

			if (
				data.elgamal &&
				data.constituencies &&
				data.ballotIDs &&
				data.candidateIDs &&
				data.highestUserID
			) {
				// generate a local key
				const localKey = await cryptosystem.generateKey(data.elgamal.p);

				if (localKey.success) {
					// generate the ballots
					const ballots = await createBallots(
						data.elgamal,
						data.constituencies,
						data.ballotIDs,
						data.candidateIDs,
						data.highestUserID,
						localKey.x
					);

					if (ballots.success) {
						// sort the plaintext ballots alphabetically
						const sortedPlaintextBallots =
							await stringifyAndShuffle(ballots.inputBallots);

						if (sortedPlaintextBallots.success) {
							// create a hash of the plaintext ballots
							const hashedPlaintextBallots =
								await cryptosystem.createHash(
									JSON.stringify(
										sortedPlaintextBallots.shuffledArray
									)
								);

							if (hashedPlaintextBallots.success) {
								res.status(200).json({
									success: true,
									ballots: ballots.ballots,
									plaintextHash: hashedPlaintextBallots.hash,
								});
							} else {
								res.status(500).json({
									success: false,
									error: 'Failed to create hash of plaintext ballots',
								});
							}
						} else {
							res.status(500).json({
								success: false,
								error: 'Failed to shuffle plaintext ballots',
							});
						}
					} else {
						res.status(500).json({
							success: false,
							error: 'Failed to generate auditable ballots',
						});
					}
				} else {
					res.status(500).json({
						success: false,
						error: 'Failed to generate local key for encryption',
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
