import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * Portfolio contact form submissions.
 *
 * Public visitors can only CREATE a submission (via API key).
 * Nobody can list/read/update/delete through the public API —
 * view submissions in the Amplify console → Data → Data manager.
 */
const schema = a.schema({
  Contact: a
    .model({
      name: a.string().required(),
      email: a.email().required(), // AWSEmail: validated server-side
      mobileNumber: a.phone().required(), // AWSPhone: validated server-side
    })
    .authorization((allow) => [allow.publicApiKey().to(["create"])]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // AppSync max is 365 days (365 itself fails at deploy). Redeploy before expiry to rotate the key.
    apiKeyAuthorizationMode: { expiresInDays: 364 },
  },
});
