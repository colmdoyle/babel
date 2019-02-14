import express from 'express';
import { WebClient, Dialog } from '@slack/client';
import models from '../db/models';
import { reject } from 'bluebird';

const router = express.Router();

router.post('/', (req, res) => {
  const payload = JSON.parse(req.body.payload);
  if (payload.token !== process.env.SLACK_VERIFICATION_TOKEN) {
    return;
  }
  models.Install.find({
    where: {
      team_id: payload.team.id,
    },
  }).then((install) => {
    const web = new WebClient(install.bot_token);
    switch (payload.type) {
      case 'message_action':
        const words = payload.message.text.split(' ');
        const cleanedUpWords = [];
        for (const word of words) {
          cleanedUpWords.push(word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?']/g, ''));
        }
        models.Jargon.findAll({
          where: {
            team_id: payload.team.id,
            phrase: {
              $in: cleanedUpWords,
            },
          },
        }).then((results) => {
          const blocks = [];
          if (results.length < 1) {
            blocks.push(
              {
                type: 'section',
                text: {
                  type: 'plain_text',
                  text: "Sorry, we don't have a definition for any of the words in this message",
                },
              },
            );
          } else {
            blocks.push(
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `_Babel has found *${results.length}* results_`,
                },
              },
              {
                type: 'divider',
              },
            );
            for (const result of results) {
              const createdTimestamp = new Date(result.createdAt).getTime() / 1000;

              blocks.push(
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*${result.phrase}*\n${result.definition}`,
                  },
                },
                {
                  type: 'context',
                  elements: [
                    {
                      type: 'mrkdwn',
                      // tslint:disable-next-line:max-line-length
                      text: `Submitted by <@${result.creator}> | <!date^${createdTimestamp}^{date}|${createdTimestamp.toString()}>`,
                    },
                  ],
                },
                {
                  type: 'actions',
                  elements: [
                    {
                      type: 'button',
                      text: {
                        type: 'plain_text',
                        text: `Edit "${result.phrase}"`,
                      },
                      value: `edit_${result.id}`,
                    },
                    {
                      type: 'button',
                      text: {
                        type: 'plain_text',
                        text: `Delete "${result.phrase}"`,
                      },
                      value: `delete_${result.id}`,
                      confirm: {
                        title: {
                          type: 'plain_text',
                          text: 'Are you sure?',
                        },
                        text: {
                          type: 'mrkdwn',
                          // tslint:disable-next-line:max-line-length
                          text: `This will remove "${result.phrase}" from your organisation's dictionary. This action cannot be undone.`,
                        },
                        confirm: {
                          type: 'plain_text',
                          text: `Yes, remove "${result.phrase}"`,
                        },
                        deny: {
                          type: 'plain_text',
                          text: `Keep "${result.phrase}"`,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'divider',
                },
              );
            }
          }

          web.chat.postEphemeral(
            {
              blocks,
              text: '',
              channel: payload.channel.id,
              user: payload.user.id,
            });

        });
        res.send({});
        break;
      case 'dialog_submission':
        const phrase: string = (payload.state) ?
          payload.state :
          payload.submission.phrase.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?']/g, '');
        console.log(phrase);
        if (phrase.match(/\s/g)) {
          // Validate the phrase to make sure it's a single word
          res.send({
            errors: [
              {
                name: 'phrase',
                error: 'Sorry, but acronyms cannot contain spaces',
              },
            ],
          });
        } else {
          models.Jargon.findOrCreate({
            where: {
              phrase,
              team_id: payload.team.id,
            },
            defaults: {
              phrase,
              team_id: payload.team.id,
              creator: payload.user.id,
              definition: payload.submission.definition,
            },
          }).spread((jargon: any, created: any) => {
            if (!created) {
              jargon.update({
                creator: payload.user.id,
                definition: payload.submission.definition,
              }).then().catch();
            }
          });
          web.chat.postEphemeral(
            {
              channel: payload.channel.id,
              user: payload.user.id,
              text: `Thanks for updating our acronym database with the acronym ${phrase}!`,
            },
          );
          res.send({});
        }

        break;
      case 'block_actions':
        const [command, value] = payload.actions[0].value.split('_');
        actionTypeResponses[command](value, payload)
          .then(result => res.send(result))
          .catch(error => res.send(error));
        break;
      default:
        console.error(`Unknown payload type ${payload.type}`);
        return;
        break;
    }
  });
});

const actionTypeResponses: { [action: string]: (s: string, p: any) => Promise<any> } = {
  delete: (value: string, payload: any) => {
    return new Promise((resolve) => {
      models.Jargon.destroy({
        where: {
          team_id: payload.team.id,
          id: value,
        },
      })
        .then((rowsDestroyed) => {
          if (rowsDestroyed > 0) {
            resolve({
              text: "Ok, we've removed it",
            });
          }
        })
        .catch((error) => {
          console.error(error);
          reject({
            text: "Something went wrong, we're sorry!",
          });

        });
    });
  },
  edit: (value: string, payload: any) => {
    return new Promise((resolve) => {
      models.Install.findOne({
        where: {
          team_id: payload.team.id,
        },
      }).then((install) => {
        const web = new WebClient(install.bot_token);
        models.Jargon.findOne({
          where: {
            team_id: payload.team.id,
            id: value,
          },
        }).then((jargon) => {

          const dialog: Dialog = {
            callback_id: 'jargon-submit',
            title: `Update meaning of ${jargon.phrase}`,
            elements: [
              {
                type: 'textarea',
                name: 'definition',
                label: 'Definition',
                value: `${jargon.definition}`,
              },
            ],
            state: `${jargon.phrase}`,
          };

          web.dialog.open({ dialog, trigger_id: payload.trigger_id });
          resolve();

        });
      });

    });
  },
};

export default router;
