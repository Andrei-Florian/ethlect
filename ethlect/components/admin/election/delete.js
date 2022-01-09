import { Component } from 'react';
import { Button, Card, Alert } from 'react-bootstrap';
import Router from 'next/router';

class Delete extends Component {
	state = {
		loading: false,
		error: false,
	};

	deleteElection = async (event) => {
		try {
			event.preventDefault();
			this.setState({ loading: true });

			// get the electionID
			const electionID = this.props.ElectionID;

			// call the API route to delete the election
			const postRequest = JSON.stringify({
				electionID,
			});

			// send the request
			const res = await fetch(
				process.env.NEXT_PUBLIC_API_DELETEELECTION,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
					},
					body: postRequest,
				}
			);

			const resJSON = await res.json();

			if (resJSON.success) {
				// refresh the page
				Router.push(`/admin`);
			} else {
				this.setState({ error: true, loading: false });
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
					variant='danger'
					onClose={() => this.setState({ error: false })}
					dismissible
				>
					<Alert.Heading>
						There was an error deleting the election
					</Alert.Heading>
					<p>Please wait a few moments and try again.</p>
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
							Are you Sure you Want to Delete this Election?
						</Card.Title>
						<Card.Text>
							By pressing the delete button below, the election
							and all associated data will be forever erased from
							the database.
						</Card.Text>
						<Button
							variant='danger'
							className='button-margin'
							onClick={this.deleteElection}
							disabled={this.state.loading}
						>
							{this.state.loading
								? 'Deleting Election...'
								: 'Delete Election'}
						</Button>
					</Card.Body>
				</Card>
			</>
		);
	}
}

export default Delete;
