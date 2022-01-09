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

	generateBallots = async () => {
		try {
			this.setState({ loading: true });
			const electionID = this.props.ElectionID;
			const fetchString = process.env.NEXT_PUBLIC_API_GENERATEBALLOTS;

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
							? 'Ballots Generated Successfully!'
							: 'There was an error generating the ballots!'}
					</Alert.Heading>
					{this.state.error === 'success' ? (
						<>
							<p>
								The ballots have been successfully generated for
								the election!
							</p>
							<Button variant='outline-dark' href='/admin'>
								Return to Admin Dashboard
							</Button>
						</>
					) : (
						<>
							<p>
								The ballot generation process errored out with
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
						<Card.Title>Generate Ballots</Card.Title>
						<Card.Text>
							<p>
								The ballot generation workflow allows for the
								generation of ballots to be used in the
								election. The application will generate two
								ballots for every registered voter, each ballot
								is tied to a specific registered voter.
							</p>
							<ol>
								<li>
									The application will create an ElGamal
									instance using the public keys and a
									generated temporary random key.
								</li>
								<li>
									Two ballots will be generated for every
									registered voter based on their constituency
									and the candidates running for said
									constituency.
								</li>
								<li>
									This data will be added to the database.
								</li>
							</ol>
							<strong>
								Note that this process will take a while
								depending on the size of the election!
							</strong>
						</Card.Text>
						{!this.props.ElectionComplete ? (
							<>
								{this.props.ElectionTabulating ? (
									<Alert variant='danger'>
										This election has been terminated and is
										currently being tabulated. You may not
										generate ballots for it.
									</Alert>
								) : (
									<Button
										variant='primary'
										className='button-margin'
										onClick={this.generateBallots}
										disabled={this.state.loading}
									>
										{this.state.loading
											? this.state.error === 'success'
												? 'Success'
												: 'Generating...'
											: 'Generate Ballots'}
									</Button>
								)}
							</>
						) : (
							<Alert variant='success'>
								This Election is Complete and ballots can no
								longer be generated for it.
							</Alert>
						)}
					</Card.Body>
				</Card>
			</>
		);
	}
}

export default GenerateBallots;
