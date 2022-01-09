import { Component } from 'react';
import { Table, Card, Alert, Button } from 'react-bootstrap';

class ElectionVerify extends Component {
	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

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
		} ${date.getFullYear()} at ${
			date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
		}:${
			date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
		}`;
	}

	renderInfoCard() {
		return (
			<>
				<Card className='create-tab-card'>
					<Card.Body>
						<Card.Title>Verify Cast Vote</Card.Title>
						<Card.Text>
							<p>
								ethlect. is an end to end verifiable i-voting
								implementation that allows for each ballot to be
								traced throughout the system while maintaining
								the voter anonymity. This page allows voters to
								verify the vote(s) they cast in an election that
								have been included in the ballot box.
							</p>
							<p>
								If your vote was recorded successfully, it will
								be displayed on a card below. The vote will
								contain the following information:
								<ul>
									<li>ID of the ballot used</li>
									<li>Your User ID</li>
									<li>The constituency you voted in</li>
									<li>
										The representative candidate IDs of the
										candidate you voted for in preferencial
										order
									</li>
								</ul>
							</p>
							<strong>
								You can verify that your vote was recorded
								correctly by comparing the displayed ballot ID
								to the ballot ID on your physical ballot and
								ensuring that the representative candidate IDs
								match the candidates you wish to vote for. You
								can also check if the order of preference is
								correct.
							</strong>
						</Card.Text>
					</Card.Body>
				</Card>
			</>
		);
	}

	renderCandidatePreferences(_candidates) {
		let candidates = [];

		for (let i = 0; i < _candidates.length; i++) {
			candidates[i] = (
				<tr>
					<td>Candidate Preference {i + 1}</td>
					<td>{_candidates[i].candidateRep}</td>
				</tr>
			);
		}

		return candidates;
	}

	renderBallotCards() {
		let ballotCards = [];

		if (this.props.Ballots.length === 0) {
			return (
				<Alert variant='info'>
					<Alert.Heading>
						No Ballots were Found Cast using this Account
					</Alert.Heading>
					<p>
						The election does not contain any ballots cast with the
						account logged in. If you followed the ballot casting
						process fully and received a confirmation of the
						casting, please try refreshing the page. You may try
						casting your ballot again by clicking the button below.
					</p>
					<Button
						variant='outline-dark'
						href={`/${this.props.ElectionDetails.electionID}/vote`}
					>
						Cast Vote
					</Button>
				</Alert>
			);
		}

		for (let i = 0; i < this.props.Ballots.length; i++) {
			ballotCards[i] = (
				<Card className='create-tab-card'>
					<Card.Body>
						<Card.Title>Vote Cast (number {i})</Card.Title>
						<Card.Text>
							<Alert
								variant={
									i < this.props.Ballots.length - 1
										? 'danger'
										: 'success'
								}
							>
								{i < this.props.Ballots.length - 1
									? 'This vote was cast by you using ethlect. and has been recorded successfully but you have cast another vote after this one. The new vote cast replaced this one.'
									: 'This vote was cast by you using ethlect. and was recorded successfully in the ballot box.'}
							</Alert>
							<p>
								The table below displays general details about
								the cast ballot.
							</p>
							<Table striped bordered hover>
								<tbody>
									<tr>
										<td>Election Casted In</td>
										<td>
											{
												this.props.ElectionDetails
													.electionName
											}
										</td>
									</tr>
									<tr>
										<td>Constituency Voted In</td>
										<td>
											{this.props.Ballots[i].constituency}
										</td>
									</tr>
									<tr>
										<td>Ballot ID</td>
										<td>
											{this.props.Ballots[i].ballotID}
										</td>
									</tr>
									<tr>
										<td>Timestamp</td>
										<td>
											{this.returnReadableDate(
												this.props.Ballots[i].timestamp
											)}
										</td>
									</tr>
								</tbody>
							</Table>
							<p>
								The table below displays the representative
								candidate IDs of thecandidates you voted for in
								preferencial order.
							</p>
							<Table striped bordered hover>
								<thead>
									<tr>
										<th>Preference</th>
										<th>Candidate ID</th>
									</tr>
								</thead>
								<tbody>
									{this.renderCandidatePreferences(
										this.props.Ballots[i].candidates
									)}
								</tbody>
							</Table>
						</Card.Text>
					</Card.Body>
				</Card>
			);
		}

		return ballotCards;
	}

	render() {
		return (
			<>
				{this.renderInfoCard()}
				{this.renderBallotCards()}
			</>
		);
	}
}

export default ElectionVerify;
