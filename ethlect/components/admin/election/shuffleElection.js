import { Component } from 'react';
import { Button, Card, Alert } from 'react-bootstrap';

class GenerateBallots extends Component {
	state = {
		loading: false,
		error: false,
	};

	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	shuffleBallots = async () => {
		try {
			this.setState({ loading: true });
			const electionID = this.props.ElectionDetails.electionID;
			const fetchString = process.env.NEXT_PUBLIC_API_SHUFFLE;

			const postRequest = JSON.stringify({
				electionID: electionID,
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
					error: 'success',
				});
				return { success: true };
			} else {
				this.setState({
					error: resJSON.error,
					loading: false,
				});
				return { success: false };
			}
		} catch (error) {
			console.log(error);
			this.setState({
				error: 'Unknown Error',
				loading: false,
			});
			return { success: false };
		}
	};

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
							? 'Ballots Shuffled Successfully!'
							: 'There was an error shuffling the ballots!'}
					</Alert.Heading>
					{this.state.error === 'success' ? (
						<>
							<p>
								The ballots have been successfully shuffled for
								the election!
							</p>
							<Button
								variant='outline-dark'
								href={`/admin/${this.props.ElectionDetails.electionID}/tabulate`}
							>
								Return to Election Tabulation Page
							</Button>
						</>
					) : (
						<>
							<p>
								The ballot shuffling process errored out with
								the following error:
							</p>
							<p>
								<strong>{this.state.error}</strong>
							</p>
						</>
					)}
				</Alert>
			);
		}
	}

	render() {
		return (
			<>
				{this.renderAlert()}
				<Card className='create-tab-card'>
					<Card.Body>
						<Card.Title>
							Create Shuffle{' '}
							{this.props.ElectionDetails.shuffles.length + 1}
						</Card.Title>
						<Card.Text>
							<p>
								Shuffling the ballots cast is an essential
								prossess of the application. This allows for the
								relationship between the ballot and the voter
								that cast the ballot to be lost which is
								essential in the ensurance of voter anonymity.
							</p>
							<ol>
								<li>
									The application will re-encrypt all
									candidates of all ballots cast in the
									election.
								</li>
								<li>
									The application will then repermute the
									ballots in a random fashion.
								</li>
								<li>
									The application will finally use zero
									knowledge interactive proof to prove that
									the shuffle was performed correctly.
								</li>
								<li>
									All this data will then be stored in the
									election database and made public to allow
									for the auditability of the shuffle.
								</li>
							</ol>
							<strong>
								Note that this process will take a while
								depending on the size of the election!
							</strong>
						</Card.Text>
						{!this.props.ElectionDetails.electionComplete ? (
							<>
								{!this.props.ElectionDetails.shuffles.at(-1)
									.approved ? (
									<Alert variant='danger'>
										You may not create a new shuffle until
										the previous shuffle was approved.
										Please return to the election tabulation
										page and approve or reject the previous
										shuffle.
									</Alert>
								) : (
									<Button
										variant='primary'
										className='button-margin'
										onClick={this.shuffleBallots}
										disabled={this.state.loading}
									>
										{this.state.loading
											? this.state.error === 'success'
												? 'Success'
												: 'Shuffling...'
											: 'Shuffle Ballots'}
									</Button>
								)}
							</>
						) : (
							<Alert variant='success'>
								The ballots have been decrypted and the election
								is now complete! You can no longer shuffle the
								ballots.
							</Alert>
						)}
					</Card.Body>
				</Card>
			</>
		);
	}
}

export default GenerateBallots;
