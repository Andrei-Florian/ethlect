import Layout from '../../components/layout/Layout';
import General from '../../components/voter/election/audit';
import { Component } from 'react';
import { getSession } from 'next-auth/react';
import { Alert, Button, Card, Table, ProgressBar } from 'react-bootstrap';

class Election_Index extends Component {
	static async getInitialProps(context) {
		const session = await getSession(context);
		const fetchString = process.env.NEXT_PUBLIC_API_GETINTEGRALELECTION;
		const electionID = context.query.election;

		const postRequest = JSON.stringify({
			electionID,
		});

		// send the request
		const res = await fetch(fetchString, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: postRequest,
		});

		const resJSON = await res.json();

		if (resJSON.success) {
			return {
				props: {
					session: session,
					election: true,
					electionDetails: resJSON.electionDetails,
				},
			};
		} else {
			return {
				props: {
					session: session,
					election: false,
				},
			};
		}
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

	renderOverviewTable() {
		return (
			<Table striped bordered hover>
				<tbody>
					<tr>
						<td>Election ID</td>
						<td>{this.props.props.electionDetails.electionID}</td>
					</tr>
					<tr>
						<td>Election Start Date</td>
						<td>
							{this.returnReadableDate(
								this.props.props.electionDetails.electionStart
							)}
						</td>
					</tr>
					<tr>
						<td>Election End Date</td>
						<td>
							{this.returnReadableDate(
								this.props.props.electionDetails.electionEnd
							)}
						</td>
					</tr>
					<tr>
						<td>Number of Constituencies</td>
						<td>
							{
								this.props.props.electionDetails.constituencies
									.length
							}
						</td>
					</tr>
					<tr>
						<td>Ballots Generated</td>
						<td>
							{this.props.props.electionDetails.ballots
								? this.props.props.electionDetails.ballots
								: 'None'}
						</td>
					</tr>
					<tr>
						<td>Ballots Cast</td>
						<td>
							{this.props.props.electionDetails.ballotBox.length
								? this.props.props.electionDetails.ballotBox
										.length
								: 'None'}
						</td>
					</tr>
					<tr>
						<td>Number of Proofs</td>
						<td>
							{this.props.props.electionDetails.shuffles.length
								? this.props.props.electionDetails.shuffles
										.length
								: 'None'}
						</td>
					</tr>
				</tbody>
			</Table>
		);
	}

	renderElectionProgress() {
		return (
			<>
				<Card.Title>Election Progress</Card.Title>
				<p>
					The progress bar below shows the stages that the election
					has been through.
				</p>
				<ProgressBar>
					{this.props.props.electionDetails.electionVerified ? (
						<ProgressBar
							variant='primary'
							now={10}
							key={1}
							label='Election Start'
						/>
					) : (
						''
					)}
					{this.props.props.electionDetails.ballots > 0 ? (
						<ProgressBar
							variant='info'
							now={10}
							key={1}
							label='Ballots Made'
						/>
					) : (
						''
					)}
					{this.props.props.electionDetails.electoralPeriod ||
					this.props.props.electionDetails.electionTabulating ||
					this.props.props.electionDetails.ballotBox.length > 0 ? (
						<ProgressBar
							variant='warning'
							now={40}
							key={1}
							label='Electoral Period'
						/>
					) : (
						''
					)}
					{this.props.props.electionDetails.electionTabulating ? (
						<ProgressBar
							variant='danger'
							now={30}
							key={1}
							label='Election Tabulation'
						/>
					) : (
						''
					)}
					{this.props.props.electionDetails.electionComplete ? (
						<ProgressBar
							variant='success'
							now={10}
							key={1}
							label='Complete'
						/>
					) : (
						''
					)}
				</ProgressBar>
			</>
		);
	}

	render() {
		return (
			<Layout Title='ethlect. Audit Election'>
				{this.props.props.election ? (
					<>
						<h1>
							Audit{' '}
							{this.props.props.electionDetails.electionName}
						</h1>
						<Card className='create-tab-card'>
							<Card.Body>
								<Card.Title>Overview</Card.Title>
								<Card.Text>
									This page allows public access to all the
									public data generated during the election
									process. An overview of the application is
									provided below and the progress bar below
									shows the stage that the election is
									currently at.
								</Card.Text>
								{this.renderOverviewTable()}
								{this.renderElectionProgress()}
							</Card.Body>
						</Card>
						<General
							ElectionDetails={this.props.props.electionDetails}
						/>
					</>
				) : (
					<>
						<Alert variant='danger'>
							<p>The queried election could not be found!</p>
							<Button variant='outline-dark' href='/'>
								Return Home
							</Button>
						</Alert>
					</>
				)}
			</Layout>
		);
	}
}

export default Election_Index;
