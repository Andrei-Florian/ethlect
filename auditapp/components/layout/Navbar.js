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
				<Navbar.Brand href='/'>audit app.</Navbar.Brand>
			</Container>
		</Navbar>
	);
}
