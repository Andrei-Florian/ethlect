import Layout from '../components/layout/Layout';
import { Component } from 'react';
import { Table, Button, Card, Form, Row, Col, Alert } from 'react-bootstrap';

class Index extends Component {
	state = {
		privateKey: '',
		ciphertext: '',
		formValidated: false,
		formError: false,
		plaintext: '',
		copiedKey: false,
	};

	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	validateForm = async () => {
		this.setState({ formValidated: true });

		// check that both fields are filled
		if (this.state.privateKey && this.state.ciphertext) {
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
			plaintext: '',
		});
		const validated = await this.validateForm();
		await this.delay(1000);

		if (validated) {
			// send the request
			const messageJSON = JSON.stringify({
				privateKey: this.state.privateKey,
				ciphertext: this.state.ciphertext,
			});
			const fetchString = process.env.NEXT_PUBLIC_DECRYPT_API;

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
					plaintext: resJSON.message,
				});
			} else {
				this.setState({ formError: true, plaintext: 'error' });
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
						Private Key
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							as='textarea'
							placeholder='RSA Private Key'
							isValid={
								this.state.formValidated &&
								this.state.privateKey
							}
							isInvalid={
								this.state.formValidated &&
								!this.state.privateKey
							}
							value={this.state.privateKey}
							onChange={(event) => {
								this.setState({
									privateKey: event.target.value,
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
						Ciphertext
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							as='textarea'
							placeholder='Ciphertext'
							isValid={
								this.state.formValidated &&
								this.state.ciphertext
							}
							isInvalid={
								this.state.formValidated &&
								!this.state.ciphertext
							}
							value={this.state.ciphertext}
							onChange={(event) => {
								this.setState({
									ciphertext: event.target.value,
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
			? navigator.clipboard.writeText(this.state.plaintext)
			: this.fallbackCopyTextToClipboard(this.state.plaintext);
	};

	renderDecryptedKey() {
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
						<td>Decrypted Key</td>
						<td>{`${this.state.plaintext.substring(0, 30)}...`}</td>
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
							Decrypt Ciphertext using Private Key
						</Card.Title>
						<Card.Text>
							Input the private key and the ciphertext to decrypt.
						</Card.Text>
						{this.renderForm()}
						<Button variant='dark' onClick={this.submitForm}>
							Decrypt Key
						</Button>
					</Card.Body>
				</Card>

				{this.state.plaintext ? (
					<Card className='card'>
						<Card.Body>
							<Card.Title>Decrypted Plaintext</Card.Title>
							{this.state.plaintext === 'error' ? (
								<Alert variant='danger'>
									There was an error decrypting the key.
									Please check your values and try again.
								</Alert>
							) : (
								<>
									<Alert variant='success'>
										Inputted key decrypted successfully.
									</Alert>
									{this.renderDecryptedKey()}
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
			<Layout Title='Keyholders App Decrypt'>
				<>
					<h1>Decrypt Key</h1>
					{this.renderCards()}
				</>
			</Layout>
		);
	}
}

export default Index;
