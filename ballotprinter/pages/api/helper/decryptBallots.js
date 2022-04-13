import cryptosystem from '../../../Cryptosystem/index.js';

async function decryptCandidate(_candidate, _elgamal, x) {
	try {
		const newCandidate = await cryptosystem.decryptMessage(
			_elgamal.g,
			_elgamal.p,
			_elgamal.y,
			x,
			JSON.parse(_candidate)
		);

		if (newCandidate.success) {
			return {
				success: true,
				candidate: parseInt(newCandidate.decryptedMessage.toString()),
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
		let candidates = [];

		for (let j = 0; j < _ballot.candidates.length; j++) {
			const decryptedCandidateID = await decryptCandidate(
				_ballot.candidates[j].encryptedCandidateID,
				_elgamal,
				x
			);

			if (decryptedCandidateID.success) {
				console.log(`[INFO] Decrypted candidate ${j + 1}`);
				candidates.push({
					candidateRep: _ballot.candidates[j].candidateRep,
					candidateID: decryptedCandidateID.candidate,
				});
			} else {
				console.log(`[ERROR] Failed to decrypt candidate ${j + 1}`);
				return { success: false };
			}
		}

		const ballot = {
			ballotID: _ballot.ballotID,
			userID: _ballot.userID,
			constituency: _ballot.constituency,
			candidates: candidates,
		};
		return { success: true, ballot: ballot };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function decryptBallotSet(_ballots, _elgamal, x) {
	try {
		let ballots = [];

		for (let i = 0; i < _ballots.length; i++) {
			console.log(`[INFO] Decrypting ballot ${i + 1}`);

			const newBallot = await decryptBallot(_ballots[i], _elgamal, x);

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

export default async function decryptBallots(req, res) {
	try {
		if (req.method === 'POST') {
			const data = req.body.data;

			if (data.elgamal && data.ballots && data.privateKey) {
				// decrypt all ballots
				const decryptedBallots = await decryptBallotSet(
					data.ballots,
					data.elgamal,
					data.privateKey
				);

				if (decryptedBallots.success) {
					res.status(200).json({
						success: true,
						ballots: decryptedBallots.ballots,
					});
				} else {
					res.status(500).json({
						success: false,
						error: 'Failed to decrypt ballots',
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
