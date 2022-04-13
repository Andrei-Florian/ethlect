import cryptosystem from '../../../Cryptosystem/index.js';

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

async function compareHashes(_firstHash, _secondHash) {
	if (_firstHash !== _secondHash) {
		return { success: false };
	}

	return { success: true };
}

export default async function verifyDecryption(req, res) {
	try {
		if (req.method === 'POST') {
			const data = req.body.data;

			if (data.ballots && data.decryptionHash) {
				// format ballots
				const ballots = await stringifyAndShuffle(data.ballots);

				if (ballots.success) {
					// create a hash of the ballot set
					const ballotSetHash = await cryptosystem.createHash(
						JSON.stringify(ballots.shuffledArray)
					);

					if (ballotSetHash.success) {
						// comapre the hashes
						const hashComparison = await compareHashes(
							data.decryptionHash,
							ballotSetHash.hash
						);

						if (hashComparison.success) {
							res.status(200).json({
								success: true,
							});
						} else {
							res.status(500).json({
								success: false,
								error: 'Hashes do not match',
							});
						}
					} else {
						res.status(500).json({
							success: false,
							error: 'Failed create hash of ballot set',
						});
					}
				} else {
					res.status(500).json({
						success: false,
						error: 'Failed to sort ballots',
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
