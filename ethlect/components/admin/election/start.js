import { Component } from 'react';
import { Button, Card, Alert } from 'react-bootstrap';

class Delete extends Component {
	state = {
		loading: false,
		error: false,
		returnedAction: null,
	};

	startElection = async (event) => {
		try {
			event.preventDefault();
			this.setState({ loading: true, error: false });

			// get the electionID
			const electionID = this.props.ElectionDetails.electionID;

			// call the API route
			const postRequest = JSON.stringify({
				electionID,
			});

			// send the request
			const res = await fetch(process.env.NEXT_PUBLIC_API_STARTELECTION, {
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
					returnedAction: resJSON.electionAction,
				});
			} else {
				this.setState({
					error: true,
					loading: false,
					returnedAction: resJSON.electionAction,
				});
			}
		} catch (error) {
			console.log(error);
			this.setState({ error: true, loading: false });
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
							? `Electoral Period ${
									this.state.returnedAction
										? 'Started'
										: 'Ended'
							  }`
							: `There was an error ${
									this.state.returnedAction
										? 'starting'
										: 'ending'
							  } the election!`}
					</Alert.Heading>
					{this.state.error === 'success' ? (
						<>
							<p>
								The Electoral Period has been{' '}
								{this.state.returnedAction
									? 'started'
									: 'ended'}{' '}
								successfully!
							</p>
							<Button variant='outline-dark' href='/admin'>
								Return to Admin Dashboard
							</Button>
						</>
					) : (
						<>
							<p>
								The process errored out! Please wait a few
								moments and try again.
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
							{this.props.Action == 'false' ? 'Start' : 'End'} the
							Electoral Period
						</Card.Title>
						<Card.Text>
							{this.props.Action == 'false' ? (
								<>
									Press the button below to start the
									electoral period for the election. This
									allows voters for whom ballots were
									generated to cast their ballot in the
									election
								</>
							) : (
								<>
									Press the button below to end the electoral
									period for the election. This will prevent
									voters from casting their ballots in the
									election. Note that you may restart the
									electoral period after ending it if you
									wish.
								</>
							)}
						</Card.Text>
						{!this.props.ElectionDetails.electionComplete ? (
							<>
								{this.props.ElectionDetails
									.electionTabulating ? (
									<Alert variant='danger'>
										This election has been terminated and is
										currently being tabulated. You may not
										start or end the election.
									</Alert>
								) : (
									<Button
										variant='primary'
										className='button-margin'
										onClick={this.startElection}
										disabled={this.state.loading}
									>
										{this.props.Action == 'false'
											? 'Start'
											: 'End'}
										{this.state.loading
											? this.state.error === 'success'
												? ' Success'
												: 'ing...'
											: ' Electoral Period'}
									</Button>
								)}
							</>
						) : (
							<Alert variant='success'>
								This Election is Complete and its state can no
								longer be edited.
							</Alert>
						)}
					</Card.Body>
				</Card>
			</>
		);
	}
}

export default Delete;
