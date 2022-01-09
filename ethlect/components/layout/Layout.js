import React from 'react';
import Header from './Header';
import Navbar from './Navbar';
import { Container } from 'react-bootstrap';
import { useSession, getSession, signIn } from 'next-auth/react';
import { Alert, Button } from 'react-bootstrap';

export async function getServerSideProps(context) {
	return {
		props: {
			session: await getSession(context),
		},
	};
}

export default function Layout(props) {
	const { data: session, status } = useSession();

	if (props.Voter || props.Admin) {
		if (props.Voter && props.Admin) {
			if (status === 'authenticated') {
				return (
					<>
						<Header Title={props.Title} />
						<Navbar SimpleNav={props.SimpleNav} />
						<Container>{props.children}</Container>
					</>
				);
			} else if (status === 'loading') {
				return <></>;
			} else {
				return (
					<>
						<Header Title={props.Title} />
						<Navbar SimpleNav={props.SimpleNav} />
						<Container>
							<div>
								<Alert variant='danger'>
									<p>
										This Page can only be viewed by signed
										in users!
									</p>
									<Button
										variant='outline-dark'
										onClick={() => signIn()}
									>
										Log In
									</Button>
								</Alert>
							</div>
						</Container>
					</>
				);
			}
		}

		const check = props.Voter ? 'voter' : 'admin';

		if (status === 'authenticated' && session.user.accountType === check) {
			return (
				<>
					<Header Title={props.Title} />
					<Navbar SimpleNav={props.SimpleNav} />
					<Container>{props.children}</Container>
				</>
			);
		} else if (status === 'loading') {
			return <></>;
		} else {
			return (
				<>
					<Header Title={props.Title} />
					<Navbar SimpleNav={props.SimpleNav} />
					<Container>
						<div>
							<Alert variant='danger'>
								<p>
									This Page can only be viewed by signed in{' '}
									{check}s!
								</p>
								<Button
									variant='outline-dark'
									onClick={() => signIn()}
								>
									{session !== null ? (
										<>Switch Account</>
									) : (
										<>Log In</>
									)}
								</Button>
							</Alert>
						</div>
					</Container>
				</>
			);
		}
	}

	return (
		<>
			<Header Title={props.Title} />
			<Navbar SimpleNav={props.SimpleNav} />
			<Container>{props.children}</Container>
		</>
	);
}
