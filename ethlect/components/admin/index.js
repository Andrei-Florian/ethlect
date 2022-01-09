import { Component } from 'react';
import { Card, Button, Alert, Table } from 'react-bootstrap';

class ElectionList extends Component {
	state = {
		elections: [],
	};

	constructor(props) {
		super(props);

		this.state = {
			elections: this.props.Elections,
		};
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
		} ${date.getFullYear()}`;
	}

	renderElections() {
		let cards = [];

		for (let i = 0; i < this.state.elections.length; i++) {
			cards[i] = (
				<Card className='create-tab-card'>
					<Card.Body>
						<Card.Title>
							{this.state.elections[i].electionName}
						</Card.Title>
						<Card.Text>
							{this.state.elections[i].electionDescription}
						</Card.Text>
						<Table striped bordered hover>
							<tbody>
								<tr>
									<td>Election ID</td>
									<td>
										{this.state.elections[i].electionID}
									</td>
								</tr>
								<tr>
									<td>Election Start Date</td>
									<td>
										{this.returnReadableDate(
											this.state.elections[i]
												.electionStart
										)}
									</td>
								</tr>
								<tr>
									<td>Election End Date</td>
									<td>
										{this.returnReadableDate(
											this.state.elections[i].electionEnd
										)}
									</td>
								</tr>
								<tr>
									<td>Election Accepting Ballots</td>
									<td>
										{this.state.elections[i].electoralPeriod
											? 'Yes'
											: 'No'}
									</td>
								</tr>
								<tr>
									<td>Number of Constituencies</td>
									<td>
										{this.state.elections[i].constituencies}
									</td>
								</tr>
								<tr>
									<td>Ballots Generated</td>
									<td>
										{this.state.elections[i].ballots
											? this.state.elections[i].ballots
											: 'None'}
									</td>
								</tr>
								<tr>
									<td>Ballots Cast</td>
									<td>
										{this.state.elections[i].ballotsCast
											? this.state.elections[i]
													.ballotsCast
											: 'None'}
									</td>
								</tr>
							</tbody>
						</Table>
						{this.state.elections[i].electionTabulating ? (
							<Alert variant='info'>
								This election is in the tabulation process and
								cannot be interacted with!
							</Alert>
						) : (
							''
						)}
						{this.state.elections[i].electionVerified ? (
							<>
								<Button
									variant='primary'
									href={`/admin/${this.state.elections[i].electionID}`}
									size='sm'
									className='button-margin'
								>
									Election Details
								</Button>
								<Button
									variant='dark'
									href={`/admin/${this.state.elections[i].electionID}/generate`}
									size='sm'
									className='button-margin'
									disabled={
										this.state.elections[i]
											.electionTabulating
									}
								>
									Generate Ballots
								</Button>
								<Button
									variant='dark'
									href={`/admin/${this.state.elections[i].electionID}/start/?action=${this.state.elections[i].electoralPeriod}`}
									size='sm'
									className='button-margin'
									disabled={
										this.state.elections[i]
											.electionTabulating
									}
								>
									{this.state.elections[i].electoralPeriod
										? 'End Electoral Period'
										: 'Start Electoral Period'}
								</Button>
								<Button
									variant='dark'
									href={`/admin/${this.state.elections[i].electionID}/tabulate`}
									size='sm'
									className='button-margin'
								>
									Tabulate Votes
								</Button>
								<Button
									variant='dark'
									href={`/${this.state.elections[i].electionID}/audit`}
									size='sm'
									className='button-margin'
								>
									Audit Election
								</Button>
								<Button
									variant='danger'
									href={`/admin/${this.state.elections[i].electionID}/delete`}
									size='sm'
									className='button-margin'
								>
									Delete Election
								</Button>
							</>
						) : (
							<>
								<Alert variant='secondary'>
									<p>
										This election was not verified and
										cannot run. Please delete the election!
									</p>
									<Button
										variant='danger'
										href={`/admin/${this.state.elections[i].electionID}/delete`}
										size='sm'
										className='button-margin'
									>
										Delete Election
									</Button>
								</Alert>
							</>
						)}
					</Card.Body>
				</Card>
			);
		}

		return cards;
	}

	render() {
		return <>{this.renderElections()}</>;
	}
}

export default ElectionList;
