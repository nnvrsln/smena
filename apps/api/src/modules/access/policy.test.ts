import assert from 'node:assert/strict'
import test from 'node:test'
import { can, navigationFor, permissionsFor } from './policy.js'

test('worker cannot manage organization, objects or issues', () => {
  assert.equal(can('worker', 'organization.manage'), false)
  assert.equal(can('worker', 'object.manage'), false)
  assert.equal(can('worker', 'issue.manage'), false)
  assert.equal(can('worker', 'shift.manage.self'), true)
})

test('foreman receives operational permissions without organization management', () => {
  assert.equal(can('foreman', 'shift.read.team'), true)
  assert.equal(can('foreman', 'task.manage'), true)
  assert.equal(can('foreman', 'organization.manage'), false)
})

test('contractor navigation and permissions include organization scope', () => {
  assert.equal(permissionsFor('contractor').includes('shift.read.organization'), true)
  assert.deepEqual(navigationFor('contractor').map((item) => item.key), ['overview', 'objects', 'team', 'tasks', 'timesheet', 'reports'])
})
