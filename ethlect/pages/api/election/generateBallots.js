import dbConnect from '../../../MongoDB/utils/backendConnection';
import Authentication from '../../../MongoDB/models/Authentication';
import Election from '../../../MongoDB/models/Election';
import { getSession } from 'next-auth/react';
import cryptosystem from '../../../Cryptosystem/index.js';
import crypto from 'crypto';

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

async function deconstructElgamalObject(_elgamal) {
	try {
		const elgamalJSON = JSON.parse(_elgamal);
		return { success: true, instance: elgamalJSON };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function getVoters() {
	try {
		// get all documents from the authentication database
		const voters = await Authentication.find({
			accountType: 'voter',
			accountVerified: true,
			idVerified: 'true',
		});

		// return the data
		if (voters) {
			return { success: true, voters: voters };
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function checkConstituency(_voterConstituency, _constituency) {
	if (_constituency.toLowerCase() === _voterConstituency.toLowerCase()) {
		return true;
	}

	return false;
}

function randomIntFromInterval(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
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

async function countBallots(_constituency, _voters, _ballotsPerVoter) {
	try {
		let count = 0;
		let voters = [];

		for (let i = 0; i < _voters.length; i++) {
			const valid = await checkConstituency(
				_voters[i].constituency,
				_constituency
			);

			if (valid) {
				count++;
				voters.push(_voters[i]);
			}
		}

		const realCount = count * _ballotsPerVoter;
		return { success: true, count: realCount, voters: voters };
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
				let candidateID = randomIntFromInterval(100000, 999999);

				while (candidateDump.includes(candidateID)) {
					candidateID = randomIntFromInterval(100000, 999999);
				}

				ids.push(candidateID);
			}

			candidateDump = candidateDump.concat(ids);
			candidateIDs.push({
				candidateName: _candidates[i].candidateName,
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
				candidate: JSON.stringify(encryptedCandidate.encryptedMessage),
			};
		} else {
			return { success: false };
		}
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

async function formatBallots(_ballots, _voters, _ballotsPerVoter, _ballotIDs) {
	try {
		let ballotIDs = _ballotIDs;
		let ballots = [];

		const shuffledBallotSet = await stringifyAndShuffle(_ballots);

		if (shuffledBallotSet.success) {
			for (let i = 0; i < _voters.length; i++) {
				for (let j = 0; j < _ballotsPerVoter; j++) {
					const encryptedCandidates =
						shuffledBallotSet.shuffledArray[ballots.length];
					let candidateReps = [];
					let candidates = [];

					// generate a candidate rep for each candidate
					for (let k = 0; k < encryptedCandidates.length; k++) {
						const candidateRep = await generateCandidateRep(
							candidateReps
						);

						candidateReps.push(candidateRep);
						candidates.push({
							candidateRep: candidateRep,
							encryptedCandidateID: encryptedCandidates[k],
						});
					}

					// shuffle the array
					const shuffledCandidates = await stringifyAndShuffle(
						candidates
					);

					if (shuffledCandidates.success) {
						// get the ballot ID
						const ballotID = await generateBallotID(ballotIDs);
						ballotIDs.push(ballotID);

						// create the ballot
						const ballot = {
							ballotID: ballotID,
							userID: _voters[i].userID,
							constituency: _voters[i].constituency,
							candidates: shuffledCandidates.shuffledArray,
						};

						ballots.push(ballot);
					} else {
						return { success: false };
					}
				}
			}
		} else {
			return { success: false };
		}

		return { success: true, ballots: ballots, ballotIDs: ballotIDs };
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

async function createBallots(_elgamal, _constituencies, _voters, x) {
	try {
		const ballotsPerVoter = 2; // defines the number of ballots to be generated per registered voter
		let existingIDs = [];
		let existingBallotIDs = [];

		let inputBallots = [];
		let outputBallots = [];
		let ballots = [];
		let constituencies = [];

		// loop through the constituencies
		for (let i = 0; i < _constituencies.length; i++) {
			// define the number of ballots to generate per constituency
			const ballotsPerConstituency = await countBallots(
				_constituencies[i].constituency,
				_voters,
				ballotsPerVoter
			);

			if (ballotsPerConstituency.success) {
				if (ballotsPerConstituency.count > 0) {
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
										...plaintextBallots.ballots,
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

async function shuffleBallotSet(_ballots) {
	try {
		const ballots = [];

		for (let i = 0; i < _ballots.length; i++) {
			const shuffledBallot = await stringifyAndShuffle(_ballots[i]);

			if (!shuffledBallot.success) {
				return { success: false };
			}

			ballots.push(shuffledBallot.shuffledArray);
		}

		const shuffledBallotSet = await stringifyAndShuffle(ballots);

		if (!shuffledBallotSet.success) {
			return { success: false };
		}

		return { success: true, ballotSet: shuffledBallotSet.shuffledArray };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function createBallotSetsForProof(_inputBallots, _elgamal, n) {
	try {
		console.log(`[INFO] Creating ${n} ballot sets for proof`);
		let ballotSets = [];

		for (let i = 0; i < n; i++) {
			console.log('');
			console.log(
				`[INFO] Re-encrypting ballot set ${i + 1}/${n} for proof`
			);

			// generate a random encryption key
			const key = await cryptosystem.generateKey(_elgamal.p);

			if (key.success) {
				// re-encrypt the input ballot set with the new key
				const reEncryptedBallots = await encryptBallots(
					_inputBallots,
					_elgamal,
					key.x
				);

				if (reEncryptedBallots.success) {
					// shuffle the ballots
					const shuffledBallots = await shuffleBallotSet(
						reEncryptedBallots.ballots
					);

					if (shuffledBallots.success) {
						// add result to the ballot object
						const ballotSet = {
							ballots: reEncryptedBallots.ballots,
							shuffledBallots: shuffledBallots.ballotSet,
							key: key.x,
						};

						ballotSets.push(ballotSet);
					} else {
						console.log(
							`[ERROR] [Re-encryption ${i}] Failed to shuffle ballots`
						);
						return { success: false };
					}
				} else {
					console.log(
						`[ERROR] [Re-encryption ${i}] Failed to re-encrypt ballots`
					);
					return { success: false };
				}
			} else {
				console.log(
					`[ERROR] [Re-encryption ${i}] Failed to generate encryption key`
				);
				return { success: false };
			}
		}

		return { success: true, ballots: ballotSets };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function makeHash(val) {
	return crypto.createHash('sha256').update(val, 'utf8').digest();
}

function convertString(_input) {
	try {
		let bits = [];

		for (let i = 0; i < _input.length; i++) {
			bits += _input[i].charCodeAt(0).toString(2);
		}

		return { success: true, bits: bits };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function generateChallengeBits(_ballots, n) {
	try {
		// deconstruct the ballot sets
		let ballots = [];

		for (let i = 0; i < _ballots.length; i++) {
			ballots.push(_ballots[i].shuffledBallots);
		}

		// stringify the ballot sets
		const ballotsJSON = JSON.stringify(ballots);

		// create hash of the ballot sets
		const hash = await makeHash(ballotsJSON);

		// convert hash to string
		const bytes = Buffer.from(hash).toString('hex');

		// split the bits into an array
		const bytesArray = bytes.split('');

		// convert array to bits
		const bitsArray = convertString(bytesArray);

		console.log('hash', bitsArray.bits);

		if (bitsArray.success) {
			// get the first n bits
			const bits = bitsArray.bits.substring(bitsArray.bits.length - n, n);

			return { success: true, bits: bits };
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function createProof(
	_ballots,
	_inputBallots,
	_outputBallots,
	_challengeBits,
	_elgamal,
	x,
	n
) {
	try {
		let proofs = [];

		for (let i = 0; i < n; i++) {
			if (_ballots[i] && _challengeBits[i] && _outputBallots) {
				if (_challengeBits[i] == 0) {
					// create first proof
					const proof = await cryptosystem.createFirstProof(
						_inputBallots,
						_ballots[i].ballots,
						_ballots[i].key,
						true
					);

					if (proof.success) {
						proofs.push(proof.proof);
					} else {
						console.log(
							`[ERROR] [Proof ${i}] Failed to create first proof`
						);
						return { success: false };
					}
				} else {
					// create second proof
					const proof = await cryptosystem.createSecondProof(
						_ballots[i].ballots,
						_outputBallots,
						_elgamal.p,
						_ballots[i].key,
						x,
						true
					);

					if (proof.success) {
						proofs.push(proof.proof);
					} else {
						console.log(
							`[ERROR] [Proof ${i}] Failed to create second proof`
						);
						return { success: false };
					}
				}
			} else {
				console.log(
					`[ERROR] [Proof ${i}] Missing ballot or challenge bit`
				);
				return { success: false };
			}

			console.log(
				`[INFO] [Proof ${i}] Created ${
					_challengeBits[i] == 0 ? 'first' : 'second'
				} proof`
			);
		}

		return { success: true, proofs: proofs };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function createZeroKnowledgeProof(
	_inputBallots,
	_outputBallots,
	_elgamal,
	_key
) {
	try {
		const n = parseInt(process.env.NUMBER_OF_PROOFS);

		// generate n number of ballots
		const ballotSets = await createBallotSetsForProof(
			_inputBallots,
			_elgamal,
			n
		);

		if (ballotSets.success) {
			console.log(`[Success] Generated ${n} ballots`);

			// generate challenge bits
			const challengeBits = await generateChallengeBits(
				ballotSets.ballots,
				n
			);

			if (challengeBits.success) {
				console.log(`[Success] Generated challenge bits`);

				// create the zero knowledge proof
				const proof = await createProof(
					ballotSets.ballots,
					_inputBallots,
					_outputBallots,
					challengeBits.bits,
					_elgamal,
					_key,
					n
				);

				if (proof.success) {
					console.log(`[Success] Created zero knowledge proof`);
					return {
						success: true,
						proof: proof.proofs,
						ballotSets: ballotSets.ballots,
					};
				} else {
					console.log(
						`[Error] Failed to create zero knowledge proof`
					);
					return { success: false };
				}
			} else {
				console.log(`[Error] Failed to generate challenge bits`);
				return { success: false };
			}
		} else {
			console.log(`[Error] Failed to generate ballots`);
			return { success: false };
		}
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

async function parseOutputBallots(_outputBallots) {
	try {
		let parsedBallots = [];

		for (let i = 0; i < _outputBallots.length; i++) {
			const ballot = await parseObject(_outputBallots[i]);
			if (!ballot.success) return { success: false };

			parsedBallots.push(ballot.ballots);
		}

		return { success: true, ballots: parsedBallots };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function parseGeneratedBallots(_generatedBallots) {
	try {
		let proofs = [];

		for (let i = 0; i < _generatedBallots.length; i++) {
			let ballots = [];

			for (
				let j = 0;
				j < _generatedBallots[i].shuffledBallots.length;
				j++
			) {
				const ballot = await parseObject(
					_generatedBallots[i].shuffledBallots[j]
				);
				if (!ballot.success) return { success: false };

				ballots.push(ballot.ballots);
			}

			proofs.push(JSON.stringify(ballots));
		}

		return { success: true, proofs: proofs };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function addBallotsToDB(
	_ballots,
	_electionID,
	_constituencies,
	_proof,
	_privateKey,
	_elgamal,
	_inputBallots,
	_outputBallots,
	_generatedBallots,
	_shuffleID
) {
	try {
		const outputBallots = await parseOutputBallots(_outputBallots);
		if (!outputBallots.success) return { success: false };

		const generatedBallots = await parseGeneratedBallots(_generatedBallots);
		if (!generatedBallots.success) return { success: false };

		const elGamalObj = {
			p: _elgamal.p,
			g: _elgamal.g,
			y: _elgamal.y,
		};

		const proofObj = {
			elGamal: JSON.stringify(elGamalObj),
			inputBallots: JSON.stringify(_inputBallots),
			generatedBallots: generatedBallots.proofs,
			outputBallots: JSON.stringify(outputBallots.ballots),
			interactiveProof: JSON.stringify(_proof),
		};

		const shuffleObj = {
			shuffleID: _shuffleID,
			shuffleType: 'generate',
			inputBallots: JSON.stringify(_inputBallots),
			outputBallots: JSON.stringify(outputBallots.ballots),
			proof: proofObj,
			approved: true,
		};

		const res = await Election.findOneAndUpdate(
			{ electionID: _electionID },
			{
				ballots: _ballots,
				constituencies: _constituencies,
				privateEncryptionkey: _privateKey,
				$push: { shuffles: shuffleObj },
			}
		);

		if (res) {
			return { success: true };
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function generateBallots(req, res) {
	if (req.method === 'POST') {
		const session = await getSession({ req });

		if (session && session.user) {
			if (session.user.accountType === 'admin') {
				const data = req.body;

				if (data.electionID) {
					// get the election document
					const electionDocument = await getElectionDocument(
						data.electionID
					);

					if (electionDocument.success) {
						// check if the election is terminated
						if (!electionDocument.election.electionTabulating) {
							// destructure the ElGamal object from the election document
							const elgamal = await deconstructElgamalObject(
								electionDocument.election.elGamal
							);

							if (elgamal.success) {
								// get the voters from the database
								const voters = await getVoters();

								if (voters.success) {
									// generate a local key
									const localX =
										await cryptosystem.generateKey(
											elgamal.instance.p
										);

									if (localX.success) {
										// generate the ballots
										const ballots = await createBallots(
											elgamal.instance,
											electionDocument.election
												.constituencies,
											voters.voters,
											localX.x
										);

										if (ballots.success) {
											// get shuffle ID
											const shuffleID =
												await getShuffleID(
													electionDocument.election
														.shuffles
												);

											if (shuffleID.success) {
												// create proof
												const proof =
													await createZeroKnowledgeProof(
														ballots.inputBallots,
														ballots.outputBallots,
														elgamal.instance,
														localX.x
													);
												if (proof.success) {
													// shuffle the encrypted ballot set
													const shuffledBallots =
														await shuffleBallotSet(
															ballots.outputBallots
														);

													if (
														shuffledBallots.success
													) {
														// add ballots to ballot database
														const ballotsAdded =
															await addBallotsToDB(
																ballots.ballots,
																data.electionID,
																ballots.candidateIDs,
																proof.proof,
																localX.x,
																elgamal.instance,
																ballots.inputBallots,
																shuffledBallots.ballotSet,
																proof.ballotSets,
																shuffleID.shuffleID
															);

														if (
															ballotsAdded.success
														) {
															res.status(
																200
															).json({
																success: true,
															});
														} else {
															res.status(
																500
															).json({
																success: false,
																error: 'Failed to add ballots to database',
															});
														}
													} else {
														res.status(500).json({
															success: false,
															error: 'Failed to add ballots to database',
														});
													}
												} else {
													res.status(500).json({
														success: false,
														error: 'Failed to create proof',
													});
												}
											} else {
												res.status(500).json({
													success: false,
													error: 'Failed to get shuffle ID',
												});
											}
										} else {
											res.status(500).json({
												success: false,
												error: 'Failed to generate ballots',
											});
										}
									} else {
										res.status(500).json({
											success: false,
											error: 'Failed to generate local key for encryption',
										});
									}
								} else {
									res.status(500).json({
										success: false,
										error: 'Failed to get voters from database',
									});
								}
							} else {
								res.status(500).json({
									success: false,
									error: 'Failed to extract ElGamal Instance',
								});
							}
						} else {
							res.status(500).json({
								success: false,
								error: 'The Election is terminated and Ballots can no longer be Generated!',
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
