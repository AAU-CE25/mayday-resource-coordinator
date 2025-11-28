'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { QUERY_KEYS } from '@/hooks/use-invalidate-queries'
import type { VolunteerCreate, VolunteerUpdate } from '@/lib/types'

export function useCreateVolunteer(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: VolunteerCreate) => {
      return api.post('/volunteers/', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })
      
      toast({
        title: 'Volunteer registered',
        description: 'The volunteer has been successfully registered.',
      })
      
      options?.onSuccess?.()
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to register volunteer. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteVolunteer() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (volunteerId: number) => {
      return api.delete(`/volunteers/${volunteerId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })
      
      toast({
        title: 'Volunteer removed',
        description: 'The volunteer has been successfully removed.',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove volunteer. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateVolunteer() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: VolunteerUpdate) => {
      return api.put(`/volunteers/${data.id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })
      
      toast({
        title: 'Volunteer updated',
        description: 'The volunteer has been successfully updated.',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update volunteer. Please try again.',
        variant: 'destructive',
      })
    },
  })
}
