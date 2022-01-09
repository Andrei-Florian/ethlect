import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';

export default function Navigation() {
	return (
		<Navbar
			collapseOnSelect
			expand='lg'
			bg='light'
			variant='light'
			id='navbar'
		>
			<Container>
				<Navbar.Brand href='/'>keyholders app.</Navbar.Brand>
				<Navbar className='justify-content-end'>
					<Nav className='me-auto'>
						<Nav.Link href='/create'>Create Keypair</Nav.Link>
						<Nav.Link href='/encrypt'>Encrypt</Nav.Link>
						<Nav.Link href='/decrypt'>Decrypt</Nav.Link>
					</Nav>
				</Navbar>
			</Container>
		</Navbar>
	);
}
