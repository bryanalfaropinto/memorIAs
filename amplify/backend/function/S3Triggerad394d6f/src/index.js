const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const REGION = "us-east-1"; //process.env.REGION,
const AUDIO_TABLE = "Audio-3zwr45ovl5cq3engfafynsxbm4-dev"; //process.env.AUDIO_TABLE;

const client = new DynamoDBClient({
  region: REGION,
});
const docClient = DynamoDBDocumentClient.from(client);

const s3Client = new S3Client({
  region: REGION,
});

exports.handler = async function (event) {
  //console.log('Received event:', JSON.stringify(event, null, 2));
  const eventName = event.Records[0].eventName;
  if (eventName === "ObjectCreated:Put") {
    const bucket = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;
    console.log(`Bucket: ${bucket}`, `Key: ${key}`);
    const transcriptId = key.slice(key.lastIndexOf("/") + 1);
    console.log(`TranscriptId: ${transcriptId}`);
    const match = transcriptId.match(/_([^_]+)_/);
    console.log(`AudioId: ${match[1]}`);
    const audioId = match && match[1] ? match[1] : null;

    if (audioId) {
      try {
        const command = new GetCommand({
          TableName: AUDIO_TABLE,
          Key: {
            id: audioId,
          },
        });
        const response = await docClient.send(command);
        //console.log("response dynamoDB: ", response);

        const s3OriginalKey = response.Item.s3Key;
        console.log("s3OriginalKey: ", s3OriginalKey);
        const keyPath = s3OriginalKey.slice(0, s3OriginalKey.lastIndexOf("/"));
        console.log("keyPath: ", keyPath);

        //get the file name from key
        const keyFileName = key.slice(key.lastIndexOf("/") + 1);
        console.log("keyFileName: ", keyFileName);

        //move file from key value path to keyPath value path
        const copyParams = {
          Bucket: bucket,
          CopySource: `${bucket}/${key}`,
          Key: keyPath + "/" + keyFileName,
        };
        //console.log("copy params: ", copyParams);

        const copyObject = await s3Client.send(
          new CopyObjectCommand(copyParams)
        );
        //console.log("copyObject: ", copyObject);

        const audioLastModified = copyObject.CopyObjectResult.LastModified;

        //delete file from key value path
        const deleteParams = {
          Bucket: bucket,
          Key: key,
        };
        const deleteObject = await s3Client.send(
          new DeleteObjectCommand(deleteParams)
        );
        //console.log("deleteObject: ", deleteObject);

        //update AUDIO_TABLE table with new transcription key7
        const commandUpdate = new UpdateCommand({
          TableName: AUDIO_TABLE,
          Key: {
            id: audioId,
          },
          UpdateExpression:
            "set transcriptionKey = :transcriptionKey, transcribedAt = :transcribedAt",
          ExpressionAttributeValues: {
            ":transcriptionKey": keyPath + "/" + keyFileName,
            ":transcribedAt": audioLastModified
              ? audioLastModified.toISOString()
              : new Date().toISOString(),
          },
          ReturnValues: "ALL_NEW",
        });
        const updateResponse = await docClient.send(commandUpdate);
        //console.log("updateResponse: ", updateResponse);
      } catch (err) {
        console.error("error: ", err);
      } finally {
        docClient.destroy();
        s3Client.destroy();
        client.destroy();
      }
    }
  }
  
};
