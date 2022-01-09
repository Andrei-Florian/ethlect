import { Component } from 'react';
import { Button, Card, Table, Alert } from 'react-bootstrap';
import Router from 'next/router';

class Delete extends Component {
	state = {
		loading: false,
		error: false,
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

	renderDetailsTable() {
		return (
			<Table striped bordered hover>
				<tbody>
					<tr>
						<td>Election ID</td>
						<td>{this.props.ElectionDetails.electionID}</td>
					</tr>
					<tr>
						<td>Election Start Date</td>
						<td>
							{this.returnReadableDate(
								this.props.ElectionDetails.electionStart
							)}
						</td>
					</tr>
					<tr>
						<td>Election End Date</td>
						<td>
							{this.returnReadableDate(
								this.props.ElectionDetails.electionEnd
							)}
						</td>
					</tr>
					<tr>
						<td>Election Accepting Ballots</td>
						<td>
							{this.props.ElectionDetails.electoralPeriod
								? 'Yes'
								: 'No'}
						</td>
					</tr>
					<tr>
						<td>Number of Constituencies</td>
						<td>{this.props.ElectionDetails.constituencies}</td>
					</tr>
					<tr>
						<td>Ballots Generated</td>
						<td>
							{this.props.ElectionDetails.ballots
								? this.props.ElectionDetails.ballots
								: 'None'}
						</td>
					</tr>
					<tr>
						<td>Ballots Cast</td>
						<td>
							{this.props.ElectionDetails.ballotsCast
								? this.props.ElectionDetails.ballotsCast
								: 'None'}
						</td>
					</tr>
				</tbody>
			</Table>
		);
	}

	renderCTAs() {
		return (
			<>
				<Button
					variant='dark'
					href={`/admin/${this.props.ElectionDetails.electionID}/generate`}
					size='sm'
					className='button-margin'
					disabled={this.props.ElectionDetails.electionTabulating}
				>
					Generate Ballots
				</Button>
				<Button
					variant='dark'
					href={`/admin/${this.props.ElectionDetails.electionID}/start/?action=${this.props.ElectionDetails.electoralPeriod}`}
					size='sm'
					className='button-margin'
					disabled={this.props.ElectionDetails.electionTabulating}
				>
					{this.props.ElectionDetails.electoralPeriod
						? 'End Electoral Period'
						: 'Start Electoral Period'}
				</Button>
				<Button
					variant='dark'
					href={`/admin/${this.props.ElectionDetails.electionID}/tabulate`}
					size='sm'
					className='button-margin'
				>
					Tabulate Votes
				</Button>
				<Button
					variant='dark'
					href={`/${this.props.ElectionDetails.electionID}/audit`}
					size='sm'
					className='button-margin'
				>
					Audit Election
				</Button>
				<Button
					variant='danger'
					href={`/admin/${this.props.ElectionDetails.electionID}/delete`}
					size='sm'
					className='button-margin'
				>
					Delete Election
				</Button>
			</>
		);
	}

	renderCTAsCard() {
		return (
			<Card className='create-tab-card'>
				<Card.Body>
					<Card.Title>Election Actions</Card.Title>
					<Card.Text>
						Use the buttons below to perform action on the election:
					</Card.Text>
					{this.renderCTAs()}
				</Card.Body>
			</Card>
		);
	}

	renderAlert() {
		if (this.props.ElectionDetails.electionTabulating) {
			return (
				<Alert variant='info'>
					This election is in the tabulation process and cannot be
					interacted with! The election has been terminated and is
					currently being tabulated. You can no longer generate
					ballots, control the electoral window, or receive votes for
					this election.
				</Alert>
			);
		}
	}

	render() {
		return (
			<>
				<Card className='create-tab-card'>
					<Card.Body>
						<Card.Title>Election Information</Card.Title>
						<Card.Text>
							Key information about the election is presented in
							the table below:
						</Card.Text>
						{this.renderAlert()}
						{this.renderDetailsTable()}
					</Card.Body>
				</Card>

				{this.renderCTAsCard()}
			</>
		);
	}
}

export default Delete;
