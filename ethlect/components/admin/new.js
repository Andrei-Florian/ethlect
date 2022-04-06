import { Component } from 'react';
import { getSession } from 'next-auth/react';
import {
	Nav,
	Card,
	Button,
	Form,
	Row,
	Col,
	InputGroup,
	FormControl,
	Table,
	Alert,
} from 'react-bootstrap';
import csvtojson from 'csvtojson';

class NewElectionForm extends Component {
	state = {
		formValidated: false,
		formError: false,
		sendingRequest: false,
		currentTab: 1,
		generateLocally: false,
		electionID: '',
		electionName: '',
		electionDescription: '',
		electionStartDate: '',
		electionEndDate: '',
		electionConstituencies: null,
		publicKeys: [],
		encryptedThresholdKeys: [],
		electionPublicKey: '',
		reencryptedThresholdKeys: [],
		electionDetails: {},
		alertError: false,
		copiedKeys: [],
	};

	static async getInitialProps(context) {
		return {
			props: {
				session: await getSession(context),
			},
		};
	}

	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	getFile = async (event) => {
		const file = event.target.files[0];

		if (file) {
			if (
				file.type === 'application/vnd.ms-excel' ||
				file.type === 'text/csv'
			) {
				const reader = new FileReader();

				reader.onload = async () => {
					try {
						// get the content of the file
						const jsonArray = await csvtojson().fromString(
							reader.result
						);

						// save it to state
						this.setState({ electionConstituencies: jsonArray });
					} catch (error) {
						console.log(error);
					}
				};

				reader.readAsText(event.target.files[0]);
			}
		}
	};

	createElection = async () => {
		try {
			// prepare the post request
			const postRequest = JSON.stringify({
				generate:
					this.state.generateLocally === true ? 'remote' : 'server',
				electionDetails: {
					electionName: this.state.electionName,
					electionDescription: this.state.electionDescription,
					electionStartDate: this.state.electionStartDate,
					electionEndDate: this.state.electionEndDate,
					electionConstituencies: this.state.electionConstituencies,
				},
				publicKeys: this.state.publicKeys,
			});

			// send the request
			const res = await fetch(
				process.env.NEXT_PUBLIC_API_CREATEELECTION,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: postRequest,
				}
			);

			const resJSON = await res.json();

			if (resJSON.success === true) {
				this.setState({
					electionID: resJSON.electionID,
					encryptedThresholdKeys: resJSON.thresholdKeys,
					electionPublicKey: resJSON.electionPublicKey,
				});

				return { success: true };
			}

			this.setState({
				alertError: resJSON.error,
			});
			return { success: false };
		} catch (error) {
			this.setState({
				alertError: error,
			});
			return { success: false };
		}
	};

	verifyKeys = async () => {
		try {
			const postRequest = JSON.stringify({
				electionID: this.state.electionID,
				thresholdKeys: this.state.reencryptedThresholdKeys,
			});

			// send the request
			const res = await fetch(process.env.NEXT_PUBLIC_API_VERIFYKEYS, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: postRequest,
			});

			const resJSON = await res.json();

			if (resJSON.success === true) {
				return { success: true };
			} else {
				return { success: false, error: resJSON.error };
			}
		} catch (error) {
			return { success: false, error: error };
		}
	};

	getElection = async () => {
		try {
			const postRequest = JSON.stringify({
				electionID: this.state.electionID,
			});

			// send the request
			const res = await fetch(process.env.NEXT_PUBLIC_API_GETELECTION, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: postRequest,
			});

			const resJSON = await res.json();

			if (resJSON.success) {
				this.setState({
					electionDetails: resJSON.electionDetails,
				});

				return { success: true };
			} else {
				return { success: false, error: resJSON.error };
			}
		} catch (error) {
			return { success: false, error: error };
		}
	};

	validateElectionDetails = async () => {
		let error = {};

		// check that all fields are filled in
		if (
			this.state.electionName === '' ||
			this.state.electionDescription === '' ||
			this.state.electionStartDate === '' ||
			this.state.electionEndDate === ''
		) {
			error.fields = true;
		}

		// check that the election start date is before the election end date
		const startDate = new Date(this.state.electionStartDate);
		const endDate = new Date(this.state.electionEndDate);

		if (startDate > endDate) {
			error.dates = true;
		}

		// check if the csv file was processed
		if (this.state.electionConstituencies === null) {
			error.csv = true;
		}

		if (
			error.fields === true ||
			error.dates === true ||
			error.csv === true
		) {
			this.setState({ formError: error, formValidated: true });
			return { success: false, error: error };
		} else {
			this.setState({ formError: false, formValidated: true });
			return { success: true };
		}
	};

	validatePublicKeys = async () => {
		let error = {};

		// check that all fields are filled in
		for (let i = 0; i < 10; i++) {
			if (!this.state.publicKeys[i]) {
				error.fields = true;
				break;
			}
		}

		if (error.fields === true) {
			this.setState({ formError: error, formValidated: true });
			return { success: false, error: error };
		} else {
			this.setState({ formError: false, formValidated: true });
			return { success: true };
		}
	};

	validateThresholdKeys = async () => {
		let error = {};

		// check that all fields are filled in
		for (let i = 0; i < 10; i++) {
			if (!this.state.reencryptedThresholdKeys[i]) {
				error.fields = true;
				break;
			}
		}

		if (error.fields === true) {
			this.setState({ formError: error, formValidated: true });
			return { success: false, error: error };
		} else {
			this.setState({ formError: false, formValidated: true });
			return { success: true };
		}
	};

	changePage = async (_tab) => {
		// move on to next page
		this.setState({
			currentTab: _tab,
			formValidated: false,
			formError: null,
			copiedKeys: [],
		});
	};

	onSubmit = async (event) => {
		event.preventDefault();

		switch (this.state.currentTab) {
			case 1:
				const electionDetailsValidation =
					await this.validateElectionDetails();
				await this.delay(1000);

				if (electionDetailsValidation.success) this.changePage(2);
				break;
			case 2:
				// send the generation option selected to the backend
				this.setState({
					generateLocally:
						event.target.id === 'server-button' ? false : true,
				});

				this.changePage(3);
				break;
			case 3:
				const publicKeysValidation = await this.validatePublicKeys();

				if (publicKeysValidation.success) {
					this.setState({ sendingRequest: true });
					const electionCreated = await this.createElection();
					this.setState({ sendingRequest: false });

					if (electionCreated.success) {
						this.changePage(4);
					} else {
						this.changePage(1);
					}
				}

				break;
			case 4:
				this.changePage(5);
				break;
			case 5:
				const thresholdKeysValidation =
					await this.validateThresholdKeys();

				if (thresholdKeysValidation.success) {
					this.setState({ sendingRequest: true });
					const verification = await this.verifyKeys();

					if (verification.success) {
						const retrievedElection = await this.getElection(
							this.state.electionID
						);

						if (!retrievedElection.success) {
							this.setState({ electionDetails: false });
						}
					} else {
						this.setState({ electionDetails: false });
					}

					this.setState({ sendingRequest: false });
					this.changePage(6);
				}
				break;
			default:
				break;
		}
	};

	renderMenu() {
		const menuHeadings = [
			'Election Details',
			'Cryptosystem Initiation',
			'Public Keys',
			'Threshold Keys',
			'Interactive Proof',
			'Summary',
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

	renderAlert() {
		if (this.state.alertError) {
			return (
				<Alert
					variant='danger'
					onClose={() => this.setState({ alertError: false })}
					dismissible
				>
					<Alert.Heading>
						The Election Generation Errored Out
					</Alert.Heading>
					<p>
						There was an error generating the election. Please check
						the inputted details and try again.
					</p>
					<p>Error Details: {this.state.alertError}</p>
				</Alert>
			);
		}
	}

	createPublicKeyInputs() {
		let inputs = [];

		for (let i = 0; i < 10; i++) {
			inputs.push(
				<InputGroup className='mb-2'>
					<InputGroup.Text>{`pk${i}`}</InputGroup.Text>
					<FormControl
						id='inlineFormInputGroup'
						placeholder='Key'
						isValid={
							this.state.formValidated && this.state.publicKeys[i]
						}
						isInvalid={
							this.state.formValidated &&
							!this.state.publicKeys[i]
						}
						value={
							this.state.publicKeys[i]
								? this.state.publicKeys[i].key
								: ''
						}
						onChange={(event) => {
							let publicKeys = [...this.state.publicKeys];
							publicKeys[i] = {
								...publicKeys[i],
								key: event.target.value,
							};
							this.setState({ publicKeys });
							this.setState({ formValidated: false });
						}}
					/>
				</InputGroup>
			);
		}

		return inputs;
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
		let key = event.target.id.substring(12, 13);

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

	createThresholdKeyTable() {
		let tableRows = [];

		for (let i = 0; i < this.state.encryptedThresholdKeys.length; i++) {
			tableRows.push(
				<tr>
					<td>{`Key ${i} (pk${i})`}</td>
					<td>{`${this.state.encryptedThresholdKeys[i].substring(
						0,
						30
					)}...`}</td>
					<td>
						<Button
							variant='dark'
							id={`copy-button-${i}`}
							onClick={this.handleCopy}
							disabled={this.state.copiedKeys[i]}
							size='sm'
						>
							{this.state.copiedKeys[i] ? 'Copied!' : 'Copy Key'}
						</Button>
					</td>
				</tr>
			);
		}

		return (
			<Table striped bordered hover>
				<thead>
					<tr>
						<th>Key</th>
						<th>Key Preview</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>{tableRows}</tbody>
			</Table>
		);
	}

	createInteractiveProofTable() {
		return (
			<Table striped bordered hover>
				<thead>
					<tr>
						<th>Key</th>
						<th>Key Preview</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Election Public Key</td>
						<td>{`${this.state.electionPublicKey.substring(
							0,
							30
						)}...`}</td>
						<td>
							<Button
								variant='dark'
								id='copy-button-e'
								onClick={this.handleCopy}
								disabled={this.state.copiedKeys[0]}
								size='sm'
							>
								{this.state.copiedKeys[0]
									? 'Copied!'
									: 'Copy Key'}
							</Button>
						</td>
					</tr>
				</tbody>
			</Table>
		);
	}

	createInteractiveProofForm() {
		let inputs = [];

		for (let i = 0; i < 10; i++) {
			inputs.push(
				<InputGroup className='mb-2'>
					<InputGroup.Text>{`pk(prk${i})`}</InputGroup.Text>
					<FormControl
						id='inlineFormInputGroup'
						placeholder='Key'
						isValid={
							this.state.formValidated &&
							this.state.reencryptedThresholdKeys[i]
						}
						isInvalid={
							this.state.formValidated &&
							!this.state.reencryptedThresholdKeys[i]
						}
						value={
							this.state.reencryptedThresholdKeys[i]
								? this.state.reencryptedThresholdKeys[i].key
								: ''
						}
						onChange={(event) => {
							let reencryptedThresholdKeys = [
								...this.state.reencryptedThresholdKeys,
							];
							reencryptedThresholdKeys[i] = {
								...reencryptedThresholdKeys[i],
								key: event.target.value,
							};
							this.setState({ reencryptedThresholdKeys });
							this.setState({ formValidated: false });
						}}
					/>
				</InputGroup>
			);
		}

		return (
			<Form>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalEmail'
				>
					<Form.Label column sm={2}>
						Encrypted Threshold Keys
					</Form.Label>
					<Col sm={10}>{inputs}</Col>
				</Form.Group>
			</Form>
		);
	}

	returnReadableDate(_date) {
		const days = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
		];

		const months = [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
		];
		let date = new Date(_date);

		return `${days[date.getDay()]}, ${date.getDate()} ${
			months[date.getMonth()]
		} ${date.getFullYear()}`;
	}

	createResultsTable() {
		return (
			<>
				<p>
					The election was generated successfully! The election
					details are shown below. Select Finish to return to the
					admin dashboard.
				</p>
				<Table striped bordered hover>
					<thead>
						<tr>
							<th>Key</th>
							<th>Value</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Election Name</td>
							<td>{this.state.electionDetails.electionName}</td>
						</tr>
						<tr>
							<td>Election Description</td>
							<td>
								{this.state.electionDetails.electionDescription}
							</td>
						</tr>
						<tr>
							<td>Election Verified</td>
							<td>
								{this.state.electionDetails.electionVerified.toString()}
							</td>
						</tr>
						<tr>
							<td>Election Start Date</td>
							<td>
								{this.returnReadableDate(
									this.state.electionDetails.electionStart
								)}
							</td>
						</tr>
						<tr>
							<td>Election End Date</td>
							<td>
								{this.returnReadableDate(
									this.state.electionDetails.electionEnd
								)}
							</td>
						</tr>
					</tbody>
				</Table>
				<Button variant='primary' href='/admin'>
					Finish
				</Button>
			</>
		);
	}

	restartInteractiveProof = async () => {
		this.changePage(4);
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

	createSummaryPage() {
		if (this.state.electionDetails.electionVerified) {
			return this.createResultsTable();
		} else {
			return this.createErrorMessage();
		}
	}

	createElectionDetailsForm() {
		return (
			<Form>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalEmail'
				>
					<Form.Label column sm={3}>
						Election Name
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							placeholder='Name'
							isValid={
								this.state.formValidated &&
								this.state.electionName
							}
							isInvalid={
								this.state.formValidated &&
								!this.state.electionName
							}
							value={this.state.electionName}
							onChange={(event) => {
								this.setState({
									electionName: event.target.value,
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
						Election Description
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							as='textarea'
							placeholder='A Brief Description of the Election'
							isValid={
								this.state.formValidated &&
								this.state.electionDescription
							}
							isInvalid={
								this.state.formValidated &&
								!this.state.electionDescription
							}
							value={this.state.electionDescription}
							onChange={(event) => {
								this.setState({
									electionDescription: event.target.value,
									formValidated: false,
								});
							}}
						/>
					</Col>
				</Form.Group>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalStartDate'
				>
					<Form.Label column sm={3}>
						Election Start Date
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							type='date'
							placeholder='A Brief Description of the Election'
							isValid={
								this.state.formValidated &&
								this.state.electionStartDate &&
								!this.state.formError.dates
							}
							isInvalid={
								this.state.formValidated &&
								(!this.state.electionStartDate ||
									this.state.formError.dates)
							}
							value={this.state.electionStartDate}
							onChange={(event) => {
								this.setState({
									electionStartDate: event.target.value,
									formValidated: false,
								});
							}}
						/>
					</Col>
				</Form.Group>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalEndDate'
				>
					<Form.Label column sm={3}>
						Election End Date
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							type='date'
							placeholder='A Brief Description of the Election'
							isValid={
								this.state.formValidated &&
								this.state.electionEndDate &&
								!this.state.formError.dates
							}
							isInvalid={
								this.state.formValidated &&
								(!this.state.electionEndDate ||
									this.state.formError.dates)
							}
							value={this.state.electionEndDate}
							onChange={(event) => {
								this.setState({
									electionEndDate: event.target.value,
									formValidated: false,
								});
							}}
						/>
					</Col>
				</Form.Group>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalFile'
				>
					<Form.Label column sm={3}>
						Constituencies
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							type='file'
							isValid={
								this.state.formValidated &&
								!this.state.formError.csv
							}
							isInvalid={
								this.state.formValidated &&
								this.state.formError.csv
							}
							onChange={this.getFile}
						/>
					</Col>
				</Form.Group>
			</Form>
		);
	}

	createCryptosystemInitiationForm() {
		return (
			<Form>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalEmail'
				>
					<Col sm={3} className='centre-buttons'>
						<Button
							variant='dark'
							id='server-button'
							onClick={this.onSubmit}
						>
							<>Initialise on Server</>
						</Button>
					</Col>
					<Form.Label column sm={9}>
						Initialise an instance of ElGamal in the application
						backend. This process can take hours and is resource
						intensive. It is reccomended when creating an official
						election.
					</Form.Label>
				</Form.Group>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalEmail'
				>
					<Col sm={3} className='centre-buttons'>
						<Button
							variant='dark'
							id='remote-button'
							onClick={this.onSubmit}
						>
							<>Initialise Remotely</>
						</Button>
					</Col>
					<Form.Label column sm={9}>
						Initialise an instance of ElGamal remotely on the
						library dedicated initiation server. This process is
						faster but should{' '}
						<strong>only be used when testing</strong>.
					</Form.Label>
				</Form.Group>
			</Form>
		);
	}

	createPublicKeysForm() {
		return (
			<Form>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalEmail'
				>
					<Form.Label column sm={2}>
						Encryption Keys
					</Form.Label>
					<Col sm={10}>{this.createPublicKeyInputs()}</Col>
				</Form.Group>
			</Form>
		);
	}

	backButton() {
		return (
			<Button
				variant='outline-dark'
				className='back-button button-margin'
				disabled={this.state.sendingRequest}
				onClick={() => {
					this.changePage(this.state.currentTab - 1);
				}}
			>
				Back
			</Button>
		);
	}

	renderTabForm() {
		switch (this.state.currentTab) {
			case 1:
				return (
					<>
						<p>Input the details in below:</p>
						{this.createElectionDetailsForm()}
						<Button variant='primary' onClick={this.onSubmit}>
							Next
						</Button>
					</>
				);
			case 2:
				return (
					<>
						<p>Select one of the initialisation options below:</p>
						{this.createCryptosystemInitiationForm()}
						{this.backButton()}
					</>
				);
			case 3:
				return (
					<>
						<p>Input all keys below:</p>
						{this.createPublicKeysForm()}
						{this.backButton()}
						<Button
							variant='primary'
							disabled={this.state.sendingRequest}
							onClick={this.onSubmit}
						>
							{this.state.sendingRequest
								? 'Loading...'
								: this.state.generateLocally
								? 'Initialise Election Remotely'
								: 'Initialise Election on Server'}
						</Button>
					</>
				);
			case 4:
				return (
					<>
						<p>
							Press the copy button next to each key to copy the
							key.
						</p>
						{this.createThresholdKeyTable()}
						<Button variant='primary' onClick={this.onSubmit}>
							Next
						</Button>
					</>
				);
			case 5:
				return (
					<>
						<p>
							Copy the following key and distribute it to the
							keyholders so they can encrypt their threshold key
							with it.
						</p>
						{this.createInteractiveProofTable()}
						<p>
							Input the encrypted threshold keys below and press
							Next to solve the interactive proof.
						</p>
						{this.createInteractiveProofForm()}
						{this.backButton()}
						<Button
							variant='primary'
							disabled={this.state.sendingRequest}
							onClick={this.onSubmit}
						>
							{this.state.sendingRequest
								? 'Loading...'
								: 'Validate Election'}
						</Button>
					</>
				);
			case 6:
				return <>{this.createSummaryPage()}</>;
			default:
				break;
		}
	}

	renderTab() {
		const content = [
			{
				title: 'Add Election Details',
				formTitle: 'Election Details',
				text: 'Input the basic details about the election and upload a .csv file with the constituencies and candidates running for them.',
			},
			{
				title: 'Initialise ElGamal',
				formTitle: 'Initialisation Options',
				text: 'An instance of the ElGamal cryptographic system must be initialised to use with the application. Note that this is a resource intensive task that could take a significant amount of time.',
			},
			{
				title: "Input Keyholders' Public Keys",
				formTitle: 'Public Keys Form',
				text: 'All keyholders must generate an asymmetric keypair and input their public keys in the form below',
			},
			{
				title: 'Hand out Threshold Keys to Keyholders',
				formTitle: 'Encrypted Threshold Keys',
				text: 'The election was generated, 10 threshold keys have been created and encrypted using the public keys provided by each keyholder. These encrypted keys should now be handed out to the keyholders for decryption and safekeeping.',
			},
			{
				title: 'Input Encrypted Threshold Keys to Solve Interactive Proof',
				formTitle: 'Input Threshold Keys',
				text: 'To prove that all the threshold keys have been handed out and decrypted correctly, the keyholders must encrypt their threshold key using the public key displayed and input the resulting ciphertext below.',
			},
			{
				title: 'Election Summary',
				formTitle: this.state.electionDetails.electionVerified
					? 'Election Creation Succeeded'
					: 'Election Creation Failed',
				text: 'The election creation process has beeen completed. The results from the process are displayed below:',
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
				{this.renderTab()}
			</>
		);
	}
}

export default NewElectionForm;
