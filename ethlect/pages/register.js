import Layout from '../components/layout/Layout';
import { Component } from 'react';
import RegisterForm from '../components/register';
import { getSession } from 'next-auth/react';

class Election_Register extends Component {
	static async getInitialProps(context) {
		return {
			props: {
				session: await getSession(context),
			},
		};
	}

	render() {
		return (
			<Layout Title='ethlect. Register' SimpleNav>
				<h1>Register</h1>
				<RegisterForm />
			</Layout>
		);
	}
}

export default Election_Register;
