import Layout from '../components/layout/Layout';
import { Component } from 'react';
import Details from '../components/index/details';
import ElectionsNow from '../components/index/elections';
import { getSession } from 'next-auth/react';

class Index extends Component {
	static async getInitialProps(context) {
		const fetchString = process.env.NEXT_PUBLIC_API_GETELECTIONS;

		// send the request
		const res = await fetch(fetchString, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		const resJSON = await res.json();

		if (resJSON.success) {
			return {
				props: {
					session: await getSession(context),
					elections: true,
					electionsObj: resJSON.elections,
				},
			};
		} else {
			return {
				props: {
					session: await getSession(context),
					elections: false,
				},
			};
		}
	}

	render() {
		return (
			<Layout Title='ethlect.'>
				<>
					<h1 className='home-h1'>Welcome to ethlect! 🗳</h1>
					<Details />
					<h1>Elections Running Now 👩‍⚖️</h1>
					<ElectionsNow Props={this.props.props} />
				</>
			</Layout>
		);
	}
}

export default Index;
