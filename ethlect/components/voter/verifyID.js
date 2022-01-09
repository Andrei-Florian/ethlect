import { Component } from 'react';
import { Button, Card, Alert } from 'react-bootstrap';
import Router from 'next/router';
import { loadStripe } from '@stripe/stripe-js';

class VerifyIdentity extends Component {
	state = {
		stripe: null,
		loading: false,
		error: false,
	};

	async componentDidMount() {
		this.setState({ stripe: await this.props.stripePromise });
	}

	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
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
						There was an error with the verification request!
					</Alert.Heading>
					<p>
						Try refreshing the page and trying again. The error is
						displayed below:
					</p>
					<strong>Error: {this.state.error}</strong>
				</Alert>
			);
		}
	}

	handleClick = async (event) => {
		try {
			event.preventDefault();
			this.setState({ loading: true });

			const { stripe } = this.state;

			if (!stripe) {
				return;
			}

			const response = await fetch('/api/register/stripeSession', {
				method: 'GET',
			});

			const session = await response.json();

			if (session.success) {
				// Show the verification modal.
				const status = await stripe.verifyIdentity(
					session.clientSecret
				);

				if (status.error) {
					this.setState({ error: status.error.code, loading: false });
				} else {
					await this.delay(2000);
					Router.reload();
				}
			} else {
				this.setState({ error: session.error });
			}
		} catch (error) {
			this.setState({ error: 'Unknown Error', loading: false });
		}
	};

	render() {
		return (
			<>
				{this.renderAlert()}
				<Card className='create-tab-card'>
					<Card.Body>
						<Card.Title>
							Provide ID and Matching Motion Selfie to Verify
							Identity
						</Card.Title>
						<Card.Text>
							<p>
								ethlect. requires voters to verify their
								identity before being able to cast votes in
								elections. Please note that you must verify your
								identity before the election starts otherwise
								ballots will not be generated for your account.
							</p>
							<p>
								<strong>
									ethlect. partnered with Stripe Identity to
									process and verify identity documents. This
									process is outlined below:
								</strong>
							</p>
							<ol>
								<li>
									After pressing the verify button below, the
									application will launch you to the Stripe
									Identity Portal
								</li>
								<li>
									You will be asked to provide a photo of your
									passport and allow the identity service to
									take multiple selfies.
								</li>
								<li>
									Stripe will attempt to match the document
									provided with the selfies. This process can
									take a couple of minutes.
								</li>
								<li>
									You will see the processing status of the
									documents provided when logged into the
									application.
								</li>
							</ol>
						</Card.Text>
						{this.props.Session.user.idVerified === 'true' ? (
							<Alert variant='success'>
								<p>
									You have successfully verified your
									identity!
								</p>
								<Button
									variant='outline-dark'
									className='button-margin'
									href='/'
								>
									Return Home
								</Button>
							</Alert>
						) : this.props.Session.user.idVerified === 'pending' ? (
							<Alert variant='warning'>
								<p>
									The documents you provided to verify your
									identity are still being processed by
									Stripe. Please wait a few minutes and then
									refresh the page.
								</p>
								<Button
									variant='outline-dark'
									className='button-margin'
									onClick={Router.reload}
								>
									Refresh
								</Button>
							</Alert>
						) : this.props.Session.user.idVerified ===
						  'rejected' ? (
							<>
								<p>
									<Alert variant='danger'>
										Stripe failed to verify your identity
										based on the provided documents. Please
										try verifying again.
									</Alert>
								</p>
								<Button
									variant='primary'
									className='button-margin'
									onClick={this.handleClick}
									disabled={
										this.state.loading || !this.state.stripe
									}
								>
									{this.state.loading
										? 'Verifying...'
										: !this.state.stripe
										? 'Loading Stripe...'
										: 'Verify Identity'}
								</Button>
							</>
						) : (
							<Button
								variant='primary'
								className='button-margin'
								onClick={this.handleClick}
								disabled={
									this.state.loading || !this.state.stripe
								}
							>
								{this.state.loading
									? 'Verifying...'
									: !this.state.stripe
									? 'Loading Stripe...'
									: 'Verify Identity'}
							</Button>
						)}
					</Card.Body>
				</Card>
			</>
		);
	}
}

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PROMISE);

const App = (props) => {
	return (
		<VerifyIdentity stripePromise={stripePromise} Session={props.Session} />
	);
};

export default App;
