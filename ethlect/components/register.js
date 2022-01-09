import { Component } from 'react';
import { Nav, Card, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { signIn } from 'next-auth/react';
import qrcode from 'qrcode';

class NewElectionForm extends Component {
	state = {
		formValidated: false,
		formError: false,
		sendingRequest: false,
		currentTab: 1,
		alertError: false,
		userFirstName: '',
		userLastName: '',
		userEircode: '',
		userEmail: '',
		userPassword: '',
		userPasswordConfirm: '',
		userID: null,
		key2FA: '',
		verificationToken: '',
		verificationSuccess: false,
	};

	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	changePage = async (_tab) => {
		// move on to next page
		this.setState({
			currentTab: _tab,
			formValidated: false,
			formError: null,
		});
	};

	validateDetailsForm = () => {
		let error = {};

		// check that all fields are filled in
		if (
			this.state.userFirstName === '' ||
			this.state.userLastName === '' ||
			this.state.userEircode === ''
		) {
			error.fields = true;
		}

		// check the length of the eircode
		if (this.state.userEircode.length !== 7) {
			error.eircode = true;
		}

		if (error.fields === true || error.eircode === true) {
			this.setState({ formError: error, formValidated: true });
			return { success: false, error: error };
		} else {
			this.setState({ formError: false, formValidated: true });
			return { success: true };
		}
	};

	checkRegister = async () => {
		try {
			const fetchString = process.env.NEXT_PUBLIC_API_CHECKREGISTER;

			const postRequest = JSON.stringify({
				firstName: this.state.userFirstName,
				lastName: this.state.userLastName,
				eircode: this.state.userEircode,
			});

			// send the request
			const res = await fetch(fetchString, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: postRequest,
			});

			const resJSON = await res.json();

			if (resJSON.success && resJSON.match) {
				this.setState({
					alertError: false,
				});

				return { success: true };
			} else {
				this.setState({
					alertError: true,
					formValidated: false,
				});

				return { success: false };
			}
		} catch (error) {
			console.log(error);
			return { success: false };
		}
	};

	validateEmail = (email) => {
		return String(email)
			.toLowerCase()
			.match(
				/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
			);
	};

	validateAccountForm = async () => {
		let error = {};

		// check that all fields are filled in
		if (
			this.state.userEmail === '' ||
			this.state.userPassword === '' ||
			this.state.userPasswordConfirm === ''
		) {
			error.fields = true;
		}

		// check the correct email format
		if (this.validateEmail(this.state.userEmail) === null) {
			error.email = true;
		}

		// check if the passwords match
		if (this.state.userPassword !== this.state.userPasswordConfirm) {
			error.password = true;
		}

		if (
			error.fields === true ||
			error.email === true ||
			error.password === true
		) {
			this.setState({ formError: error, formValidated: true });
			return { success: false, error: error };
		} else {
			this.setState({ formError: false, formValidated: true });
			return { success: true };
		}
	};

	createAccount = async () => {
		try {
			const fetchString = process.env.NEXT_PUBLIC_API_CREATEACCOUNT;

			const postRequest = JSON.stringify({
				firstName: this.state.userFirstName,
				lastName: this.state.userLastName,
				eircode: this.state.userEircode,
				email: this.state.userEmail,
				password: this.state.userPassword,
			});

			// send the request
			const res = await fetch(fetchString, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: postRequest,
			});

			const resJSON = await res.json();

			if (resJSON.success) {
				const qrCode = await qrcode.toDataURL(resJSON.key2FA);

				this.setState({
					alertError: false,
					key2FA: qrCode,
					userID: resJSON.userID,
				});

				return { success: true };
			} else {
				this.setState({
					alertError: true,
					formValidated: false,
				});

				return { success: false };
			}
		} catch (error) {
			this.setState({
				alertError: true,
				formValidated: false,
			});
			return { success: false };
		}
	};

	validate2FAForm = async () => {
		let error = false;

		// check that the field is filled in, is a number, and is 6 digits long
		if (
			this.state.verificationToken === '' ||
			this.state.verificationToken.length !== 6 ||
			isNaN(this.state.verificationToken)
		) {
			error = true;
		}

		if (error) {
			this.setState({ formError: true, formValidated: true });
			return { success: false };
		} else {
			this.setState({ formError: false, formValidated: true });
			return { success: true };
		}
	};

	validateUser = async () => {
		try {
			const fetchString = process.env.NEXT_PUBLIC_API_VALIDATEACCOUNT;

			const postRequest = JSON.stringify({
				userID: this.state.userID,
				token: this.state.verificationToken,
			});

			// send the request
			const res = await fetch(fetchString, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: postRequest,
			});

			const resJSON = await res.json();

			if (resJSON.success) {
				this.setState({
					alertError: false,
				});

				return { success: true };
			} else {
				this.setState({
					alertError: true,
					formValidated: false,
				});

				return { success: false };
			}
		} catch (error) {
			return { success: false };
		}
	};

	onSubmit = async (event) => {
		event.preventDefault();
		this.setState({
			alertError: false,
		});

		switch (this.state.currentTab) {
			case 1:
				// first form submitted
				const validateDetails = this.validateDetailsForm();

				if (validateDetails.success) {
					this.setState({ sendingRequest: true });
					const result = await this.checkRegister();
					this.setState({ sendingRequest: false });

					if (result.success) {
						this.changePage(2);
					}
				}

				break;
			case 2:
				// second form submitted
				const validateAccount = await this.validateAccountForm();

				if (validateAccount.success) {
					this.setState({ sendingRequest: true });
					const accountCreated = await this.createAccount();
					this.setState({ sendingRequest: false });

					if (accountCreated.success) {
						this.changePage(3);
					}
				}
				break;
			case 3:
				// final form submitted
				const validate2FA = await this.validate2FAForm();

				if (validate2FA.success) {
					this.setState({ sendingRequest: true });
					const validated = await this.validateUser();
					this.setState({ sendingRequest: false });

					if (validated.success) {
						this.setState({
							verificationSuccess: true,
						});
					}
				}
				break;
			default:
				break;
		}
	};

	renderMenu() {
		const menuHeadings = [
			'User Details',
			'Account Details',
			'2FA Initialisation',
		];
		let menuItems = [];

		for (let i = 0; i < menuHeadings.length; i++) {
			menuItems.push(
				<Nav.Item>
					<Nav.Link
						eventKey='first'
						active={this.state.currentTab === i + 1 ? true : false}
						disabled={
							this.state.currentTab === i + 1 ? false : true
						}
					>
						{menuHeadings[i]}
					</Nav.Link>
				</Nav.Item>
			);
		}

		return (
			<Nav variant='pills' id='create-menu'>
				{menuItems}
			</Nav>
		);
	}

	renderSuccess() {
		if (this.state.verificationSuccess) {
			return (
				<Alert
					variant='success'
					onClose={() =>
						this.setState({ verificationSuccess: false })
					}
					dismissible
				>
					<Alert.Heading>Account Created Successfully!</Alert.Heading>
					<p>
						You have successfully created an account. You can now
						log into the application.
					</p>
					<Button variant='outline-dark' onClick={signIn}>
						Log In
					</Button>
				</Alert>
			);
		}
	}

	renderAlert() {
		if (this.state.alertError) {
			return (
				<Alert
					variant='danger'
					onClose={() => this.setState({ alertError: false })}
					dismissible
				>
					<Alert.Heading>
						{this.state.currentTab === 1
							? 'The Details were not Found on the Register!'
							: this.state.currentTab === 2
							? 'There was an Error Creating the Account'
							: 'There was an Error Validating the Account'}
					</Alert.Heading>
					<p>
						{this.state.currentTab === 1
							? 'There was an error checking the register with the details provided. Please check the details provided and submit the form again.'
							: this.state.currentTab === 2
							? 'The application encountered an error creating the account. Please check the details provided and submit the form again.'
							: 'The application failed to validate the account. Please check the details provided and submit the form again.'}
					</p>
				</Alert>
			);
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
					key === 'e'
						? this.state.electionPublicKey
						: this.state.encryptedThresholdKeys[
								event.target.id.substring(12, 13)
						  ]
			  )
			: this.fallbackCopyTextToClipboard(
					key === 'e'
						? this.state.electionPublicKey
						: this.state.encryptedThresholdKeys[
								event.target.id.substring(12, 13)
						  ]
			  );

		if (key === 'e') key = 0;
		let copiedKeys = [...this.state.copiedKeys];
		copiedKeys[key] = {
			...copiedKeys[key],
			copied: true,
		};
		this.setState({ copiedKeys });
	};

	createErrorMessage() {
		return (
			<>
				<p>
					The election generation failed. The interactive proof
					failed. This is probably due to incorrect keys being
					inputted into the system.
				</p>
				<Button
					variant='danger'
					href='/admin'
					className='button-margin'
				>
					Cancel
				</Button>
				<Button
					variant='primary'
					onClick={this.restartInteractiveProof}
				>
					Retry Interactive Proof
				</Button>
			</>
		);
	}

	createDetailsForm() {
		return (
			<Form>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalEmail'
				>
					<Form.Label column sm={3}>
						Firstname
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							type='name'
							placeholder='John'
							isValid={
								this.state.formValidated &&
								this.state.userFirstName
							}
							isInvalid={
								this.state.formValidated &&
								!this.state.userFirstName
							}
							value={this.state.userFirstName}
							onChange={(event) => {
								this.setState({
									userFirstName: event.target.value,
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
						Lastname
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							type='name'
							placeholder='Doe'
							isValid={
								this.state.formValidated &&
								this.state.userLastName
							}
							isInvalid={
								this.state.formValidated &&
								!this.state.userLastName
							}
							value={this.state.userLastName}
							onChange={(event) => {
								this.setState({
									userLastName: event.target.value,
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
						Eircode
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							type='address'
							placeholder='D02 9QQ'
							isValid={
								this.state.formValidated &&
								this.state.userEircode.length === 7
							}
							isInvalid={
								this.state.formValidated &&
								this.state.userEircode.length !== 7
							}
							value={this.state.userEircode}
							onChange={(event) => {
								this.setState({
									userEircode: event.target.value,
									formValidated: false,
								});
							}}
						/>
					</Col>
				</Form.Group>
			</Form>
		);
	}

	createAccountForm() {
		return (
			<Form>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalEmail'
				>
					<Form.Label column sm={3}>
						Email
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							type='email'
							placeholder='user@domain.com'
							isValid={
								this.state.formValidated &&
								this.state.userEmail &&
								!this.state.formError.email
							}
							isInvalid={
								this.state.formValidated &&
								(!this.state.userEmail ||
									this.state.formError.email)
							}
							value={this.state.userEmail}
							onChange={(event) => {
								this.setState({
									userEmail: event.target.value,
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
						Password
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							type='password'
							placeholder='********'
							isValid={
								this.state.formValidated &&
								this.state.userPassword &&
								!this.state.formError.password
							}
							isInvalid={
								this.state.formValidated &&
								(!this.state.userPassword ||
									this.state.formError.password)
							}
							value={this.state.userPassword}
							onChange={(event) => {
								this.setState({
									userPassword: event.target.value,
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
						Confirm Password
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							type='password'
							placeholder='********'
							isValid={
								this.state.formValidated &&
								this.state.userPasswordConfirm &&
								!this.state.formError.password
							}
							isInvalid={
								this.state.formValidated &&
								(!this.state.userPasswordConfirm ||
									this.state.formError.password)
							}
							value={this.state.userPasswordConfirm}
							onChange={(event) => {
								this.setState({
									userPasswordConfirm: event.target.value,
									formValidated: false,
								});
							}}
						/>
					</Col>
				</Form.Group>
			</Form>
		);
	}

	createQRCode() {
		return (
			<div>
				<img src={this.state.key2FA}></img>
			</div>
		);
	}

	createValidationForm() {
		return (
			<Form>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalEmail'
				>
					<Form.Label column sm={3}>
						2FA Token
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							type='token'
							placeholder='982029'
							isValid={
								this.state.formValidated &&
								!this.state.formError
							}
							isInvalid={
								this.state.formValidated && this.state.formError
							}
							value={this.state.verificationToken}
							onChange={(event) => {
								this.setState({
									verificationToken: event.target.value,
									formValidated: false,
								});
							}}
						/>
					</Col>
				</Form.Group>
			</Form>
		);
	}

	renderTabForm() {
		switch (this.state.currentTab) {
			case 1:
				return (
					<>
						<p>Input the details in below:</p>
						{this.createDetailsForm()}
						<Button
							variant='primary'
							onClick={this.onSubmit}
							disabled={this.state.sendingRequest}
						>
							{this.state.sendingRequest
								? 'Checking...'
								: 'Check the Register'}
						</Button>
					</>
				);
			case 2:
				return (
					<>
						<p>Input your email and password below:</p>
						{this.createAccountForm()}
						<Button
							variant='primary'
							onClick={this.onSubmit}
							disabled={this.state.sendingRequest}
						>
							{this.state.sendingRequest ? 'Loading...' : 'Next'}
						</Button>
					</>
				);
			case 3:
				return (
					<>
						<p>
							Scan the QR Code below with your Two Factor
							Authenticator Application to start Getting 2FA
							Tokens.
						</p>
						{this.createQRCode()}
						<p>
							Input the token returned by your 2FA application
							below to complete the registration.
						</p>
						{this.createValidationForm()}
						<Button
							variant='primary'
							onClick={this.onSubmit}
							disabled={
								this.state.sendingRequest ||
								this.state.verificationSuccess
							}
						>
							{this.state.sendingRequest
								? 'Loading...'
								: 'Submit'}
						</Button>
					</>
				);
			default:
				break;
		}
	}

	renderTab() {
		const content = [
			{
				title: 'User Details',
				formTitle: 'Input User Details',
				text: 'Please fill in the form below to get started. Note that you must be on the voter registry to be able to create an account and use the application.',
			},
			{
				title: 'Account Details',
				formTitle: 'Create Login Credentials',
				text: 'Please input an email and password you wish to use to log into the application in the form below.',
			},
			{
				title: '2FA Initialisation',
				formTitle: 'Initialise Two Factor Authentication',
				text: 'Scan the QR Code provided below with your 2FA application and input the code provided.',
			},
		];
		return (
			<>
				<Card
					className='create-tab-card'
					id={`create-tab-${this.state.currentTab}`}
				>
					<Card.Body>
						<Card.Title>
							{content[this.state.currentTab - 1].title}
						</Card.Title>
						<Card.Text>
							{content[this.state.currentTab - 1].text}
						</Card.Text>
					</Card.Body>
				</Card>

				<Card
					className='create-tab-card'
					id={`create-tab-form-${this.state.currentTab}`}
				>
					<Card.Body>
						<Card.Title>
							{content[this.state.currentTab - 1].formTitle}
						</Card.Title>
						{this.renderTabForm()}
					</Card.Body>
				</Card>
			</>
		);
	}

	render() {
		return (
			<>
				{this.renderMenu()}
				{this.renderAlert()}
				{this.renderSuccess()}
				{this.renderTab()}
			</>
		);
	}
}

export default NewElectionForm;
