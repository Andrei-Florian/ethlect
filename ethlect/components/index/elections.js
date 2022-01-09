import { Component } from 'react';
import { Card, Button, Alert, Table, Row, Col } from 'react-bootstrap';
import { signIn } from 'next-auth/react';

class ElectionsNow extends Component {
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

	renderElectionCard(electionsObj) {
		return (
			<Card className='create-tab-card'>
				<Card.Body>
					<Card.Title>{electionsObj.electionName}</Card.Title>
					<Card.Text>{electionsObj.electionDescription}</Card.Text>

					{!electionsObj.electionComplete ? (
						electionsObj.electionTabulating ? (
							<Alert variant='danger'>
								This Election is Over and the Votes are being
								Tabulated!
							</Alert>
						) : electionsObj.electoralPeriod ? (
							(this.props.Props.session &&
								this.props.Props.session.user.accountType ===
									'admin') ||
							this.props.Props.session.user.idVerified ==
								'true' ? (
								<Alert variant='info'>
									This Election is Running at Present and
									Accepts Votes!
								</Alert>
							) : this.props.Props.session ? (
								<Alert variant='danger'>
									You may not partake in this election as you
									have not verified your ID.
								</Alert>
							) : (
								''
							)
						) : (
							<Alert variant='warning'>
								This Election is Running at Present but the
								Electoral Period has not yet Started!
							</Alert>
						)
					) : (
						<Alert variant='success'>
							The ballots have been revealed and the election is
							now complete!
						</Alert>
					)}

					<Table striped bordered hover>
						<tbody>
							<tr>
								<td>Election Start Date</td>
								<td>
									{this.returnReadableDate(
										electionsObj.electionStart
									)}
								</td>
							</tr>
							<tr>
								<td>Election End Date</td>
								<td>
									{this.returnReadableDate(
										electionsObj.electionEnd
									)}
								</td>
							</tr>
							<tr>
								<td>Number of Constituencies</td>
								<td>{electionsObj.constituencies}</td>
							</tr>
						</tbody>
					</Table>
					<div>
						{this.props.Props.session ? (
							this.props.Props.session.user.accountType ===
							'admin' ? (
								<>
									<Button
										variant='primary'
										href={`/admin/${electionsObj.electionID}`}
										size='sm'
										className='button-margin'
									>
										Manage Election
									</Button>
									<Button
										variant='dark'
										href={`/${electionsObj.electionID}/audit`}
										size='sm'
										className='button-margin'
									>
										Audit Election
									</Button>
								</>
							) : (
								<>
									<Button
										variant='primary'
										href={`/${electionsObj.electionID}`}
										size='sm'
										className='button-margin'
									>
										Election Details
									</Button>
									<Button
										variant='dark'
										href={`/${electionsObj.electionID}/vote`}
										size='sm'
										className='button-margin'
										disabled={
											!electionsObj.electoralPeriod ||
											electionsObj.electionTabulating ||
											this.props.Props.session.user
												.idVerified !== 'true'
										}
									>
										Cast Vote
									</Button>
									<Button
										variant='dark'
										href={`/${electionsObj.electionID}/verify`}
										size='sm'
										className='button-margin'
									>
										Verify Cast Vote
									</Button>
									<Button
										variant='dark'
										href={`/${electionsObj.electionID}/audit`}
										size='sm'
										className='button-margin'
									>
										Audit Election
									</Button>
								</>
							)
						) : (
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
								<Button
									variant='primary'
									href={`/${electionsObj.electionID}`}
									size='sm'
									className='button-margin button-space-bottom'
								>
									Election Details
								</Button>
								<Button
									variant='dark'
									href={`/${electionsObj.electionID}/audit`}
									size='sm'
									className='button-margin button-space-bottom'
								>
									Audit Election
								</Button>
							</>
						)}
					</div>
				</Card.Body>
			</Card>
		);
	}

	renderElectionCards() {
		let cards = [];
		let verifiedElections = [];

		for (let i = 0; i < this.props.Props.electionsObj.length; i++) {
			if (this.props.Props.electionsObj[i].electionVerified) {
				verifiedElections.push(this.props.Props.electionsObj[i]);
			}
		}

		for (let i = 0; i < verifiedElections.length; i += 2) {
			cards[i] = (
				<Row>
					<Col lg={6}>
						{verifiedElections[i]
							? this.renderElectionCard(verifiedElections[i])
							: ''}
					</Col>
					<Col lg={6}>
						{verifiedElections[i + 1]
							? this.renderElectionCard(verifiedElections[i + 1])
							: ''}
					</Col>
				</Row>
			);
		}

		if (cards.length === 0) {
			return (
				<Alert variant='info' style={{ marginTop: 20 + 'px' }}>
					There are no elections running at present. Elections running
					will be displayed here.
				</Alert>
			);
		}

		return cards;
	}

	render() {
		return <div className='home-table'>{this.renderElectionCards()}</div>;
	}
}

export default ElectionsNow;
