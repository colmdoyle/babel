import express from 'express';
import { WebClient, Dialog } from '@slack/client';
import models from '../../db/models';

const router = express.Router();

router.post('/', (req, res) => {
  const payload = req.body;
  if (payload.text.match(/\s/g)) {
    // Validate the phrase to make sure it's a single word
    res.send('Sorry, but acronyms cannot contain spaces');
  } else {
    models.Install.find({
      where: {
        team_id: payload.team_id,
      },
    }).then((install) => {
      const web = new WebClient(install.bot_token);

      const dialog: Dialog = {
        callback_id: 'jargon-submit',
        title: 'Define new acronym',
        elements : [
          {
            type: 'text',
            name: 'phrase',
            label: 'Phrase to define',
            value: payload.text,
          },
          {
            type: 'textarea',
            name: 'definition',
            label: 'Definition',
          },
        ],
      };

      web.dialog.open({ dialog, trigger_id: payload.trigger_id });
    });
    res.status(200).send();
  }
});

export default router;
