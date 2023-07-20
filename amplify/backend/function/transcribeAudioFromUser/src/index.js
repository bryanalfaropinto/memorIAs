const {
  TranscribeClient,
  StartTranscriptionJobCommand,
} = require("@aws-sdk/client-transcribe");
const {
  GetObjectCommand,
  S3Client,
} = require("@aws-sdk/client-s3");
const path = require("path");

const LANGUAGE_CODE = "es-US", //process.env.LANGUAGE_CODE,
  REGION = "us-east-1", //process.env.REGION,
  MEMORIAS_BUCKET = "memorias-storage-0206a16603328-dev"; //process.env.MEMORIAS_BUCKET;
const transcribe = new TranscribeClient({ region: REGION });
const client = new S3Client({
  region: REGION,
});

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  try {
    //console.log(`EVENT: ${JSON.stringify(event)}`);
    //console.log("context: ", context);
    for (const record of event.Records) {
      //console.log(record.eventID);
      //console.log(record.eventName);
      //console.log('DynamoDB Record: %j', record.dynamodb);
      //console.log("Is deletion: ", record.dynamodb.NewImage._deleted.BOOL);
      //if (!record.dynamodb.NewImage._deleted.BOOL) {
      if (record.eventName === "INSERT") {
        //'MODIFY'
        //transcribe the audio file here
        const s3Key = record.dynamodb.NewImage.s3Key.S;
        const userId = record.dynamodb.NewImage.userId.S;
        console.log("Transcribing: ", s3Key);
        const fileName = path.parse(s3Key).name;
        const timestamp = new Date().getTime().toString();
        const transcriptionJobName = `TranscriptionJob_${timestamp}-${fileName}`;
        //const uri = `s3://${MEMORIAS_BUCKET}/private/${s3Key}`;

        // const command1 = new ListObjectsCommand({
        //   Bucket: MEMORIAS_BUCKET,
        //   Prefix: "private/"
        //   //MaxKeys: 1
        // });
        //   Bucket: MEMORIAS_BUCKET,
        //   Key: s3Key,
        // });
        // const rpta = await client.send(command1);
        // console.log("RPTA: ", rpta);
        //console.log(`Object '${s3Key}' exists in bucket '${MEMORIAS_BUCKET}'.`);

        const command2 = new GetObjectCommand({
          Bucket: MEMORIAS_BUCKET,
          Key: s3Key,
        });
        const response = await client.send(command2);
        //console.log("Response GetObjectCommand: ", response);
        const uri = "https://" + MEMORIAS_BUCKET + ".s3." + REGION + ".amazonaws.com/" + s3Key;
        //console.log("URI: ", uri);
        //extract the path without the filename and extension
        let transcriptionPath = s3Key.substring(0, s3Key.lastIndexOf("/"));
        //code to replace ":" to unicode char
        // transcriptionPath = transcriptionPath.replace(/:/g, "%3A");
        // console.log("====================>TranscriptionPath: ", transcriptionPath);
        //key: private/us-east-1:7ce737f6-1373-4b93-a4c2-cbf72b697202/audios/11Julio2023_2_1689131108132/11Julio2023_2.m4a
        //private/us-east-1:7ce737f6-1373-4b93-a4c2-cbf72b697202/audios/11Julio2023_2_1689131108132
        //private/
        const params = {
          TranscriptionJobName: transcriptionJobName,
          LanguageCode: LANGUAGE_CODE,
          Media: {
            MediaFileUri: uri,
          },
          OutputBucketName: MEMORIAS_BUCKET,
          OutputKey: transcriptionPath,
        };

        const command = new StartTranscriptionJobCommand(params);
        const responseTranscription = await transcribe.send(command);
        console.log(`Transcription job started for: ${s3Key}`);
        console.log("response transcription:", responseTranscription);
      }
    }
    return Promise.resolve("Successfully processed DynamoDB record");
  } catch (err) {
    console.error("Error processing DynamoDB record:", err);
    throw err;
  }
};
