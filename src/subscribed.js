'use strict';

const fs = require('fs');

class Subscribed {
  constructor(filepath) {
    this.collection = []
    try {
      if (fs.existsSync(filepath)) {
        this.collection = JSON.parse(fs.readFileSync(filepath))
      }
    } catch (err) {
      console.error(err)
    }
  }

  addUser(user) {
    this.collection = [...new Set([...this.collection, user])]
  }

  getUsers() {
    return this.collection
  }

  isFollowing(user) {
    return this.collection.includes(user)
  }

  load(filepath) {
    try {
      if (fs.existsSync(filepath)) {
        this.collection = JSON.parse(fs.readFileSync(filepath))
      }
    } catch (err) {
      console.error(err)
    }
  }

  save(filepath) {
    fs.writeFileSync(filepath, JSON.stringify(this.collection))
  }
}

module.exports = Subscribed
