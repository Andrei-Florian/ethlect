import dbConnect from '../../../MongoDB/utils/backendConnection';
import Election from '../../../MongoDB/models/Election';
import cryptosystem from '../../../Cryptosystem/index.js';
import { getSession } from 'next-auth/react';
import secrets from 'secrets.js-grempe';
import NodeRSA from 'node-rsa';
import crypto from 'crypto';

dbConnect(process.env.DB_CONNECTION);

async function getElectionID() {
	try {
		// get the last document in the collection
		const lastElection = await Election.findOne({})
			.sort({
				_id: -1,
			})
			.limit(1);

		if (lastElection === null) {
			return { success: true, documentCount: 1 };
		} else {
			return {
				success: true,
				documentCount: lastElection.electionID + 1,
			};
		}
	} catch (error) {
		console.log(error);
		return { success: false, error: error };
	}
}

async function generateLocalDatabase(_data) {
	try {
		let constituencies = [];

		for (let i = 0; i < _data.length; i++) {
			let constituency = {};
			constituency.constituency = _data[i].Constituency;
			constituency.seats = _data[i].Seats;
			constituency.candidates = [];

			const candidateArray = _data[i].Candidates.split(', ');

			for (let n = 0; n < candidateArray.length; n++) {
				constituency.candidates.push({
					candidateName: candidateArray[n],
					candidateID: undefined,
				});
			}

			constituencies.push(constituency);
		}

		return { success: true, constituencies: constituencies };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function getPrivateKey(_elgamal) {
	const unformattedPrivateKey = _elgamal.x;
	const privateKey = unformattedPrivateKey.toString();
	return privateKey;
}

async function makeHash(val) {
	return crypto.createHash('sha256').update(val, 'utf8').digest();
}

async function hashElGamalPrivatekey(_privateKey) {
	try {
		const salt = crypto.randomBytes(16).toString('hex');
		const hashedPrivateKey = crypto
			.createHash('sha256')
			.update(_privateKey, 'utf8')
			.update(await makeHash(salt))
			.digest('base64');
		return { success: true, key: hashedPrivateKey, salt: salt };
	} catch (error) {
		return { success: false };
	}
}

async function createShamirKeys(_privateKey) {
	try {
		const threshold = parseInt(process.env.THRESHOLD_VALUE);
		const shares = secrets.share(
			_privateKey,
			parseInt(process.env.NUMBER_OF_KEYS),
			threshold
		);

		return { success: true, keys: shares };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function encryptThresholdKeys(_publicKeys, _thresholdKeys) {
	try {
		const numberOfKeys = 10;
		let encryptedThresholdKeys = [];

		if (
			_publicKeys.length === numberOfKeys &&
			_thresholdKeys.length === numberOfKeys
		) {
			for (let i = 0; i < numberOfKeys; i++) {
				const key = new NodeRSA();
				let publicKey;

				publicKey = _publicKeys[i].key.toString();

				key.importKey(publicKey, 'pkcs1-public-pem');

				const plainText = _thresholdKeys[i];
				const cipherText = key.encrypt(plainText, 'base64');

				encryptedThresholdKeys.push(cipherText);
			}

			return {
				success: true,
				keys: encryptedThresholdKeys,
			};
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function generateRSAKeypair() {
	try {
		const key = new NodeRSA({ b: 512 });
		const privateKey = key.exportKey('pkcs1-private-pem');
		const publicKey = key.exportKey('pkcs1-public-pem');

		return { success: true, privateKey, publicKey };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function createElectionInstance(
	_electionID,
	_electionData,
	_constituencies,
	_elgamal,
	_rsaKeypair,
	_hashedPrivateKey,
	_hashedPrivateKeySalt
) {
	try {
		const elgamalObject = {
			g: _elgamal.g.toString(),
			p: _elgamal.p.toString(),
			y: _elgamal.y.toString(),
			hashedPrivateKey: _hashedPrivateKey,
			salt: _hashedPrivateKeySalt,
		};

		const elgamalObjectString = JSON.stringify(elgamalObject);

		const rsaObject = {
			privateKey: _rsaKeypair.privateKey,
			publicKey: _rsaKeypair.publicKey,
		};

		const rsaObjectString = JSON.stringify(rsaObject);

		const electionObject = {
			electionID: _electionID,
			electionVerified: false,
			electionName: _electionData.electionName,
			electionDescription: _electionData.electionDescription,
			electionStart: _electionData.electionStartDate,
			electionEnd: _electionData.electionEndDate,
			constituencies: _constituencies,
			elGamal: elgamalObjectString,
			rsaKeypair: rsaObjectString,
			electoralPeriod: false,
			electionTabulating: false,
		};

		const res = await Election.create(electionObject);

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

export default async function createElection(req, res) {
	if (req.method === 'POST') {
		const session = await getSession({ req });

		if (session && session.user) {
			if (session.user.accountType === 'admin') {
				const data = req.body;

				// get election ID
				const electionID = await getElectionID();

				if (electionID.success) {
					// generate local constintuency database
					const constituencies = await generateLocalDatabase(
						data.electionDetails.electionConstituencies
					);

					if (constituencies.success) {
						// create an instance of ElGamal
						const elgamal = await cryptosystem.generateElGamal(
							data.generate
						);

						if (elgamal.success) {
							// get the private key
							const privateKey = await getPrivateKey(
								elgamal.instance
							);

							// hash the private elgamal key
							const hashedPrivateKey =
								await hashElGamalPrivatekey(privateKey);

							if (hashedPrivateKey.success) {
								// create shamir keys
								const thresholdKeys = await createShamirKeys(
									privateKey
								);

								if (thresholdKeys.success) {
									// encrypt the threshold keys
									const encryptedThresholdKeys =
										await encryptThresholdKeys(
											data.publicKeys,
											thresholdKeys.keys
										);

									if (encryptedThresholdKeys.success) {
										// generate an asymmetric keypair for general communication
										const rsaKeypair =
											await generateRSAKeypair();

										if (rsaKeypair.success) {
											// push instance to database
											const electionInstance =
												await createElectionInstance(
													electionID.documentCount,
													data.electionDetails,
													constituencies.constituencies,
													elgamal.instance,
													rsaKeypair,
													hashedPrivateKey.key,
													hashedPrivateKey.salt
												);

											if (electionInstance.success) {
												res.status(200).json({
													success: true,
													electionID:
														electionID.documentCount,
													thresholdKeys:
														encryptedThresholdKeys.keys,
													electionPublicKey:
														rsaKeypair.publicKey,
												});
											} else {
												res.status(500).json({
													success: false,
													error: 'Error creating election instance in database',
												});
											}
										} else {
											res.status(500).json({
												success: false,
												error: 'Error generating RSA keypair',
											});
										}
									} else {
										res.status(500).json({
											success: false,
											error: 'Error encrypting threshold keys',
										});
									}
								} else {
									res.status(500).json({
										success: false,
										error: 'Error creating shamir keys',
									});
								}
							} else {
								res.status(500).json({ success: false });
								error: 'Error hashing private key';
							}
						} else {
							res.status(500).json({
								success: false,
								error: 'Error generating ElGamal instance',
							});
						}
					} else {
						res.status(500).json({
							success: false,
							error: 'Error processing constituencies',
						});
					}
				} else {
					res.status(500).json({
						success: false,
						error: 'Error creating an election ID',
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
		res.status(400).json({ success: false, error: 'Bad Request' });
	}
}
