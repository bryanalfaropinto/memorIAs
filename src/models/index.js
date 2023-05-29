// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { AppUser, Audio } = initSchema(schema);

export {
  AppUser,
  Audio
};