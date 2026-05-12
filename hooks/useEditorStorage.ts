"use client";

import { useCallback } from 'react'

export interface SavedDesign {
  templateId: number
  templateTitle: string
  savedAt: string
  fabricJson: object
}

const STORAGE_PREFIX = 'artegenia_design_'

const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(key)
  },
  set: (key: string, value: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, value)
  },
  remove: (key: string) => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  },
  length: () => {
    if (typeof window === 'undefined') return 0
    return localStorage.length
  },
  key: (i: number) => {
    if (typeof window === 'undefined') return null
    return localStorage.key(i)
  },
}

export function useEditorStorage() {
  const saveDesign = useCallback(
    (templateId: number, templateTitle: string, fabricJson: object): boolean => {
      try {
        const data: SavedDesign = {
          templateId,
          templateTitle,
          savedAt: new Date().toISOString(),
          fabricJson,
        }
        storage.set(`${STORAGE_PREFIX}${templateId}`, JSON.stringify(data))
        return true
      } catch (e) {
        console.error('Error al guardar diseño:', e)
        return false
      }
    },
    []
  )

  const loadDesign = useCallback((templateId: number): SavedDesign | null => {
    try {
      const raw = storage.get(`${STORAGE_PREFIX}${templateId}`)
      if (!raw) return null
      return JSON.parse(raw) as SavedDesign
    } catch (e) {
      console.error('Error al cargar diseño:', e)
      return null
    }
  }, [])

  const deleteDesign = useCallback((templateId: number) => {
    storage.remove(`${STORAGE_PREFIX}${templateId}`)
  }, [])

  const hasSavedDesign = useCallback((templateId: number): boolean => {
    return storage.get(`${STORAGE_PREFIX}${templateId}`) !== null
  }, [])

  const listSavedDesigns = useCallback((): SavedDesign[] => {
    const results: SavedDesign[] = []
    const len = storage.length()
    for (let i = 0; i < len; i++) {
      const key = storage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        try {
          const raw = storage.get(key)
          if (raw) results.push(JSON.parse(raw) as SavedDesign)
        } catch {}
      }
    }
    return results.sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    )
  }, [])

  return { saveDesign, loadDesign, deleteDesign, hasSavedDesign, listSavedDesigns }
}
