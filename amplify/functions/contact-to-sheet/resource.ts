import { defineFunction, secret } from "@aws-amplify/backend";

export const contactToSheet = defineFunction({
  name: "contact-to-sheet",
  // Lives in the data stack, so the Contact table stream can trigger it
  // without a circular dependency between stacks.
  resourceGroupName: "data",
  timeoutSeconds: 15,
  environment: {
    SHEET_WEBHOOK_URL: secret("SHEET_WEBHOOK_URL"),
    SHEET_WEBHOOK_TOKEN: secret("SHEET_WEBHOOK_TOKEN"),
  },
});
