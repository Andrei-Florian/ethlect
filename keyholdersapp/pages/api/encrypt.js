import NodeRSA from 'node-rsa';

async function encryptMessage(_message, _publicKey) {
	try {
		const key = new NodeRSA();
		key.importKey(_publicKey, 'pkcs1-public-pem');

		const encrypted = key.encrypt(_message, 'base64');
		return { success: true, message: encrypted };
	} catch (error) {
		return { success: false };
	}
}

export default async function encrypt(req, res) {
	if (req.method === 'POST') {
		const { success, message } = await encryptMessage(
			req.body.plaintext,
			req.body.publicKey
		);

		if (success) {
			res.status(200).json({
				success: true,
				message,
			});
		} else {
			res.status(500).send({
				success: false,
				error: 'Error encrypting key',
			});
		}
	} else {
		res.status(400).json({ success: false, error: 'Bad request' });
	}
}
