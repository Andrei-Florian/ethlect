import { Component } from 'react';
import { Button, Card, Table, Alert } from 'react-bootstrap';
import { signIn } from 'next-auth/react';

class Index extends Component {
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
						<td>Number of Constituencies</td>
						<td>{this.props.ElectionDetails.constituencies}</td>
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

	renderVoterActions() {
		return (
			<>
				<p>
					Use the button below to access the vote casting page and
					cast your vote in the election. Note that you must have a
					physical ballot to be able to cast a vote in this election.
				</p>
				{this.props.Ballots.length > 0 ? (
					<Alert variant='success'>
						You have already voted in this election and your ballot
						was successfully added to the ballot box! You may cast
						another vote with a different ballot if you wish. Your
						new vote will replace the old one cast.
					</Alert>
				) : (
					''
				)}
				{!this.props.ElectionDetails.electionComplete ? (
					this.props.ElectionDetails.electoralPeriod &&
					!this.props.ElectionDetails.electionTabulating ? (
						this.props.Session.user.idVerified === 'true' ? (
							<>
								<Button
									variant='primary'
									size='sm'
									href={`/${this.props.ElectionDetails.electionID}/vote`}
									className='button-margin'
								>
									Cast Vote
								</Button>
							</>
						) : (
							<Alert variant='danger'>
								You may not partake in this election as you have
								not verified your ID before ballots were
								generated for it.
							</Alert>
						)
					) : (
						<Alert variant='warning'>
							This election does not accept any ballots at
							present. The election may not have started or may
							have been terminated by the electoral body.
						</Alert>
					)
				) : (
					<Alert variant='success'>This Election is Complete!</Alert>
				)}
			</>
		);
	}

	renderAdminActions() {
		return (
			<>
				<p>
					You can manage this election from the admin dashboard. This
					allows you to configure the election and perform various
					actions.
				</p>
				<Button
					variant='primary'
					size='sm'
					href={`/admin/${this.props.ElectionDetails.electionID}`}
					className='button-margin'
				>
					Admin Dashboard
				</Button>
			</>
		);
	}

	renderUnauthenticatedActions() {
		return (
			<>
				<p>Cast your vote in the election.</p>
				{this.props.ElectionDetails.electoralPeriod &&
				!this.props.ElectionDetails.electionTabulating ? (
					<>
						<Alert variant='secondary'>
							<p>
								Please log in or register if you wish to
								interact with this election.
							</p>
							<Button
								variant='light'
								onClick={signIn}
								size='sm'
								className='button-margin'
							>
								Log In
							</Button>
							<Button
								variant='light'
								href={`/register`}
								size='sm'
								className='button-margin'
							>
								Register
							</Button>
						</Alert>
					</>
				) : (
					<Alert variant='info'>
						This election does not accept any ballots at present.
						The election may not have started or may have been
						terminated by the electoral body.
					</Alert>
				)}
			</>
		);
	}

	renderCTAsCard() {
		return (
			<Card className='create-tab-card'>
				<Card.Body>
					<Card.Title>Partake in Election</Card.Title>
					<Card.Text>
						{this.props.Session
							? this.props.Session.user.accountType === 'voter'
								? this.renderVoterActions()
								: this.renderAdminActions()
							: this.renderUnauthenticatedActions()}
					</Card.Text>
				</Card.Body>
			</Card>
		);
	}

	renderAuditCard() {
		return (
			<Card className='create-tab-card'>
				<Card.Body>
					<Card.Title>Verify and Audit Election</Card.Title>
					<Card.Text>
						Use the options below to verify and audit the election.
						Anyone can access all election documents and data at the
						link provided by the audit button. If you are a logged
						in voter, you may also verify your vote in the election.
					</Card.Text>
					<Button
						variant='dark'
						size='sm'
						href={`/${this.props.ElectionDetails.electionID}/audit`}
						className='button-margin'
					>
						Audit Election
					</Button>
					{this.props.Session &&
					this.props.Session.user.accountType === 'voter' ? (
						<Button
							variant='dark'
							size='sm'
							href={`/${this.props.ElectionDetails.electionID}/verify`}
							className='button-margin'
						>
							Verify Vote
						</Button>
					) : (
						''
					)}
				</Card.Body>
			</Card>
		);
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
						{this.renderDetailsTable()}
					</Card.Body>
				</Card>

				{this.renderCTAsCard()}
				{this.renderAuditCard()}
			</>
		);
	}
}

export default Index;
