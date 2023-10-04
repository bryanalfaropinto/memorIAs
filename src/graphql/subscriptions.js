/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateAppUser = /* GraphQL */ `
  subscription OnCreateAppUser($filter: ModelSubscriptionAppUserFilterInput) {
    onCreateAppUser(filter: $filter) {
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
export const onUpdateAppUser = /* GraphQL */ `
  subscription OnUpdateAppUser($filter: ModelSubscriptionAppUserFilterInput) {
    onUpdateAppUser(filter: $filter) {
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
export const onDeleteAppUser = /* GraphQL */ `
  subscription OnDeleteAppUser($filter: ModelSubscriptionAppUserFilterInput) {
    onDeleteAppUser(filter: $filter) {
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
export const onCreateAudio = /* GraphQL */ `
  subscription OnCreateAudio($filter: ModelSubscriptionAudioFilterInput) {
    onCreateAudio(filter: $filter) {
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
export const onUpdateAudio = /* GraphQL */ `
  subscription OnUpdateAudio($filter: ModelSubscriptionAudioFilterInput) {
    onUpdateAudio(filter: $filter) {
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
export const onDeleteAudio = /* GraphQL */ `
  subscription OnDeleteAudio($filter: ModelSubscriptionAudioFilterInput) {
    onDeleteAudio(filter: $filter) {
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
