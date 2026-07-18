import type { NavigationItem, Permission, Role } from '@smena/contracts'

const rolePermissions: Record<Role, readonly Permission[]> = {
  contractor: [
    'organization.read', 'organization.manage', 'object.read', 'object.manage',
    'member.read', 'member.manage', 'shift.read.organization', 'task.read.object',
    'task.create', 'task.manage', 'issue.create', 'issue.comment', 'issue.manage', 'report.read',
  ],
  foreman: [
    'organization.read', 'object.read', 'member.read', 'shift.read.self', 'shift.read.team',
    'shift.manage.self', 'task.read.self', 'task.read.object', 'task.create', 'task.manage',
    'issue.create', 'issue.comment', 'issue.manage',
  ],
  worker: [
    'organization.read', 'object.read', 'shift.read.self', 'shift.manage.self',
    'task.read.self', 'issue.create', 'issue.comment',
  ],
}

const roleNavigation: Record<Role, readonly NavigationItem[]> = {
  contractor: [
    { key: 'overview', label: 'Обзор' }, { key: 'objects', label: 'Объекты' },
    { key: 'team', label: 'Команда' }, { key: 'tasks', label: 'Задачи' },
    { key: 'timesheet', label: 'Табель' }, { key: 'reports', label: 'Отчёты' },
  ],
  foreman: [
    { key: 'today', label: 'Сегодня' }, { key: 'team', label: 'Команда' },
    { key: 'tasks', label: 'Задачи' }, { key: 'messages', label: 'Сообщения' },
  ],
  worker: [
    { key: 'today', label: 'Главная' }, { key: 'tasks', label: 'Мои задачи' },
    { key: 'messages', label: 'Сообщения' }, { key: 'profile', label: 'Профиль' },
  ],
}

export function permissionsFor(role: Role): Permission[] {
  return [...rolePermissions[role]]
}

export function navigationFor(role: Role): NavigationItem[] {
  return [...roleNavigation[role]]
}

export function can(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission)
}
