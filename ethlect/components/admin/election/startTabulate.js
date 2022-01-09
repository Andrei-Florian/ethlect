import { Component } from 'react';
import { Button, Card, Alert } from 'react-bootstrap';

class StartTabulate extends Component {
	state = {
		loading: false,
		error: false,
	};

	start = async (event) => {
		try {
			event.preventDefault();
			this.setState({ loading: true });

			// get the electionID
			const electionID =
				this.props.Props.props.electionDetails.electionID;

			// call the API route to delete the election
			const postRequest = JSON.stringify({
				electionID,
			});

			// send the request
			const res = await fetch(
				process.env.NEXT_PUBLIC_API_STARTTABULATION,
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
					error: 'success',
				});
			} else {
				this.setState({ error: true, loading: false });
			}
		} catch (error) {
			console.log(error);
			this.setState({ error: 'Unknown Error', loading: false });
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
							? 'Election Tabulation Started!'
							: 'There was an error starting the tabulation process!'}
					</Alert.Heading>
					{this.state.error === 'success' ? (
						<>
							<p>
								The election has successfully been marked for
								tabulation. Please refresh the page to see the
								tabulation options.
							</p>
							<Button
								variant='outline-dark'
								href={`/admin/${this.props.Props.props.electionDetails.electionID}/tabulate`}
							>
								Refresh
							</Button>
						</>
					) : (
						<>
							<p>
								The application encountered an error while
								terminating the election and marking it for
								tabulation:
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
							Start Tabulation for{' '}
							{
								this.props.Props.props.electionDetails
									.electionName
							}
						</Card.Title>
						<Card.Text>
							<p>
								The admin can terminate the election and start
								the election tabulation process. This is a long
								process that allows for the ballots cast in the
								election to be shuffled cryptographically and
								then decrypted to extract the votes cast.
							</p>
							<p>
								<strong>
									Note that once the election is marked for
									tabulation, ballots can no longer be
									generated and voters will no longer be able
									to cast their votes.
								</strong>
							</p>
						</Card.Text>
						<Button
							variant='primary'
							className='button-margin'
							onClick={this.start}
							disabled={this.state.loading}
						>
							{this.state.loading
								? this.state.error === 'success'
									? 'Success'
									: 'Starting...'
								: 'Start Tabulation'}
						</Button>
					</Card.Body>
				</Card>
			</>
		);
	}
}

export default StartTabulate;
