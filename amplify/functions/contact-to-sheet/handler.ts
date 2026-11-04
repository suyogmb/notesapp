import { env } from "$amplify/env/contact-to-sheet";

// Minimal shape of the DynamoDB stream records we read.
type StringAttr = { S?: string } | undefined;
type StreamRecord = {
  eventName?: "INSERT" | "MODIFY" | "REMOVE";
  dynamodb?: { NewImage?: Record<string, StringAttr> };
};

const str = (attr: StringAttr) => attr?.S ?? "";

/**
 * Copies each newly created Contact row into the Google Sheet by calling
 * the sheet's Apps Script web app. DynamoDB stays the source of truth.
 */
export const handler = async (event: { Records: StreamRecord[] }) => {
  for (const record of event.Records) {
    if (record.eventName !== "INSERT") continue;
    const item = record.dynamodb?.NewImage ?? {};

    const res = await fetch(env.SHEET_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: env.SHEET_WEBHOOK_TOKEN,
        id: str(item.id),
        name: str(item.name),
        email: str(item.email),
        mobileNumber: str(item.mobileNumber),
        createdAt: str(item.createdAt),
      }),
    });

    const text = await res.text();
    // Throwing makes Lambda retry the batch (limited by retryAttempts).
    if (!res.ok || !text.includes('"ok":true')) {
      throw new Error(`Sheet webhook failed: HTTP ${res.status} ${text.slice(0, 200)}`);
    }
  }
};
