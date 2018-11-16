import sequelize from 'sequelize';

export default function (sequelize: sequelize.Sequelize, dataTypes: sequelize.DataTypes): any {
  // tslint:disable-next-line:variable-name
  const Jargon = sequelize.define('Jargon', {
    team_id: dataTypes.STRING,
    creator: dataTypes.STRING,
    phrase: dataTypes.STRING,
    definition: dataTypes.STRING,
  }, {});
  Jargon.associate = function (_models): any {
    // associations can be defined here
  };
  return Jargon;
}
