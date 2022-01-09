import Layout from '../components/layout/Layout';
import VerifyIdentity from '../components/voter/verifyID';
import { Component } from 'react';
import { getSession } from 'next-auth/react';

class Election_Delete extends Component {
	static async getInitialProps(context) {
		return {
			props: {
				session: await getSession(context),
			},
		};
	}

	render() {
		return (
			<Layout Title='ethlect. Verify Identity' Voter>
				<>
					<h1>Verify Identity</h1>
					<VerifyIdentity Session={this.props.props.session} />
				</>
			</Layout>
		);
	}
}

export default Election_Delete;
