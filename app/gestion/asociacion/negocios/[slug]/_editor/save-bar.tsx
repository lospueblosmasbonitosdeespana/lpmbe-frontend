'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog'
import { Save, ExternalLink, RotateCcw, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SaveBarProps {
  completion: number
  isDirty: boolean
  isSaving: boolean
  onSave: () => void
  onReset: () => void
  onPreview?: () => void
  lastSaved: Date | null
}

export function SaveBar({
  completion,
  isDirty,
  isSaving,
  onSave,
  onReset,
  onPreview,
  lastSaved,
}: SaveBarProps) {
  const [timeAgo, setTimeAgo] = useState<string | null>(null)

  useEffect(() => {
    if (!lastSaved) return
    function update() {
      if (!lastSaved) return
      const secs = Math.floor((Date.now() - lastSaved.getTime()) / 1000)
      if (secs < 60) setTimeAgo('justo ahora')
      else if (secs < 120) setTimeAgo('hace 1 min')
      else setTimeAgo(`hace ${Math.floor(secs / 60)} min`)
    }
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [lastSaved])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-sm shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative size-8 shrink-0">
            <svg className="size-8 -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16" cy="16" r="12"
                fill="none" stroke="currentColor"
                strokeWidth="3"
                className="text-muted/30"
              />
              <circle
                cx="16" cy="16" r="12"
                fill="none" stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 12}`}
                strokeDashoffset={`${2 * Math.PI * 12 * (1 - completion / 100)}`}
                strokeLinecap="round"
                className={cn(
                  'transition-all duration-500',
                  completion === 100 ? 'text-green-500' : 'text-amber-500'
                )}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">
              {completion}%
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {completion === 100 ? 'Perfil completo' : `${completion}% completado`}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {isSaving ? (
                <span className="text-blue-600 font-medium">Guardando...</span>
              ) : isDirty ? (
                <span className="text-amber-600 font-medium">Cambios sin guardar</span>
              ) : lastSaved && timeAgo ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-green-500 inline" />
                  Guardado {timeAgo}
                </span>
              ) : (
                'Sin cambios'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs text-muted-foreground gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Restablecer</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Restablecer datos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se descartarán todos los cambios realizados y se volverá al último estado guardado. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onReset}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sí, restablecer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {onPreview && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1.5"
              onClick={onPreview}
            >
              <ExternalLink className="size-3.5" />
              <span className="hidden sm:inline">Vista previa</span>
            </Button>
          )}

          <Button
            size="sm"
            className="h-8 px-4 text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-white border-0"
            onClick={onSave}
            disabled={!isDirty || isSaving}
          >
            <Save className="size-3.5" />
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  )
}
