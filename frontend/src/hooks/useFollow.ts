import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as usersApi from '../api/users'

export function useFollow(username: string) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['profile', username] })
    queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] })
  }

  const follow = useMutation({
    mutationFn: () => usersApi.followUser(username),
    onSuccess: invalidate,
  })

  const unfollow = useMutation({
    mutationFn: () => usersApi.unfollowUser(username),
    onSuccess: invalidate,
  })

  return { follow: follow.mutate, unfollow: unfollow.mutate, isLoading: follow.isPending || unfollow.isPending }
}
