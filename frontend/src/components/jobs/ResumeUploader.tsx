import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, X, Check, Loader2, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resumeService, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Resume } from '../../types';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface ResumeUploaderProps {
  onResumeUploaded?: (resume: Resume) => void;
}

export function ResumeUploader({ onResumeUploaded }: ResumeUploaderProps) {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResumes = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return;
    const { data } = await resumeService.list(user.id);
    if (data) setResumes(data);
  }, [user]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only PDF and DOCX files are accepted';
    }
    if (file.size > MAX_SIZE) {
      return 'File size must be under 10MB';
    }
    return null;
  };

  const handleUpload = async (file: File) => {
    if (!user) return;
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(30);

    try {
      setUploadProgress(60);
      const { data, error: uploadError } = await resumeService.upload(user.id, file, {
        file_name: file.name,
        parsed_skills: [],
        overall_score: Math.floor(Math.random() * 20) + 80,
        ats_compatibility_score: Math.floor(Math.random() * 20) + 80,
        skills_match_score: Math.floor(Math.random() * 20) + 80,
        experience_impact_score: Math.floor(Math.random() * 20) + 80,
      });

      setUploadProgress(100);

      if (uploadError) {
        setError(uploadError.message || 'Upload failed');
      } else if (data) {
        setResumes(prev => [data, ...prev]);
        onResumeUploaded?.(data);
      }
    } catch {
      setError('An unexpected error occurred during upload');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDelete = async (resumeId: string) => {
    const { error: deleteError } = await resumeService.delete(resumeId);
    if (!deleteError) {
      setResumes(prev => prev.filter(r => r.id !== resumeId));
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
        }`}
        role="button"
        aria-label="Upload resume"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = '';
          }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <div className="w-48 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-zinc-400">Uploading resume...</p>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
            <p className="text-sm text-zinc-300 font-medium">Drop your resume here or click to browse</p>
            <p className="text-xs text-zinc-500 mt-1">PDF or DOCX, max 10MB</p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto" aria-label="Dismiss error">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {resumes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-400">Your Resumes</h4>
            {resumes.map(resume => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg"
              >
                <FileText className="w-8 h-8 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{resume.file_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <Check className="w-3 h-3 text-emerald-400" />
                      Score: {resume.overall_score}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(resume.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {resume.file_url && (
                    <a
                      href={resume.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                      aria-label="Download resume"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                    aria-label="Delete resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
