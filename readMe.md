# Abstract

<p align="center">
    <img src="./resources/image1.png" alt="ethlect." width="500" style=/>
</p>

ethlect. is the first end-to-end verifiable, internet voting application for elections run using the PR-STV model.

ethlect. is an end-to-end verifiable, internet voting system that employs a hybrid approach to remote voting and various cryptographic techniques guaranteeing complete transparency and auditability while ensuring the secret ballot.

The system employs code voting for the marking of ballots: the electoral authority verifiably generates and distributes physical ballots via mail to voters. Ballots consist of the candidates a voter can vote for and a three-digit numeric representing each candidate.

Upon the receipt of a ballot, a voter can log into the ethlect. application on their personal computing device and cast their ballot digitally by inputting the unique ID of the ballot and the codes representing each candidate they wish to vote for in order of preference.

The implementing of code voting circumvents the unavoidable security vulnerabilities in voter hardware such that an attacker cannot modify a ballot with intent nor compromise voter anonymity by monitoring voter selections.

The application allows voters to verify that their vote was recorded as intended without compromising their anonymity. Once a vote is recorded in the system, a series of verifiable cryptographic processes and shuffles anonymise ballots while allowing for the independent auditing of the election to ensure its integrity at all stages.

ethlect. is designed specifically for the Irish Electoral System running on PR-STV but can be easily adjusted to fit other systems such as first-past-the-post.

The application’s integration with the Dublin Voter Registry and the Stripe Identity service allows for the digital onboarding of registered voters in seconds.

# Repository Structure

This repository centralises all public documents, code and tests related to ethlect. The table below gives a high-level overview of the repo's structure.

| Item              | Description                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Project Paper     | The complete ethlect. paper                                                                                                                                                    |
| ethlect           | The source code of the ethlect. application                                                                                                                                    |
| keyholders app    | The source code of the keyholders application (this app can be used to operate cryptographic functions using RSA keys and generate keypairs)                                   |
| audit app         | The source code of the audit app. This app can be used to easily upload and digest the proof documents downloadable from ethlect.'s audit page and prove the proofs provided.  |
| votecounter app   | The source code of the votecounter app. This application is used to count the votes after the completion of an election and identify the elected candidates.                   |
| ballotprinter app | The source code of the ballotprinter app. The ballotprinter application is intended to simulate the ballot printing process. It creates plaintext ballots that can be printed. |
| mock election     | The documents related to the mock election conducted using the application.                                                                                                    |

# Getting Started

The ethlect. application, and all other apps are packaged and ready to be downloaded and run. This section provides an overview of the steps involved in setting the applications up so you can run them yourself. Feel free to refer to the paper to learn how to navigate the app and what you can do.

## Clone Repository

Make sure to clone the repository through your command line by running `git clone https://github.com/Andrei-Florian/ethlect.git` or by downloading it directly from GitHub by pressing the 'Code' button at the top right of the screen.

## Install Dependencies

The application runs on Nodejs and relies on the Node Package Manager (NPM) to install dependencies.

1. If you do not have Nodejs, make sure to [download and install it](https://nodejs.org/en/download/). NPM will automatically be downloaded for you!

2. In order to install the app's dependencies. Open a terminal instance at the path of the app you wish to run (ethlect. or keyholders) and type `npm install --save`

3. Wait for the intallation process to finish, all the dependencies should have been downloaded!

## Populate the Environment File

The only bit of setup needed to get started is in the environment file.

1. Create a file in the root directory of the application you are running and name it `.env.local`

2. Copy and paste the entries below respective to the app you are tring to run and follow the guides below to edit them.

### ethlect. App

```
THRESHOLD_VALUE=8
NUMBER_OF_KEYS=10
NUMBER_OF_PROOFS=5

NEXT_PUBLIC_ENABLE_2FA=true
NEXT_PUBLIC_ENABLE_STRIPEIDENTITY=true
NEXT_PUBLIC_ENABLE_VOTERREGISTRY=true

NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_API_GETELECTIONS=http://localhost:3000/api/getElections
NEXT_PUBLIC_API_GETELECTION=http://localhost:3000/api/getElection
NEXT_PUBLIC_API_GETINTEGRALELECTION=http://localhost:3000/api/getIntegralElection
NEXT_PUBLIC_API_GETELECTIONSHUFFLE=http://localhost:3000/api/getElectionShuffle
API_REGISTER_CHECK=http://localhost:3000/api/register/check
NEXT_PUBLIC_API_VERIFY_BALLOT=http://localhost:3000/api/election/verifyBallot

NEXT_PUBLIC_API_CHECKREGISTER=http://localhost:3000/api/register/check
NEXT_PUBLIC_API_CREATEACCOUNT=http://localhost:3000/api/register/create
NEXT_PUBLIC_API_VALIDATEACCOUNT=http://localhost:3000/api/register/validate

NEXT_PUBLIC_API_CHECKACCOUNT=http://localhost:3000/api/vote/checkAccount
NEXT_PUBLIC_API_CHECKBALLOTID=http://localhost:3000/api/vote/checkBallotID
NEXT_PUBLIC_API_CHECKCANDIDATEIDS=http://localhost:3000/api/vote/checkCandidateIDs
NEXT_PUBLIC_API_CASTVOTE=http://localhost:3000/api/vote/cast

NEXT_PUBLIC_API_CREATEELECTION=http://localhost:3000/api/election/create
NEXT_PUBLIC_API_VERIFYKEYS=http://localhost:3000/api/election/verifyKeys

NEXT_PUBLIC_API_STARTTABULATION=http://localhost:3000/api/election/startTabulation

NEXT_PUBLIC_API_STARTELECTION=http://localhost:3000/api/election/startElection

NEXT_PUBLIC_API_SHUFFLE=http://localhost:3000/api/election/shuffle

NEXT_PUBLIC_API_VALIDATESHUFFLE=http://localhost:3000/api/election/validateShuffle

NEXT_PUBLIC_API_DELETESHUFFLE=http://localhost:3000/api/election/deleteShuffle

NEXT_PUBLIC_API_GENERATEBALLOTS=http://localhost:3000/api/election/generateBallots

NEXT_PUBLIC_API_DELETEELECTION=http://localhost:3000/api/election/deleteElection

NEXT_PUBLIC_API_GETELECTIONKEY=http://localhost:3000/api/election/getElectionKey
NEXT_PUBLIC_API_DECRYPTBALLOTS=http://localhost:3000/api/election/decrypt

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PROMISE=

JWT_SECRET=QPRpe6ATR7109JN8DlxRIHTUPA7UbEJXn9kXcHDlvw8=
API_AUTH_UPDATE=http://localhost:3000/api/auth/update
API_AUTH_ENDPOINT=http://localhost:3000/api/auth/endpoint

DB_CONNECTION=
```

-   If you wish to use [Stripe Identity](https://stripe.com/en-gb/identity), and have successfully been invited to the BETA program, ensure to mark `USE_STRIPE_IDENTITY=true` and add your credentials in the entries below. Remember that if your'e running the application locally, you must forward the local port to Stripe using the Stripe CLI ([guide here](https://stripe.com/docs/webhooks/test))
-   `THRESHOLD_VALUE` represents the number of threshold keys needed to recompose the original key (refer to the paper)
-   `NUMBER_OF_KEYS` is the number of threshold keys to generate (default is 10)
-   `NUMBER_OF_PROOFS` is the number of indirect proofs the application should create for the ballots generation and shuffles (default is 5 for dev, set to 100 for production) (refer to the paper for more details)
-   The application requires a [MongoDB Database](https://www.mongodb.com/) to store data. There are multiple ways to set one up, the easiest is to follow [this guide](https://docs.atlas.mongodb.com/getting-started/?_ga=2.86438609.835679229.1641746435-125592554.1638636187&_gac=1.56322649.1641746505.CjwKCAiArOqOBhBmEiwAsgeLmVwGv1C2WZjTdkXtbC2acYEGwsHSfdjYXeZlSqE2ozH_9JxhH2SskxoC-fYQAvD_BwE) by MongoDB to create a free MongoDB atlas DB.
-   After you created your DB, ensure to paste the connection URL of your DB in the `DB_CONNECTION` field.
-   The links above assume that the app is hosted at `http://localhost:3000/`, make sure to update them if you are hosting at a different local or global URL

### Keyholders App

```
NEXT_PUBLIC_CREATE_API=http://localhost:3000/api/create
NEXT_PUBLIC_DECRYPT_API=http://localhost:3000/api/decrypt
NEXT_PUBLIC_ENCRYPT_API=http://localhost:3000/api/encrypt
```

The keyholders app requires no setup and runs out of the box after the lines above are added to the environment file.

-   The links above assume that the app is hosted at `http://localhost:3000/`, make sure to update them if you are hosting at a different local or global URL

### Audit App

```
NEXT_PUBLIC_API_ROUTE=http://localhost:3000/api/verify
```

The audit app requires no setup and runs out of the box after the lines above are added to the environment file.

-   The links above assume that the app is hosted at `http://localhost:3000/`, make sure to update them if you are hosting at a different local or global URL
-   To prove a proof outputted by the ethlect. application, head over to `/${electionID}/audit` where `electionID` is the ID of the election you want to audit, and identify the proof you wish to verify. You can download this proof by pressing the download button.
-   Back in the audit app, upload the file in the form on the index page and click the "verify" button to verify the proof.

### Votecounter App

```
NEXT_PUBLIC_API_ROUTE=http://localhost:3000/api/count
```

The audit app requires no setup and runs out of the box after the lines above are added to the environment file.

-   The links above assume that the app is hosted at `http://localhost:3000/`, make sure to update them if you are hosting at a different local or global URL
-   To count the votes outputted by the ethlect. app, head over to `/${electionID}/audit` where `electionID` is the ID of the election you want to audit, and download the election's constituencies and results documents. You can download these documents by pressing the download button.
-   Head back to the votecounter app and upload the documents in the form. You can then click the _Count Votes_ button to count the votes.

### BallotPrinter App

```
NUMBER_OF_AUDITABLE_BALLOTS=10

NEXT_PUBLIC_API_VERIFYCONNECTIONSTRING=http://localhost:3000/api/verifyConnectionString
NEXT_PUBLIC_API_PRINTBALLOTS=http://localhost:3000/api/print

PRIVATE_API_HELPER_GENERATEAUDITABLEBALLOTS=http://localhost:3000/api/helper/generateAuditableBallots
PRIVATE_API_HELPER_DECRYPTBALLOTS=http://localhost:3000/api/helper/decryptBallots
PRIVATE_API_HELPER_VERIFYDECRYPTION=http://localhost:3000/api/helper/verifyDecryption
```

The ballotprinter app is ready to run out of the box. All that is required is to add the lines above to the environment file and optionally edit the number of auditable ballots to generate per constituency by editing the `NUMBER_OF_AUDITABLE_BALLOTS` field.

-   The links above assume that the app is hosted at `http://localhost:3000/`, make sure to update them if you are hosting at a different local or global URL
-   This app will decrypt the ballots generated by the ethlect. application and audit the process autonomously aiming to simulate the ballot printing process.
-   The application will ask for a MongoDB connection string to gain access to private data in the ethlect. database, you will need to create a new user account with read-only access to the database and paste the connection string in the application's form when prompted.

## Start the App

Finally, you can start the app by running `npm run dev` in the terminal

The applications are build ready (you must update the Stripe Credentials to your public credentials before deploying). In order to test and deploy the production build, run `npm run build`, and then `npm run start` to launch the app.

You may follow the URL at which the app is hosted to start experimenting (defualt is `localhost:3000`)
