import { Component } from 'react';
import {
	Card,
	Button,
	Alert,
	Table,
	Row,
	Col,
	ListGroup,
	Badge,
} from 'react-bootstrap';

class ElectionsNow extends Component {
	state = {
		downloadedConstituencies: false,
		downloadedBallotBox: false,
		downloadedResults: false,
		downloadedShuffles: [],
	};

	returnReadableDate(_date) {
		const days = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
		];

		const months = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
		];
		let date = new Date(_date);

		return `${days[date.getDay()]}, ${date.getDate()} ${
			months[date.getMonth()]
		} ${date.getFullYear()}`;
	}

	downloadFile(_data, _filename) {
		const element = document.createElement('a');
		const file = new Blob([_data], {
			type: 'text/plain',
		});
		element.href = URL.createObjectURL(file);
		element.download = _filename;
		document.body.appendChild(element);
		element.click();
	}

	parseDownload(_shuffle) {
		try {
			const newShuffle = _shuffle.replaceAll('\\', '');
			const newShuffle2 = newShuffle.replaceAll('"[', '[');
			const newShuffle3 = newShuffle2.replaceAll(']"', ']');
			const newShuffle4 = newShuffle3.replaceAll('}"', '}');
			const newShuffle5 = newShuffle4.replaceAll('"{', '{');

			return newShuffle5;
		} catch (error) {
			console.log(error);
		}
	}

	handleDownload = async (event) => {
		event.preventDefault();

		const buttonID = event.target.id;

		switch (buttonID) {
			case 'button-constituencies':
				this.setState({
					downloadedConstituencies: true,
				});

				this.downloadFile(
					JSON.stringify(this.props.ElectionDetails.constituencies),
					`ethlect ${
						this.props.ElectionDetails.electionName
					} constituencies @${this.returnReadableDate(
						Date.now()
					)}.json`
				);
				break;
			case 'button-ballotBox':
				this.setState({
					downloadedBallotBox: true,
				});

				this.downloadFile(
					JSON.stringify(this.props.ElectionDetails.ballotBox),
					`ethlect ${
						this.props.ElectionDetails.electionName
					} Ballot Box @${this.returnReadableDate(Date.now())}.json`
				);
				break;
			case 'button-results':
				this.setState({
					downloadedResults: true,
				});

				this.downloadFile(
					this.parseDownload(
						JSON.stringify(
							this.props.ElectionDetails.electionResults
						)
					),
					`ethlect ${
						this.props.ElectionDetails.electionName
					} Election Results @${this.returnReadableDate(
						Date.now()
					)}.json`
				);
				break;
			default:
				const shuffleID = buttonID.split('-')[2];

				let downloadedShuffles = [...this.state.downloadedShuffles];
				downloadedShuffles[shuffleID] = {
					...downloadedShuffles[shuffleID],
					copied: true,
				};
				this.setState({ downloadedShuffles });

				if (shuffleID < this.props.ElectionDetails.shuffles.length) {
					this.downloadFile(
						this.parseDownload(
							JSON.stringify(
								this.props.ElectionDetails.shuffles[shuffleID]
							)
						),
						`ethlect ${
							this.props.ElectionDetails.electionName
						} Proof ${
							this.props.ElectionDetails.shuffles[shuffleID]
								.shuffleID
						} @${this.returnReadableDate(Date.now())}.json`
					);
				}
				break;
		}
	};

	renderGeneralList() {
		return (
			<ListGroup as='ol' numbered>
				{this.props.ElectionDetails.constituencies &&
				this.props.ElectionDetails.constituencies.length > 0 ? (
					<ListGroup.Item
						as='li'
						className='d-flex justify-content-between align-items-start'
					>
						<div className='ms-2 me-auto'>
							<div className='fw-bold'>
								Election Constituencies
							</div>
							<p>
								A list of all constituencies in the election.
								Each constituency contains the number of seats
								that are to be filled together with the
								candidates running for the seats and the 6-digit
								IDs that represent these candidates throughout
								the system.
							</p>
							<p>
								<Button
									variant='primary'
									href={`/register`}
									size='sm'
									className='button-margin'
									id='button-constituencies'
									onClick={this.handleDownload}
									disabled={
										this.state.downloadedConstituencies
									}
								>
									{this.state.downloadedConstituencies
										? 'Downloaded!'
										: 'Download'}
								</Button>
							</p>
						</div>
						<Badge bg='success' pill>
							Approved
						</Badge>
					</ListGroup.Item>
				) : (
					''
				)}
				{this.props.ElectionDetails.ballotBox &&
				this.props.ElectionDetails.ballotBox.length > 0 ? (
					<ListGroup.Item
						as='li'
						className='d-flex justify-content-between align-items-start'
					>
						<div className='ms-2 me-auto'>
							<div className='fw-bold'>Ballot Box</div>
							<p>
								The ballot box contains all the ballots cast by
								voters using the application. Each cast ballot
								is tied to the ID of the voter that cast it and
								contains the encryptions of the candidates voted
								for. Note that the ballot box represents the
								votes cast at present and may not be complete
								until the electoral period is over.
							</p>
							<p>
								<Button
									variant='primary'
									href={`/register`}
									size='sm'
									className='button-margin'
									id='button-ballotBox'
									onClick={this.handleDownload}
									disabled={this.state.downloadedBallotBox}
								>
									{this.state.downloadedBallotBox
										? 'Downloaded!'
										: 'Download'}
								</Button>
							</p>
						</div>
						<Badge bg='success' pill>
							Approved
						</Badge>
					</ListGroup.Item>
				) : (
					''
				)}
				{this.props.ElectionDetails.electionResults &&
				this.props.ElectionDetails.electionResults.length > 0 ? (
					<ListGroup.Item
						as='li'
						className='d-flex justify-content-between align-items-start'
					>
						<div className='ms-2 me-auto'>
							<div className='fw-bold'>Election Results</div>
							<p>
								The final results of the election can be
								downloaded here. The results represent the
								decrypted candidate names from each ballot cast
								in the election. The results are not accompanied
								by any other data.
							</p>
							<p>
								<Button
									variant='primary'
									href={`/register`}
									size='sm'
									className='button-margin'
									id='button-results'
									onClick={this.handleDownload}
									disabled={this.state.downloadedResults}
								>
									{this.state.downloadedResults
										? 'Downloaded!'
										: 'Download'}
								</Button>
							</p>
						</div>
						<Badge bg='success' pill>
							Approved
						</Badge>
					</ListGroup.Item>
				) : (
					''
				)}
			</ListGroup>
		);
	}

	renderShufflesList() {
		let cards = [];

		if (
			!this.props.ElectionDetails.shuffles ||
			this.props.ElectionDetails.shuffles.length === 0
		) {
			return (
				<Alert variant='info'>
					No proofs have been created for this election.
				</Alert>
			);
		}

		for (let i = 0; i < this.props.ElectionDetails.shuffles.length; i++) {
			cards.push(
				<ListGroup.Item
					as='li'
					className='d-flex justify-content-between align-items-start'
				>
					<div className='ms-2 me-auto'>
						<div className='fw-bold'>
							{this.props.ElectionDetails.shuffles[i]
								.shuffleType === 'generate'
								? 'Ballot Generation'
								: this.props.ElectionDetails.shuffles[i]
										.shuffleType === 'transfer'
								? 'Ballot Transfer from Ballot Box'
								: this.props.ElectionDetails.shuffles[i]
										.shuffleType === 'decryption'
								? 'Ballots Decryption'
								: `Ballot Shuffle ${this.props.ElectionDetails.shuffles[i].shuffleID}`}
						</div>
						<p>
							{this.props.ElectionDetails.shuffles[i]
								.shuffleType === 'generate'
								? 'Represents the generation of the ballots. The election will generate ballots for every registered voter. Each ballot contains the designated constituency together with the ciphertexts representing the candidates running for that constituency.'
								: this.props.ElectionDetails.shuffles[i]
										.shuffleType === 'transfer'
								? 'The application will transfer all ballots from the ballot box into the shuffles list upon the start of the election tabulation process. All identifying information related to the ballots is removed.'
								: this.props.ElectionDetails.shuffles[i]
										.shuffleType === 'decryption'
								? 'Represents the final decryption of the ballots. The ballots are decrypted by the electoral authority and the resulting candidate selections are made public together with a proof of decryption.'
								: 'The electoral authority re-encrypts and shuffles the ballots in the ballot list in order to lose the relationship between the ballots and the voters. Each shuffle is accompanied by a proof of shuffling.'}
						</p>
						<p>
							<Button
								variant='primary'
								href={`/register`}
								size='sm'
								className='button-margin'
								id={`button-shuffle-${i}`}
								onClick={this.handleDownload}
								disabled={this.state.downloadedShuffles[i]}
							>
								{this.state.downloadedShuffles[i]
									? 'Downloaded!'
									: 'Download'}
							</Button>
						</p>
					</div>
					<Badge
						className='button-margin'
						bg={
							this.props.ElectionDetails.shuffles[i]
								.shuffleType === 'generate'
								? 'primary'
								: this.props.ElectionDetails.shuffles[i]
										.shuffleType === 'transfer'
								? 'info'
								: this.props.ElectionDetails.shuffles[i]
										.shuffleType === 'decryption'
								? 'success'
								: 'dark'
						}
						pill
					>
						{this.props.ElectionDetails.shuffles[i].shuffleType}
					</Badge>
					<Badge
						bg={
							this.props.ElectionDetails.shuffles[i].approved
								? 'success'
								: 'warning'
						}
						pill
					>
						{this.props.ElectionDetails.shuffles[i].approved
							? 'Approved'
							: 'Pending'}
					</Badge>
				</ListGroup.Item>
			);
		}

		return (
			<p>
				<ListGroup as='ol' numbered>
					{cards}
				</ListGroup>
			</p>
		);
	}

	render() {
		return (
			<>
				<Card className='create-tab-card'>
					<Card.Body>
						<Card.Title>General Data</Card.Title>
						<Card.Text>
							This section allows for more general data produced
							by the election to be accessed. All data excluding
							proofs is shown here.
						</Card.Text>
						{this.renderGeneralList()}
					</Card.Body>
				</Card>
				<Card className='create-tab-card'>
					<Card.Body>
						<Card.Title>Proof Data</Card.Title>
						<Card.Text>
							Every time the application generates or manipulates
							ballots in any way, the data related to this action
							is made public together with a proof of the
							correctness of this manipulation that can be proven
							by third parties.
						</Card.Text>
						{this.renderShufflesList()}
					</Card.Body>
				</Card>
			</>
		);
	}
}

export default ElectionsNow;
