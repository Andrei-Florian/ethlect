import { BigInteger as BigInt } from 'jsbn';
import ElGamal from 'basic_simple_elgamal';
import * as Utils from './utils.js';
import DecryptedValue from './models/decrypted-value.js';
import crypto from 'crypto';

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

/**
 * Generates an instance of ElGamal using the provided setting and exports the instance.
 * @param {Object} _option How to initialise the instance ('server' to generate on the server or 'remote' to generate remotely)
 * @returns {success: boolean, instance: ElGamal}
 */
async function generateElGamal(_option) {
	try {
		// create an instance of El Gamal
		const elgamal = new ElGamal();
		elgamal.setSecurityLevel('LOW');

		if (_option === 'server') {
			console.log('Initialising ElGamal on Server');
			await elgamal.initialize();
		} else {
			console.log('Initialising ElGamal Remotely');
			await elgamal.initializeRemotely();
		}

		console.log('ElGamal Initialised!');
		console.log('Checking ElGamal Security');

		// check if the instance is secure
		if (elgamal.checkSecurity()) {
			// export the instance
			const exportedInstance = elgamal.export(true);

			const instanceObj = {
				g: exportedInstance.g.toString(),
				p: exportedInstance.p.toString(),
				y: exportedInstance.y.toString(),
				x: exportedInstance.x.toString(),
			};

			console.log('ElGamal Instance is Exported!');

			return { success: true, instance: instanceObj };
		} else {
			console.log('ElGamal Instance failed to Export');
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

/**
 * Encrypts a message using the provided ElGamal values and message
 * @param {String} g The g value of the ElGamal instance
 * @param {String} p The p value of the ElGamal instance
 * @param {String} y The y value of the ElGamal instance
 * @param {String} x A randomly generated x value for the encryption
 * @param {String} _message The message to encrypt
 * @returns {success: boolean, encryptedMessage: {a: String, b: String}}
 */
async function encryptMessage(g, p, y, x, _message) {
	try {
		const parsedG = Utils.parseBigInt(g);
		const parsedY = Utils.parseBigInt(y);
		const parsedP = Utils.parseBigInt(p);
		const parsedX = Utils.parseBigInt(x);
		const parsedMessage = new DecryptedValue(_message).bi;

		const a = parsedY
			.modPow(parsedX, parsedP)
			.multiply(parsedMessage)
			.remainder(parsedP);
		const b = parsedG.modPow(parsedX, parsedP);

		const encryptedMessage = { a: a.toString(), b: b.toString() };
		return { success: true, encryptedMessage: encryptedMessage };
	} catch (error) {
		console.error(error);
		return { success: false };
	}
}

/**
 * Generates a random value for x to use when encrypting a message
 * @param {String} p The p value of the ElGamal instance
 * @returns {success: boolean, x: String}
 */
async function generateKey(p) {
	try {
		const parsedP = Utils.parseBigInt(p);
		const x = await Utils.getRandomBigIntAsync(
			Utils.BIG_TWO,
			parsedP.subtract(BigInt.ONE)
		);
		return { success: true, x: x.toString() };
	} catch (error) {
		console.error(error);
		return { success: false };
	}
}

/**
 * Encrypts a message using the provided ElGamal values and message
 * @param {String} g The g value of the ElGamal instance
 * @param {String} p The p value of the ElGamal instance
 * @param {String} y The y value of the ElGamal instance
 * @param {String} x A randomly generated x value for the encryption
 * @param {String} _message The message to encrypt
 * @returns {success: boolean, encryptedMessage: {a: String, b: String}}
 */
async function reEncryptMessage(g, p, y, x, _message) {
	try {
		const parsedG = Utils.parseBigInt(g);
		const parsedY = Utils.parseBigInt(y);
		const parsedP = Utils.parseBigInt(p);
		const parsedA = Utils.parseBigInt(_message.a);
		const parsedB = Utils.parseBigInt(_message.b);
		const parsedX = Utils.parseBigInt(x);

		const a2 = parsedA
			.multiply(parsedY.modPow(parsedX, parsedP))
			.remainder(parsedP);
		const b2 = parsedB
			.multiply(parsedG.modPow(parsedX, parsedP))
			.remainder(parsedP);

		const encryptedMessage = { a: a2.toString(), b: b2.toString() };
		return { success: true, encryptedMessage: encryptedMessage };
	} catch (error) {
		console.error(error);
		return { success: false };
	}
}

/**
 * Encrypts a message using the provided ElGamal values and message
 * @param {String} g The g value of the ElGamal instance
 * @param {String} p The p value of the ElGamal instance
 * @param {String} y The y value of the ElGamal instance
 * @param {String} x A randomly generated x value for the encryption
 * @param {String} _message The message to encrypt
 * @returns {success: boolean, decryptedMessage: BigInt}
 */
async function decryptMessage(g, p, y, x, _message) {
	try {
		const parsedG = Utils.parseBigInt(g);
		const parsedY = Utils.parseBigInt(y);
		const parsedP = Utils.parseBigInt(p);
		const parsedX = Utils.parseBigInt(x);
		const parsedA = Utils.parseBigInt(_message.a);
		const parsedB = Utils.parseBigInt(_message.b);

		const r = await Utils.getRandomBigIntAsync(
			Utils.BIG_TWO,
			parsedP.subtract(BigInt.ONE)
		);

		const aBlind = parsedG
			.modPow(r, parsedP)
			.multiply(parsedB)
			.remainder(parsedP);
		const ax = aBlind.modPow(parsedX, parsedP);

		const plaintextBlind = ax
			.modInverse(parsedP)
			.multiply(parsedA)
			.remainder(parsedP);

		const plaintext = parsedY
			.modPow(r, parsedP)
			.multiply(plaintextBlind)
			.remainder(parsedP);

		const decryptedMessage = new DecryptedValue(plaintext);
		return { success: true, decryptedMessage: decryptedMessage };
	} catch (error) {
		console.error(error);
		return { success: false };
	}
}

/**
 * Ctreates proof that proves that b = bn
 * This is the first type of proof
 * @param {Object} _newBallot The ballot after re-encryption
 * @param {String|BigInt} x The key used to encrypt the original ballot to get the encrypted ballot
 * @returns {success: boolean, proof: {ballot: Object, newBallot: Object, key: String}}
 */
async function createFirstProof(
	_inputBallots,
	_outputBallots,
	x,
	_shuffleCandidates
) {
	try {
		if (_inputBallots.length !== _outputBallots.length) {
			return { success: false };
		}

		let ballots = [];

		for (let i = 0; i < _inputBallots.length; i++) {
			const ballot = _inputBallots[i];
			let provenBallot = [];

			for (let j = 0; j < ballot.length; j++) {
				let candidate;

				if (_shuffleCandidates) {
					candidate = {
						inputCandidate: ballot[j].toString(),
						outputCandidate: JSON.parse(_outputBallots[i][j]),
					};
				} else {
					candidate = {
						inputCandidate: ballot[j],
						outputCandidate: _outputBallots[i][j],
					};
				}

				provenBallot.push(candidate);
			}

			if (_shuffleCandidates) {
				const shuffledBallot = await stringifyAndShuffle(provenBallot);
				if (!shuffledBallot.success) return { success: false };

				ballots.push(shuffledBallot.shuffledArray);
			} else {
				ballots.push(provenBallot);
			}
		}

		const shuffledBallots = await stringifyAndShuffle(ballots);
		if (!shuffledBallots.success) return { success: false };

		const proof = {
			type: false,
			key: x.toString(),
			ballots: shuffledBallots.shuffledArray,
		};

		return { success: true, proof: proof };
	} catch (error) {
		console.error(error);
		return { success: false };
	}
}

/**
 * Ctreates proof that proves that bn = b'
 * This is the second type of proof
 * @param {Object} _inputBallots The generated ballot set
 * @param {Object} _outputBallots The output ballot set
 * @param {String|BigInt} p The prime number from the ElGamal instance
 * @param {String|BigInt} x1 The encryption key used to get ballot bn
 * @param {String|BigInt} x2 The encryption key used to get ballot b'
 * @returns {success: boolean, proof: {ballot: Object, newBallot: Object, key: String}}
 */
async function createSecondProof(
	_inputBallots,
	_outputBallots,
	p,
	x1,
	x2,
	_shuffleCandidates
) {
	try {
		if (_inputBallots.length !== _outputBallots.length) {
			return { success: false };
		}

		const parsedX1 = Utils.parseBigInt(x1);
		const parsedX2 = Utils.parseBigInt(x2);
		const parsedP = Utils.parseBigInt(p);

		const key = parsedX1
			.subtract(parsedX2)
			.mod(parsedP.subtract(BigInt.ONE));

		let ballots = [];

		for (let i = 0; i < _inputBallots.length; i++) {
			const ballot = _inputBallots[i];
			let provenBallot = [];

			for (let j = 0; j < ballot.length; j++) {
				let candidate;

				if (_shuffleCandidates) {
					candidate = {
						inputCandidate: JSON.parse(ballot[j]),
						outputCandidate: JSON.parse(_outputBallots[i][j]),
					};
				} else {
					candidate = {
						inputCandidate: ballot[j],
						outputCandidate: _outputBallots[i][j],
					};
				}

				provenBallot.push(candidate);
			}

			if (_shuffleCandidates) {
				const shuffledBallot = await stringifyAndShuffle(provenBallot);
				if (!shuffledBallot.success) return { success: false };

				ballots.push(shuffledBallot.shuffledArray);
			} else {
				ballots.push(provenBallot);
			}
		}

		const shuffledBallots = await stringifyAndShuffle(ballots);
		if (!shuffledBallots.success) return { success: false };

		const proof = {
			type: true,
			key: key.toString(),
			ballots: shuffledBallots.shuffledArray,
		};

		return { success: true, proof: proof };
	} catch (error) {
		console.error(error);
		return { success: false };
	}
}

/**
 * Proves the provided proof that states that b = bn for a re-encryption
 * This method attempts to encrypt the initial ballot from the proof provided with the provided private key and then compares the encrypted ballot to the provided encrypted ballot
 * @param {String} g The g value of the ElGamal instance
 * @param {String} p The p value of the ElGamal instance
 * @param {String} y The y value of the ElGamal instance
 * @param {Object} _proof The proof provided by the createFirstProof() function
 * @returns {success: boolean, match: boolean}
 */
async function proveFirstProofShuffle(g, p, y, _proof) {
	try {
		const parsedG = Utils.parseBigInt(g);
		const parsedY = Utils.parseBigInt(y);
		const parsedP = Utils.parseBigInt(p);

		// encrypt the first ballot and see if it matches the second ballot
		const check = await reEncryptMessage(
			parsedG,
			parsedP,
			parsedY,
			_proof.key,
			_proof.ballot
		);

		if (check.success) {
			if (
				check.encryptedMessage.a.toString() ===
					_proof.newBallot.a.toString() &&
				check.encryptedMessage.b.toString() ===
					_proof.newBallot.b.toString()
			) {
				return { success: true, match: true };
			} else {
				return { success: true, match: false };
			}
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

/**
 * Proves the provided proof that states that b = bn for n encryption
 * This method attempts to encrypt the initial ballot from the proof provided with the provided private key and then compares the encrypted ballot to the provided encrypted ballot
 * @param {String} g The g value of the ElGamal instance
 * @param {String} p The p value of the ElGamal instance
 * @param {String} y The y value of the ElGamal instance
 * @param {Object} _proof The proof provided by the createFirstProof() function
 * @returns {success: boolean, match: boolean}
 */
async function proveFirstProofGenerate(g, p, y, _proof) {
	try {
		const parsedG = Utils.parseBigInt(g);
		const parsedY = Utils.parseBigInt(y);
		const parsedP = Utils.parseBigInt(p);

		// encrypt the first ballot and see if it matches the second ballot
		const check = await encryptMessage(
			parsedG,
			parsedP,
			parsedY,
			_proof.key,
			_proof.ballot
		);

		if (check.success) {
			if (
				check.encryptedMessage.a.toString() ===
					_proof.newBallot.a.toString() &&
				check.encryptedMessage.b.toString() ===
					_proof.newBallot.b.toString()
			) {
				return { success: true, match: true };
			} else {
				return { success: true, match: false };
			}
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

/**
 * Proves the provided proof that states that bn = b'
 * This method uses homomophism to prove that bn = b' by proving that both ballots are decryptable with the same key without knowing the decryption key
 * @param {String} g The g value of the ElGamal instance
 * @param {String} p The p value of the ElGamal instance
 * @param {String} y The y value of the ElGamal instance
 * @param {Object} _proof The proof provided by the createFirstProof() function
 * @returns {success: boolean, match: boolean}
 */
async function proveSecondProof(g, p, y, _proof) {
	try {
		async function firstProof(g, p, b1, b2, proof) {
			const left = b1.multiply(b2.modInverse(p)).mod(p);
			const right = g.modPow(proof, p);

			const match = left.equals(right);
			return match;
		}

		async function secondProof(y, p, a1, a2, proof) {
			const left = a1.multiply(a2.modInverse(p)).mod(p);
			const right = y.modPow(proof, p);

			const match = left.equals(right);
			return match;
		}

		const parsedG = Utils.parseBigInt(g);
		const parsedY = Utils.parseBigInt(y);
		const parsedP = Utils.parseBigInt(p);

		const firstEncryption = {
			a: Utils.parseBigInt(_proof.ballot.a),
			b: Utils.parseBigInt(_proof.ballot.b),
		};
		const secondEncryption = {
			a: Utils.parseBigInt(_proof.newBallot.a),
			b: Utils.parseBigInt(_proof.newBallot.b),
		};
		const key = Utils.parseBigInt(_proof.key);

		// run proofs
		const firstMatch = await firstProof(
			parsedG,
			parsedP,
			firstEncryption.b,
			secondEncryption.b,
			key
		);
		const secondMatch = await secondProof(
			parsedY,
			parsedP,
			firstEncryption.a,
			secondEncryption.a,
			key
		);

		if (firstMatch && secondMatch) {
			return { success: true, match: true };
		} else {
			return { success: true, match: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function createHash(_message) {
	try {
		const hashedPassword = crypto
			.createHash('sha256')
			.update(_message, 'utf8')
			.digest('base64');
		return { success: true, hash: hashedPassword };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

/**
 * Creates a proof that proves that a given ciphertext decrypts to a given plaintext without revealing the key
 * @param {String} k A random scalar value
 * @param {String} g The g value of the ElGamal instance
 * @param {String} p The p value of the ElGamal instance
 * @param {String} x The x value of the ElGamal instance
 * @param {Object} _encryptedMessage The ciphertext to prove
 * @returns {success: boolean, proof: {c: String, r: String}}
 */
async function createDecryptionProof(k, g, p, x, _encryptedMessage) {
	try {
		const parsedK = Utils.parseBigInt(k);
		const parsedG = Utils.parseBigInt(g);
		const parsedP = Utils.parseBigInt(p);
		const parsedX = Utils.parseBigInt(x);
		const parsedB = Utils.parseBigInt(_encryptedMessage.b);

		// calculate c
		const c1 = parsedG.modPow(parsedK, parsedP);
		const c2 = parsedB.modPow(parsedK, parsedP);

		// concatnate c1 and c2
		const c = c1.toString() + c2.toString();

		// hash c
		const hashedC = await createHash(c);

		// convert c to number
		const cNum = Utils.parseBigInt(hashedC.hash);
		const cReady = cNum.mod(parsedP.subtract(BigInt.ONE));

		// calculate r
		const r = parsedK
			.subtract(cReady.multiply(parsedX))
			.mod(parsedP.subtract(BigInt.ONE));

		return {
			success: true,
			proof: {
				c: cReady.toString(),
				r: r.toString(),
			},
		};
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

/**
 * Proves the DLEQ proof provied to prove that a given ciphertext decrypts to a given plaintext without revealing the key
 * @param {String} g The g value of the ElGamal instance
 * @param {String} p The p value of the ElGamal instance
 * @param {String} y The y value of the ElGamal instance
 * @param {String} _proof The proof object outputted by the proof creation function
 * @param {Object} _encryptedMessage The ciphertext to prove
 * @param {Object} _decryptedMessage The plaintext to prove
 * @returns {success: boolean, proof: {c: String, r: String}}
 */
async function proveDecryptionProof(
	g,
	p,
	y,
	_proof,
	_encryptedMessage,
	_decryptedMessage
) {
	try {
		const parsedG = Utils.parseBigInt(g);
		const parsedP = Utils.parseBigInt(p);
		const parsedY = Utils.parseBigInt(y);
		const parsedC = Utils.parseBigInt(_proof.c);
		const parsedR = Utils.parseBigInt(_proof.r);

		const parsedA = Utils.parseBigInt(_encryptedMessage.a);
		const parsedB = Utils.parseBigInt(_encryptedMessage.b);
		const parsedMessage = new DecryptedValue(_decryptedMessage.toString())
			.bi;

		// derive P
		const P = parsedA
			.multiply(parsedMessage.modInverse(parsedP))
			.mod(parsedP);

		// creating hash
		const mod1 = parsedG.modPow(parsedR, parsedP);
		const mod2 = parsedY.modPow(parsedC, parsedP);
		const mod3 = parsedB.modPow(parsedR, parsedP);
		const mod4 = P.modPow(parsedC, parsedP);

		// multiply the mods
		const hash1 = mod1.multiply(mod2).mod(parsedP);
		const hash2 = mod3.multiply(mod4).mod(parsedP);

		// concatnate the mods
		const hash = hash1.toString() + hash2.toString();

		// hash the concatenated mods
		const hashedProof = await createHash(hash);

		// convert the hashed proof to a number
		const proof = Utils.parseBigInt(hashedProof.hash);
		const proofReady = proof.mod(parsedP.subtract(BigInt.ONE));

		// compare the hashes
		if (proofReady.equals(parsedC)) {
			return { success: true, match: true };
		}

		return { success: true, match: false };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default {
	generateElGamal,
	encryptMessage,
	reEncryptMessage,
	decryptMessage,
	createFirstProof,
	createSecondProof,
	createDecryptionProof,
	generateKey,
	proveFirstProofGenerate,
	proveFirstProofShuffle,
	proveSecondProof,
	proveDecryptionProof,
};
