import React from 'react';
import { Navbar, Container } from 'react-bootstrap';

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
				<Navbar.Brand href='/'>vote counter.</Navbar.Brand>
			</Container>
		</Navbar>
	);
}
