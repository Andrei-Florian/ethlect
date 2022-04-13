import crypto from 'crypto';
import cryptosystem from '../../Cryptosystem/index';

export const config = {
	api: {
		bodyParser: {
			sizeLimit: '100mb',
		},
	},
};

async function createHash(_value) {
	try {
		const hashedPassword = crypto
			.createHash('sha384')
			.update(_value, 'utf8')
			.digest('base64');
		return { success: true, hash: hashedPassword };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function checkBallots(_shuffle) {
	try {
		const hash1 = await createHash(JSON.stringify(_shuffle.inputBallots));
		const hash2 = await createHash(JSON.stringify(_shuffle.outputBallots));
		const hash3 = await createHash(
			JSON.stringify(_shuffle.proof.inputBallots)
		);
		const hash4 = await createHash(
			JSON.stringify(_shuffle.proof.outputBallots)
		);

		if (!(hash1.success && hash2.success && hash3.success && hash4.success))
			return { success: false };

		const shuffleObj = {
			inputBallots: hash1.hash,
			outputBallots: hash2.hash,
		};

		const proofObj = {
			inputBallots: hash3.hash,
			outputBallots: hash4.hash,
		};

		if (
			!(
				shuffleObj.inputBallots === proofObj.inputBallots &&
				shuffleObj.inputBallots &&
				proofObj.inputBallots
			) ||
			!(
				shuffleObj.outputBallots === proofObj.outputBallots &&
				shuffleObj.outputBallots &&
				proofObj.outputBallots
			)
		) {
			return { success: true, match: false };
		}

		return { success: true, match: true };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function makeHash(val) {
	return crypto.createHash('sha384').update(val, 'utf8').digest();
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
		// stringify the ballots
		const ballotsJSON = JSON.stringify(_ballots);

		// create hash of the ballot sets
		const hash = await makeHash(ballotsJSON);

		// convert hash to string
		const bytes = Buffer.from(hash).toString('hex');

		// split the bits into an array
		const bytesArray = bytes.split('');

		// convert array to bits
		const bitsArray = convertString(bytesArray);

		if (bitsArray.success) {
			// get the last n bits
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

async function checkChallengeBits(_ballots, _proof, n) {
	try {
		// generate challenge bits
		const challengeBits = await generateChallengeBits(_ballots, n);
		if (!challengeBits.success) return { success: false };

		// get the challenge bits from the proof
		let proofBits = '';

		for (let i = 0; i < _proof.length; i++) {
			if (_proof[i].type === true) {
				proofBits += 1;
			} else {
				proofBits += 0;
			}
		}

		// check if the bits match
		if (challengeBits.bits == proofBits) {
			return { success: true, match: true };
		}

		return { success: true, match: false };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function checkCandidate(_candidate, _ballotSet) {
	try {
		let candidate = JSON.stringify(_candidate);
		let ballotSet = JSON.stringify(_ballotSet);

		if (typeof _candidate === 'string') {
			candidate = _candidate;
		}

		// check if the ballotSet contains the candidate
		if (ballotSet.includes(candidate)) {
			return { success: true, match: true };
		}

		return { success: true, match: false };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function proveProof(
	_proof,
	_elgamal,
	_key,
	_inputBallots,
	_outputBallots,
	shuffleType,
	type
) {
	try {
		// index over the ballots
		for (let i = 0; i < _proof.length; i++) {
			const ballot = _proof[i];

			// index over the candidates in the ballot
			for (let j = 0; j < ballot.length; j++) {
				const candidate = ballot[j];

				// check if the input candidate is in the input ballot set
				const inputMatch = await checkCandidate(
					candidate.inputCandidate,
					_inputBallots
				);

				if (!(inputMatch.success && inputMatch.match))
					return { success: false };

				// check if the output candidate is in the output ballot set
				const outputMatch = await checkCandidate(
					candidate.outputCandidate,
					_outputBallots
				);

				if (!(outputMatch.success && outputMatch.match))
					return { success: false };

				// check proof
				const proofObj = {
					key: _key,
					ballot: candidate.inputCandidate,
					newBallot: candidate.outputCandidate,
				};

				let proof;

				if (type) {
					if (shuffleType === 'shuffle') {
						proof = await cryptosystem.proveFirstProofShuffle(
							_elgamal.g,
							_elgamal.p,
							_elgamal.y,
							proofObj
						);
					} else {
						proof = await cryptosystem.proveFirstProofGenerate(
							_elgamal.g,
							_elgamal.p,
							_elgamal.y,
							proofObj
						);
					}
				} else {
					proof = await cryptosystem.proveSecondProof(
						_elgamal.g,
						_elgamal.p,
						_elgamal.y,
						proofObj
					);
				}

				if (!(proof.success && proof.match)) return { success: false };
				console.log(
					`[INFO] Proved Candidate ${j + 1} of Ballot ${i + 1}`
				);
			}
		}

		return { success: true };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function proveGenerate(_proof) {
	try {
		const n = _proof.interactiveProof.length;

		// check the challenge bits
		const challengeBitCheck = await checkChallengeBits(
			_proof.generatedBallots,
			_proof.interactiveProof,
			n
		);

		if (!(challengeBitCheck.success && challengeBitCheck.match))
			return { success: false };

		// verifying proofs
		for (let i = 0; i < n; i++) {
			console.log(
				`[Info] Proving proof ${i + 1}/${n} of type ${
					_proof.interactiveProof[i].type
				}`
			);

			if (_proof.interactiveProof[i].type === false) {
				const firstProof = await proveProof(
					_proof.interactiveProof[i].ballots,
					_proof.elGamal,
					_proof.interactiveProof[i].key,
					_proof.inputBallots,
					_proof.generatedBallots[i],
					'generate',
					true
				);

				if (!firstProof.success) return { success: false };
			} else {
				const secondProof = await proveProof(
					_proof.interactiveProof[i].ballots,
					_proof.elGamal,
					_proof.interactiveProof[i].key,
					_proof.generatedBallots[i],
					_proof.outputBallots,
					'generate',
					false
				);

				if (!secondProof.success) return { success: false };
			}

			console.log(`[Success] Proved proof ${i + 1}/${n}`);
			console.log();
		}

		return { success: true };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function proveShuffle(_proof) {
	try {
		const n = _proof.interactiveProof.length;

		// check the challenge bits
		const challengeBitCheck = await checkChallengeBits(
			_proof.generatedBallots,
			_proof.interactiveProof,
			n
		);

		if (!(challengeBitCheck.success && challengeBitCheck.match))
			return { success: false };

		// verifying proofs
		for (let i = 0; i < n; i++) {
			console.log(
				`[Info] Proving proof ${i + 1}/${n} of type ${
					_proof.interactiveProof[i].type
				}`
			);

			if (_proof.interactiveProof[i].type === false) {
				const firstProof = await proveProof(
					_proof.interactiveProof[i].ballots,
					_proof.elGamal,
					_proof.interactiveProof[i].key,
					_proof.inputBallots,
					_proof.generatedBallots[i],
					'shuffle',
					true
				);

				if (!firstProof.success) return { success: false };
			} else {
				const secondProof = await proveProof(
					_proof.interactiveProof[i].ballots,
					_proof.elGamal,
					_proof.interactiveProof[i].key,
					_proof.generatedBallots[i],
					_proof.outputBallots,
					'shuffle',
					false
				);

				if (!secondProof.success) return { success: false };
			}

			console.log(`[Success] Proved proof ${i + 1}/${n}`);
			console.log();
		}

		return { success: true };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function proveDecryption(_proof) {
	try {
		console.log(`[INFO] Proving decryption`);

		// index over the ballots
		for (let i = 0; i < _proof.interactiveProof.length; i++) {
			const ballot = _proof.interactiveProof[i];

			// index over the candidates in the ballot
			for (let j = 0; j < ballot.length; j++) {
				const candidate = ballot[j];

				// check if the input candidate is in the input ballot set
				const inputMatch = await checkCandidate(
					candidate.inputCandidate,
					_proof.inputBallots
				);

				if (!(inputMatch.success && inputMatch.match))
					return { success: false };

				// check if the output candidate is in the output ballot set
				const outputMatch = await checkCandidate(
					candidate.outputCandidate,
					_proof.outputBallots
				);

				if (!(outputMatch.success && outputMatch.match))
					return { success: false };

				const proof = await cryptosystem.proveDecryptionProof(
					_proof.elGamal.g,
					_proof.elGamal.p,
					_proof.elGamal.y,
					candidate.proof,
					candidate.inputCandidate,
					candidate.outputCandidate
				);

				if (!(proof.success && proof.match)) return { success: false };
				console.log(
					`[INFO] Proved Candidate ${j + 1} of Ballot ${i + 1}`
				);
			}
		}

		console.log(`[Success] Proved All Candidates`);
		return { success: true };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function verify(req, res) {
	try {
		if (req.method === 'POST') {
			const proof = JSON.parse(req.body.proof);

			// check if shuffle type is valid
			if (
				proof.shuffleType === 'shuffle' ||
				proof.shuffleType === 'generate' ||
				proof.shuffleType === 'decryption'
			) {
				// check if the proof object contains the same ballots as the shuffle object
				const sameBallots = await checkBallots(proof);

				if (sameBallots.success && sameBallots.match) {
					// check the shuffle type
					switch (proof.shuffleType) {
						case 'generate':
							const generateProof = await proveGenerate(
								proof.proof
							);

							if (!generateProof.success) {
								return res.status(500).json({
									success: false,
									error: 'Proof verification failed',
								});
							}
							break;
						case 'shuffle':
							const shuffleProof = await proveShuffle(
								proof.proof
							);

							if (!shuffleProof.success) {
								return res.status(500).json({
									success: false,
									error: 'Proof verification failed',
								});
							}
							break;
						case 'decryption':
							const decryptionProof = await proveDecryption(
								proof.proof
							);

							if (!decryptionProof.success) {
								return res.status(500).json({
									success: false,
									error: 'Proof verification failed',
								});
							}
							break;
						default:
							break;
					}

					res.status(200).json({
						success: true,
					});
				} else {
					return res.status(500).json({
						success: false,
						error: 'Proof Ballots do not Check Out',
					});
				}
			} else {
				res.status(400).json({
					success: false,
					error: 'Invalid Shuffle Type',
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
