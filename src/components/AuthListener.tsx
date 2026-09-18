import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logoutUser } from '../features/auth/authSlice';
import { useToast } from './ui/ToastContext';

export const AuthListener = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Ref — мгновенный синхронный щит от параллельных событий
  const isLockActive = useRef(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (!isAuthenticated) return;
      if (isLockActive.current) return;

      isLockActive.current = true; // Синхронно ставим щит

      dispatch(logoutUser());
      showToast('Сессия истекла, войдите заново', 'error');
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [isAuthenticated, navigate, dispatch, showToast]);

  // Сбрасываем щит при следующем входе
  useEffect(() => {
    if (isAuthenticated) {
      isLockActive.current = false;
    }
  }, [isAuthenticated]);

  return null;
};