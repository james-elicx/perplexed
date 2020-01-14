import Prism from '@zwolf/prism'
import { schema } from 'normalizr'

import { createParser } from './parser'

import { Track, toTrack, trackSchema } from './track'
import { MediaContainer, toMediaContainer } from './media-container'
import { toBoolean, toNumber } from './types'

/**
 * @ignore
 */
const playlistItemSchema = new schema.Object({
  track: trackSchema,
})

/**
 * @ignore
 */
const playlistSchema = new schema.Entity('playlists', {
  items: new schema.Array(playlistItemSchema),
})

/**
 * @ignore
 */
const playlistContainerSchema = new schema.Object({
  playlists: new schema.Array(playlistSchema),
})

export interface PlaylistItem {
  _type: string,
  id: number,
  playlistId: number,
  track: Track,
}

export interface NormalizedPlaylistItem extends Omit<PlaylistItem, 'track'> {
  track: number,
}

/**
 * @ignore
 */
const toPlaylistItem = (playlistId: number) => (
  $data: Prism<any>,
): PlaylistItem => {
  return {
    _type: 'playlistItem',
    id: $data.get('playlistItemID').value,
    playlistId,
    track: $data.transform(toTrack).value,
  }
}

export interface Playlist extends MediaContainer {
  _type: string,

  id: number,
  ratingKey: string,
  key: string,
  guid: string,
  type: string,
  title: string,
  summary: string,
  smart: boolean,
  playlistType: string,
  composite: boolean,
  viewCount: number,
  lastViewedAt: Date,
  duration: number,
  leafCount: number,
  addedAt: Date,
  updatedAt: Date,

  items: PlaylistItem[],
}

export interface NormalizedPlaylist extends Omit<Playlist, 'items'> {
  items: NormalizedPlaylistItem[],
}

/**
 * @ignore
 */
const toPlaylist = ($data: Prism<any>): Playlist => {
  if ($data.has('MediaContainer')) {
    $data = $data.get('MediaContainer')
  }

  const playlistId = $data.get('ratingKey').transform(toNumber).value

  return {
    ...$data.transform(toMediaContainer).value,

    _type: 'playlist',

    id: $data.get('ratingKey').transform(toNumber).value,

    ratingKey: $data.get('ratingKey').value,
    key: $data.get('key', { quiet: true }).value,
    guid: $data.get('guid', { quiet: true }).value,
    type: $data.get('type', { quiet: true }).value,
    title: $data.get('title').value,
    summary: $data.get('summary', { quiet: true }).value,
    smart: $data.get('smart').transform(toBoolean).value,
    playlistType: $data.get('playlistType').value,
    composite: $data.get('composite').value,
    viewCount: $data.get('viewCount', { quiet: true }).value,
    lastViewedAt: $data.get('lastViewedAt', { quiet: true }).value,
    duration: $data.get('duration').value,
    leafCount: $data.get('leafCount').value,
    addedAt: $data.get('addedAt', { quiet: true }).value,
    updatedAt: $data.get('updatedAt', { quiet: true }).value,
    items: $data
      .get('Metadata', { quiet: true })
      .toArray()
      .map(toPlaylistItem(playlistId)),
  }
}

export interface PlaylistContainer extends MediaContainer {
  _type: string,
  playlists: Playlist[],
}

export interface NormalizedPlaylistContainer
  extends Omit<PlaylistContainer, 'playlists'> {
  playlists: NormalizedPlaylist[],
}

/**
 * @ignore
 */
const toPlaylistContainer = ($data: Prism<any>): PlaylistContainer => {
  if ($data.has('MediaContainer')) {
    $data = $data.get('MediaContainer')
  }

  return {
    ...$data.transform(toMediaContainer).value,

    _type: 'playlistContainer',

    playlists: $data
      .get('Metadata')
      .toArray()
      .map(toPlaylist),
  }
}

/**
 * @ignore
 */
const parsePlaylist = createParser('playlist', toPlaylist)

/**
 * @ignore
 */
const parsePlaylistContainer = createParser(
  'playlistContainer',
  toPlaylistContainer,
)

export {
  playlistItemSchema,
  playlistSchema,
  playlistContainerSchema,
  toPlaylist,
  toPlaylistContainer,
  parsePlaylist,
  parsePlaylistContainer,
}
