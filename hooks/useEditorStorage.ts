// hooks/useEditorStorage.ts
import { useCallback } from 'react'

export interface SavedDesign {
  templateId: number
  templateTitle: string
  savedAt: string
  fabricJson: object
}

const STORAGE_PREFIX = 'artegenia_design_'

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
        localStorage.setItem(`${STORAGE_PREFIX}${templateId}`, JSON.stringify(data))
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
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${templateId}`)
      if (!raw) return null
      return JSON.parse(raw) as SavedDesign
    } catch (e) {
      console.error('Error al cargar diseño:', e)
      return null
    }
  }, [])

  const deleteDesign = useCallback((templateId: number) => {
    localStorage.removeItem(`${STORAGE_PREFIX}${templateId}`)
  }, [])

  const hasSavedDesign = useCallback((templateId: number): boolean => {
    return localStorage.getItem(`${STORAGE_PREFIX}${templateId}`) !== null
  }, [])

  const listSavedDesigns = useCallback((): SavedDesign[] => {
    const results: SavedDesign[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        try {
          const raw = localStorage.getItem(key)
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
