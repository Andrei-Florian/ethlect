import Layout from '../../../../components/layout/Layout';
import { Component } from 'react';
import { getSession } from 'next-auth/react';
import { Alert, Button } from 'react-bootstrap';
import ShuffleElection from '../../../../components/admin/election/shuffleElection';

class Election_Tabulate extends Component {
	static async getInitialProps(context) {
		const fetchString = process.env.NEXT_PUBLIC_API_GETELECTIONSHUFFLE;

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
					session: await getSession(context),
					election: true,
					electionDetails: resJSON.electionDetails,
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
			<Layout Title='ethlect. Shuffle Ballots' Admin>
				<>
					{this.props.props.election ? (
						<>
							<h1>
								Create a New Shuffle for{' '}
								{this.props.props.electionDetails.electionName}
							</h1>
							<ShuffleElection
								ElectionDetails={
									this.props.props.electionDetails
								}
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
				</>
			</Layout>
		);
	}
}

export default Election_Tabulate;
