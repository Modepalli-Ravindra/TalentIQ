import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Sparkles, X, Loader2, MapPin, Wifi, Tag } from 'lucide-react';
import { searchApi } from '../../lib/api';

interface SemanticSearchBarProps {
  onResults: (results: any[], query: string) => void;
  onLoading?: (loading: boolean) => void;
  initialQuery?: string;
  placeholder?: string;
}

export const SemanticSearchBar: React.FC<SemanticSearchBarProps> = ({
  onResults,
  onLoading,
  initialQuery = '',
  placeholder = 'Search naturally... e.g. "remote Python AI jobs with FastAPI"',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [location, setLocation] = useState('');
  const [remoteOnly, setRemoteOnly] = useState<boolean | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      onResults([], searchQuery);
      return;
    }

    setIsSearching(true);
    onLoading?.(true);

    try {
      const params: Record<string, any> = { q: searchQuery, limit: 20 };
      if (location) params.location = location;
      if (remoteOnly !== undefined) params.is_remote = remoteOnly;

      const response = await searchApi.semantic(params);
      onResults(response.data || [], searchQuery);
    } catch (error) {
      console.error('Semantic search failed:', error);
      onResults([], searchQuery);
    } finally {
      setIsSearching(false);
      onLoading?.(false);
    }
  }, [location, remoteOnly, onResults, onLoading]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(value), 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    performSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setLocation('');
    setRemoteOnly(undefined);
    onResults([], '');
    inputRef.current?.focus();
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="w-full space-y-3">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-blue-400" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-24 py-4 bg-[#18181B] border border-[#27272A] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
          />

          <div className="absolute right-3 flex items-center gap-1.5">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#27272A] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-[#27272A]'}`}
            >
              <Tag className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </form>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 px-2 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#18181B] border border-[#27272A] rounded-xl">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none w-32"
            />
          </div>

          <button
            type="button"
            onClick={() => setRemoteOnly(remoteOnly === true ? undefined : true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
              remoteOnly === true
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                : 'bg-[#18181B] border-[#27272A] text-gray-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            Remote Only
          </button>

          {query && (
            <span className="text-xs text-gray-500">
              Press Enter or type to search
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 px-1">
        <span className="text-[10px] text-blue-400/70 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">AI</span>
        <span className="text-[10px] text-gray-500">Semantic search — understands intent and synonyms</span>
      </div>
    </div>
  );
};
