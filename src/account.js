import { btoa } from 'isomorphic-base64'

import { requestJSON, requestXML } from './utils/request'
import { parseResources } from './types/resources'
import { parseUser, parseSignIn } from './types/user'
import { parsePin } from './types/pin'

const PLEX_API = 'https://plex.tv'

/**
 * A plex.tv account
 *
 * @class Account
 * @param {string} [authToken] Plex auth token
 */

export default class Account {
  constructor (client, authToken) {
    this.client = client
    this.authToken = authToken
  }

  /**
   * Headers we need to send to Plex whenever we make a request
   *
   * @private
   */

  headers () {
    return {
      ...this.client.headers(),
      'X-Plex-Token': this.authToken || undefined
    }
  }

  /**
   * Make a JSON request to the Plex.tv API
   *
   * @private
   */

  fetch (path, options = {}) {
    const url = PLEX_API + path
    return requestJSON(url, {
      ...options,
      headers: {
        ...options.headers,
        ...this.headers()
      }
    })
  }

  /**
   * Make an XML request to the Plex.tv API
   *
   * @private
   */

  fetchXML (path, options = {}) {
    const url = PLEX_API + path
    return requestXML(url, {
      ...options,
      headers: {
        ...options.headers,
        ...this.headers()
      }
    })
  }

  /**
   * Log in to a Plex account
   *
   * @param {string} username
   * @param {string} password
   * @returns {Promise} - User info
   */

  authenticate (username, password) {
    const token = btoa(`${username}:${password}`)
    // we use requestJSON instead of this.fetch because if you send
    // the X-Plex-Token header it won't actually switch accounts.
    return requestJSON(`${PLEX_API}/users/sign_in.json`, {
      method: 'POST',
      headers: {
        ...this.client.headers(),
        authorization: `Basic ${token}`
      }
    })
      .then((res) => parseSignIn(res))
      .then((user) => {
        this.authToken = user.authToken
        return user
      })
  }

  requestPin () {
    return this.fetch('/pins.json', { method: 'POST' })
      .then((res) => parsePin(res))
  }

  checkPin (pinId) {
    return this.fetch(`/pins/${pinId}.json`)
      .then((res) => parsePin(res))
      .then((pin) => {
        if (pin.authToken != null) {
          this.authToken = pin.authToken
        }
        return pin
      })
  }

  /**
   * Fetch information about the currently logged in user
   *
   * @returns {Promise}
   */

  info () {
    return this.fetch('/api/v2/user')
      .then((res) => parseUser(res))
  }

  /**
   * Fetch a list of servers and clients connected to this plex account.
   * Useful for figuring out which server to connect to.
   *
   * Note: this API doesn't support JSON at the moment, so we need
   * to parse the response as XML.
   *
   * @returns {Promise}
   */

  resources () {
    return this.fetchXML('/api/resources', {
      params: {
        includeHttps: 1,
        includeRelay: 1
      }
    })
      .then((res) => parseResources(res))
  }

  /**
   * Fetch a list of all the servers
   *
   * @returns {Promise}
   */

  servers () {
    return this.resources().then((resources) => ({
      ...resources,
      devices: resources.devices.filter((device) =>
        device.provides.includes('server'))
    }))
  }

  /**
   * Fetch a list of devices attached to an account
   *
   * @returns {Promise}
   */

  devices () {
    return this.fetch('/devices.json')
  }

  /**
   * Remove a device from the account
   */

  removeDevice (deviceId) {
    return this.fetch(`/devices/${deviceId}.json`, {
      method: 'DELETE'
    })
  }
}
