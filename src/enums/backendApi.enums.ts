export const backendApiEnums = {
  METHODS: {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    DELETE: "DELETE",
  },
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      VERIFY_OTP: "/auth/verify-otp",
      REGISTER: "/auth/register",
      AUTH: "/auth",
      UPDATE_PROFILE_INFO: "/auth/update-user",
      RESET_PASSWORD: "/auth/reset-password",
      RECOVER_PASSWORD: "/auth/recover-password",
      FORGET_PASSWORD: "/auth/forget-password",
      VERIFY_TOKEN: "/auth/update-status",
    },

    VISA_APPLICATION: {
      GET_USER_APPLICATIONS: "/visa-application",
      // CREATE_USER_APPLICATIONS: "/visa-application/create",
      CREATE_OR_UPDATE: "/visa-application/create",
      GET_APPLICATION_BY_ID: "/visa-application/getApplicationById",
      DELETE_APPLICATION: "/visa-application/delete",
    },

    VISA: {
      CHECK: "/visa/check",
      TYPES: "/visa/types",
      COUNTRIES: "/visa/countries",
      CREATE_ORDER: "/visa/order",
    },

    PAYMENT: {
      CREATE_DYNAMIC_CHECKOUT_SESSION: "/stripe_payment/session",
    },

    COUPON: {
      VALIDATE: "/coupon/validate",
      AVAILABLE: "/coupon/available",
      APPLY: "/coupon/apply",
      REMOVE: "/coupon/remove",
      VERIFY_STUDENT: "/coupon/verify-student",
    },
  },
};
