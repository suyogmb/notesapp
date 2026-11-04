import { defineBackend } from "@aws-amplify/backend";
import { Stack } from "aws-cdk-lib";
import { Effect, Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { EventSourceMapping, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { data } from "./data/resource";
import { contactToSheet } from "./functions/contact-to-sheet/resource";

const backend = defineBackend({
  data,
  contactToSheet,
});

// Send every new Contact row to the Google Sheet via the table's stream.
const contactTable = backend.data.resources.tables["Contact"];
const stack = Stack.of(contactTable);

const streamPolicy = new Policy(stack, "ContactToSheetStreamPolicy", {
  statements: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "dynamodb:DescribeStream",
        "dynamodb:GetRecords",
        "dynamodb:GetShardIterator",
        "dynamodb:ListStreams",
      ],
      resources: [contactTable.tableStreamArn!],
    }),
  ],
});
backend.contactToSheet.resources.lambda.role?.attachInlinePolicy(streamPolicy);

const mapping = new EventSourceMapping(stack, "ContactToSheetMapping", {
  target: backend.contactToSheet.resources.lambda,
  eventSourceArn: contactTable.tableStreamArn,
  startingPosition: StartingPosition.LATEST,
  retryAttempts: 3,
});
mapping.node.addDependency(streamPolicy);
