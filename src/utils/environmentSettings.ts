import { appEnums } from "@/enums/app.enums";

export const recaptchaEnvironment = 
  process.env.APP_ENV != appEnums.ENVIRONMENT.DEVELOPMENT &&
  process.env.APP_ENV != appEnums.ENVIRONMENT.LOCAL;

export const productionEnvironment =
  process.env.APP_ENV == appEnums.ENVIRONMENT.PRODUCTION;
