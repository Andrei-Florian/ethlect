import React from 'react';
import Header from './Header';
import Navbar from './Navbar';
import { Container } from 'react-bootstrap';

export default function Layout(props) {
	return (
		<>
			<Header Title={props.Title} />
			<Navbar />
			<Container>{props.children}</Container>
		</>
	);
}
