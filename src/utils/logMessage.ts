import { appEnums } from '@/enums/app.enums';

export const logMessage = (message) => {
  if (process.env.APP_ENV !== appEnums.ENVIRONMENT.PRODUCTION) {
    console.log(message);
  }
};
