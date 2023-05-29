import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled, AsyncCollection, AsyncItem } from "@aws-amplify/datastore";





type EagerAppUser = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<AppUser, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly cognitoId?: string | null;
  readonly name?: string | null;
  readonly birthday?: string | null;
  readonly Audio?: (Audio | null)[] | null;
  readonly photo?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyAppUser = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<AppUser, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly cognitoId?: string | null;
  readonly name?: string | null;
  readonly birthday?: string | null;
  readonly Audio: AsyncCollection<Audio>;
  readonly photo?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type AppUser = LazyLoading extends LazyLoadingDisabled ? EagerAppUser : LazyAppUser

export declare const AppUser: (new (init: ModelInit<AppUser>) => AppUser) & {
  copyOf(source: AppUser, mutator: (draft: MutableModel<AppUser>) => MutableModel<AppUser> | void): AppUser;
}

type EagerAudio = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Audio, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title?: string | null;
  readonly s3UrlPath?: string | null;
  readonly expoFileSytemPath?: string | null;
  readonly metadata?: string | null;
  readonly appuserID: string;
  readonly AppUser?: AppUser | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyAudio = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Audio, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title?: string | null;
  readonly s3UrlPath?: string | null;
  readonly expoFileSytemPath?: string | null;
  readonly metadata?: string | null;
  readonly appuserID: string;
  readonly AppUser: AsyncItem<AppUser | undefined>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Audio = LazyLoading extends LazyLoadingDisabled ? EagerAudio : LazyAudio

export declare const Audio: (new (init: ModelInit<Audio>) => Audio) & {
  copyOf(source: Audio, mutator: (draft: MutableModel<Audio>) => MutableModel<Audio> | void): Audio;
}