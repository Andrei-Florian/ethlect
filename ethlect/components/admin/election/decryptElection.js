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
	Badge,
	ListGroup,
} from 'react-bootstrap';

class DecryptElection extends Component {
	state = {
		formValidated: false,
		formError: false,
		sendingRequest: false,
		currentTab: 1,
		electionPublicKey: '',
		reencryptedThresholdKeys: [],
		alertError: false,
		copiedKeys: [],
		success: false,
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

	retryDecryption = async () => {
		this.setState({
			success: false,
			sendingRequest: false,
		});

		this.changePage(2);
	};

	getElectionPublicKey = async () => {
		try {
			this.setState({ sendingRequest: true });

			// get the electionID
			const electionID = this.props.ElectionDetails.electionID;

			// call the API route to delete the election
			const postRequest = JSON.stringify({
				electionID,
			});

			// send the request
			const res = await fetch(
				process.env.NEXT_PUBLIC_API_GETELECTIONKEY,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: postRequest,
				}
			);

			const resJSON = await res.json();

			if (resJSON.success) {
				this.setState({
					electionPublicKey: resJSON.publicKey,
					sendingRequest: false,
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

	decryptElection = async () => {
		try {
			this.setState({ sendingRequest: true });

			// get the electionID
			const electionID = this.props.ElectionDetails.electionID;
			const keys = this.state.reencryptedThresholdKeys;

			// call the API route to delete the election
			const postRequest = JSON.stringify({
				electionID,
				keys,
			});

			// send the request
			const res = await fetch(
				process.env.NEXT_PUBLIC_API_DECRYPTBALLOTS,
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
				return { success: true };
			} else {
				return { success: false, error: resJSON.error };
			}
		} catch (error) {
			console.log(error);
			return { success: false, error: 'Unknown Error' };
		}
	};

	onSubmit = async (event) => {
		event.preventDefault();

		switch (this.state.currentTab) {
			case 1:
				const key = await this.getElectionPublicKey();

				if (key.success) {
					this.changePage(2);
				} else {
					this.setState({
						alertError: key.error,
						sendingRequest: false,
					});
				}
				break;
			case 2:
				const thresholdKeyValidation =
					await this.validateThresholdKeys();

				if (thresholdKeyValidation.success) {
					const decryption = await this.decryptElection();

					if (decryption.success) {
						this.setState({
							success: true,
						});
					} else {
						this.setState({
							success: decryption.error,
						});
					}
					this.changePage(3);
				}
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
			default:
				break;
		}
	};

	renderMenu() {
		const menuHeadings = ['Overview', 'Threshold Keys', 'Summary'];
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
						There was an error with the Request!
					</Alert.Heading>
					<p>
						{this.state.currentTab === 1
							? 'The application failed to retrieve the election public key from the database. Please refresh the page and try again.'
							: ''}
					</p>
					<p>Error Details: {this.state.alertError}</p>
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
		navigator.clipboard
			? navigator.clipboard.writeText(this.state.electionPublicKey)
			: this.fallbackCopyTextToClipboard(this.state.electionPublicKey);

		let copiedKeys = [...this.state.copiedKeys];
		copiedKeys[0] = {
			...copiedKeys[0],
			copied: true,
		};
		this.setState({ copiedKeys });
	};

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

	createShufflesTable() {
		let cards = [];

		for (let i = 0; i < this.props.ElectionDetails.shuffles.length; i++) {
			cards.push(
				<ListGroup.Item
					as='li'
					className='d-flex justify-content-between align-items-start'
				>
					<div className='ms-2 me-auto'>
						<div className='fw-bold'>
							{this.props.ElectionDetails.shuffles[i]
								.shuffleType === 'generate'
								? 'Ballot Generation'
								: this.props.ElectionDetails.shuffles[i]
										.shuffleType === 'transfer'
								? 'Ballot Transfer from Ballot Box'
								: this.props.ElectionDetails.shuffles[i]
										.shuffleType === 'decryption'
								? 'Ballots Decryption'
								: `Ballot Shuffle ${this.props.ElectionDetails.shuffles[i].shuffleID}`}
						</div>
						{this.props.ElectionDetails.shuffles[i].shuffleType ===
						'generate'
							? 'Represents the generation of the ballots.'
							: this.props.ElectionDetails.shuffles[i]
									.shuffleType === 'transfer'
							? 'Represents the transfer of ballots from the ballot box into the shuffles array upon the starting of the election tabulation process.'
							: this.props.ElectionDetails.shuffles[i]
									.shuffleType === 'decryption'
							? 'Represents the final decryption of the ballots. This reveals the candidate choices of the ballots.'
							: 'Represents a complete re-encryption of all candidates in all ballots and a random permutation of the resulting ballot set.'}
					</div>
					<Badge
						className='button-margin'
						bg={
							this.props.ElectionDetails.shuffles[i]
								.shuffleType === 'generate'
								? 'primary'
								: this.props.ElectionDetails.shuffles[i]
										.shuffleType === 'transfer'
								? 'info'
								: this.props.ElectionDetails.shuffles[i]
										.shuffleType === 'decryption'
								? 'success'
								: 'dark'
						}
						pill
					>
						{this.props.ElectionDetails.shuffles[i].shuffleType}
					</Badge>
					<Badge
						bg={
							this.props.ElectionDetails.shuffles[i].approved
								? 'success'
								: 'warning'
						}
						pill
					>
						{this.props.ElectionDetails.shuffles[i].approved
							? 'Approved'
							: 'Pending'}
					</Badge>
				</ListGroup.Item>
			);
		}

		if (this.state.success === true) {
			cards.push(
				<ListGroup.Item
					as='li'
					className='d-flex justify-content-between align-items-start'
				>
					<div className='ms-2 me-auto'>
						<div className='fw-bold'>Ballots Decryption</div>
						Represents the final decryption of the ballots. This
						reveals the candidate choices of the ballots.
					</div>
					<Badge className='button-margin' bg='success' pill>
						Decryption
					</Badge>
					<Badge bg='success' pill>
						Approved
					</Badge>
				</ListGroup.Item>
			);
		}

		return (
			<p>
				<ListGroup as='ol' numbered>
					{cards}
				</ListGroup>
			</p>
		);
	}

	createOverviewPage() {
		return (
			<>
				<p>
					The application will decrypt the ballots found in the last
					shuffle provided it was successful and approved by the
					admin. The application requires there to have been at least
					one verified shuffle of the ballots before allowing for
					their decryption.
				</p>
				<p>
					<strong>The decryption process is explained below:</strong>
				</p>
				<ol>
					<li>
						The application will decrypt all candidates of all
						ballots in the last approved shuffle.
					</li>
					<li>
						The application will then release an interactive proof
						to prove the legitimacy of the decryption.
					</li>
					<li>
						The resulting decrypted ballots are made public together
						with the interactive proof to allow for auditing.
					</li>
				</ol>
				<p>
					<strong>
						Please review the trail of shuffles below before
						proceeding with the decryption.
					</strong>
				</p>
				{this.createShufflesTable()}
			</>
		);
	}

	renderTabForm() {
		switch (this.state.currentTab) {
			case 1:
				return (
					<>
						{this.createOverviewPage()}
						{!this.props.ElectionDetails.electionComplete ? (
							<>
								{!(
									this.props.ElectionDetails.shuffles.at(-1)
										.approved &&
									this.props.ElectionDetails.shuffles.at(-1)
										.shuffleType === 'shuffle'
								) ? (
									<Alert variant='danger'>
										You must complete at least one shuffle
										and validate it before decrypting
										ballots!
									</Alert>
								) : (
									''
								)}
								<Button
									variant='primary'
									onClick={this.onSubmit}
									disabled={
										!(
											this.props.ElectionDetails.shuffles.at(
												-1
											).approved &&
											this.props.ElectionDetails.shuffles.at(
												-1
											).shuffleType === 'shuffle'
										) || this.state.sendingRequest
									}
								>
									{this.state.sendingRequest
										? 'Loading...'
										: 'Next'}
								</Button>
							</>
						) : (
							<Alert variant='success'>
								The ballots have been decrypted and the election
								is now complete! You cannot decrypt the ballots
								again.
							</Alert>
						)}
					</>
				);
			case 2:
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
						<Button
							variant='primary'
							disabled={this.state.sendingRequest}
							onClick={this.onSubmit}
						>
							{this.state.sendingRequest
								? 'Decrypting...'
								: 'Decrypt Ballots'}
						</Button>
					</>
				);
			case 3:
				return (
					<>
						{this.state.success === true ? (
							<>
								<Alert variant='success'>
									The application successfully decrypted the
									ballots! Please return to the tabulation tab
									to access the results of the decryption.
								</Alert>
								<p>
									A trail of the shuffles completed in the
									election is displayed below:
								</p>
								<p>{this.createShufflesTable()}</p>
								<Button
									variant='primary'
									href={`/admin/${this.props.ElectionDetails.electionID}/tabulate`}
									className='button-margin'
								>
									Finish
								</Button>
							</>
						) : (
							<>
								<Alert variant='danger'>
									<p>
										The application failed to decrypt the
										ballot set. The error message returned
										is displayed below. Please check that
										the encrypted threshold keys provided
										are correct and try inputting them
										again.
									</p>
									<strong>Error: {this.state.success}</strong>
								</Alert>
								<p>
									Use the options below to revise the
									threshold keys provided and attempt to
									decrypt again or to return to the tabulation
									page.
								</p>
								<Button
									variant='primary'
									onClick={this.retryDecryption}
									className='button-margin'
								>
									Retry
								</Button>
								<Button
									variant='outline-dark'
									href={`/admin/${this.props.ElectionDetails.electionID}/tabulate`}
									className='button-margin'
								>
									Return to Tabulation Page
								</Button>
							</>
						)}
					</>
				);
			default:
				break;
		}
	}

	renderTab() {
		const content = [
			{
				title: 'Ballot Decryption Overview',
				formTitle: 'Decrypt Ballots',
				text: 'The ballot decryption process allows for the decryption of all ballots cast in the election in order to reveal the candidates voted for. This process is the final step in the election and in turns terminates the election. After the ballots are decrypted, they can no longer be shuffled or managed in any way.',
			},
			{
				title: "Input Keyholders' threshold keys",
				formTitle: 'Encrypt Threshold Keys and Input them Below',
				text: 'The decryption process requires the threshold keys of the keyholders in order to decrypt the ballots. All keyholders need to encrypt their threshold keys with the election public key provided below and then input them in the fields below. Please note that the decryption process will take a while depending on the size of the election.',
			},
			{
				title: 'Summary',
				formTitle:
					this.state.success === true
						? 'Decryption Successful!'
						: 'Decryption Failed!',
				text: 'The application finished the decryption process. The results are displayed below.',
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

export default DecryptElection;
