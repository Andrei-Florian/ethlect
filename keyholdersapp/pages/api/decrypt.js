import NodeRSA from 'node-rsa';

async function decryptMessage(_message, _privateKey) {
	try {
		const key = new NodeRSA();
		key.importKey(_privateKey, 'pkcs1-private-pem');

		const decrypted = key.decrypt(_message, 'ascii');
		return { success: true, message: decrypted };
	} catch (error) {
		return { success: false };
	}
}

export default async function encrypt(req, res) {
	if (req.method === 'POST') {
		const { success, message } = await decryptMessage(
			req.body.ciphertext,
			req.body.privateKey
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
