import Layout from '../components/layout/Layout';
import { Component } from 'react';
import { Card, Button } from 'react-bootstrap';

class Index extends Component {
	renderCards() {
		return (
			<>
				<Card className='card'>
					<Card.Body>
						<Card.Title>Create RSA Keypair</Card.Title>
						<Card.Text>
							Create an RSA keypair that can be used to encrypt
							and decrypt keys exchanged with ethlect.
						</Card.Text>
						<Button variant='dark' href='/create'>
							Create Keypair
						</Button>
					</Card.Body>
				</Card>
				<Card className='card'>
					<Card.Body>
						<Card.Title>Encrypt Key</Card.Title>
						<Card.Text>
							Encrypt a key using your public encryption key to
							send to the application.
						</Card.Text>
						<Button variant='dark' href='/encrypt'>
							Encrypt Key
						</Button>
					</Card.Body>
				</Card>
				<Card className='card'>
					<Card.Body>
						<Card.Title>Decrypt Key</Card.Title>
						<Card.Text>
							Decrypt the key returned from the application with
							your private encryption key.
						</Card.Text>
						<Button variant='dark' href='/decrypt'>
							Decrypt Key
						</Button>
					</Card.Body>
				</Card>
			</>
		);
	}

	render() {
		return (
			<Layout Title='Keyholders App'>
				<>
					<h1>Keyholders App</h1>
					{this.renderCards()}
				</>
			</Layout>
		);
	}
}

export default Index;
