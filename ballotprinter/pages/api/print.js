import dbConnect from '../../MongoDB/utils/backendConnection';
import Election from '../../MongoDB/models/Election';
import secrets from 'secrets.js-grempe';
import NodeRSA from 'node-rsa';
import crypto from 'crypto';

async function getElection(_electionID) {
	try {
		const election = await Election.findOne({ electionID: _electionID });

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

async function compileBallotAuditData(_elgamal, _constituencies, _ballots) {
	try {
		// extract the public ElGamal keys
		const elGamal = {
			g: _elgamal.g.toString(),
			p: _elgamal.p.toString(),
			y: _elgamal.y.toString(),
		};

		// get a list of constituencies and existing candidate IDs
		let constituencies = [];
		let candidateIDs = [];

		for (let i = 0; i < _constituencies.length; i++) {
			let candidates = [];

			for (let j = 0; j < _constituencies[i].candidates.length; j++) {
				candidates.push(_constituencies[i].candidates[j].candidateName);

				for (
					let k = 0;
					k < _constituencies[i].candidates[j].candidateID.length;
					k++
				) {
					candidateIDs.push(
						_constituencies[i].candidates[j].candidateID[k]
					);
				}
			}

			constituencies.push({
				constituency: _constituencies[i].constituency,
				candidates: candidates,
			});
		}

		// get a list of existing ballot IDs and highest userID
		let ballotIDs = [];
		let highestUserID = 0;

		for (let i = 0; i < _ballots.length; i++) {
			ballotIDs.push(_ballots[i].ballotID);

			if (_ballots[i].userID > highestUserID) {
				highestUserID = _ballots[i].userID;
			}
		}

		return {
			success: true,
			data: {
				elgamal: elGamal,
				constituencies: constituencies,
				ballotIDs: ballotIDs,
				candidateIDs: candidateIDs,
				highestUserID: highestUserID,
			},
		};
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function generateAuditableBallots(_data) {
	try {
		console.log('[INFO] Generating Auditable Ballots');
		const postRequest = JSON.stringify({
			data: _data,
		});

		// send the request
		const res = await fetch(
			process.env.PRIVATE_API_HELPER_GENERATEAUDITABLEBALLOTS,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: postRequest,
			}
		);

		const resJSON = await res.json();

		if (resJSON.success) {
			console.log('[Success] Generated Auditable Ballots');
			console.log('');

			return {
				success: true,
				data: {
					ballots: resJSON.ballots,
					plaintextHash: resJSON.plaintextHash,
				},
			};
		} else {
			console.log('[Error] Failed to Generate Auditable Ballots');
			console.log('');

			return { success: false, error: resJSON.error };
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

async function combineBallotSets(_ballotSet, _auditBallots) {
	try {
		// remove the _id property from the ballot set
		let ballotSet = [];

		for (let i = 0; i < _ballotSet.length; i++) {
			ballotSet.push({
				ballotID: _ballotSet[i].ballotID,
				userID: _ballotSet[i].userID,
				constituency: _ballotSet[i].constituency,
				candidates: _ballotSet[i].candidates,
			});
		}

		// combine the two ballot sets
		const combinedBallots = ballotSet.concat(_auditBallots);

		// shuffle the combined ballots
		const shuffledBallots = await stringifyAndShuffle(combinedBallots);
		if (!shuffledBallots.success) return { success: false };

		return {
			success: true,
			ballots: shuffledBallots.shuffledArray,
		};
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function decryptBallotSet(_data) {
	try {
		console.log('[INFO] Decrypting Ballot Set');
		const postRequest = JSON.stringify({
			data: _data,
		});

		// send the request
		const res = await fetch(process.env.PRIVATE_API_HELPER_DECRYPTBALLOTS, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: postRequest,
		});

		const resJSON = await res.json();

		if (resJSON.success) {
			console.log('[Success] Decrypted Ballot Set');
			console.log('');

			return {
				success: true,
				ballots: resJSON.ballots,
			};
		} else {
			console.log('[Error] Failed to Decrypt Ballot Set');
			console.log('');

			return { success: false, error: resJSON.error };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function extractAuditableBallots(_encryptedAuditableBallots, _ballots) {
	try {
		// get the ballotIDs from the auditable ballots
		let auditableBallotIDs = [];

		for (let i = 0; i < _encryptedAuditableBallots.length; i++) {
			auditableBallotIDs.push(_encryptedAuditableBallots[i].ballotID);
		}

		// separate the auditable ballots from the rest
		let auditableBallots = [];
		let nonAuditableBallots = [];

		for (let i = 0; i < _ballots.length; i++) {
			if (auditableBallotIDs.includes(_ballots[i].ballotID)) {
				auditableBallots.push(_ballots[i]);
			} else {
				nonAuditableBallots.push(_ballots[i]);
			}
		}

		return {
			success: true,
			ballots: {
				auditableBallots: auditableBallots,
				nonAuditableBallots: nonAuditableBallots,
			},
		};
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function verifyDecryption(_data) {
	try {
		console.log('[INFO] Verifying Process');
		const postRequest = JSON.stringify({
			data: _data,
		});

		// send the request
		const res = await fetch(
			process.env.PRIVATE_API_HELPER_VERIFYDECRYPTION,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: postRequest,
			}
		);

		const resJSON = await res.json();

		if (resJSON.success) {
			console.log('[Success] Verified Process');
			console.log('');

			return {
				success: true,
			};
		} else {
			console.log('[Error] Failed to Verify Process');
			console.log('');

			return { success: false, error: resJSON.error };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function matchBallots(_ballots, _constituencies) {
	try {
		// loop through the ballots
		let matchedBallots = [];

		for (let i = 0; i < _ballots.length; i++) {
			// identify the constituency of the ballot
			for (let j = 0; j < _constituencies.length; j++) {
				let candidates = [];

				if (
					_ballots[i].constituency.toLowerCase() ===
					_constituencies[j].constituency.toLowerCase()
				) {
					// identify the candidates of the ballot
					for (let k = 0; k < _ballots[i].candidates.length; k++) {
						for (
							let y = 0;
							y < _constituencies[j].candidates.length;
							y++
						) {
							if (
								_constituencies[j].candidates[
									y
								].candidateID.includes(
									_ballots[i].candidates[k].candidateID
								)
							) {
								candidates.push({
									candidateRep:
										_ballots[i].candidates[k].candidateRep,
									candidate:
										_constituencies[j].candidates[y]
											.candidateName,
								});
							}
						}
					}

					// add the ballot to the matched ballots
					matchedBallots.push({
						ballotID: _ballots[i].ballotID,
						userID: _ballots[i].userID,
						constituency: _ballots[i].constituency,
						candidates: candidates,
					});
				}
			}
		}

		// ensure that matchedBallots count is equal to ballots count
		if (matchedBallots.length !== _ballots.length) {
			return {
				success: false,
			};
		}

		return { success: true, ballots: matchedBallots };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function printBallots(req, res) {
	try {
		if (req.method === 'POST') {
			const connectionString = req.body.connectionString;
			const electionID = req.body.electionID;
			const thresholdKeys = req.body.keys;

			if (connectionString && electionID && thresholdKeys) {
				// connect to DB
				const connection = await dbConnect(connectionString);

				if (connection.success) {
					// attempt to read the election document
					const election = await getElection(electionID);

					if (election.success) {
						// get the election private key
						const privateElectionKey = await getElectionPrivateKey(
							election.election.rsaKeypair
						);

						// decrypt the keys received
						const decryptedThresholdKeys = await decryptKeys(
							thresholdKeys,
							privateElectionKey
						);

						if (decryptedThresholdKeys.success) {
							// combine the threshold keys into the original key
							const derivedPrivateKey = await getPrivateKey(
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

								if (hashedDerivedPrivateKey.success) {
									// compare the hashed public key with the hashed combined key
									const comparison = await compareKeys(
										hashedDerivedPrivateKey.key,
										elGamalObject.hashedPrivateKey
									);

									if (comparison.success) {
										// prepare the data for the generation of auditable ballots
										const ballotAuditData =
											await compileBallotAuditData(
												elGamalObject,
												election.election
													.constituencies,
												election.election.ballots
											);

										if (ballotAuditData.success) {
											// send data to API to generate auditable ballots
											const auditableBallots =
												await generateAuditableBallots(
													ballotAuditData.data
												);

											if (auditableBallots.success) {
												// shuffle the auditable ballots with the other ballots
												const combinedBallots =
													await combineBallotSets(
														election.election
															.ballots,
														auditableBallots.data
															.ballots
													);

												if (combinedBallots.success) {
													// send ballot set to API to decrypt the ballots
													const decryptedBallots =
														await decryptBallotSet({
															ballots:
																combinedBallots.ballots,
															elgamal:
																elGamalObject,
															privateKey:
																derivedPrivateKey.privateKey,
														});

													if (
														decryptedBallots.success
													) {
														const ballotSets =
															await extractAuditableBallots(
																auditableBallots
																	.data
																	.ballots,
																decryptedBallots.ballots
															);

														if (
															ballotSets.success
														) {
															// verify the decrypted auditable ballots
															const verifiedBallots =
																await verifyDecryption(
																	{
																		ballots:
																			ballotSets
																				.ballots
																				.auditableBallots,
																		decryptionHash:
																			auditableBallots
																				.data
																				.plaintextHash,
																	}
																);

															if (
																verifiedBallots.success
															) {
																// update the non-auditable decrypted ballots such that the IDs are replaced with candidate names
																const printableBallots =
																	await matchBallots(
																		ballotSets
																			.ballots
																			.nonAuditableBallots,
																		election
																			.election
																			.constituencies
																	);

																if (
																	printableBallots.success
																) {
																	res.status(
																		200
																	).json({
																		success: true,
																		data: {
																			encryptedBallots:
																				combinedBallots.ballots,
																			decryptedBallots:
																				decryptedBallots.ballots,
																			encryptedAuditableBallots:
																				auditableBallots
																					.data
																					.ballots,
																			decryptedAuditableBallotsHash:
																				auditableBallots
																					.data
																					.plaintextHash,
																			printableBallots:
																				printableBallots.ballots,
																		},
																	});
																} else {
																	res.status(
																		500
																	).json({
																		success: false,
																		error: 'Failed to match ballots',
																	});
																}
															} else {
																res.status(
																	500
																).json({
																	success: false,
																	error: 'Failed to verify printing process',
																});
															}
														} else {
															res.status(
																500
															).json({
																success: false,
																error: 'Failed to extract auditable ballots from ballot set',
															});
														}
													} else {
														res.status(500).json({
															success: false,
															error: 'Failed to decrypt ballots',
														});
													}
												} else {
													res.status(500).json({
														success: false,
														error: 'Failed to combine ballot sets',
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
												error: 'Failed to prepare data for ballot generation',
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
									error: 'Failed to Combine threshold keys',
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
							error: 'Connection to DB Failed',
						});
					}
				} else {
					res.status(500).json({
						success: false,
						error: 'Connection to DB Failed',
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
