import { Component } from 'react';
import { getSession } from 'next-auth/react';
import { Button, Card } from 'react-bootstrap';
import Layout from '../../components/layout/Layout';
import ElectionList from '../../components/admin';

class Admin extends Component {
	static async getInitialProps(context) {
		const fetchString = process.env.NEXT_PUBLIC_API_GETELECTIONS;

		const res = await fetch(fetchString, {
			method: 'GET',
		});

		const resJSON = await res.json();

		return {
			props: {
				session: await getSession(context),
				elections: resJSON.elections,
			},
		};
	}

	render() {
		return (
			<Layout Title='ethlect. Admin Dashboard' Admin>
				<>
					<h1 className='heading'>Admin Page</h1>

					<Card>
						<Card.Header>Create Election</Card.Header>
						<Card.Body>
							<Card.Title>Create a new Election</Card.Title>
							<Card.Text>
								Initiate a new Election to run on the ethlect.
								System
							</Card.Text>
							<Button variant='primary' href='/admin/new'>
								Create Election
							</Button>
						</Card.Body>
					</Card>

					<ElectionList Elections={this.props.props.elections} />
				</>
			</Layout>
		);
	}
}

export default Admin;
