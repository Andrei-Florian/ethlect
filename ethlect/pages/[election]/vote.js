import Layout from '../../components/layout/Layout';
import ElectionVote from '../../components/voter/election/vote';
import { Component } from 'react';
import { getSession } from 'next-auth/react';
import { Alert, Button } from 'react-bootstrap';

class Election_Vote extends Component {
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
			<Layout Title='ethlect. Vote' Voter>
				{this.props.props.election ? (
					this.props.props.electionDetails.electoralPeriod ? (
						<>
							<h1>
								Cast Vote in{' '}
								{this.props.props.electionDetails.electionName}
							</h1>
							<ElectionVote
								ElectionDetails={
									this.props.props.electionDetails
								}
								Session={this.props.props.session}
							/>
						</>
					) : (
						<>
							<Alert variant='danger'>
								<p>
									The election you wish to vote in is not
									accepting votes at the moment!
								</p>
								<Button variant='outline-dark' href='/'>
									Return Home
								</Button>
							</Alert>
						</>
					)
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

export default Election_Vote;
