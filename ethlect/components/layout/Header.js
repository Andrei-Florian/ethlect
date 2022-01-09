import React from 'react';
import Head from 'next/head';

export default function Header(props) {
	return (
		<Head>
			<meta charset='UTF-8' />
			<meta httpEquiv='X-UA-Compatible' content='IE=edge' />
			<meta
				name='viewport'
				content='width=device-width, initial-scale=1.0, maximum-scale=1'
			/>
			<meta
				name='viewport'
				id='viewport'
				content='width=device-width, height=device-height, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
			/>
			<title>{props.Title}</title>
		</Head>
	);
}
