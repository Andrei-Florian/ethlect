import Layout from '../../../components/layout/Layout';
import StartElection from '../../../components/admin/election/start';
import { Component } from 'react';
import { getSession } from 'next-auth/react';
import { Alert, Button } from 'react-bootstrap';

class Election_Delete extends Component {
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
					action: context.query.action,
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
			<Layout Title='ethlect. Start Election' Admin>
				{this.props.props.election ? (
					<>
						<h1>
							{this.props.props.action == 'true'
								? 'End'
								: 'Start'}{' '}
							{this.props.props.electionDetails.electionName}
						</h1>
						<StartElection
							ElectionDetails={this.props.props.electionDetails}
							Action={this.props.props.action}
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

export default Election_Delete;
