/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createAppUser = /* GraphQL */ `
  mutation CreateAppUser(
    $input: CreateAppUserInput!
    $condition: ModelAppUserConditionInput
  ) {
    createAppUser(input: $input, condition: $condition) {
      id
      cognitoId
      name
      birthday
      Audio {
        nextToken
        startedAt
        __typename
      }
      photo
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateAppUser = /* GraphQL */ `
  mutation UpdateAppUser(
    $input: UpdateAppUserInput!
    $condition: ModelAppUserConditionInput
  ) {
    updateAppUser(input: $input, condition: $condition) {
      id
      cognitoId
      name
      birthday
      Audio {
        nextToken
        startedAt
        __typename
      }
      photo
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteAppUser = /* GraphQL */ `
  mutation DeleteAppUser(
    $input: DeleteAppUserInput!
    $condition: ModelAppUserConditionInput
  ) {
    deleteAppUser(input: $input, condition: $condition) {
      id
      cognitoId
      name
      birthday
      Audio {
        nextToken
        startedAt
        __typename
      }
      photo
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const createAudio = /* GraphQL */ `
  mutation CreateAudio(
    $input: CreateAudioInput!
    $condition: ModelAudioConditionInput
  ) {
    createAudio(input: $input, condition: $condition) {
      id
      title
      s3Key
      expoFileSytemPath
      metadata
      transcribedAt
      transcriptionPath
      appuserID
      AppUser {
        id
        cognitoId
        name
        birthday
        photo
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const updateAudio = /* GraphQL */ `
  mutation UpdateAudio(
    $input: UpdateAudioInput!
    $condition: ModelAudioConditionInput
  ) {
    updateAudio(input: $input, condition: $condition) {
      id
      title
      s3Key
      expoFileSytemPath
      metadata
      transcribedAt
      transcriptionPath
      appuserID
      AppUser {
        id
        cognitoId
        name
        birthday
        photo
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
export const deleteAudio = /* GraphQL */ `
  mutation DeleteAudio(
    $input: DeleteAudioInput!
    $condition: ModelAudioConditionInput
  ) {
    deleteAudio(input: $input, condition: $condition) {
      id
      title
      s3Key
      expoFileSytemPath
      metadata
      transcribedAt
      transcriptionPath
      appuserID
      AppUser {
        id
        cognitoId
        name
        birthday
        photo
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      createdAt
      updatedAt
      _version
      _deleted
      _lastChangedAt
      __typename
    }
  }
`;
