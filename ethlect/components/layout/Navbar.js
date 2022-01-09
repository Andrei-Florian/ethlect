import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { useSession, signIn, signOut, getSession } from 'next-auth/react';
import { Button, Alert } from 'react-bootstrap';
import Router from 'next/router';

export default function Navigation(props) {
	const { data: session, status } = useSession();
	const loading = status === 'loading';

	return (
		<>
			<Navbar
				collapseOnSelect
				expand='lg'
				bg='light'
				variant='light'
				id='navbar'
			>
				<Container>
					<Navbar.Brand href='/'>ethlect.</Navbar.Brand>
					{session &&
					!loading &&
					session.user.accountType === 'admin' ? (
						<Nav className='me-auto'>
							<Nav.Link href='/admin'>Dashboard</Nav.Link>
						</Nav>
					) : (
						''
					)}
					<Navbar className='justify-content-end'>
						{props.SimpleNav ? (
							<>
								<Navbar.Text id='navbar-text'>
									by Andrei Florian
								</Navbar.Text>
							</>
						) : session && !loading ? (
							<>
								<Navbar.Text id='navbar-text'>
									Logged in as {session.user.accountType}:{' '}
									{session.user.email}{' '}
									{session.user.idVerified === 'true' ? (
										<img
											src='/images/check.svg'
											className='check-icon'
										/>
									) : (
										''
									)}
								</Navbar.Text>
								<Navbar.Text>
									<Button
										variant='dark'
										onClick={() => signOut()}
									>
										Log out
									</Button>
								</Navbar.Text>
							</>
						) : (
							<>
								<Button
									variant='dark'
									href='/register'
									style={{ marginRight: 10 + 'px' }}
								>
									Register
								</Button>
								<Navbar.Text id='navbar-text'>
									<Button
										variant='dark'
										onClick={() => signIn()}
									>
										Log In
									</Button>
								</Navbar.Text>
							</>
						)}
					</Navbar>
				</Container>
			</Navbar>
			<Container>
				{session &&
				!loading &&
				session.user.accountType === 'voter' &&
				Router.pathname !== '/verifyID' &&
				Router.pathname !== '/login' &&
				Router.pathname !== '/register' ? (
					session.user.idVerified === 'false' ? (
						<Alert variant='danger'>
							<Alert.Heading>Please Verify your ID</Alert.Heading>
							<p>
								You must provide a valid proof of ID and motion
								selfie to be eligible to interact with
								elections. Please use the button below to
								provide the needed information.
							</p>
							<Button variant='outline-dark' href='/verifyID'>
								Provide Proof of ID
							</Button>
						</Alert>
					) : session.user.idVerified === 'pending' ? (
						<Alert variant='warning'>
							<Alert.Heading>
								Your ID is being Verified
							</Alert.Heading>
							<p>
								Your proof of ID has been submitted successfully
								and is currently being processed. Please wait a
								few minutes and refresh the page.
							</p>
						</Alert>
					) : session.user.idVerified === 'rejected' ? (
						<Alert variant='danger'>
							<Alert.Heading>
								ID Verification Failed
							</Alert.Heading>
							<p>
								The application was not able to verify your
								identity successfully through Stripe Identity.
								Please try again by pressing the button below.
							</p>
							<Button variant='outline-dark' href='/verifyID'>
								Retry Proof of ID
							</Button>
						</Alert>
					) : (
						''
					)
				) : (
					''
				)}
			</Container>
		</>
	);
}
