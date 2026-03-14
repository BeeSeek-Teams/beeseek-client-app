import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';

export const useJobSocket = () => {
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;
    socketService.connect(accessToken);
  }, [accessToken]);

  const joinJobRoom = (jobId: string) => {
    socketService.emit('joinJob', jobId);
  };

  const leaveJobRoom = (jobId: string) => {
    socketService.emit('leaveJob', jobId);
  };

  const onJobUpdate = (callback: (job: any) => void) => {
    return socketService.on('jobUpdate', callback);
  };

  return {
    joinJobRoom,
    leaveJobRoom,
    onJobUpdate,
  };
};
