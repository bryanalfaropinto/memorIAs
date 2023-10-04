/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getAppUser = /* GraphQL */ `
  query GetAppUser($id: ID!) {
    getAppUser(id: $id) {
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
export const listAppUsers = /* GraphQL */ `
  query ListAppUsers(
    $filter: ModelAppUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAppUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncAppUsers = /* GraphQL */ `
  query SyncAppUsers(
    $filter: ModelAppUserFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncAppUsers(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
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
      nextToken
      startedAt
      __typename
    }
  }
`;
export const getAudio = /* GraphQL */ `
  query GetAudio($id: ID!) {
    getAudio(id: $id) {
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
export const listAudio = /* GraphQL */ `
  query ListAudio(
    $filter: ModelAudioFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAudio(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        s3Key
        expoFileSytemPath
        metadata
        transcribedAt
        transcriptionPath
        appuserID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const syncAudio = /* GraphQL */ `
  query SyncAudio(
    $filter: ModelAudioFilterInput
    $limit: Int
    $nextToken: String
    $lastSync: AWSTimestamp
  ) {
    syncAudio(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
      lastSync: $lastSync
    ) {
      items {
        id
        title
        s3Key
        expoFileSytemPath
        metadata
        transcribedAt
        transcriptionPath
        appuserID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
export const audioByAppuserID = /* GraphQL */ `
  query AudioByAppuserID(
    $appuserID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelAudioFilterInput
    $limit: Int
    $nextToken: String
  ) {
    audioByAppuserID(
      appuserID: $appuserID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        title
        s3Key
        expoFileSytemPath
        metadata
        transcribedAt
        transcriptionPath
        appuserID
        createdAt
        updatedAt
        _version
        _deleted
        _lastChangedAt
        __typename
      }
      nextToken
      startedAt
      __typename
    }
  }
`;
