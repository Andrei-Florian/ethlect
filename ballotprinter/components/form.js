import { Component } from 'react';
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
	Badge,
	ListGroup,
} from 'react-bootstrap';

class BallotForm extends Component {
	state = {
		formValidated: false,
		formError: false,
		sendingRequest: false,
		currentTab: 1,
		reencryptedThresholdKeys: [],
		alertError: false,
		copiedKey: false,
		connectionString: '',
		electionID: '',
		electionName: '',
		electionPublicKey: '',
		apiData: [],
		printError: false,
		downloadedPrintableBallots: false,
		downloadedEncryptedBallots: false,
		downloadedDecryptedBallots: false,
		downloadedEncryptedAuditableBallots: false,
		copiedHash: false,
	};

	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
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
		if (event.target.id === 'copy-button-e') {
			navigator.clipboard
				? navigator.clipboard.writeText(this.state.electionPublicKey)
				: this.fallbackCopyTextToClipboard(
						this.state.electionPublicKey
				  );

			this.setState({ copiedKey: true });
		} else {
			navigator.clipboard
				? navigator.clipboard.writeText(
						this.state.apiData.decryptedAuditableBallotsHash
				  )
				: this.fallbackCopyTextToClipboard(
						this.state.apiData.decryptedAuditableBallotsHash
				  );

			this.setState({ copiedHash: true });
		}
	};

	downloadFile(_data, _filename) {
		const element = document.createElement('a');
		const file = new Blob([_data], {
			type: 'text/plain',
		});
		element.href = URL.createObjectURL(file);
		element.download = _filename;
		document.body.appendChild(element);
		element.click();
	}

	parseDownload(_shuffle) {
		try {
			const newShuffle = _shuffle.replaceAll('\\', '');
			const newShuffle2 = newShuffle.replaceAll('"[', '[');
			const newShuffle3 = newShuffle2.replaceAll(']"', ']');
			const newShuffle4 = newShuffle3.replaceAll('}"', '}');
			const newShuffle5 = newShuffle4.replaceAll('"{', '{');

			return newShuffle5;
		} catch (error) {
			console.log(error);
		}
	}

	handleDownload = async (event) => {
		event.preventDefault();
		const buttonID = event.target.id;

		switch (buttonID) {
			case 'button-printableBallots':
				this.setState({
					downloadedPrintableBallots: true,
				});

				this.downloadFile(
					this.parseDownload(
						JSON.stringify(this.state.apiData.printableBallots)
					),
					`ethlect Printable Ballot Set.json`
				);
				break;
			case 'button-encryptedBallots':
				this.setState({
					downloadedEncryptedBallots: true,
				});

				this.downloadFile(
					this.parseDownload(
						JSON.stringify(this.state.apiData.encryptedBallots)
					),
					`ethlect Encrypted Ballot Set.json`
				);
				break;
			case 'button-decryptedBallots':
				this.setState({
					downloadedDecryptedBallots: true,
				});

				this.downloadFile(
					this.parseDownload(
						JSON.stringify(this.state.apiData.decryptedBallots)
					),
					`ethlect Decrypted Ballot Set.json`
				);
				break;
			default:
				this.setState({
					downloadedEncryptedAuditableBallots: true,
				});

				this.downloadFile(
					this.parseDownload(
						JSON.stringify(
							this.state.apiData.encryptedAuditableBallots
						)
					),
					`ethlect Encrypted Auditable Ballot Set.json`
				);
				break;
		}
	};

	validateKey = async () => {
		// check if the electionID field is empty
		if (this.state.electionID === '') {
			return { success: false };
		}

		// check if the electionID is a number
		if (
			isNaN(this.state.electionID) ||
			isNaN(parseFloat(this.state.electionID))
		) {
			return { success: false };
		}

		if (this.state.connectionString === '') {
			// check if the connection string field is empty
			return { success: false };
		}

		// check if the connection string is formatted correctly
		if (!this.state.connectionString.startsWith('mongodb+srv://')) {
			return { success: false };
		}

		return { success: true };
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

	verifyConnectionString = async () => {
		try {
			this.setState({ sendingRequest: true });
			await this.delay(500);

			const postRequest = JSON.stringify({
				connectionString: this.state.connectionString,
				electionID: this.state.electionID,
			});

			// send the request
			const res = await fetch(
				process.env.NEXT_PUBLIC_API_VERIFYCONNECTIONSTRING,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: postRequest,
				}
			);

			const resJSON = await res.json();
			this.setState({
				sendingRequest: false,
			});

			if (resJSON.success) {
				this.setState({
					electionName: resJSON.electionName,
					electionPublicKey: resJSON.publicKey,
				});
				return { success: true };
			} else {
				return { success: false, error: resJSON.error };
			}
		} catch (error) {
			console.log(error);
			return { success: false, error: 'Unknown Error' };
		}
	};

	printBallots = async () => {
		try {
			this.setState({ sendingRequest: true });
			await this.delay(500);

			// call the API route to delete the election
			const postRequest = JSON.stringify({
				connectionString: this.state.connectionString,
				electionID: this.state.electionID,
				keys: this.state.reencryptedThresholdKeys,
			});

			// send the request
			const res = await fetch(process.env.NEXT_PUBLIC_API_PRINTBALLOTS, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: postRequest,
			});

			const resJSON = await res.json();

			this.setState({
				sendingRequest: false,
			});

			if (resJSON.success) {
				return { success: true, data: resJSON.data };
			} else {
				return { success: false, error: resJSON.error };
			}
		} catch (error) {
			console.log(error);
			return { success: false, error: 'Unknown Error' };
		}
	};

	changePage = async (_tab) => {
		// move on to next page
		this.setState({
			currentTab: _tab,
			formValidated: false,
			formError: null,
			copiedKeys: [],
			alertError: false,
		});
	};

	goBack = async () => {
		this.changePage(this.state.currentTab - 1);
	};

	onSubmit = async (event) => {
		event.preventDefault();

		switch (this.state.currentTab) {
			case 1:
				this.changePage(2);
				break;
			case 2:
				const keyValidation = await this.validateKey();

				if (keyValidation.success) {
					this.setState({ formValidated: true });

					// send connection string to backend to attempt connection to db
					const keyCheck = await this.verifyConnectionString();

					if (keyCheck.success) {
						this.changePage(3);
					} else {
						this.setState({
							alertError: keyCheck.error,
							formValidated: false,
						});
					}
				} else {
					this.setState({
						formError: true,
						formValidated: true,
					});
				}
				break;
			case 3:
				const thresholdKeyValidation =
					await this.validateThresholdKeys();

				if (thresholdKeyValidation.success) {
					// send all data to backend and run the printing process
					const printResults = await this.printBallots();

					if (printResults.success) {
						this.setState({
							apiData: printResults.data,
							formValidated: false,
							printError: false,
						});
					} else {
						this.setState({
							apiData: [],
							formValidated: false,
							printError: printResults.error,
						});
					}

					this.changePage(4);
				}
				break;
			default:
				break;
		}
	};

	renderMenu() {
		const menuHeadings = [
			'Overview',
			'Election Documents',
			'Threshold Keys',
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
					className='alert-error'
				>
					<Alert.Heading>
						There was an error with the Request!
					</Alert.Heading>
					<p>
						The Application Failed to Verify the Connection String
					</p>
					<p>Error Details: {this.state.alertError}</p>
				</Alert>
			);
		}
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

	createOverviewPage() {
		return (
			<>
				<p>
					In the election process, ballots need to be printed and
					distributed to voters. The physical ballot is the only
					element of the election that maps a ciphertext directly to a
					candidate so this process must be done with great security
					in mind to prevent the exposure of voter identities.
				</p>
				<p>
					It is recommended that this app is run on an airtight
					computer to prevent the possibility of a data leak. The
					application will automatically verify the process integrity
					through the introduction of auditable ballots and subsequent
					verification of these ballots. All verifications can also be
					done manually using the documents outputted by the app.
				</p>
				<p>
					<strong>The printing process is explained below:</strong>
				</p>
				<ol>
					<li>
						The admin provides a read-only access string to the
						election database such that the application can access
						required private information.
					</li>
					<li>
						The admin is then to distribute the provided public key
						to the election keyholders who are then to encrypt their
						key and return it to the admin who will then provide
						these encrypted keys to the application.
					</li>
					<li>
						The application will then derive the ElGamal private key
						from the threshold keys and generate auditable ballots.
					</li>
					<li>
						The entire ballot set will be decrypted and the physical
						ballots will be constructed.
					</li>
					<li>
						The decrypted auditable ballots are separated from the
						set and compared against the plaintext auditable
						ballots.
					</li>
					<li>
						The application outputs documents containing the
						decrypted ballots and auditable ballot sets.
					</li>
				</ol>
				<Button
					variant='primary'
					disabled={this.state.sendingRequest}
					onClick={this.onSubmit}
				>
					Continue
				</Button>
			</>
		);
	}

	createKeyForm() {
		return (
			<Form>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalEmail'
				>
					<Form.Label column sm={3}>
						Election ID
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							placeholder='1'
							isValid={
								this.state.formValidated &&
								this.state.electionID !== '' &&
								!isNaN(this.state.electionID) &&
								!isNaN(parseFloat(this.state.electionID))
							}
							isInvalid={
								this.state.formValidated &&
								(this.state.electionID === '' ||
									(isNaN(this.state.electionID) &&
										isNaN(
											parseFloat(this.state.electionID)
										)))
							}
							value={this.state.electionID}
							onChange={(event) => {
								this.setState({
									electionID: event.target.value,
									formValidated: false,
									formError: false,
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
						Connection String
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							placeholder='mongodb+srv://username:password@cluster.4lrwj.mongodb.net/db?retryWrites=true&w=majority'
							isValid={
								this.state.formValidated &&
								!this.state.formError
							}
							isInvalid={
								this.state.formValidated && this.state.formError
							}
							value={this.state.connectionString}
							onChange={(event) => {
								this.setState({
									connectionString: event.target.value,
									formValidated: false,
									formError: false,
								});
							}}
						/>
					</Col>
				</Form.Group>
			</Form>
		);
	}

	renderResultsTable() {
		return (
			<ListGroup as='ol' numbered>
				<ListGroup.Item
					as='li'
					className='d-flex justify-content-between align-items-start'
				>
					<div className='ms-2 me-auto'>
						<div className='fw-bold'>Printable Ballots</div>
						<p>
							The list of plaintext ballots correlating each
							candidate representative number to the respective
							candidate for each ballot.
						</p>
						<p>
							<Button
								variant='primary'
								size='sm'
								className='button-margin'
								id='button-printableBallots'
								onClick={this.handleDownload}
								disabled={this.state.downloadedPrintableBallots}
							>
								{this.state.downloadedPrintableBallots
									? 'Downloaded!'
									: 'Download'}
							</Button>
						</p>
					</div>
					<Badge bg='success' pill>
						Verified
					</Badge>
					<Badge bg='danger' pill className='pill'>
						Sensitive
					</Badge>
				</ListGroup.Item>
				<ListGroup.Item
					as='li'
					className='d-flex justify-content-between align-items-start'
				>
					<div className='ms-2 me-auto'>
						<div className='fw-bold'>Decrypted Ballots</div>
						<p>
							The decrypted ballots generated by the ethlect.
							application combined with the decrypted auditable
							ballots. This data is sensitive and exposing it will
							lead to the compromise of voter anonymity!
						</p>
						<p>
							<Button
								variant='primary'
								size='sm'
								className='button-margin'
								id='button-decryptedBallots'
								onClick={this.handleDownload}
								disabled={this.state.downloadedDecryptedBallots}
							>
								{this.state.downloadedDecryptedBallots
									? 'Downloaded!'
									: 'Download'}
							</Button>
						</p>
					</div>
					<Badge bg='success' pill className='pill'>
						Verified
					</Badge>
					<Badge bg='danger' pill className='pill'>
						Sensitive
					</Badge>
				</ListGroup.Item>
				<ListGroup.Item
					as='li'
					className='d-flex justify-content-between align-items-start'
				>
					<div className='ms-2 me-auto'>
						<div className='fw-bold'>Encrypted Ballots</div>
						<p>
							The encrypted ballots generated by the ethlect.
							application combined with the encrypted auditable
							ballots.
						</p>
						<p>
							<Button
								variant='primary'
								size='sm'
								className='button-margin'
								id='button-encryptedBallots'
								onClick={this.handleDownload}
								disabled={this.state.downloadedEncryptedBallots}
							>
								{this.state.downloadedEncryptedBallots
									? 'Downloaded!'
									: 'Download'}
							</Button>
						</p>
					</div>
					<Badge bg='success' pill>
						Verified
					</Badge>
				</ListGroup.Item>

				<ListGroup.Item
					as='li'
					className='d-flex justify-content-between align-items-start'
				>
					<div className='ms-2 me-auto'>
						<div className='fw-bold'>
							Encrypted Auditable Ballots
						</div>
						<p>
							The encrypted auditable ballots generated by the
							process.
						</p>
						<p>
							<Button
								variant='primary'
								size='sm'
								className='button-margin'
								id='button-encryptedAuditableBallots'
								onClick={this.handleDownload}
								disabled={
									this.state
										.downloadedEncryptedAuditableBallots
								}
							>
								{this.state.downloadedEncryptedAuditableBallots
									? 'Downloaded!'
									: 'Download'}
							</Button>
						</p>
					</div>
					<Badge bg='success' pill>
						Verified
					</Badge>
				</ListGroup.Item>
				<ListGroup.Item
					as='li'
					className='d-flex justify-content-between align-items-start'
				>
					<div className='ms-2 me-auto'>
						<div className='fw-bold'>
							Decrypted Auditable Ballots Hash
						</div>
						<p>The hash of the plaintext auditable ballots.</p>
						<p>
							<Button
								variant='primary'
								size='sm'
								className='button-margin'
								id='button-decryptedAuditableBallotsHash'
								onClick={this.handleCopy}
								disabled={this.state.copiedHash}
							>
								{this.state.copiedHash
									? 'Copied!'
									: 'Copy Hash'}
							</Button>
						</p>
					</div>
					<Badge bg='success' pill>
						Verified
					</Badge>
				</ListGroup.Item>
			</ListGroup>
		);
	}

	renderTabForm() {
		switch (this.state.currentTab) {
			case 1:
				return <>{this.createOverviewPage()}</>;
			case 2:
				return (
					<>
						<p>
							Create a connection key in MongoDB ensuring that the
							key only provides read-access to the election data
							and input this key below. Also input the election ID
							of the election wished to interact with; this can be
							found on the details page of the election in the
							ethlect. application.
						</p>
						{this.createKeyForm()}
						<Button
							variant='outline-dark'
							onClick={this.goBack}
							className='button-margin'
							disabled={this.state.sendingRequest}
						>
							Back
						</Button>
						<Button
							disabled={this.state.sendingRequest}
							variant='primary'
							onClick={this.onSubmit}
						>
							{this.state.sendingRequest
								? 'Verifying...'
								: 'Verify Connection'}
						</Button>
					</>
				);
			case 3:
				return (
					<>
						<p>
							Copy the following key and distribute it to the
							keyholders so they can encrypt their threshold keys
							with it.
						</p>
						{this.createInteractiveProofTable()}
						<p>
							Input the encrypted threshold keys below and press
							Print to start the printing and auditing process.
						</p>
						{this.createInteractiveProofForm()}
						<Button
							variant='outline-dark'
							onClick={this.goBack}
							className='button-margin'
							disabled={this.state.sendingRequest}
						>
							Back
						</Button>
						<Button
							variant='primary'
							disabled={this.state.sendingRequest}
							onClick={this.onSubmit}
						>
							{this.state.sendingRequest
								? 'Printing and Auditing...'
								: `Print Ballots for ${this.state.electionName}`}
						</Button>
					</>
				);
			case 4:
				if (this.state.printError) {
					return (
						<>
							<Alert variant='danger' className='alert-error'>
								<Alert.Heading>
									The Ballot Printing Process Failed
								</Alert.Heading>
								<p>
									The application failed to successfully
									complete the ballot printing operation.
									Please try going back, verifying your data
									inputs, and submitting the form again.
								</p>
								<p>
									<strong>
										Error Details: {this.state.printError}
									</strong>
								</p>
							</Alert>
							<Button variant='primary' onClick={this.goBack}>
								Back
							</Button>
						</>
					);
				} else {
					return (
						<>
							<p>
								The application successfully prepared all
								ballots for printing and verified the
								correctness of the process autonomously. Below
								are all documents outputted by the application.
							</p>
							<p>
								<strong>
									The process can be manually verified by
									checking that all ballot IDs in the
									decrypted ballot set are found in the
									encrypted set, ensuring that the encrypted
									auditable ballots are present in the
									encrypted ballot set, and verifying that the
									hash of the decrypted auditable ballots
									matches the provided hash.
								</strong>
							</p>
							{this.renderResultsTable()}
						</>
					);
				}
			default:
				break;
		}
	}

	renderTab() {
		const content = [
			{
				title: 'Ballot Printing Overview',
				formTitle: 'Ballot Printing Process',
				text: 'This application alows for the simulation of the ballot printing process. The application decrypts the election ballot set using the threshold keys provided by the keyholders in a verifiable fashion.',
			},
			{
				title: 'Input Election Key',
				formTitle: 'Election Key',
				text: 'The admin is to create a MongoDB read-only access string for the election and input this string into the field provided below such that the application will be able to access private election data.',
			},
			{
				title: "Input Keyholders' threshold keys",
				formTitle: 'Encrypt Threshold Keys and Input them Below',
				text: 'The printing process requires the threshold keys of the keyholders in order to decrypt the ballots. All keyholders need to encrypt their threshold keys with the public key provided below and then input them in the fields below. Please note that the printing process will take a while depending on the size of the election.',
			},
			{
				title: 'Summary',
				formTitle:
					this.state.printError === false
						? 'Process Complete!'
						: 'Process Failed!',
				text: 'The application finished the printing process. The results are displayed below.',
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

export default BallotForm;
