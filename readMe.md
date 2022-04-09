# Abstract

<p align="center">
    <img src="./resources/image1.png" alt="ethlect." width="500" style=/>
</p>

ethlect. is the first end-to-end verifiable, internet voting application for elections run using the PR-STV model.

ethlect. employs a hybrid approach to internet voting that allows it to be the first internet voting implementation that can assure the security of the application’s frontend.

A physical layer is added to the application, similar to postal voting, where voters introduce their votes into the application using paper ballots received. The voter never introduces their direct candidate selection but instead ciphertexts representing their candidate choices. This allows for an unprecedented level of security and anonymity where nor the application, nor any malicious actors can identify the voter’s selections.

The application allows for voters to verify that their vote was cast successfully, and all ballots are traceable throughout the application once they are cast. This allows for third parties to audit the system and ensure the correct tabulation of votes.

ethlect. is designed specifically for Irish General Elections and integrates with existing public systems to validate voter identities and ensure the system’s integrity.

Voters that are already registered to vote can follow the online registration process to use the app to cast their ballot.

After the voter registration period, the election is prepared by the election authorities. In this process, an election is started using the application by inputting the candidates running for each constituency and distributing keys, ballots are generated for all candidates in a verifiable manner (the candidates are encrypted for all candidates on all ballots), the ballots are then printed at a secure location (again in a verifiable manner) and posted to the voters.

The electoral period is then started. Voters can use their physical ballots to introduce their candidate selection in preferential order. This is done by introducing the ciphertexts representing each candidate. The application will ensure that the ballot was marked correctly and will then add the ballot to the virtual ballot box.
The voter can verify that their ballot was cast correctly either through the application or by querying the public database themselves. This process is designed such that only the voter can confirm the correct casting of the ballot in a way that prevents third parties from identifying the voter’s choices.

After the completion of the electoral period, the election administration body can start the tabulation process. This process involves the re-encryption and cryptographic shuffle of ballots in a verifiable fashion as to lose the correlation between a ballot and the voter that cast it.

Ultimately, after the ballots were shuffled a few times, ten keyholders that hold decryption keys are to combine their keys and decrypt the ballots verifiably.
All stages of the tabulation process are made publicly available together with cryptographic proofs that attest the correctness of each shuffle and decryption of the ballot set. This allows third parties to assert the integrity of the system.

# Repository Structure

This repository centralises all public documents, code and tests related to ethlect. The table below gives a high-level overview of the repo's structure.

| Item            | Description                                                                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project Paper   | The complete ethlect. paper                                                                                                                                                   |
| ethlect         | The source code of the ethlect. application                                                                                                                                   |
| keyholders app  | The source code of the keyholders application (this app can be used to operate cryptographic functions using RSA keys and generate keypairs)                                  |
| audit app       | The source code of the audit app. This app can be used to easily upload and digest the proof documents downloadable from ethlect.'s audit page and prove the proofs provided. |
| votecounter app | The source code of the votecounter app. This application is used to count the votes after the completion of an election and identify the elected candidates.                  |
| mock election   | The documents related to the mock election conducted using the application.                                                                                                   |

# Getting Started

The ethlect. application, keyholders app, and audit app are packaged and ready to be downloaded and run. This section provides an overview of the steps involved in setting the applications up so you can run them yourself. Feel free to refer to the paper to learn how to navigate the app and what you can do.

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

## Start the App

Finally, you can start the app by running `npm run dev` in the terminal

The applications are build ready (you must update the Stripe Credentials to your public credentials before deploying). In order to test and deploy the production build, run `npm run build`, and then `npm run start` to launch the app.

You may follow the URL at which the app is hosted to start experimenting (defualt is `localhost:3000`)
