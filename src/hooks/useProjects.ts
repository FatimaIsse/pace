import { useEffect, useState } from 'react'
import { createDoc, patchDoc, removeDoc, subscribeToCollection } from '@/firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import type { Project, ProjectStatus } from '@/types'

const COLLECTION = 'projects'

export function useProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProjects([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeToCollection<Omit<Project, 'id'>>(user.uid, COLLECTION, (items) => {
      setProjects(items)
      setLoading(false)
    })
    return unsubscribe
  }, [user])

  async function addProject(name: string, notes = '') {
    if (!user) return
    const project: Omit<Project, 'id'> = {
      name,
      notes,
      status: 'just_started',
      createdAt: new Date().toISOString(),
      archivedAt: null,
    }
    return createDoc(user.uid, COLLECTION, project)
  }

  async function updateProjectStatus(projectId: string, status: ProjectStatus) {
    if (!user) return
    await patchDoc(user.uid, COLLECTION, projectId, { status })
  }

  async function updateProject(projectId: string, data: Partial<Project>) {
    if (!user) return
    await patchDoc(user.uid, COLLECTION, projectId, data)
  }

  async function archiveProject(projectId: string) {
    if (!user) return
    await patchDoc(user.uid, COLLECTION, projectId, { archivedAt: new Date().toISOString() })
  }

  async function removeProject(projectId: string) {
    if (!user) return
    await removeDoc(user.uid, COLLECTION, projectId)
  }

  return { projects, loading, addProject, updateProjectStatus, updateProject, archiveProject, removeProject }
}
