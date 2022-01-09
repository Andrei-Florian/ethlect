import { Component } from 'react';
import { Card, Button, Alert, Table, Row, Col } from 'react-bootstrap';

class Details extends Component {
	renderSections() {
		const sectionDetails = [
			{
				title: 'The First E2E Voting System for PR-STV Elections',
				details:
					'ethlect. is the first application to provide an end-to-end, fully verifiable internet voting solution for proportional representation elections. The system implements novel cryptographic techniques to assure the security, auditability and transparency of the voting process.',
				image: 'home1',
			},
			{
				title: 'Register in Seconds and Cast Your Vote Online from Anywhere',
				details:
					'ethlect. is integrated with the Dublin Voter Registry and Stripe Identity to allow for registered voters to onboard and start using the system in seconds. The voter can cast their vote from anywhere, in a matter of minutes using the website.',
				image: 'home2',
			},
			{
				title: 'Verify and Track Your Vote',
				details:
					'ethlect. employes multiple security layers to ensure voter anonymity and third party auditability of the system. All ballots can be verified and traced throughout the system to ensure integrity while maintaining voter anonymity.',
				image: 'home3',
			},
		];

		let sections = [];

		for (let i = 0; i < sectionDetails.length; i++) {
			sections[i] = (
				<>
					<Row
						style={{
							'flex-direction': i % 2 ? 'row' : 'row-reverse',
						}}
						className='home-section'
					>
						<Col className='home-section-img-section' md={4}>
							<div className='home-section-img-wrap'>
								<img
									className='home-section-img'
									src={`/images/${sectionDetails[i].image}.png`}
								></img>
							</div>
						</Col>
						<Col className='home-section-text'>
							<div>
								<h3 className='home-h3'>
									{sectionDetails[i].title}
								</h3>
								<p className='home-text'>
									{sectionDetails[i].details}
								</p>
							</div>
						</Col>
					</Row>
				</>
			);
		}

		return sections;
	}

	render() {
		return <>{this.renderSections()}</>;
	}
}

export default Details;
