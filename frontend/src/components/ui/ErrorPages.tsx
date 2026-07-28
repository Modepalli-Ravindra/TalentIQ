import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Shield, Server, FileQuestion } from 'lucide-react';

interface ErrorPageProps {
  code: number;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
}

const errorConfig: Record<number, { icon: React.ReactNode; color: string; bg: string }> = {
  404: {
    icon: <FileQuestion className="w-16 h-16" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  403: {
    icon: <Shield className="w-16 h-16" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  500: {
    icon: <Server className="w-16 h-16" />,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
};

const defaultTitles: Record<number, string> = {
  404: 'Page Not Found',
  403: 'Access Denied',
  500: 'Server Error',
};

const defaultMessages: Record<number, string> = {
  404: 'The page you are looking for does not exist or has been moved.',
  403: 'You do not have permission to access this resource.',
  500: 'Something went wrong on our end. Please try again later.',
};

export const ErrorPage: React.FC<ErrorPageProps> = ({
  code,
  title,
  message,
  onRetry,
  onGoHome,
  onGoBack,
}) => {
  const config = errorConfig[code] || errorConfig[500];

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className={`inline-flex items-center justify-center w-24 h-24 ${config.bg} rounded-3xl mb-6`}>
          <div className={config.color}>{config.icon}</div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18181B] border border-[#27272A] text-gray-400 text-xs font-mono mb-4">
          Error {code}
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-2">
          {title || defaultTitles[code] || 'Something Went Wrong'}
        </h1>

        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          {message || defaultMessages[code] || 'An unexpected error occurred. Please try again.'}
        </p>

        <div className="flex items-center justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#18181B] border border-[#27272A] text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          )}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#18181B] border border-[#27272A] text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC<{ onGoHome?: () => void; onGoBack?: () => void }> = ({ onGoHome, onGoBack }) => (
  <ErrorPage code={404} onGoHome={onGoHome} onGoBack={onGoBack} />
);

export const ForbiddenPage: React.FC<{ onGoHome?: () => void }> = ({ onGoHome }) => (
  <ErrorPage code={403} onGoHome={onGoHome} />
);

export const ServerErrorPage: React.FC<{ onRetry?: () => void; onGoHome?: () => void }> = ({ onRetry, onGoHome }) => (
  <ErrorPage code={500} onRetry={onRetry} onGoHome={onGoHome} />
);
