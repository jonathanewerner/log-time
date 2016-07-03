#!/usr/bin/env node
/* eslint-disable max-len */
'use strict'
const cat = require('shelljs').cat
const findIndex = require('lodash/findIndex')
const transform = require('lodash/transform')
const groupBy = require('lodash/groupBy')
const sortBy = require('lodash/sortBy')
const sumBy = require('lodash/sumBy')
const invariant = require('invariant')
const moment = require('moment')
const chalk = require('chalk')
const humanizeDuration = require('humanize-duration')

/* eslint-disable */
Date.prototype.addHours = function(h) {
  this.setHours(this.getHours() + h)
  return this
}
/* eslint-enable */

const WAKE = 'wake'
const SLEEP = 'sleep'
const WORK = 'work'
const PERSONAL = 'personal'

const file = cat('~/.time/log.txt')
const lines = file.split('\n').filter((line) => line)

const entries = lines.map((line) => {
  const parsed = JSON.parse(line)
  return { date: new Date(parsed.date), action: parsed.action }
})

const firstWakeIndex = findIndex(entries, (entry) => entry.action === WAKE)
const firstSleepIndex = findIndex(entries, (entry) => entry.action === SLEEP)
invariant(
  firstSleepIndex === -1 || firstWakeIndex < firstSleepIndex,
  'The first "wake"" entry should come before the first "sleep" entry.'
)

function getTimeSlots(timeEntries) {
  let working = true
  let currentSlot
  const endSlot = (slot, entry) => {
    slot.end = entry.date // eslint-disable-line no-param-reassign
    slot.duration = Math.floor(( // eslint-disable-line no-param-reassign
      slot.end.getTime() - slot.start.getTime()) / 1000)
    invariant(
      slot.duration > 0,
      `slot.duration is negative for slot ${JSON.stringify(slot, null, 2)}`
    )
  }
  const makeNewSlot = (entry) => ({ start: entry.date, type: working ? 'work' : 'personal' })
  const result = transform(timeEntries, (slots, entry) => {
    switch (entry.action) { // eslint-disable-line default-case
      case WAKE:
        currentSlot = makeNewSlot(entry)
        break
      case SLEEP: {
        if (!currentSlot) return
        invariant(currentSlot, 'SlEEP action executed without a current slot.')
        endSlot(currentSlot, entry)
        slots.push(currentSlot)
        currentSlot = null
        break
      }
      case PERSONAL: {
        if (!working) return
        working = false
        endSlot(currentSlot, entry)
        slots.push(currentSlot)
        currentSlot = makeNewSlot(entry)
        break
      }
      case WORK: {
        if (working) return
        working = true
        endSlot(currentSlot, entry)
        slots.push(currentSlot)
        currentSlot = makeNewSlot(entry)
        break
      }
    }
  }, [])
  const resultShortsFilteredOut = result.filter((slot) => slot.duration > 60)

  if (currentSlot) {
    endSlot(currentSlot, { date: new Date().addHours(1) })
    currentSlot.current = true
    resultShortsFilteredOut.push(currentSlot)
  }
  return resultShortsFilteredOut
}

const durationPretty = (seconds) => humanizeDuration(seconds * 1000)
const time = (dateObject) => moment(dateObject).utcOffset(1).format('h:mma')
const date = (dateObject) => moment(dateObject).utcOffset(1).format('ddd, D.M')

function printTimeSlots(timeSlots) {
  timeSlots.forEach((slot) => {
    const s = `${slot.current ? 'Current' : date(slot.start)}: ${time(slot.start)}—${time(slot.end)} (${durationPretty(slot.duration)})`
    const style = slot.type === PERSONAL
      ? (str) => chalk.dim(str)
      : (str) => chalk.black(str)
    console.log(style(s))
  })
}

function printTimeSlotsByYearWeek(timeSlotsByYearWeek) {
  sortBy(Object.keys(timeSlotsByYearWeek)).forEach((yearWeek) => {
    const timeSlotsForYearWeek = timeSlotsByYearWeek[yearWeek]
    console.info(chalk.yellow(yearWeek))
    printTimeSlots(timeSlotsForYearWeek)
    const overallTimeSpentWorking = sumBy(timeSlotsForYearWeek.filter((slot) => slot.type === WORK), (slot) => slot.duration)
    const overallTimeSpentPersonal = sumBy(timeSlotsForYearWeek.filter((slot) => slot.type === PERSONAL), (slot) => slot.duration)
    console.info()
    overallTimeSpentWorking && console.info(`Working: ${durationPretty(overallTimeSpentWorking)}`)
    overallTimeSpentPersonal && console.info(chalk.dim(`Personal: ${durationPretty(overallTimeSpentPersonal)}`))
    console.info()
  })
}

const slots = getTimeSlots(entries)
const groupedByYearWeek = groupBy(slots, (slot) => `${moment(slot.start).year()}-${moment(slot.start).week()}`)

printTimeSlotsByYearWeek(groupedByYearWeek)
