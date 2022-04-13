import dbConnect from '../../../MongoDB/utils/backendConnection';
import Election from '../../../MongoDB/models/Election';
import { getSession } from 'next-auth/react';
import secrets from 'secrets.js-grempe';
import NodeRSA from 'node-rsa';
import crypto from 'crypto';
import cryptosystem from '../../../Cryptosystem/index';

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
		if (_shuffle.shuffleType === 'shuffle') {
			return { success: true, match: true };
		} else {
			return { success: true, match: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function getElectionPrivateKey(_rsaKeypair) {
	const rsaKeypairJSON = JSON.parse(_rsaKeypair);
	const privateElectionKey = rsaKeypairJSON.privateKey;

	return privateElectionKey;
}

async function decryptKeys(_encryptedKeys, _privateElectionKey) {
	try {
		let decryptedKeys = [];

		const key = new NodeRSA();
		key.importKey(_privateElectionKey.toString(), 'pkcs1-private-pem');

		for (let i = 0; i < _encryptedKeys.length; i++) {
			const encryptedKey = _encryptedKeys[i].key.toString();
			const decryptedKey = key.decrypt(encryptedKey, 'ascii');
			decryptedKeys.push(decryptedKey);
		}

		return { success: true, decryptedKeys: decryptedKeys };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function getPrivateKey(_thresholdKeys) {
	try {
		const privateKey = secrets.combine(_thresholdKeys);
		return { success: true, privateKey: privateKey };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function makeHash(val) {
	return crypto.createHash('sha384').update(val, 'utf8').digest();
}

async function hashElGamalPrivatekey(_privateKey, _salt) {
	try {
		const hashedPrivateKey = crypto
			.createHash('sha384')
			.update(_privateKey, 'utf8')
			.update(await makeHash(_salt))
			.digest('base64');
		return { success: true, key: hashedPrivateKey };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function compareKeys(_derivedKey, _actualKey) {
	if (_derivedKey === _actualKey) {
		return { success: true };
	} else {
		return { success: false };
	}
}

async function decryptCandidate(_candidate, _elgamal, x) {
	try {
		const newCandidate = await cryptosystem.decryptMessage(
			_elgamal.g,
			_elgamal.p,
			_elgamal.y,
			x,
			_candidate
		);

		if (newCandidate.success) {
			return {
				success: true,
				candidate: newCandidate.decryptedMessage.toString(),
			};
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function decryptBallot(_ballot, _elgamal, x) {
	try {
		let ballot = [];

		for (let j = 0; j < _ballot.length; j++) {
			const newCandidate = await decryptCandidate(
				_ballot[j],
				_elgamal,
				x
			);

			if (newCandidate.success) {
				console.log(`[INFO] Decrypted candidate ${j + 1}`);
				ballot.push(newCandidate.candidate);
			} else {
				console.log(`[ERROR] Failed to decrypt candidate ${j + 1}`);
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

async function decryptBallots(_ballots, _elgamal, x) {
	try {
		const ballotsJSON = JSON.parse(_ballots);
		let ballots = [];

		for (let i = 0; i < ballotsJSON.length; i++) {
			console.log(`[INFO] Decrypting ballot ${i + 1}`);

			const newBallot = await decryptBallot(ballotsJSON[i], _elgamal, x);

			if (newBallot.success) {
				console.log(`[SUCCESS] Decrypted ballot ${i + 1}`);
				console.log('');
				ballots.push(newBallot.ballot);
			} else {
				console.log(`[ERROR] Failed to decrypt ballot ${i + 1}`);
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

async function matchCandidate(_candidateID, _candidates) {
	try {
		console.log(`[INFO] Matching candidate ${_candidateID}`);
		console.log(_candidates);

		for (let i = 0; i < _candidates.length; i++) {
			for (let j = 0; j < _candidates[i].candidateID.length; j++) {
				if (_candidates[i].candidateID[j] == _candidateID) {
					return {
						success: true,
						candidate: _candidates[i].candidateName,
					};
				}
			}
		}

		return { success: false };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function createResults(_ballots, _constituencies) {
	try {
		console.log('[INFO] Creating results');

		// combine candidates
		let candidates = [];

		for (let i = 0; i < _constituencies.length; i++) {
			for (let j = 0; j < _constituencies[i].candidates.length; j++) {
				candidates.push(_constituencies[i].candidates[j]);
			}
		}

		// loop through the ballots
		let results = [];

		for (let i = 0; i < _ballots.length; i++) {
			let result = [];

			// loop through the candidates
			for (let j = 0; j < _ballots[i].length; j++) {
				const candidate = await matchCandidate(
					_ballots[i][j],
					candidates
				);

				if (candidate.success) {
					result.push(candidate.candidate);
				} else {
					return { success: false };
				}
			}

			results.push(JSON.stringify(result));
		}

		return { success: true, results: results };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function generateProof(_inputBallots, _outputBallots, _elgamal, _key) {
	try {
		let proofs = [];

		console.log('[INFO] Generating proof');

		// check that the input and output ballots are the same length
		if (_inputBallots.length != _outputBallots.length) {
			return { success: false };
		}

		// generate a random value
		const randomValue = await cryptosystem.generateKey(_elgamal.p);

		if (randomValue.success) {
			for (let i = 0; i < _inputBallots.length; i++) {
				console.log(`[INFO] Generating proof ${i + 1}`);
				let ballotProofs = [];

				for (let j = 0; j < _inputBallots[i].length; j++) {
					const proof = await cryptosystem.createDecryptionProof(
						randomValue.x,
						_elgamal.g,
						_elgamal.p,
						_key,
						_inputBallots[i][j]
					);

					if (proof.success) {
						// format the proof object
						const proofObject = {
							inputCandidate: _inputBallots[i][j],
							outputCandidate: _outputBallots[i][j],
							proof: proof.proof,
						};

						// add the proof object to the array
						ballotProofs.push(proofObject);
					} else {
						return { success: false };
					}
				}

				proofs.push(ballotProofs);
			}
		} else {
			return { success: false };
		}

		const elGamalObj = {
			p: _elgamal.p,
			g: _elgamal.g,
			y: _elgamal.y,
		};

		// create the proof object
		const proofObj = {
			elGamal: JSON.stringify(elGamalObj),
			inputBallots: JSON.stringify(_inputBallots),
			outputBallots: JSON.stringify(_outputBallots),
			interactiveProof: JSON.stringify(proofs),
		};

		console.log('[Success] Generated proofs');
		return { success: true, proof: proofObj };
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
	_electionResults,
	_proof
) {
	try {
		const ballotSetObj = {
			shuffleID: _shuffleID,
			inputBallots: _lastBallots,
			outputBallots: JSON.stringify(_ballots),
			approved: true,
			shuffleType: 'decryption',
			proof: _proof,
		};

		const election = await Election.findOneAndUpdate(
			{
				electionID: _electionID,
			},
			{
				electionComplete: true,
				electionResults: _electionResults,
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

export default async function decrypt(req, res) {
	if (req.method === 'POST') {
		const session = await getSession({ req });

		if (session && session.user) {
			if (session.user.accountType === 'admin') {
				const data = req.body;
				const electionID = data.electionID;

				// check that all data is sent
				if (electionID && data.keys) {
					// get the election with the provided ID
					const election = await getElection(electionID);

					if (election.success) {
						// extract the last shuffle from the shuffles array
						const lastShuffle =
							election.election.shuffles[
								election.election.shuffles.length - 1
							];

						if (lastShuffle) {
							// check that the last shuffle is of type shuffle
							const checkShuffle = await checkShuffleType(
								lastShuffle
							);

							if (checkShuffle.success && checkShuffle.match) {
								// check if last shuffle is approved
								if (lastShuffle.approved) {
									// get the election private key
									const privateElectionKey =
										await getElectionPrivateKey(
											election.election.rsaKeypair
										);

									// decrypt the keys received
									const decryptedThresholdKeys =
										await decryptKeys(
											data.keys,
											privateElectionKey
										);

									if (decryptedThresholdKeys.success) {
										// combine the threshold keys into the original key
										const derivedPrivateKey =
											await getPrivateKey(
												decryptedThresholdKeys.decryptedKeys
											);

										if (derivedPrivateKey.success) {
											// get the elGamal object from the election document
											const elGamalObject = JSON.parse(
												election.election.elGamal
											);

											// hash the combined key
											const hashedDerivedPrivateKey =
												await hashElGamalPrivatekey(
													derivedPrivateKey.privateKey,
													elGamalObject.salt
												);

											if (
												hashedDerivedPrivateKey.success
											) {
												// compare the hashed public key with the hashed combined key
												const comparison =
													await compareKeys(
														hashedDerivedPrivateKey.key,
														elGamalObject.hashedPrivateKey
													);

												if (comparison.success) {
													// decrypt all ballots
													const decryptedBallots =
														await decryptBallots(
															lastShuffle.outputBallots,
															elGamalObject,
															derivedPrivateKey.privateKey
														);

													if (
														decryptedBallots.success
													) {
														// parse the ballots object
														const parsedBallots =
															await parseObject(
																decryptedBallots.ballots
															);

														if (
															parsedBallots.success
														) {
															// get shuffle ID
															const shuffleID =
																await getShuffleID(
																	election
																		.election
																		.shuffles
																);

															if (
																shuffleID.success
															) {
																// convert the candidate IDs to names
																const electionResults =
																	await createResults(
																		parsedBallots.ballots,
																		election
																			.election
																			.constituencies
																	);

																if (
																	electionResults.success
																) {
																	// generate proof of decryption
																	const proof =
																		await generateProof(
																			JSON.parse(
																				lastShuffle.outputBallots
																			),
																			parsedBallots.ballots,
																			elGamalObject,
																			derivedPrivateKey.privateKey
																		);

																	if (
																		proof.success
																	) {
																		// add the shuffle to the database
																		const addShuffle =
																			await addShuffleToDB(
																				election
																					.election
																					.electionID,
																				lastShuffle.outputBallots,
																				parsedBallots.ballots,
																				shuffleID.shuffleID,
																				electionResults.results,
																				proof.proof
																			);

																		if (
																			addShuffle.success
																		) {
																			res.status(
																				200
																			).json(
																				{
																					success: true,
																				}
																			);
																		} else {
																			res.status(
																				500
																			).json(
																				{
																					success: false,
																					error: 'Could not update election',
																				}
																			);
																		}
																	} else {
																		res.status(
																			500
																		).json({
																			success: false,
																			error: 'Could not generate proof of decryption',
																		});
																	}
																} else {
																	res.status(
																		500
																	).json({
																		success: false,
																		error: 'Failed to create results',
																	});
																}
															} else {
																res.status(
																	500
																).json({
																	success: false,
																	error: 'Failed to Get a Shuffle ID',
																});
															}
														} else {
															res.status(
																500
															).json({
																success: false,
																error: 'Failed to Parse Decrypted Ballots',
															});
														}
													} else {
														res.status(500).json({
															success: false,
															error: 'Failed to Decrypt Ballots',
														});
													}
												} else {
													res.status(500).json({
														success: false,
														error: "The combined private key does not match the ElGamal Private Key's Hash",
													});
												}
											} else {
												res.status(500).json({
													success: false,
													error: 'Failed to hash the combined key',
												});
											}
										} else {
											res.status(500).json({
												success: false,
												error: 'Failed to Combine the keys',
											});
										}
									} else {
										res.status(500).json({
											success: false,
											error: 'Failed to Decrypt Provided Threshold Keys',
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
									error: 'Last shuffle is not of type shuffle',
								});
							}
						} else {
							res.status(500).json({
								success: false,
								error: 'Could not find shuffles',
							});
						}
					} else {
						res.status(500).json({
							success: false,
							error: 'Could not find election with provided ID',
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
