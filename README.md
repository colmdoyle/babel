# Babel

A Slack API sample of an application for "translating" your company's internal lingo. Helps new hires by allowing them to get a definition of phrases like "OKR" without having to ask

![Demo of Babel](https://github.com/slackapi/babel/raw/master/babel_demo.gif)

## Setup

### Creating a Slack App

Head on over to [https://api.slack.com/apps](https://api.slack.com/apps) and click "Create New App". It should be a green button near the top right.

Now, you should have a screen with a section called *App Credentials*. Make a note of the Client ID, Client Secret and Verification Token. You'll need these in a minute.

### Hosting on Heroku

If you're planning on running the app from Heroku, then click the button below.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Once that's deployed, make a note of the URL and skip forward to [here](#slack-app-configuration)

### Self Hosting

#### Prerequisites

- Node (latest LTS version) and a recent version of `npm`.
- MySQL 5.6+ (or equivalent)
- _Production_: A public URL with a valid TLS certificate (https)
- _Local development_: [ngrok](https://ngrok.com/) will help you tunnel requests from a public URL (with TLS) to your
  development machine. A free plan is okay, but in order to use a stable subdomain (and avoid changing the Slack
  configuration), its recommended to use a paid plan.

Once you have the prerequisites covered, go get the code and dependencies:

1. _Recommended_: Update the version of npm to the latest stable:
    ```bash
    npm install -g npm@latest
    ```
2. Clone the repository
3. Install dependencies
    ```bash
    npm install
    ```
4. Build the application
    ```bash
    npm run build
    ```

#### Environment Variables

See .env.sample in the repository root

- `DB_HOSTNAME` - host name for MySQL server
- `DB_PORT` - port for MySQL server
- `DB_NAME` - database name
- `DB_USERNAME` - app's MySQL user name
- `DB_PASSWORD` - app's MySQL password
- `SLACK_CLIENT_ID` - Issued when you created your app on api.slack.com
- `SLACK_CLIENT_SECRET` - Issued when you created your app on api.slack.com
- `SLACK_VERIFICATION_TOKEN` - Issued when you created your app on api.slack.com

#### Database

You may need to create the MySQL database and user if you're setting up for the first time locally. Here are some
helpful commands for accomplishing this from the MySQL shell (remember to replace the password):

```bash
mysql> CREATE DATABASE babel_development;
mysql> CREATE USER 'babel-dev'@'localhost' IDENTIFIED BY 'new_password';
mysql> GRANT ALL ON babel_development.* TO 'babel-dev'@'localhost';
mysql> FLUSH PRIVILEGES;
```

Before running the app, you'll need to set up the schema for the database. This can be done using the following commands:

```bash
./node_modules/.bin/sequelize db:create  # only run once to create the database
./node_modules/.bin/sequelize db:migrate
```

### Run the server

Before running, make sure your MySQL server is listening and start the server:

```bash
npm start
```

### Slack App Configuration

Now that we have a functioning server running, we need to go back to the Slack App Configuration screen to enable features on the Slack side

Go back to [https://api.slack.com/apps](https://api.slack.com/apps) and choose the App you created earlier.

#### Enabling Message Actions

The first thing we're going to do is enable [Message Actions](https://api.slack.com/actions). In this sample, a Message Action is used to allow users to select a message they want to search for acronyms.

1. In the sidebar, choose _Interactive Components_
2. Toggle it to on, and in the _Request URL_ field, enter the publicly facing URL of your server, and add `/interactive_components` to the end, e.g. `https://www.example.com/interactive_components`
3. Click on the _Create New Action_ button under Actions and fill in the following:
    - Action Name: a short, catchy call to action. If your action will trigger a dialog, we recommend including an ellipsis (...) at the end of the action name as a UI convention to indicate this.
    - Short Description: describe what the action does for the benefit of a potential user.
    - Callback ID: a string that will be sent to your Request URL when an action is used. This is used to distingush multiple actions from each other

#### Enabling Slash Commands

Now that's done, the next thing we're going to do is enable a [Slash Command](https://api.slack.com/slash-commands). In this sample, a slash command is used to allow users to define new acronyms.

1. In the sidebar, choose _Slash Commands_
2. Click on the _Create New Command_ button and fill in the following:
    - Command: This is what users will use to invoke the command. For now, let's call it `/add_acronym`
    - Request URL: This is the endpoint that Slack will `POST` to when the command is invoked by a user. Enter the publicly facing URL of your server, and add `/slash_commands/add_acronym` to the end, e.g. `https://www.example.com/slash_commands/add_acronym`
    - Short Description: This text is displayed to End Users to help them understand the purpose of the command
    - Usage Hint: This text is displayed to End Users to help them understand what parameters they can pass to the command

#### Enabling OAuth

We're almost there, just a few more steps. This next one will be to enable the installation workflow, so users can add your app to their workspace.

1. In the sidebar, choose _OAuth & Permissions_
2. Click on the _Add New Redirect URL_ button and enter the publicly facing URL of your server, and add `/app_installed` to the end, e.g. `https://www.example.com/app_installed`
3. Click _Save URLs_

#### Adding a Bot User

The end is almost in sight, soon you'll be playing with your new Slack integration! The next step requires you to add what we call a _Bot User_. This is a user inside of the Slack Workspace that represents your application. It also allows us to get a `xoxb` or "Bot" token for your app.

1. In the sidebar, choose _Bot Users_
2. Click on the _Add a Bot User_ button and fill in the following:
    - Display name: This is the public facing name of your Bot. It's kind of like the "Real Name", in that it can have spaces etc if you choose
    - Default username: This is more of an "identifier", and cannot be greater than 21 characters and must be all one word
3. Click _Add Bot User_

#### Installing the App to your workspace

This is it, the final step. Thanks for sticking with it. We hope you'll enjoy playing with your new bot.

1. In the sidebar, choose _Manage Distribution_
2. In the _Share Your App with Your Workspace_ section, you'll see a _Sharable URL_. Copy and paste that to your browser, and the Slack App Installation Flow will take over!
3. Get a coffee and enjoy the fruits of your labor
