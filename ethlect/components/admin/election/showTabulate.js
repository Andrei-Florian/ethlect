import { Component } from 'react';
import { Button, Card, Alert, Table } from 'react-bootstrap';
import Router from 'next/router';

class ShowTabulate extends Component {
	state = {
		loading: false,
		error: false,
	};

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
		} ${date.getFullYear()} at ${
			date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
		}:${
			date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
		}`;
	}

	renderAlert() {
		if (this.state.error) {
			return (
				<Alert
					variant='danger'
					onClose={() => this.setState({ error: false })}
					dismissible
				>
					<Alert.Heading>
						There was an error with the request!
					</Alert.Heading>
					<>
						<p>
							The application encountered an error while
							performing the request. Please try again later. The
							error is displayed below:
						</p>
						<p>
							<strong>{this.state.error}</strong>
						</p>
					</>
				</Alert>
			);
		}
	}

	handleApprove = async (event) => {
		try {
			event.preventDefault();

			// get the shuffle ID
			const shuffleID = event.target.id.split('')[16];

			// get the election ID
			const electionID =
				this.props.Props.props.electionDetails.electionID;

			// prepare the request
			const fetchString = process.env.NEXT_PUBLIC_API_VALIDATESHUFFLE;

			const postRequest = JSON.stringify({
				electionID: electionID,
				shuffleID: parseInt(shuffleID),
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
				Router.reload();
			} else {
				this.setState({ error: resJSON.error });
			}
		} catch (error) {
			console.log(error);
			this.setState({ error: 'Unknown Error' });
		}
	};

	handleReject = async (event) => {
		try {
			event.preventDefault();

			// get the shuffle ID
			const shuffleID = event.target.id.split('')[15];

			// get the election ID
			const electionID =
				this.props.Props.props.electionDetails.electionID;

			// prepare the request
			const fetchString = process.env.NEXT_PUBLIC_API_DELETESHUFFLE;

			const postRequest = JSON.stringify({
				electionID: electionID,
				shuffleID: parseInt(shuffleID),
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
				Router.reload();
			} else {
				this.setState({ error: resJSON.error });
			}
		} catch (error) {
			console.log(error);
			this.setState({ error: 'Unknown Error' });
		}
	};

	renderOverviewCard() {
		return (
			<Card className='create-tab-card'>
				<Card.Body>
					<Card.Title>Overview</Card.Title>
					<Card.Text>
						The election tabulation process has been successfully
						initiated and all cast ballots are destructured and
						stored in the shuffle database. This page allows the
						admin to interact with the tabulation of the election.
					</Card.Text>
				</Card.Body>
			</Card>
		);
	}

	renderShuffleCards() {
		let cards = [];
		const shuffles = this.props.Props.props.electionDetails.shuffles;

		for (let i = 0; i < shuffles.length; i++) {
			if (shuffles[i].shuffleType === 'shuffle') {
				cards.push(
					<Card className='create-tab-card'>
						<Card.Body>
							<Card.Title>
								Shuffle {shuffles[i].shuffleID}
							</Card.Title>
							<Card.Text>
								<p>
									This shuffle represents a re-encryption of
									all candidate IDs in each ballot and a
									repermutation of the ballot set.
								</p>
							</Card.Text>
							{this.renderAlert()}
							{!shuffles[i].approved ? (
								<Alert variant='warning'>
									<p>
										You have not approved nor rejected this
										shuffle. Please chose to either approve
										or reject this shuffle to be able to
										create another shuffle and decrypt the
										votes. Note that if you reject the
										shuffle, it will be deleted.
									</p>
									<Button
										variant='outline-success'
										size='sm'
										className='button-margin'
										id={`approve-shuffle-${shuffles[i].shuffleID}`}
										onClick={this.handleApprove}
									>
										Approve
									</Button>
									<Button
										variant='outline-danger'
										size='sm'
										className='button-margin'
										id={`reject-shuffle-${shuffles[i].shuffleID}`}
										onClick={this.handleReject}
									>
										Reject
									</Button>
								</Alert>
							) : (
								<Alert variant='success'>
									This shuffle has been approved and is
									included in the chain of shuffles for the
									election.
								</Alert>
							)}
							<Table striped bordered hover>
								<tbody>
									<tr>
										<td>Shuffle ID</td>
										<td>{shuffles[i].shuffleID}</td>
									</tr>
									<tr>
										<td>Shuffle Approved</td>
										<td>
											{shuffles[i].approved
												? 'Yes'
												: 'No'}
										</td>
									</tr>
									<tr>
										<td>Number of Ballots</td>
										<td>
											{
												JSON.parse(
													shuffles[i].outputBallots
												).length
											}
										</td>
									</tr>
									<tr>
										<td>Date of Shuffle</td>
										<td>
											{this.returnReadableDate(
												shuffles[i].timestamp
											)}
										</td>
									</tr>
								</tbody>
							</Table>
						</Card.Body>
					</Card>
				);
			}
		}

		return cards;
	}

	renderMixCard() {
		return (
			<Card className='create-tab-card'>
				<Card.Header>Shuffles</Card.Header>
				<Card.Body>
					<Card.Title>Overview</Card.Title>
					<Card.Text>
						<ul>
							<li>
								The admin can create a cryptographic shuffle of
								the ballots. This is a long process that
								involves the re-encryption of all candidate IDs
								in each ballot in the set.
							</li>
							<li>
								This process allows for the loss of relation
								between the ballots and the voters that cast
								them. All shuffles are accompanied by an
								interactive proof that proves that the shuffle
								was performed correctly.
							</li>
							<li>
								The admin can verify the proof through the
								application or a third party service if they
								wish.
							</li>
							<li>
								<strong>
									Note that all shuffles must be approved or
									rejected by the admin before shuffling again
								</strong>
							</li>
						</ul>
					</Card.Text>
					{this.renderShuffleCards()}
					{!this.props.Props.props.electionDetails
						.electionComplete ? (
						<Card className='create-tab-card'>
							<Card.Body>
								<Card.Title>New Shuffle</Card.Title>
								<Card.Text>
									Create a new shuffle of the ballots in the
									last approved shuffle.
								</Card.Text>
								<Button
									variant='primary'
									className='button-margin'
									disabled={
										!this.props.Props.props.electionDetails.shuffles.at(
											-1
										).approved
									}
									href={`/admin/${this.props.Props.props.electionDetails.electionID}/tabulate/shuffle`}
								>
									New Shuffle
								</Button>
							</Card.Body>
						</Card>
					) : (
						''
					)}
				</Card.Body>
			</Card>
		);
	}

	renderDecryptionCard() {
		const shuffles = this.props.Props.props.electionDetails.shuffles;

		return (
			<Card className='create-tab-card'>
				<Card.Header>Decryption</Card.Header>
				<Card.Body>
					<Card.Title>Overview</Card.Title>
					<Card.Text>
						<ul>
							<li>
								The admin can decrypt the last approved shuffle
								by pressing the button below. The decrypted
								ballots will be available for download after
								decryption.
							</li>
							<li>
								<strong>
									The ballots must have been shuffled at least
									once to be able to decrypt them.
								</strong>
							</li>
						</ul>
					</Card.Text>
					{!this.props.Props.props.electionDetails
						.electionComplete ? (
						<>
							{!(
								this.props.Props.props.electionDetails.shuffles.at(
									-1
								).approved &&
								this.props.Props.props.electionDetails.shuffles.at(
									-1
								).shuffleType === 'shuffle'
							) ? (
								<Alert variant='danger'>
									You must complete at least one shuffle and
									validate it before decrypting ballots!
								</Alert>
							) : (
								''
							)}
							<Button
								variant='primary'
								className='button-margin'
								href={`/admin/${this.props.Props.props.electionDetails.electionID}/tabulate/decrypt`}
								disabled={
									!(
										this.props.Props.props.electionDetails.shuffles.at(
											-1
										).approved &&
										this.props.Props.props.electionDetails.shuffles.at(
											-1
										).shuffleType === 'shuffle'
									)
								}
							>
								Decrypt Ballots
							</Button>
						</>
					) : (
						<>
							<Alert variant='success'>
								The ballots have been decrypted and the election
								is now complete. Use the buttons below to access
								the ballots.
							</Alert>
							<Table striped bordered hover>
								<tbody>
									<tr>
										<td>Shuffle ID</td>
										<td>{shuffles.at(-1).shuffleID}</td>
									</tr>
									<tr>
										<td>Decryption Approved</td>
										<td>Yes</td>
									</tr>
									<tr>
										<td>Number of Ballots</td>
										<td>
											{
												JSON.parse(
													shuffles.at(-1)
														.outputBallots
												).length
											}
										</td>
									</tr>
									<tr>
										<td>Date of Decryption</td>
										<td>
											{this.returnReadableDate(
												shuffles.at(-1).timestamp
											)}
										</td>
									</tr>
								</tbody>
							</Table>
						</>
					)}
				</Card.Body>
			</Card>
		);
	}

	renderAuditCard() {
		return (
			<Card className='create-tab-card'>
				<Card.Header>Auditing</Card.Header>
				<Card.Body>
					<Card.Title>Overview</Card.Title>
					<Card.Text>
						<ul>
							<li>
								All stages of the tabulation process are made
								public together with the proof generated by
								these workflows.
							</li>
							<li>
								You can access and download all these documents
								at the election audit link.
							</li>
						</ul>
					</Card.Text>
					<Button
						variant='dark'
						className='button-margin'
						href={`/${this.props.Props.props.electionDetails.electionID}/audit`}
					>
						Audit Election
					</Button>
				</Card.Body>
			</Card>
		);
	}

	renderDecryptionAlert() {
		if (this.props.Props.props.electionDetails.electionComplete) {
			return (
				<Alert variant='success'>
					The ballots have been decrypted and the election is now
					complete!
				</Alert>
			);
		}
	}

	render() {
		return (
			<>
				{this.renderDecryptionAlert()}
				{this.renderOverviewCard()}
				{this.renderMixCard()}
				{this.renderDecryptionCard()}
				{this.renderAuditCard()}
			</>
		);
	}
}

export default ShowTabulate;
