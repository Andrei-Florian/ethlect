import NodeRSA from 'node-rsa';

async function generateRSAKeypair() {
	try {
		const key = new NodeRSA({ b: 512 });
		const privateKey = key.exportKey('pkcs1-private-pem');
		const publicKey = key.exportKey('pkcs1-public-pem');

		return { success: true, privateKey, publicKey };
	} catch (error) {
		console.log(error);
		return { success: false };
	}
}

export default async function create(req, res) {
	if (req.method === 'GET') {
		const { success, privateKey, publicKey } = await generateRSAKeypair();

		if (success) {
			res.status(200).json({
				success: true,
				privateKey,
				publicKey,
			});
		} else {
			res.status(500).send({
				success: false,
				error: 'Error generating RSA keypair',
			});
		}
	} else {
		res.status(400).json({ success: false, error: 'Bad request' });
	}
}
