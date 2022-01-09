import https from 'https';

async function checkRegister(_firstName, _lastName, _eircode) {
	try {
		// send the api request to the register open API here
		const fetchString = `https://www.voter.ie/api/search/name/${_firstName}/surname/${_lastName}/eircode/${_eircode}/lang/en`;

		// send the request
		const res = await fetch(fetchString, {
			method: 'GET',
			agent: new https.Agent({
				rejectUnauthorized: false,
			}),
		});

		const resJSON = await res.json();

		if (resJSON.results !== null) {
			return { success: true, match: true, data: resJSON.results[0] };
		} else {
			return { success: true, match: false };
		}
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function checkTheRegister(req, res) {
	if (req.method === 'POST') {
		const data = req.body;

		const check = await checkRegister(
			data.firstName,
			data.lastName,
			data.eircode
		);

		if (check.success) {
			res.status(200).json({
				success: true,
				match: check.match,
				data: check.data,
			});
		} else {
			res.status(500).json({
				success: false,
				error: 'Error calling registry external API',
			});
		}
	} else {
		res.status(400).json({ success: false, error: 'Bad request' });
	}
}
