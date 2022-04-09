import Layout from '../components/layout/Layout';
import { Component } from 'react';
import { Card, Button, Form, Row, Col, Alert, Table } from 'react-bootstrap';

class Index extends Component {
	state = {
		formValidated: false,
		constituenciesError: false,
		resultsError: false,
		sendingRequest: false,
		constituenciesFile: null,
		resultsFile: null,
		error: false,
		electionResults: null,
	};

	getFile = async (event) => {
		const file = event.target.files[0];

		if (file) {
			if (file.type === 'application/json') {
				const reader = new FileReader();

				reader.onload = async () => {
					try {
						// save json to state
						if (event.target.id === 'constituenciesFile') {
							this.setState({
								constituenciesFile: reader.result,
							});
						} else {
							this.setState({
								resultsFile: reader.result,
							});
						}
						return;
					} catch (error) {
						console.log(error);
					}
				};

				reader.readAsText(event.target.files[0]);
			}
		}

		if (event.target.id === 'constituenciesFile') {
			this.setState({ constituenciesFile: null });
		} else {
			this.setState({ resultsFile: null });
		}
	};

	validateForm = async () => {
		// ensure the files are uploaded successfully
		if (!this.state.constituenciesFile) {
			this.setState({ constituenciesError: true, formValidated: true });
		} else {
			this.setState({ constituenciesError: false, formValidated: true });
		}

		if (!this.state.resultsFile) {
			this.setState({ resultsError: true, formValidated: true });
		} else {
			this.setState({ resultsError: false, formValidated: true });
		}

		if (!this.state.constituenciesFile || !this.state.resultsFile) {
			return { success: false };
		}

		return { success: true };
	};

	sendRequest = async () => {
		try {
			this.setState({ sendingRequest: true });

			const postRequest = JSON.stringify({
				constituenciesFile: this.state.constituenciesFile,
				resultsFile: this.state.resultsFile,
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
				this.setState({ electionResults: resJSON.results });
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
		this.setState({ electionResults: null });

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

	renderOverviewCard() {
		return (
			<Card className='card'>
				<Card.Body>
					<Card.Title>Count Votes for Completed Election</Card.Title>
					<Card.Text>
						<p>
							The Vote Counting App allows for the counting of
							votes for an election. After the completion of an
							election using ethlect., the application will output
							a results dataset containing all the tabulated
							votes. This application allows for constituency
							seats to be allocated based on the tabulated votes.
						</p>
					</Card.Text>
				</Card.Body>
			</Card>
		);
	}

	renderForm() {
		return (
			<Form>
				<Form.Group
					as={Row}
					className='mb-3'
					controlId='constituenciesFile'
				>
					<Form.Label column sm={3}>
						Election Constituencies
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							type='file'
							isValid={
								this.state.formValidated &&
								!this.state.constituenciesError
							}
							isInvalid={
								this.state.formValidated &&
								this.state.constituenciesError
							}
							onChange={this.getFile}
						/>
					</Col>
				</Form.Group>
				<Form.Group as={Row} className='mb-3' controlId='resultsFile'>
					<Form.Label column sm={3}>
						Election Results
					</Form.Label>
					<Col sm={9}>
						<Form.Control
							type='file'
							isValid={
								this.state.formValidated &&
								!this.state.resultsError
							}
							isInvalid={
								this.state.formValidated &&
								this.state.resultsError
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
						? 'Counting...'
						: this.state.error === 'success'
						? 'Votes Counted'
						: 'Count Votes'}
				</Button>
			</Form>
		);
	}

	renderFormCard() {
		return (
			<Card className='card'>
				<Card.Body>
					<Card.Title>Upload Documents</Card.Title>
					<Card.Text>
						Use the form below to upload the election constituencies
						and the election results documents. These documents can
						be downloaded from the election's audit page on the
						ethlect. app.
					</Card.Text>
					{this.renderForm()}
				</Card.Body>
			</Card>
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
							? 'Ballots Counted Successfully'
							: 'Ballot Counting Failed'}
					</Alert.Heading>
					{this.state.error === 'success' ? (
						<>
							<p>
								The application successfully counted the ballots
								and determined the results!
							</p>
						</>
					) : (
						<>
							<p>
								The application failed to count the ballots and
								determine the results of the election. Please
								ensure that the correct files were uploaded and
								try again.
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

	renderCandidateList(_candidates) {
		let candidateList = '';

		for (let i = 0; i < _candidates.length; i++) {
			candidateList += _candidates[i];

			if (i !== _candidates.length - 1) {
				candidateList += ', ';
			}
		}

		return candidateList;
	}

	renderResultsTable() {
		let tableConstituencies = [];

		for (let i = 0; i < this.state.electionResults.length; i++) {
			tableConstituencies.push(
				<tr>
					<td>{this.state.electionResults[i].constituency}</td>
					<td>
						{this.state.electionResults[i].seatsCount}{' '}
						{this.state.electionResults[i].seatsCount > 1
							? 'seats'
							: 'seat'}
					</td>
					<td>
						{this.renderCandidateList(
							this.state.electionResults[i].candidates
						)}
					</td>
				</tr>
			);
		}

		return (
			<Table striped bordered hover>
				<thead>
					<tr>
						<th>Constituency</th>
						<th>Number of Seats</th>
						<th>Elected Candidates</th>
					</tr>
				</thead>
				<tbody>{tableConstituencies}</tbody>
			</Table>
		);
	}

	renderResultsCard() {
		if (this.state.electionResults) {
			return (
				<Card className='card'>
					<Card.Body>
						<Card.Title>Election Results</Card.Title>
						<Card.Text>
							The table below displays the candidates that secured
							a seat for each election constituency.
						</Card.Text>
						{this.renderResultsTable()}
					</Card.Body>
				</Card>
			);
		}
	}

	render() {
		return (
			<Layout Title='Vote Counting App'>
				<>
					<h1>Vote Counting App</h1>
					{this.renderAlert()}
					{this.renderOverviewCard()}
					{this.renderFormCard()}
					{this.renderResultsCard()}
				</>
			</Layout>
		);
	}
}

export default Index;
