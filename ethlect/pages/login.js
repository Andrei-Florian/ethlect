import Layout from '../components/layout/Layout';
import { Component } from 'react';
import { Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { signIn } from 'next-auth/react';

class Login extends Component {
	state = {
		email: '',
		password: '',
		token: '',
		formError: false,
		formValidated: false,
	};

	static async getInitialProps({ query }) {
		return { query };
	}

	validateEmail = (email) => {
		return String(email)
			.toLowerCase()
			.match(
				/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
			);
	};

	validateForm = () => {
		let error = {};

		// check that all fields are filled in
		if (
			this.state.email === '' ||
			this.state.password === '' ||
			this.state.token === ''
		) {
			error.fields = true;
		}

		// check the length of the 2FA token
		if (this.state.token.length !== 6) {
			error.token = true;
		}

		// check the correct email format
		if (this.validateEmail(this.state.email) === null) {
			error.email = true;
		}

		if (
			error.fields === true ||
			error.token === true ||
			error.email === true
		) {
			this.setState({ formError: error, formValidated: true });
			return { success: false, error: error };
		} else {
			this.setState({ formError: false, formValidated: true });
			return { success: true };
		}
	};

	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	submitForm = async (event) => {
		event.preventDefault();
		const validation = this.validateForm();

		if (validation.success === true) {
			await this.delay(1000);
			signIn('credentials', {
				username: this.state.email,
				password: this.state.password,
				token: this.state.token,
				callbackUrl: this.props.query.callbackUrl,
			});
		}
	};

	render() {
		return (
			<Layout Title='ethlect. Login' SimpleNav>
				<>
					<div id='login-body'>
						<div id='card-body'>
							{this.props.query.error ? (
								<Alert variant='danger'>
									<Alert.Heading>
										There was an error logging in!
									</Alert.Heading>
									<p>
										The application failed to log you in,
										please check your details and try again.
									</p>
								</Alert>
							) : (
								<></>
							)}

							<Card id='login-grid'>
								<Card.Body>
									<Row>
										<Col xs={5}>
											<div id='login-grid'>
												<img
													src='/images/1.jpg'
													id='login-logo'
												></img>
											</div>
										</Col>
										<Col>
											<h2>Log into ethlect.</h2>
											<p>
												Log into ethlect. to be able to
												cast your vote in elections.
											</p>

											<Form>
												<Form.Group
													className='mb-3'
													controlId='Email'
												>
													<Form.Label>
														Email address
													</Form.Label>
													<Form.Control
														isValid={
															this.state
																.formValidated &&
															!this.state
																.formError
																.email &&
															this.state.email
														}
														isInvalid={
															this.state
																.formValidated &&
															(!this.state
																.email ||
																this.state
																	.formError
																	.email)
														}
														type='email'
														value={this.state.email}
														placeholder='user@domain.com'
														onChange={(event) => {
															this.setState({
																email: event
																	.target
																	.value,
																formValidated: false,
															});
														}}
													/>
												</Form.Group>

												<Form.Group
													className='mb-3'
													controlId='Password'
												>
													<Form.Label>
														Password
													</Form.Label>
													<Form.Control
														type='password'
														value={
															this.state.password
														}
														placeholder='*********'
														isInvalid={
															this.state
																.formValidated &&
															!this.state.password
														}
														isValid={
															this.state
																.formValidated &&
															this.state.password
														}
														onChange={(event) => {
															this.setState({
																password:
																	event.target
																		.value,
																formValidated: false,
															});
														}}
													/>
												</Form.Group>
												<Form.Group
													className='mb-3'
													controlId='2FA Token'
												>
													<Form.Label>
														2FA Code
													</Form.Label>
													<Form.Control
														type='number'
														value={this.state.token}
														placeholder='972819'
														isInvalid={
															this.state
																.formValidated &&
															(this.state
																.formError
																.token ||
																!this.state
																	.token)
														}
														isValid={
															this.state
																.formValidated &&
															(!this.state
																.formError
																.token ||
																this.state
																	.token)
														}
														onChange={(event) => {
															this.setState({
																token: event
																	.target
																	.value,
																formValidated: false,
															});
														}}
													/>
												</Form.Group>
												<Button
													variant='primary'
													type='submit'
													onClick={this.submitForm}
												>
													Log In
												</Button>
											</Form>
										</Col>
									</Row>
								</Card.Body>
							</Card>
						</div>
					</div>
				</>
			</Layout>
		);
	}
}

export default Login;
