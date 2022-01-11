import Layout from '../components/layout/Layout';
import { Component } from 'react';
import { Card, Button, Form, Row, Col, Alert } from 'react-bootstrap';

class Index extends Component {
	state = {
		formValidated: false,
		formError: false,
		sendingRequest: false,
		proofFile: null,
		error: false,
	};

	getFile = async (event) => {
		const file = event.target.files[0];

		if (file) {
			if (file.type === 'application/json') {
				const reader = new FileReader();

				reader.onload = async () => {
					try {
						// save json to state
						this.setState({ proofFile: reader.result });
						return;
					} catch (error) {
						console.log(error);
					}
				};

				reader.readAsText(event.target.files[0]);
			}
		}

		this.setState({ proofFile: null });
	};

	validateForm = async () => {
		// ensure the file is uploaded successfully
		if (!this.state.proofFile) {
			this.setState({ formError: true, formValidated: true });
			return { success: false };
		}

		this.setState({ formError: false, formValidated: true });
		return { success: true };
	};

	sendRequest = async () => {
		try {
			this.setState({ sendingRequest: true });

			const postRequest = JSON.stringify({
				proof: this.state.proofFile,
			});

			// send the request
			const res = await fetch(process.env.NEXT_PUBLIC_API_ROUTE, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: postRequest,
			});

			const resJSON = await res.json();
			this.setState({ sendingRequest: false });

			if (resJSON.success) {
				return { success: true };
			} else {
				return { success: false, error: resJSON.error };
			}
		} catch (error) {
			console.log(error);
			return { success: false, error: 'Unknown error' };
		}
	};

	onSubmit = async (event) => {
		event.preventDefault();

		const formValidated = await this.validateForm();

		if (formValidated.success) {
			const response = await this.sendRequest();

			if (response.success) {
				this.setState({ error: 'success', formValidated: false });
			} else {
				this.setState({ error: response.error, formValidated: false });
			}
		}
	};

	renderForm() {
		return (
			<Form>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalFile'
				>
					<Form.Label column sm={3}>
						Proof
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							type='file'
							isValid={
								this.state.formValidated &&
								!this.state.formError
							}
							isInvalid={
								this.state.formValidated && this.state.formError
							}
							onChange={this.getFile}
						/>
					</Col>
				</Form.Group>
				<Button
					variant='primary'
					id='server-button'
					disabled={
						this.state.sendingRequest ||
						this.state.error === 'success'
					}
					onClick={this.onSubmit}
				>
					{this.state.sendingRequest
						? 'Verifying...'
						: this.state.error === 'success'
						? 'Proof Verified'
						: 'Verify Proof'}
				</Button>
			</Form>
		);
	}

	renderAlert() {
		if (this.state.error) {
			return (
				<Alert
					variant={
						this.state.error === 'success' ? 'success' : 'danger'
					}
					onClose={() => this.setState({ error: false })}
					dismissible
				>
					<Alert.Heading>
						{this.state.error === 'success'
							? 'Proof Verified Successfully!'
							: 'Proof Verification Failed!'}
					</Alert.Heading>
					{this.state.error === 'success' ? (
						<>
							<p>
								The proof provided by the application checked
								out! This means that the process verified was
								completed correctly!
							</p>
						</>
					) : (
						<>
							<p>
								The proof validation failed. This can be caused
								by a corruption in the proof file uploaded or an
								error with the process attempted to be verified.
								Please try downloading the file from the audit
								page and re-uploading it.
							</p>
							<p>
								<strong>
									Error message: {this.state.error}
								</strong>
							</p>
						</>
					)}
				</Alert>
			);
		}
	}

	renderCards() {
		return (
			<>
				<Card className='card'>
					<Card.Body>
						<Card.Title>
							Audit Proofs Outputted by Application
						</Card.Title>
						<Card.Text>
							<p>
								The Audit App allows for proofs downloaded from
								the ethlect. application to be uploaded and
								proven. The application allows for the direct
								upload and digest of shuffle proofs downloaded
								by ethlect. from the audit page.
							</p>

							<strong>
								Note that the verification process may take a
								while depending on the size of the proof.
							</strong>
						</Card.Text>
					</Card.Body>
				</Card>
				<Card className='card'>
					<Card.Body>
						<Card.Title>Upload Proof</Card.Title>
						<Card.Text>
							Use the form below to upload a proof and submit the
							form to verify the proof. The application can digest
							proofs of type generation, shuffle, and decryption.
						</Card.Text>
						{this.renderForm()}
					</Card.Body>
				</Card>
			</>
		);
	}

	render() {
		return (
			<Layout Title='Audit App'>
				<>
					<h1>Audit App</h1>
					{this.renderAlert()}
					{this.renderCards()}
				</>
			</Layout>
		);
	}
}

export default Index;
