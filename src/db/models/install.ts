import sequelize from 'sequelize';

export default function (sequelize: sequelize.Sequelize, dataTypes: sequelize.DataTypes): any {
  // tslint:disable-next-line:variable-name
  const Install = sequelize.define('Install', {
    team_id: dataTypes.STRING,
    bot_token: dataTypes.STRING,
    bot_user_id: dataTypes.STRING,
    user_access_token: dataTypes.STRING,
  }, {});
  Install.associate = function (_models): any {
    // associations can be defined here
  };
  return Install;
}
