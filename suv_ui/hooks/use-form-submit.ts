/**
 * Reusable form submission hook
 * Eliminates duplicate form handling logic across components
 */

import { useState } from "react"

interface UseFormSubmitOptions<T> {
  onSubmit: (data: T) => Promise<void>
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseFormSubmitReturn<T> {
  isSubmitting: boolean
  error: Error | null
  handleSubmit: (e: React.FormEvent, data: T) => Promise<void>
  reset: () => void
}


export function useFormSubmit<T = unknown>({
  onSubmit,
  onSuccess,
  onError,
}: UseFormSubmitOptions<T>): UseFormSubmitReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const handleSubmit = async (e: React.FormEvent, data: T) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(data)
      
      if (onSuccess) {
        onSuccess(data)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred")
      setError(error)
      
      if (onError) {
        onError(error)
      } else {
        console.error("Form submission error:", error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    setIsSubmitting(false)
    setError(null)
  }

  return {
    isSubmitting,
    error,
    handleSubmit,
    reset,
  }
}
