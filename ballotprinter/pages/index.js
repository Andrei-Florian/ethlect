import Layout from '../components/layout/Layout';
import { Component } from 'react';
import BallotForm from '../components/form';

class Index extends Component {
	render() {
		return (
			<Layout Title='Ballot Printing App'>
				<>
					<h1>Ballot Printing App</h1>
					<BallotForm />
				</>
			</Layout>
		);
	}
}

export default Index;
