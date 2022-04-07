import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

let credentials = {
	username: {
		label: 'Email',
		type: 'email',
		placeholder: 'jsmith',
	},
	password: {
		label: 'Password',
		type: 'password',
		placeholder: '*********',
	},
};

if (process.env.NEXT_PUBLIC_ENABLE_2FA == 'true') {
	credentials += {
		token: {
			label: '2FA Token',
			type: 'number',
			placeholder: '021810',
		},
	};
}

export default NextAuth({
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: credentials,

			async authorize(credentials) {
				const fetchString = process.env.API_AUTH_ENDPOINT;
				const res = await fetch(fetchString, {
					method: 'POST',
					body: JSON.stringify(credentials),
					headers: { 'Content-Type': 'application/json' },
				});

				const resJSON = await res.json();

				if (res.ok && resJSON.success && resJSON.user) {
					return resJSON.user;
				}

				return null;
			},
		}),
	],
	session: { jwt: true, maxAge: 60 * 30 }, // 30 minute session
	callbacks: {
		async session({ session, token }) {
			session.user = token.user;
			return session;
		},
		async jwt({ token, user }) {
			if (!token.user) {
				token.user = user;
			}

			try {
				if (token.user.accountType === 'voter') {
					const fetchString = process.env.API_AUTH_UPDATE;
					const res = await fetch(fetchString, {
						method: 'POST',
						body: JSON.stringify(token.user.userID),
						headers: { 'Content-Type': 'application/json' },
					});

					const resJSON = await res.json();

					if (resJSON.success) {
						token.user.idVerified = resJSON.idVerified;
					}
				}
			} catch (error) {
				console.log(`[ERROR] @NextAuth: `, error);
			}

			return token;
		},
	},
	pages: {
		signIn: '/login',
	},
	secret: process.env.JWT_SECRET,
});
