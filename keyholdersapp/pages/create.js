import Layout from '../components/layout/Layout';
import { Component } from 'react';
import { Table, Button, Card } from 'react-bootstrap';

class Index extends Component {
	state = {
		copiedPrivateKey: false,
		copiedPublicKey: false,
	};

	static async getInitialProps() {
		const fetchString = process.env.NEXT_PUBLIC_CREATE_API;

		const res = await fetch(fetchString, {
			method: 'GET',
		});

		const resJSON = await res.json();

		if (resJSON.success) {
			return {
				privateKey: resJSON.privateKey,
				publicKey: resJSON.publicKey,
			};
		} else {
			return {
				privateKey: '',
				publicKey: '',
			};
		}
	}

	fallbackCopyTextToClipboard(text) {
		let textArea = document.createElement('textarea');
		textArea.value = text;

		textArea.style.top = '0';
		textArea.style.left = '0';
		textArea.style.position = 'fixed';

		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		document.execCommand('copy');
		document.body.removeChild(textArea);
	}

	handleCopy = async (event) => {
		const key = event.target.id.substring(12, 13);

		navigator.clipboard
			? navigator.clipboard.writeText(
					key === '1' ? this.props.privateKey : this.props.publicKey
			  )
			: this.fallbackCopyTextToClipboard(
					key === '1' ? this.props.privateKey : this.props.publicKey
			  );

		key === '1'
			? this.setState({ copiedPrivateKey: true })
			: this.setState({ copiedPublicKey: true });
	};

	renderKeypairCard() {
		return (
			<Table striped bordered hover>
				<thead>
					<tr>
						<th>Key</th>
						<th>Value</th>
						<th>Copy Key</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Private Key</td>
						<td>{`${this.props.privateKey.substring(
							40,
							70
						)}...`}</td>
						<td>
							<Button
								variant='dark'
								id={`copy-button-1`}
								onClick={this.handleCopy}
								disabled={this.state.copiedPrivateKey}
								size='sm'
							>
								{this.state.copiedPrivateKey
									? 'Copied!'
									: 'Copy Key'}
							</Button>
						</td>
					</tr>
					<tr>
						<td>Public Key</td>
						<td>{`${this.props.publicKey.substring(
							40,
							70
						)}...`}</td>
						<td>
							<Button
								variant='dark'
								id={`copy-button-2`}
								onClick={this.handleCopy}
								disabled={this.state.copiedPublicKey}
								size='sm'
							>
								{this.state.copiedPublicKey
									? 'Copied!'
									: 'Copy Key'}
							</Button>
						</td>
					</tr>
				</tbody>
			</Table>
		);
	}

	renderCards() {
		return (
			<>
				<Card className='card'>
					<Card.Body>
						<Card.Title>Generate New Keypair</Card.Title>
						<Card.Text>
							Keypairs are automatically generated when the page
							is refreshed, press the button below to generate a
							new keypair.
						</Card.Text>
						<Button variant='dark' href='/create'>
							Generate New Keypair
						</Button>
					</Card.Body>
				</Card>

				<Card className='card'>
					<Card.Body>
						<Card.Title>Generated Keypair</Card.Title>
						<Card.Text>
							The public and private keys are displayed below,
							press the copy button next to each key to copy the
							key to your clipboard.
						</Card.Text>
						{this.renderKeypairCard()}
					</Card.Body>
				</Card>
			</>
		);
	}

	render() {
		return (
			<Layout Title='Keyholders App Create'>
				<>
					<h1>Create Keypair</h1>
					{this.renderCards()}
				</>
			</Layout>
		);
	}
}

export default Index;
