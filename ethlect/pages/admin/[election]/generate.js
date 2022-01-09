import Layout from '../../../components/layout/Layout';
import GenerateBallots from '../../../components/admin/election/generate';
import { Component } from 'react';
import { getSession } from 'next-auth/react';
import { Alert, Button } from 'react-bootstrap';

class Election_Register extends Component {
	static async getInitialProps(context) {
		const fetchString = process.env.NEXT_PUBLIC_API_GETELECTION;
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

		if (resJSON.success && resJSON.electionDetails.electionVerified) {
			return {
				props: {
					session: await getSession(context),
					election: true,
					electionName: resJSON.electionDetails.electionName,
					electionID: resJSON.electionDetails.electionID,
					electionTabulating:
						resJSON.electionDetails.electionTabulating,
					electionComplete: resJSON.electionDetails.electionComplete,
				},
			};
		} else {
			return {
				props: {
					session: await getSession(context),
					election: false,
				},
			};
		}
	}

	render() {
		return (
			<Layout Title='ethlect. Generate Ballots' Admin>
				{this.props.props.election ? (
					<>
						<h1>
							Generate Ballots for {this.props.props.electionName}
						</h1>
						<GenerateBallots
							ElectionID={this.props.props.electionID}
							ElectionTabulating={
								this.props.props.electionTabulating
							}
							ElectionComplete={this.props.props.electionComplete}
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

export default Election_Register;
