async function verifyDocuments(_constituenciesFile, _resultsFile) {
	try {
		// deconstruct the files into arrays
		let resultsCandidates = [];
		let constituencyCandidates = [];

		// populate the resultsCandidates array
		for (let i = 0; i < _resultsFile.length; i++) {
			for (let j = 0; j < _resultsFile[i].length; j++) {
				const candidate = _resultsFile[i][j];

				if (resultsCandidates.indexOf(candidate) === -1) {
					resultsCandidates.push(candidate);
				}
			}
		}

		// populate the constituencyCandidates array
		for (let i = 0; i < _constituenciesFile.length; i++) {
			for (let j = 0; j < _constituenciesFile[i].candidates.length; j++) {
				const candidate =
					_constituenciesFile[i].candidates[j].candidateName;

				if (constituencyCandidates.indexOf(candidate) === -1) {
					constituencyCandidates.push(candidate);
				}
			}
		}

		// ensure all candidates in result file are in constituency file
		for (let i = 0; i < resultsCandidates.length; i++) {
			if (constituencyCandidates.indexOf(resultsCandidates[i]) === -1) {
				return { success: false };
			}
		}

		return { success: true };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function getVotes(_constituency, _resultsFile) {
	try {
		// deconstruct the file into array
		let constituencyCandidates = [];

		// populate the constituencyCandidates array
		for (let i = 0; i < _constituency.candidates.length; i++) {
			const candidate = _constituency.candidates[i].candidateName;
			constituencyCandidates.push(candidate);
		}

		// loop through results file
		let votes = [];

		for (let i = 0; i < _resultsFile.length; i++) {
			// check if candidates in the ballot are in the constituency
			if (constituencyCandidates.indexOf(_resultsFile[i][0]) !== -1) {
				votes.push(_resultsFile[i]);
			}
		}

		return { success: true, ballots: votes };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function getQuota(_constituency, _ballots) {
	try {
		const seats = _constituency.seats;
		const quota = Math.floor(_ballots.length / (parseInt(seats) + 1)) + 1;
		return { success: true, quota: quota };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function countConstituency(_ballots, _quota, _seats) {
	try {
		let allocatedSeats = [];
		let piles = [];

		// compile array of candidates
		let candidates = [];

		for (let i = 0; i < _ballots.length; i++) {
			for (let j = 0; j < _ballots[i].length; j++) {
				if (candidates.indexOf(_ballots[i][j]) === -1) {
					candidates.push(_ballots[i][j]);
					piles.push([]);
				}
			}
		}

		// arrange ballots into piles
		for (let i = 0; i < _ballots.length; i++) {
			piles[candidates.indexOf(_ballots[i][0])].push(_ballots[i]);
		}

		// repeat until all seats are filled
		let i = 0;

		while (allocatedSeats.length < _seats) {
			console.log(`[INFO] Count ${i + 1}`);

			// count number of candidates left
			let candidatesLeft = [];

			for (let i = 0; i < piles.length; i++) {
				if (piles[i].length > 0) {
					candidatesLeft.push(piles[i][0][0]);
				}
			}

			// check if the number of candidates left is equal to the number of seats left
			if (candidatesLeft.length === _seats - allocatedSeats.length) {
				// if so, allocate all seats
				for (let i = 0; i < candidatesLeft.length; i++) {
					allocatedSeats.push(candidatesLeft[i]);
				}
			} else {
				// count the piles and alocate seats
				let seatsFilled = [];

				for (let i = 0; i < piles.length; i++) {
					if (piles[i].length >= _quota) {
						allocatedSeats.push(piles[i][0][0]);
						seatsFilled.push(piles[i][0][0]);
					}
				}

				if (seatsFilled.length > 0) {
					// index through the candidates that reached the quota
					for (let i = 0; i < seatsFilled.length; i++) {
						// remove the alocated seats from the ballot piles
						for (let j = 0; j < piles.length; j++) {
							for (let k = 0; k < piles[j].length; k++) {
								if (
									piles[j][k].indexOf(seatsFilled[i]) !== -1
								) {
									piles[j][k].splice(
										piles[j][k].indexOf(seatsFilled[i]),
										1
									);
								}
							}
						}

						// check if the quota is exceeded
						const surplus =
							piles[candidates.indexOf(seatsFilled[i])].length -
							_quota;

						if (surplus > 0) {
							// identify which ballots to redistribute
							let redistributedCandidates = [];
							let redistributionPiles = [];
							let redistributionBallots = [];
							const pile =
								piles[candidates.indexOf(seatsFilled[i])];

							// populate redistributedCandidates array
							for (let i = 0; i < pile.length; i++) {
								if (
									redistributedCandidates.indexOf(
										pile[i][0]
									) === -1
								) {
									redistributedCandidates.push(pile[i][0]);
									redistributionPiles.push([]);
								}
							}

							// sort the ballots by next choice
							for (let i = 0; i < pile.length; i++) {
								redistributionPiles[
									redistributedCandidates.indexOf(pile[i][0])
								].push(pile[i]);
							}

							// find the length of the largest pile
							let largestPile = 0;

							for (
								let i = 0;
								i < redistributionPiles.length;
								i++
							) {
								if (
									redistributionPiles[i].length > largestPile
								) {
									largestPile = redistributionPiles[i].length;
								}
							}

							// sort the ballots into one array
							for (let i = 0; i < largestPile; i++) {
								for (
									let j = 0;
									j < redistributionPiles.length;
									j++
								) {
									if (
										redistributionPiles[j][i] !==
											undefined &&
										redistributionPiles[j][i] !== []
									) {
										redistributionBallots.push(
											redistributionPiles[j][i]
										);
									}
								}
							}

							// flip the array over
							redistributionBallots.reverse();

							// save the first surplus number of ballots from the pile
							const surplusBallots = redistributionBallots.slice(
								0,
								surplus
							);

							// remove all ballots but the surplus from the pile
							piles[candidates.indexOf(seatsFilled[i])] =
								surplusBallots;
						} else {
							// if there is no surplus, we can remove all candidates from the pile
							piles[candidates.indexOf(seatsFilled[i])] = [];
						}
					}
				} else {
					// identify candidate with least number of votes
					let smallestPile = null;

					for (let i = 0; i < piles.length; i++) {
						if (
							(smallestPile === null && piles[i].length !== 0) ||
							(smallestPile !== null &&
								piles[i].length < smallestPile.length &&
								piles[i].length !== 0)
						) {
							smallestPile = piles[i];
						}
					}

					const candidateToRemove = smallestPile[0][0];

					// remove candidate from ballots
					for (let i = 0; i < piles.length; i++) {
						for (let j = 0; j < piles[i].length; j++) {
							if (piles[i][j].indexOf(candidateToRemove) !== -1) {
								piles[i][j].splice(
									piles[i][j].indexOf(candidateToRemove),
									1
								);
							}
						}
					}
				}

				// arrange all ballots into one array
				let ballots = [];
				let localPiles = [];

				for (let i = 0; i < piles.length; i++) {
					for (let j = 0; j < piles[i].length; j++) {
						ballots.push(piles[i][j]);
					}

					localPiles.push([]);
				}

				// arrange the ballots into piles
				for (let i = 0; i < ballots.length; i++) {
					if (ballots[i][0] !== undefined) {
						localPiles[candidates.indexOf(ballots[i][0])].push(
							ballots[i]
						);
					}
				}

				piles = localPiles;
				i++;

				// break in case of infinite loop
				if (i > 20) {
					return { success: false };
				}
			}
		}

		// return the results
		return { success: true, seats: allocatedSeats };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

async function countVotes(_constituenciesFile, _resultsFile) {
	try {
		let results = [];

		// loop through constituencies
		for (let i = 0; i < _constituenciesFile.length; i++) {
			console.log(
				`[INFO] Counting Ballots for ${_constituenciesFile[i].constituency}`
			);

			// get all votes for constituency
			const votes = await getVotes(_constituenciesFile[i], _resultsFile);
			if (!votes.success) return { success: false };

			// get the quota for the constituency
			const quota = await getQuota(_constituenciesFile[i], votes.ballots);
			if (!quota.success) return { success: false };

			// count the votes
			const result = await countConstituency(
				votes.ballots,
				quota.quota,
				_constituenciesFile[i].seats
			);
			if (!result.success) return { success: false };

			// format the results
			const constituencySeats = {
				constituency: _constituenciesFile[i].constituency,
				seatsCount: _constituenciesFile[i].seats,
				candidates: result.seats,
			};

			// add the results to the array
			results.push(constituencySeats);

			console.log(
				`[Success] Counting Complete for ${_constituenciesFile[i].constituency}`
			);
			console.log('');
		}

		// return the results
		console.log('[Success] Counting Complete');
		return { success: true, results: results };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function verify(req, res) {
	try {
		if (req.method === 'POST') {
			if (req.body.constituenciesFile && req.body.resultsFile) {
				const constituenciesFile = JSON.parse(
					req.body.constituenciesFile
				);
				const resultsFile = JSON.parse(req.body.resultsFile);

				// ensure the documents are formatted correctly
				const verification = await verifyDocuments(
					constituenciesFile,
					resultsFile
				);

				if (verification.success) {
					// count votes
					const results = await countVotes(
						constituenciesFile,
						resultsFile
					);

					if (results.success) {
						res.status(200).json({
							success: true,
							results: results.results,
						});
					} else {
						return res.status(500).json({
							success: false,
							error: 'Failed to Count Votes',
						});
					}
				} else {
					res.status(400).json({
						success: false,
						error: 'Files Formatted Incorrectly',
					});
				}
			} else {
				res.status(400).json({
					success: false,
					error: 'Missing Files',
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
