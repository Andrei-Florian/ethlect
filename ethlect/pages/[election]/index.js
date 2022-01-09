import Layout from '../../components/layout/Layout';
import ElectionIndex from '../../components/voter/election/index';
import { Component } from 'react';
import { getSession } from 'next-auth/react';
import { Alert, Button } from 'react-bootstrap';

class Election_Index extends Component {
	static async getInitialProps(context) {
		const session = await getSession(context);
		const fetchString = process.env.NEXT_PUBLIC_API_VERIFY_BALLOT;
		const electionID = context.query.election;

		const postRequest = JSON.stringify({
			electionID,
			session,
			simple: true,
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
			<Layout Title='ethlect. Election'>
				{this.props.props.election ? (
					<>
						<h1>{this.props.props.electionDetails.electionName}</h1>
						<p>
							{
								this.props.props.electionDetails
									.electionDescription
							}
						</p>
						<ElectionIndex
							ElectionDetails={this.props.props.electionDetails}
							Session={this.props.props.session}
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

export default Election_Index;
