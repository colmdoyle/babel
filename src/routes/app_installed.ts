import express from 'express';
import { WebClient } from '@slack/client';
import models from '../db/models';

const router = express.Router();
const client = new WebClient(process.env.SLACK_XOXB);

router.get('/', (req, res) => {
  const code = req.query.code;
  if (code !== undefined) {
    client.oauth.access({
      code,
      client_id: process.env.SLACK_CLIENT_ID as string,
      client_secret: process.env.SLACK_CLIENT_SECRET as string,
    }).then((apiResult: any) => {
      models.Install.findOrCreate({
        where: {
          user_access_token: apiResult.access_token,
        },
        defaults: {
          team_id: apiResult.team_id,
          bot_token: apiResult.bot.bot_access_token,
          bot_user_id: apiResult.bot.bot_user_id,
          user_access_token: apiResult.access_token,
        },
      }).spread((install: any, created: any) => {
        if (!created) {
          install.update({
            bot_token: apiResult.bot.bot_access_token,
            user_access_token: apiResult.access_token,
          }).then().catch((error: Error) => {
            console.error(error);
            res.render('app_installed', {
              title: 'Installation error!',
              success: false,
            });
          });
        }
        res.render('app_installed', {
          title: 'Installation successful!',
          success: true,
        });
      });
    }).catch((oAuthError) => {
      console.error(oAuthError.message);
      res.render('app_installed', {
        title: 'Installation error!',
        success: false,
      });
    });
  } else {
    res.render('app_installed', {
      title: 'Installation error!',
      success: false,
    });

  }

});

export default router;
