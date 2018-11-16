'use strict';

import fs from 'fs';
import path from 'path';
// tslint:disable-next-line:import-name
import Sequelize from 'sequelize';
import { sequelizeConfig } from '../../config/config';

export const sequelize = new Sequelize(sequelizeConfig);
const basename  = path.basename(__filename);
const db: { [name: string]: Sequelize.Model<any, any> } = {};

fs
  .readdirSync(__dirname)
  .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    const model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  // tslint:disable-next-line:strict-boolean-expressions
  if (db[modelName].associate) {
    (db[modelName].associate as (d: any) => void)(db);
  }
});

export default db;
