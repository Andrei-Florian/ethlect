import dbConnect from '../../../MongoDB/utils/backendConnection';
import Election from '../../../MongoDB/models/Election';
import { getSession } from 'next-auth/react';
import cryptosystem from '../../../Cryptosystem/index';
import crypto from 'crypto';

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

async function checkShuffleType(_shuffle) {
	try {
		if (
			_shuffle.shuffleType === 'transfer' ||
			_shuffle.shuffleType === 'shuffle'
		) {
			return { success: true, match: true };
		} else {
			return { success: true, match: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function reEncryptCandidate(_candidate, _elgamal, x) {
	try {
		const newCandidate = await cryptosystem.reEncryptMessage(
			_elgamal.g,
			_elgamal.p,
			_elgamal.y,
			x,
			_candidate
		);

		if (newCandidate.success) {
			return { success: true, candidate: newCandidate.encryptedMessage };
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function reEncryptBallot(_ballot, _elgamal, x) {
	try {
		let ballot = [];

		for (let j = 0; j < _ballot.length; j++) {
			const newCandidate = await reEncryptCandidate(
				_ballot[j],
				_elgamal,
				x
			);

			if (newCandidate.success) {
				console.log(`[INFO] Re-encrypted candidate ${j + 1}`);
				ballot.push(newCandidate.candidate);
			} else {
				console.log(`[ERROR] Failed to re-encrypt candidate ${j + 1}`);
				return { success: false };
			}
		}

		const ballotString = JSON.stringify(ballot);
		return { success: true, ballot: ballotString };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function reEncryptBallots(_ballots, _elgamal, x) {
	try {
		let ballots = [];

		for (let i = 0; i < _ballots.length; i++) {
			console.log(`[INFO] Re-encrypting ballot ${i + 1}`);
			const newBallot = await reEncryptBallot(_ballots[i], _elgamal, x);

			if (newBallot.success) {
				console.log(`[SUCCESS] Re-encrypted ballot ${i + 1}`);
				console.log('');

				ballots.push(newBallot.ballot);
			} else {
				console.log(`[ERROR] Failed to re-encrypt ballot ${i}`);
				console.log('');
				return { success: false };
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

async function parseObject(_ballots) {
	try {
		let ballots = [];

		for (let i = 0; i < _ballots.length; i++) {
			ballots.push(JSON.parse(_ballots[i]));
		}

		return { success: true, ballots: ballots };
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

async function createBallotSetsForProof(_inputBallots, _elgamal, n) {
	try {
		console.log(`[INFO] Creating ${n} ballot sets for proof`);
		let ballots = [];

		for (let i = 0; i < n; i++) {
			console.log('');
			console.log(
				`[INFO] Re-encrypting ballot set ${i + 1}/${n} for proof`
			);

			// generate a random encryption key
			const key = await cryptosystem.generateKey(_elgamal.p);

			if (key.success) {
				// re-encrypt the input ballot set with the new key
				const reEncryptedBallots = await reEncryptBallots(
					_inputBallots,
					_elgamal,
					key.x
				);

				if (reEncryptedBallots.success) {
					// parse the ballots
					const parsedBallots = await parseObject(
						reEncryptedBallots.ballots
					);

					if (parsedBallots.success) {
						// shuffle the re-encrypted ballots
						const shuffledBallots = await stringifyAndShuffle(
							parsedBallots.ballots
						);

						if (shuffledBallots.success) {
							// add result to the ballot object
							const ballot = {
								ballots: parsedBallots.ballots,
								shuffledBallots: shuffledBallots.shuffledArray,
								key: key.x,
							};

							ballots.push(ballot);
						} else {
							console.log(
								`[ERROR] [Re-encryption ${i}] Failed to shuffle ballots`
							);
							return { success: false };
						}
					} else {
						console.log(
							`[ERROR] [Re-encryption ${i}] Failed to parse ballots`
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

		return { success: true, ballots: ballots };
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

		if (bitsArray.success) {
			// get the first n bits
			const bits = bitsArray.bits.substring(
				bitsArray.bits.length - n,
				bitsArray.bits.length
			);

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
			if (_ballots[i] && _challengeBits[i]) {
				if (_challengeBits[i] == 0) {
					// create first proof
					const proof = await cryptosystem.createFirstProof(
						_inputBallots,
						_ballots[i].ballots,
						_ballots[i].key,
						false
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
						false
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

		// generate n number of balltos
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
				const ballot = _generatedBallots[i].shuffledBallots[j];
				ballots.push(ballot);
			}

			proofs.push(JSON.stringify(ballots));
		}

		return { success: true, proofs: proofs };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function addShuffleToDB(
	_electionID,
	_lastBallots,
	_ballots,
	_shuffleID,
	_elgamal,
	_shuffleProof,
	_generatedBallots
) {
	try {
		const generatedBallots = await parseGeneratedBallots(_generatedBallots);
		if (!generatedBallots.success) return { success: false };

		const elGamalObj = {
			p: _elgamal.p,
			g: _elgamal.g,
			y: _elgamal.y,
		};

		const proofObj = {
			elGamal: JSON.stringify(elGamalObj),
			inputBallots: _lastBallots,
			generatedBallots: generatedBallots.proofs,
			outputBallots: JSON.stringify(_ballots),
			interactiveProof: JSON.stringify(_shuffleProof),
		};

		const ballotSetObj = {
			shuffleID: _shuffleID,
			inputBallots: _lastBallots,
			outputBallots: JSON.stringify(_ballots),
			approved: false,
			shuffleType: 'shuffle',
			proof: proofObj,
		};

		const election = await Election.findOneAndUpdate(
			{
				electionID: _electionID,
			},
			{
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

export default async function shuffle(req, res) {
	if (req.method === 'POST') {
		const session = await getSession({ req });

		if (session && session.user) {
			if (session.user.accountType === 'admin') {
				const data = req.body;
				const electionID = data.electionID;

				// get the election with the provided ID
				const election = await getElection(electionID);

				if (election.success) {
					// extract the last shuffle from the shuffles array
					const lastShuffle =
						election.election.shuffles[
							election.election.shuffles.length - 1
						];

					if (lastShuffle) {
						// check to ensure the previous shuffle is of type transfer or shuffle
						const checkShuffle = await checkShuffleType(
							lastShuffle
						);

						if (checkShuffle.success && checkShuffle.match) {
							// check if last shuffle is approved
							if (lastShuffle.approved) {
								// extract the elgamal instance from the document
								const elgamal = JSON.parse(
									election.election.elGamal
								);

								// generate encryption key
								const key = await cryptosystem.generateKey(
									elgamal.p
								);

								if (key.success) {
									// re-encrypt all ballots
									const newBallots = await reEncryptBallots(
										JSON.parse(lastShuffle.outputBallots),
										elgamal,
										key.x
									);

									if (newBallots.success) {
										// get shuffle ID
										const shuffleID = await getShuffleID(
											election.election.shuffles
										);

										if (shuffleID.success) {
											// convert the ballots to object
											const parsedBallots =
												await parseObject(
													newBallots.ballots
												);

											if (parsedBallots.success) {
												// create proof
												const proof =
													await createZeroKnowledgeProof(
														JSON.parse(
															lastShuffle.outputBallots
														),
														parsedBallots.ballots,
														elgamal,
														key.x
													);

												if (proof.success) {
													// shuffle the output ballots
													const shuffledBallots =
														await stringifyAndShuffle(
															parsedBallots.ballots
														);

													if (
														shuffledBallots.success
													) {
														// add the shuffle to the database
														const addShuffle =
															await addShuffleToDB(
																election
																	.election
																	.electionID,
																lastShuffle.outputBallots,
																shuffledBallots.shuffledArray,
																shuffleID.shuffleID,
																elgamal,
																proof.proof,
																proof.ballotSets
															);

														if (
															addShuffle.success
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
																error: 'Could not update election',
															});
														}
													} else {
														res.status(500).json({
															success: false,
															error: 'Failed to shuffle ballots',
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
													error: 'Failed to parse the ballots',
												});
											}
										} else {
											res.status(500).json({
												success: false,
												error: 'Failed to get a shuffle ID for the new shuffle',
											});
										}
									} else {
										res.status(500).json({
											success: false,
											error: 'Failed to re-encrypt ballots',
										});
									}
								} else {
									res.status(500).json({
										success: false,
										error: 'Failed to generate encryption key',
									});
								}
							} else {
								res.status(500).json({
									success: false,
									error: 'Last shuffle is not approved',
								});
							}
						} else {
							res.status(500).json({
								success: false,
								error: 'Last shuffle is not of type transfer or shuffle',
							});
						}
					} else {
						res.status(500).json({
							success: false,
							error: 'Failed to get last shuffle',
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
