import test from 'ava'
import nock from 'nock'

import ServerConnection from './serverConnection'

const URI = 'http://192.168.1.100:32400'
const PARENT_HEADERS = {
  'X-Plex-Token': 'abc'
}
const PARENT = {
  headers: () => PARENT_HEADERS
}

test.beforeEach((t) => {
  t.context.sc = new ServerConnection(URI, PARENT)
})

test('constructor without parent', (t) => {
  const sc = new ServerConnection(URI)
  t.is(sc.uri, URI)
  t.is(sc.parent, undefined)
})

test('constructor with parent', (t) => {
  const sc = new ServerConnection(URI, PARENT)
  t.is(sc.uri, URI)
  t.is(sc.parent, PARENT)
})

test('headers', (t) => {
  const { sc } = t.context
  t.deepEqual(sc.headers(), PARENT_HEADERS)
})

test('getUrl', (t) => {
  const { sc } = t.context
  const url = sc.getUrl('/path', { key: 'value' })
  t.is(url, 'http://192.168.1.100:32400/path?key=value')
})

test('getAuthenticatedUrl', (t) => {
  const { sc } = t.context
  const url = sc.getAuthenticatedUrl('/path', { key: 'value' })
  t.is(url, 'http://192.168.1.100:32400/path?key=value&X-Plex-Token=abc')
})

test('fetch', async (t) => {
  const { sc } = t.context

  const scope = nock(URI)
    .get('/path')
    .reply(200, {})

  const res = await sc.fetch('/path')

  t.deepEqual(res, {})

  scope.done()
})

test('fetch with params', async (t) => {
  const { sc } = t.context

  const scope = nock(URI)
    .post('/path?key=value')
    .reply(200, {})

  const res = await sc.fetch('/path', {
    method: 'post',
    params: {
      key: 'value'
    }
  })

  t.deepEqual(res, {})

  scope.done()
})
