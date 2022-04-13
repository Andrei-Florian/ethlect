import dbConnect from '../../../MongoDB/utils/backendConnection';
import Election from '../../../MongoDB/models/Election';
import { getSession } from 'next-auth/react';
import secrets from 'secrets.js-grempe';
import NodeRSA from 'node-rsa';
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

async function deconstructElgamalObject(_elgamal) {
	try {
		const elgamalJSON = JSON.parse(_elgamal);
		return { success: true, instance: elgamalJSON };
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

async function verifyElection(_electionID) {
	try {
		const res = await Election.findOneAndUpdate(
			{ electionID: _electionID },
			{
				electionVerified: true,
			}
		);

		if (res) {
			return { success: true };
		} else {
			return { success: false };
		}
	} catch (error) {
		return { success: false };
	}
}

export default async function verifyKeys(req, res) {
	if (req.method === 'POST') {
		const session = await getSession({ req });

		if (session && session.user) {
			if (session.user.accountType === 'admin') {
				const data = req.body;

				// find the election document in the database
				const election = await getElectionDocument(data.electionID);

				if (election.success) {
					// get the election's private key
					const privateElectionKey = await getElectionPrivateKey(
						election.election.rsaKeypair
					);

					// decrypt the keys received
					const decryptedThresholdKeys = await decryptKeys(
						data.thresholdKeys,
						privateElectionKey
					);

					if (decryptedThresholdKeys.success) {
						// combine the threshold keys into the original key
						const derivedPrivateKey = await getPrivateKey(
							decryptedThresholdKeys.decryptedKeys
						);

						if (derivedPrivateKey.success) {
							// get the elGamal object from the election document
							const elGamalObject =
								await deconstructElgamalObject(
									election.election.elGamal
								);

							if (elGamalObject.success) {
								// hash the combined key
								const hashedDerivedPrivateKey =
									await hashElGamalPrivatekey(
										derivedPrivateKey.privateKey,
										elGamalObject.instance.salt
									);

								if (hashedDerivedPrivateKey.success) {
									// compare the hashed public key with the hashed combined key
									const comparison = await compareKeys(
										hashedDerivedPrivateKey.key,
										elGamalObject.instance.hashedPrivateKey
									);

									if (comparison.success) {
										const electionValidation =
											await verifyElection(
												data.electionID
											);

										// set the election as verified
										if (electionValidation.success) {
											res.status(200).json({
												success: true,
											});
										} else {
											res.status(400).json({
												success: false,
												error: 'failed to change state of election to verified',
											});
										}
									} else {
										res.status(500).json({
											success: false,
											error: 'keys do not match',
										});
									}
								} else {
									res.status(500).json({
										success: false,
										error: 'Could not hash ElGamal private key',
									});
								}
							} else {
								res.status(500).json({
									success: false,
									error: 'Could not deconstruct ElGamal object',
								});
							}
						} else {
							res.status(500).json({
								success: false,
								message:
									'Could not dervive ElGamal private key from threshold keys',
							});
							return;
						}
					} else {
						return res.status(500).send({
							success: false,
							error: 'Could not decrypt the threshold keys provided',
						});
					}
				} else {
					res.status(500).send({
						success: false,
						error: 'Could not find an election with the provided election ID',
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
		res.status(400).json({
			success: false,
			error: 'Invalid request method',
		});
	}
}
