/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import fetch from 'node-fetch';
import * as path from 'path';
import { InteractionResponseType, InteractionType } from 'discord-interactions';
import {
  VerifyDiscordRequest,
  sendScheduledMessage,
  sendDailyMessage,
  sendTestMessage,
} from './utils';
import {
  remote_week_1,
  remote_week_2,
  remote_week_3,
  remote_week_4,
} from './messages';

const app = express();
const githubToken = process.env.GITHUB_TOKEN;

app.use('/assets', express.static(path.join(__dirname, 'assets')));
// app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

app.get('/api', (req, res) => {
  (async () => {
    try {
      sendDailyMessage();
      sendScheduledMessage('1-10 9:00', remote_week_1);
      sendScheduledMessage('1-17 9:00', remote_week_2);
      sendScheduledMessage('1-24 9:00', remote_week_3);
      sendScheduledMessage('1-31 9:00', remote_week_4);
      sendTestMessage('Bot is up and running!');
    } catch (e) {
      console.log(e);
      sendTestMessage('Error: ' + e + '\n' + 'Stack: ' + e.stack + '\n');
    }
  })();
  res.send({ message: 'Welcome to bot!' });
});

function fetchAndSendDiff(pr) {
  const url = pr.diff_url;
  fetch(url, {
    headers: {
      Authorization: `token ${githubToken}`,
    },
  })
    .then((response) => response.text())
    .then((data) => {
      sendTestMessage(data);
    })
    .catch((error) => {
      console.error('Error:', error);
      sendTestMessage('這次失敗');
    });
}

app.post(
  '/pull_request',
  express.json({ type: 'application/json' }),
  (req, res) => {
    res.status(202).send('Accepted');
    const githubEvent = req.headers['x-github-event'];
    if (githubEvent === 'pull_request') {
      const data = req.body;
      const action = data.action;
      const pr = data.pull_request;
      // console.log(data);
      if (action === 'opened') {
        console.log(`An pull_request was opened with this title: ${pr.title}`);
        sendTestMessage(
          `An pull_request was opened with this title: ${pr.title}`
        );
        fetchAndSendDiff(pr);
      } else if (action === 'reopened') {
        console.log(
          `An pull_request was reopened with this title: ${pr.title}`
        );
        fetchAndSendDiff(pr);
      } else if (action === 'closed') {
        sendTestMessage(`${pr.user.login} close 他的 PR 了`);
      } else {
        console.log(`Unhandled action for the pull_request event: ${action}`);
      }
    } else if (githubEvent === 'ping') {
      console.log('GitHub sent the ping event');
    } else {
      console.log(`Unhandled event: ${githubEvent}`);
    }
  }
);

app.post(
  '/interactions',
  VerifyDiscordRequest(process.env.PUBLIC_KEY),
  (req, res) => {
    const { type } = req.body;
    /**
     * Handle verification requests
     */
    if (type === InteractionType.PING) {
      return res.send({ type: InteractionResponseType.PONG });
    }
  }
);

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
