import Layout from '../components/layout/Layout';
import { Component } from 'react';
import { Table, Button, Card, Form, Row, Col, Alert } from 'react-bootstrap';

class Index extends Component {
	state = {
		publicKey: '',
		plaintext: '',
		formValidated: false,
		formError: false,
		ciphertext: '',
		copiedKey: false,
	};

	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	validateForm = async () => {
		this.setState({ formValidated: true });

		// check that both fields are filled
		if (this.state.publicKey && this.state.plaintext) {
			return true;
		} else {
			return false;
		}
	};

	submitForm = async (event) => {
		event.preventDefault();

		// validate the form
		this.setState({
			copiedKey: false,
			ciphertext: '',
		});
		const validated = await this.validateForm();
		await this.delay(1000);

		if (validated) {
			// send the request
			const messageJSON = JSON.stringify({
				publicKey: this.state.publicKey,
				plaintext: this.state.plaintext,
			});
			const fetchString = process.env.NEXT_PUBLIC_ENCRYPT_API;

			const res = await fetch(fetchString, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: messageJSON,
			});

			// get the response
			const resJSON = await res.json();

			if (resJSON.success) {
				// display the response
				this.setState({
					ciphertext: resJSON.message,
				});
			} else {
				this.setState({ formError: true, ciphertext: 'error' });
			}
		} else {
			this.setState({ formError: true });
		}
	};

	renderForm() {
		return (
			<Form>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalEmail'
				>
					<Form.Label column sm={3}>
						Public Key
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							as='textarea'
							placeholder='RSA Public Key'
							isValid={
								this.state.formValidated && this.state.publicKey
							}
							isInvalid={
								this.state.formValidated &&
								!this.state.publicKey
							}
							value={this.state.publicKey}
							onChange={(event) => {
								this.setState({
									publicKey: event.target.value,
									formValidated: false,
								});
							}}
						/>
					</Col>
				</Form.Group>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalEmail'
				>
					<Form.Label column sm={3}>
						Plaintext
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							as='textarea'
							placeholder='Plaintext'
							isValid={
								this.state.formValidated && this.state.plaintext
							}
							isInvalid={
								this.state.formValidated &&
								!this.state.plaintext
							}
							value={this.state.plaintext}
							onChange={(event) => {
								this.setState({
									plaintext: event.target.value,
									formValidated: false,
								});
							}}
						/>
					</Col>
				</Form.Group>
			</Form>
		);
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
		this.setState({ copiedKey: true });
		navigator.clipboard
			? navigator.clipboard.writeText(this.state.ciphertext)
			: this.fallbackCopyTextToClipboard(this.state.ciphertext);
	};

	renderEncryptedKey() {
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
						<td>Encrypted Key</td>
						<td>{`${this.state.ciphertext.substring(
							0,
							30
						)}...`}</td>
						<td>
							<Button
								variant='dark'
								id={`copy-button-1`}
								onClick={this.handleCopy}
								disabled={this.state.copiedKey}
								size='sm'
							>
								{this.state.copiedKey ? 'Copied!' : 'Copy Key'}
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
						<Card.Title>
							Encrypt Plaintext using Public Key
						</Card.Title>
						<Card.Text>
							Input the public key and the plaintext to encrypt.
						</Card.Text>
						{this.renderForm()}
						<Button variant='dark' onClick={this.submitForm}>
							Encrypt Key
						</Button>
					</Card.Body>
				</Card>

				{this.state.ciphertext ? (
					<Card className='card'>
						<Card.Body>
							<Card.Title>Encrypted Ciphertext</Card.Title>
							{this.state.ciphertext === 'error' ? (
								<Alert variant='danger'>
									There was an error encrypting the key.
									Please check your values and try again.
								</Alert>
							) : (
								<>
									<Alert variant='success'>
										Inputted key encrypted successfully.
									</Alert>
									{this.renderEncryptedKey()}
								</>
							)}
						</Card.Body>
					</Card>
				) : (
					<></>
				)}
			</>
		);
	}

	render() {
		return (
			<Layout Title='Keyholders App Encrypt'>
				<>
					<h1>Encrypt Key</h1>
					{this.renderCards()}
				</>
			</Layout>
		);
	}
}

export default Index;
