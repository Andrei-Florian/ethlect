import Layout from '../../components/layout/Layout';
import ElectionVerify from '../../components/voter/election/verify';
import { Component } from 'react';
import { getSession } from 'next-auth/react';
import { Alert, Button } from 'react-bootstrap';

class Election_Audit extends Component {
	static async getInitialProps(context) {
		const session = await getSession(context);
		const fetchString = process.env.NEXT_PUBLIC_API_VERIFY_BALLOT;
		const electionID = context.query.election;

		const postRequest = JSON.stringify({
			electionID,
			session,
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

		if (resJSON.success && resJSON.ballots) {
			return {
				props: {
					session: session,
					election: true,
					electionDetails: resJSON.electionDetails,
					ballots: resJSON.ballots,
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

	render() {
		return (
			<Layout Title='ethlect. Verify Vote' Voter>
				{this.props.props.election ? (
					<>
						<h1>
							Verify your Vote in{' '}
							{this.props.props.electionDetails.electionName}
						</h1>
						<ElectionVerify
							ElectionDetails={this.props.props.electionDetails}
							Ballots={this.props.props.ballots}
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

export default Election_Audit;
