import { Component } from 'react';
import {
	Nav,
	Card,
	Button,
	Form,
	Row,
	Col,
	Alert,
	InputGroup,
	FormControl,
	Table,
} from 'react-bootstrap';

class NewElectionForm extends Component {
	state = {
		formValidated: false,
		formError: false,
		sendingRequest: false,
		currentTab: 1,
		alertError: false,
		ballotID: '',
		candidateCount: 0,
		candidateReps: [],
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

	checkAccount = async () => {
		try {
			const fetchString = process.env.NEXT_PUBLIC_API_CHECKACCOUNT;

			const postRequest = JSON.stringify({
				electionID: this.props.ElectionDetails.electionID,
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
				return { success: true };
			} else {
				return { success: false };
			}
		} catch (error) {
			console.log(error);
			return { success: false };
		}
	};

	checkBallotID = async () => {
		try {
			const fetchString = process.env.NEXT_PUBLIC_API_CHECKBALLOTID;

			const postRequest = JSON.stringify({
				electionID: this.props.ElectionDetails.electionID,
				ballotID: this.state.ballotID,
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
					candidateCount: resJSON.candidateCount,
				});
				return { success: true };
			} else {
				return { success: false };
			}
		} catch (error) {
			console.log(error);
			return { success: false };
		}
	};

	decomposeGivenCandidates(_candidates) {
		let candidates = [];

		for (let i = 0; i < _candidates.length; i++) {
			if (_candidates[i] !== undefined && _candidates[i].key) {
				candidates.push(_candidates[i].key);
			}
		}

		return candidates;
	}

	checkCandidateIDs = async () => {
		try {
			const fetchString = process.env.NEXT_PUBLIC_API_CHECKCANDIDATEIDS;

			const postRequest = JSON.stringify({
				electionID: this.props.ElectionDetails.electionID,
				candidates: this.decomposeGivenCandidates(
					this.state.candidateReps
				),
				ballotID: this.state.ballotID,
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
				return { success: true };
			} else {
				return { success: false };
			}
		} catch (error) {
			console.log(error);
			return { success: false };
		}
	};

	castVote = async () => {
		try {
			const fetchString = process.env.NEXT_PUBLIC_API_CASTVOTE;

			const postRequest = JSON.stringify({
				electionID: this.props.ElectionDetails.electionID,
				candidates: this.decomposeGivenCandidates(
					this.state.candidateReps
				),
				ballotID: this.state.ballotID,
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
				return { success: true };
			} else {
				return { success: false };
			}
		} catch (error) {
			console.log(error);
			return { success: false };
		}
	};

	validateBallotID = async () => {
		let error = false;

		// check that the field is filled in, is a number, and is 9 digits long
		if (this.state.ballotID === '' || isNaN(this.state.ballotID)) {
			error = true;
		}

		if (this.state.ballotID.length !== 9) {
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

	consecutive(array) {
		var i = 2,
			d;
		while (i < array.length) {
			d = array[i - 1] - array[i - 2];
			if (Math.abs(d) === 1 && d === array[i] - array[i - 1]) {
				return false;
			}
			i++;
		}
		return true;
	}

	validateCandidateIDs = async () => {
		let error = false;

		// check that all fields are numbers
		for (let i = 0; i < this.state.candidateReps.length; i++) {
			if (
				this.state.candidateReps[i] &&
				isNaN(this.state.candidateReps[i].key)
			) {
				error = true;
			}
		}

		// ensure the fields are filled in from the beginning
		let values = [];
		for (let i = 0; i < this.state.candidateCount; i++) {
			if (
				this.state.candidateReps[i] != undefined &&
				this.state.candidateReps[i].key != ''
			) {
				values.push(true);

				// set error to true if the candidate ID is not 3 digits long
				if (this.state.candidateReps[i].key.length !== 3) {
					error = true;
				}
			} else {
				values.push(false);

				// set error to true if the first field is empty
				if (i === 0) {
					error = true;
				}
			}
		}

		// ensure all fields are unique
		let reps = [];

		for (let i = 0; i < this.state.candidateReps.length; i++) {
			if (
				reps.includes(this.state.candidateReps[i].key) &&
				this.state.candidateReps[i].key != undefined &&
				this.state.candidateReps[i].key != ''
			) {
				error = true;
			} else {
				reps.push(this.state.candidateReps[i].key);
			}
		}

		let wasFalse = false;
		for (let i = 0; i < values.length; i++) {
			if (values[i] === false) {
				wasFalse = true;
			} else if (wasFalse) {
				error = true;
			}
		}

		if (error) {
			this.setState({ formError: true, formValidated: true });
			return { success: false };
		} else {
			this.setState({ formError: false, formValidated: true });
			return { success: true };
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
				this.setState({ sendingRequest: true });
				const result = await this.checkAccount();
				this.setState({ sendingRequest: false });

				if (result.success) {
					this.changePage(2);
				} else {
					this.setState({
						alertError: true,
					});
				}

				break;
			case 2:
				// second form submitted
				const validateID = await this.validateBallotID();

				if (validateID.success) {
					this.setState({ sendingRequest: true });
					await this.delay(1000);
					const ballotIDValidated = await this.checkBallotID();
					this.setState({ sendingRequest: false });

					if (ballotIDValidated.success) {
						this.changePage(3);
					} else {
						this.setState({
							alertError: true,
							formValidated: false,
						});
					}
				}
				break;
			case 3:
				const validateCandidates = await this.validateCandidateIDs();

				if (validateCandidates.success) {
					this.setState({ sendingRequest: true });
					await this.delay(1000);
					const candidateIDsValidated =
						await this.checkCandidateIDs();
					this.setState({ sendingRequest: false });

					if (candidateIDsValidated.success) {
						this.changePage(4);
					} else {
						this.setState({
							alertError: true,
							formValidated: false,
						});
					}
				}
				break;
			case 4:
				this.setState({ sendingRequest: true });
				const voteCast = await this.castVote();
				this.setState({ sendingRequest: false });

				if (voteCast.success) {
					this.setState({
						verificationSuccess: true,
					});
				} else {
					this.setState({
						alertError: true,
						formValidated: false,
					});
				}
				break;
			default:
				break;
		}
	};

	renderMenu() {
		const menuHeadings = [
			'Start Casting Process',
			'Ballot Verification',
			'Candidate Selection',
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
					<Alert.Heading>Vote Cast Successfully!</Alert.Heading>
					<p>
						You have successfully cast your vote. You can now use
						the vote verification function built into ethlect. or a
						third party app to verify that your vote was cast.
					</p>
					<Button
						variant='outline-dark'
						href='/'
						className='button-margin'
					>
						Return Home
					</Button>
					<Button
						variant='outline-dark'
						href={`/${this.props.ElectionDetails.electionID}/verify`}
					>
						Verify Vote
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
							? 'Failed to find Your Ballots'
							: this.state.currentTab === 2
							? 'There is an Error with the Ballot ID Provided'
							: this.state.currentTab === 3
							? 'The Candidate IDs provided are not valid'
							: 'The Vote was not Cast Successfully!'}
					</Alert.Heading>
					<p>
						{this.state.currentTab === 1
							? 'The application failed to find ballots associated with your ID in the election. Try signing out and signing back in.'
							: this.state.currentTab === 2
							? 'The application encountered an error trying to find a ballot assigned to your user ID in the election. This can be caused by an incorrect or duplicate ballot ID being inputted. Ensure that you have inputted the correct ballot ID and try submitting the form again and remember that a ballot can only be used once!.'
							: this.state.currentTab === 3
							? 'The application could not find the candidate IDs provided in the ballot you are using. Please check that you inputted correct candidate IDs and try submitting the form again.'
							: 'The application failed to add the ballot cast to the ballot box. Try refreshing the page and submitting the form again.'}
					</p>
				</Alert>
			);
		}
	}

	renderBallotIDForm() {
		return (
			<Form>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='formHorizontalEmail'
				>
					<Form.Label column sm={3}>
						Ballot ID
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							type='number'
							placeholder='748388389'
							isValid={
								this.state.formValidated &&
								!this.state.formError
							}
							isInvalid={
								this.state.formValidated && this.state.formError
							}
							value={this.state.ballotID}
							onChange={(event) => {
								this.setState({
									ballotID: event.target.value,
									formValidated: false,
								});
							}}
						/>
					</Col>
				</Form.Group>
			</Form>
		);
	}

	renderCandidateForm() {
		let inputs = [];

		for (let i = 0; i < this.state.candidateCount; i++) {
			inputs.push(
				<InputGroup className='mb-2'>
					<InputGroup.Text>{`Candidate ${i + 1}`}</InputGroup.Text>
					<FormControl
						id='inlineFormInputGroup'
						placeholder='Candidate ID'
						type='number'
						isValid={
							this.state.formValidated && !this.state.formError
						}
						isInvalid={
							this.state.formValidated && this.state.formError
						}
						value={
							this.state.candidateReps[i]
								? this.state.candidateReps[i].key
								: ''
						}
						onChange={(event) => {
							let candidateReps = [...this.state.candidateReps];
							candidateReps[i] = {
								...candidateReps[i],
								key: event.target.value,
							};
							this.setState({ candidateReps });
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
						Candidates
					</Form.Label>
					<Col sm={10}>{inputs}</Col>
				</Form.Group>
			</Form>
		);
	}

	renderSummaryTable() {
		const candidates = this.decomposeGivenCandidates(
			this.state.candidateReps
		);
		let tableRows = [];

		for (let i = 0; i < candidates.length; i++) {
			tableRows.push(
				<tr>
					<td>{`Candidate ${i + 1}`}</td>
					<td>{candidates[i]}</td>
				</tr>
			);
		}

		return (
			<Table striped bordered hover>
				<thead>
					<tr>
						<th>Candidate Preference</th>
						<th>Candidate Representative ID</th>
					</tr>
				</thead>
				<tbody>{tableRows}</tbody>
			</Table>
		);
	}

	renderTabForm() {
		switch (this.state.currentTab) {
			case 1:
				return (
					<>
						<p>
							This process allows for the casting of votes in the{' '}
							<em>{this.props.ElectionDetails.electionName}</em>{' '}
							election using ethlect. Please complete this form to
							cast your vote in the election.
						</p>
						<p>
							<strong>
								Please have your physical ballot ready as you
								will need it during this process. You may now
								reveal all redacted fields on your ballot.
							</strong>
						</p>
						<p>The steps below offer a summary of the process:</p>
						<ol>
							<li>
								After you press the button below, the
								application will check to ensure that it has
								generated your personalised ballots.
							</li>
							<li>
								You will then be asked to input the ID present
								on your physical ballot, this allows the
								application to check if you are casting a vote
								with a ballot that was assigned to your account.
							</li>
							<li>
								You will be asked to input the representative
								candidate IDs of the candidates you wish to vote
								for. These IDs can be found next to each
								candidate on your physical ballot.
							</li>
							<li>
								You will finally be able to review your
								selection and cast your vote.
							</li>
						</ol>
						{this.props.ElectionDetails.electionTabulating ? (
							<Alert variant='danger'>
								This election has been terminated and is
								currently being tabulated. You may no longer
								cast your vote!
							</Alert>
						) : this.props.Session.user.idVerified === 'true' ? (
							<Button
								variant='primary'
								onClick={this.onSubmit}
								disabled={this.state.sendingRequest}
							>
								{this.state.sendingRequest
									? 'Loading...'
									: 'Continue'}
							</Button>
						) : (
							<Alert variant='danger'>
								You may not partake in this election as you have
								not verified your ID before ballots were
								generated for it.
							</Alert>
						)}
					</>
				);
			case 2:
				return (
					<>
						<p>
							Identify the ballot ID on your physical ballot and
							input it in the form below to continue. The
							application will check if the ballot ID provided is
							associated with your account.
						</p>
						{this.renderBallotIDForm()}
						<Button
							variant='primary'
							onClick={this.onSubmit}
							disabled={this.state.sendingRequest}
						>
							{this.state.sendingRequest
								? 'Loading...'
								: 'Continue'}
						</Button>
					</>
				);
			case 3:
				return (
					<>
						<p>
							Identify the candidates you wish to vote for on your
							physical ballot and input the 3-digit representative
							ID of each candidate you wish to vote for in
							preferencial order. You must vote for at least one
							candidate.
						</p>
						<p>
							<strong>
								Do not input the candidate names, only the
								3-digit IDs
							</strong>
						</p>
						{this.renderCandidateForm()}
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
								: 'Continue'}
						</Button>
					</>
				);
			case 4:
				return (
					<>
						<div className='margin-div'>
							<p>
								Review your selection of candidates displayed in
								the table below. Note that the table represents
								the representative candidate IDs of the
								candidates you selected in preferencial order.
								Please ensure once again that the candidate IDs
								match the candidates you intend to vote for.
								Also ensure that they are listed in your order
								of preference.
							</p>
							{this.renderSummaryTable()}
						</div>
						<Button
							variant='primary'
							onClick={this.onSubmit}
							disabled={
								this.state.sendingRequest ||
								this.state.verificationSuccess
							}
						>
							{this.state.verificationSuccess
								? 'Vote Cast'
								: this.state.sendingRequest
								? 'Casting...'
								: 'Cast Vote'}
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
				title: 'Start Casting Process',
				formTitle: 'Start Process',
				text: 'Cast your vote for the election. Please follow the steps in this form to cast your vote in the election.',
			},
			{
				title: 'Ballot Verification',
				formTitle: 'Verify Ballot ID',
				text: 'You must verify your ballot ID before you can cast your vote.',
			},
			{
				title: 'Candidate Selection',
				formTitle: 'Input Candidate IDs',
				text: 'Input the candidate IDs of the candidates you wish to vote for in order of preference.',
			},
			{
				title: 'Cast Vote',
				formTitle: 'Ballot Summary',
				text: 'Make sure all the inputted details are correct before casting your vote.',
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
