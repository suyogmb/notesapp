import { generateClient } from "aws-amplify/data";

/**
 * @type {import('aws-amplify/data').Client<import('../../amplify/data/resource').Schema>}
 */
const client = generateClient({ authMode: "apiKey" });

/**
 * Save a contact form submission.
 * @param {{ name: string, email: string, mobileNumber: string }} input
 * @returns {Promise<void>} throws Error with a readable message on failure
 */
export async function submitContact({ name, email, mobileNumber }) {
  const { errors } = await client.models.Contact.create(
    {
      name: name.trim(),
      email: email.trim(),
      // AWSPhone accepts digits, spaces, dashes and an optional leading +
      mobileNumber: mobileNumber.trim(),
    },
    // public key can only create, so don't ask the API to return the record
    { selectionSet: ["id"] }
  );
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(", "));
  }
}
