const {
  TranscribeClient,
  StartTranscriptionJobCommand,
} = require("@aws-sdk/client-transcribe");
const path = require("path");

const LANGUAGE_CODE = "es-US", //process.env.LANGUAGE_CODE,
  REGION = "us-east-1", //process.env.REGION,
  MEMORIAS_BUCKET = "memorias-storage-0206a16603328-dev"; //process.env.MEMORIAS_BUCKET;
const transcribe = new TranscribeClient({ region: REGION });

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  try {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    for (const record of event.Records) {
      //if (!record.dynamodb.NewImage._deleted.BOOL) {
      if (record.eventName === "INSERT") {
        const idAudio = record.dynamodb.Keys.id.S;
        const s3Key = record.dynamodb.NewImage.s3Key.S;
        const userId = record.dynamodb.NewImage.metadata.M.userName.S;
        console.log("Transcribing: ", s3Key);

        //console.log("UserId: ", userId);
        let fileName = path.parse(s3Key).name;
        //replace white spaces with underscores
        fileName = fileName.replace(/ /g, "_");
        //replace special characters with underscores
        //fileName = fileName.replace(/[^0-9a-zA-Z._-]/g, "_");

        //const timestamp = new Date().getTime().toString();
        const transcriptionJobName = `TranscriptionJob_${idAudio}_${fileName}`;

        let uri = "s3://" + MEMORIAS_BUCKET + "/" + s3Key;
        console.log("====================>Source URI: ", uri);
        //extract the path without the filename and extension
        let transcriptionPath = "transcripts/transcripts-" + userId;
        console.log(
          "====================>Transcription Path: ",
          transcriptionPath
        );

        const params = {
          TranscriptionJobName: transcriptionJobName,
          LanguageCode: LANGUAGE_CODE,
          Media: {
            MediaFileUri: uri,
          },
          OutputBucketName: MEMORIAS_BUCKET,
          OutputKey: transcriptionPath + "/" + transcriptionJobName + ".json",
          Tags: [
            {
              Key: "sourceKey",
              Value: s3Key,
            }
          ]
        };

        const command = new StartTranscriptionJobCommand(params);

        const responseTranscription = await transcribe.send(command);

        console.log(`Transcription job started for: ${s3Key}`);
        console.log("response transcription:", responseTranscription);
        
        if (responseTranscription.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
          console.log('Transcription job completed');
        }

      }
    }
    return Promise.resolve("Successfully processed DynamoDB record");
  } catch (err) {
    console.error("Error processing DynamoDB record:", err);
    throw err;
  } finally {
    transcribe.destroy();
  }
};
