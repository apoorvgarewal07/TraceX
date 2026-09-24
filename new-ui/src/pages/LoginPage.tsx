import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-[#131114] text-[#EDE8DE] flex flex-col items-center justify-center p-6 relative">
      <div className="absolute top-6 left-6">
        <Link to="/" className="text-xs text-[#A8A399] hover:text-[#B8935F] flex items-center gap-1.5 transition-colors">
          <span>&larr; Return to Overview</span>
        </Link>
      </div>

      <div className="w-full flex justify-center">
        <LoginForm onSuccess={() => navigate('/', { replace: true })} />
      </div>
    </div>
  );
}
