import { Component } from 'react';
import Layout from '../../components/layout/Layout';
import { getSession } from 'next-auth/react';
import NewElectionForm from '../../components/admin/new';

class NewElection extends Component {
	static async getInitialProps(context) {
		return {
			props: {
				session: await getSession(context),
			},
		};
	}

	render() {
		return (
			<Layout Title='ethlect. Create New Election' Admin>
				<>
					<h1 className='heading'>Create new Election</h1>
					<NewElectionForm />
				</>
			</Layout>
		);
	}
}

export default NewElection;
