import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Sparkles, Mail, CheckCircle2, ChevronRight, UserCheck, Calendar, MoreHorizontal } from 'lucide-react';
import { CandidateApplication } from '../../types';
import { MatchMeter } from '../ui/MatchMeter';
import { applicationService, isSupabaseConfigured } from '../../lib/supabase';

interface KanbanBoardProps {
  applications: CandidateApplication[];
  onOpenFollowUp: (app: CandidateApplication) => void;
}

const STAGES: CandidateApplication['stage'][] = [
  'Applied',
  'Screening',
  'AI Assessment',
  'Interview',
  'Offer',
];

const STAGE_COLORS: Record<string, string> = {
  'Applied': 'bg-blue-400',
  'Screening': 'bg-amber-400',
  'AI Assessment': 'bg-purple-400',
  'Interview': 'bg-emerald-400',
  'Offer': 'bg-cyan-400',
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ applications, onOpenFollowUp }) => {
  const [appsState, setAppsState] = useState<CandidateApplication[]>(applications);

  const grouped: Record<string, CandidateApplication[]> = {
    'Applied': [],
    'Screening': [],
    'AI Assessment': [],
    'Interview': [],
    'Offer': [],
  };

  appsState.forEach(app => {
    if (grouped[app.stage]) {
      grouped[app.stage].push(app);
    } else {
      grouped['Applied'].push({ ...app, stage: 'Applied' });
    }
  });

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStage = destination.droppableId as CandidateApplication['stage'];

    setAppsState(prev => prev.map(app =>
      app.id === draggableId ? { ...app, stage: newStage } : app
    ));

    if (isSupabaseConfigured()) {
      const statusMap: Record<string, string> = {
        'Applied': 'applied',
        'Screening': 'screening',
        'AI Assessment': 'assessment',
        'Interview': 'interview',
        'Offer': 'offer',
      };
      applicationService.updateStatus(draggableId, statusMap[newStage] as 'applied' | 'screening' | 'assessment' | 'interview' | 'offer');
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Active Recruitment Kanban Pipeline
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-mono">
              Live AI Rankings
            </span>
          </h2>
          <p className="text-xs text-gray-400">Drag candidates between stages • Changes save automatically</p>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageApps = grouped[stage] || [];

            return (
              <div key={stage} className="bg-[#111827] border border-[#27272A] rounded-2xl p-4 flex flex-col min-w-[240px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#27272A]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${STAGE_COLORS[stage] || 'bg-blue-400'}`} />
                    <h3 className="text-xs font-bold text-gray-200">{stage}</h3>
                  </div>
                  <span className="px-2 py-0.5 bg-[#18181B] text-gray-400 border border-[#27272A] rounded-full text-[10px] font-mono">
                    {stageApps.length}
                  </span>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 flex-1 overflow-y-auto max-h-[600px] min-h-[100px] rounded-xl transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-500/5 ring-1 ring-blue-500/30' : ''
                      }`}
                    >
                      {stageApps.length === 0 && !snapshot.isDraggingOver ? (
                        <div className="py-8 text-center text-xs text-gray-500 border border-dashed border-[#27272A] rounded-xl">
                          No candidates
                        </div>
                      ) : (
                        stageApps.map((app, index) => (
                          <Draggable key={app.id} draggableId={app.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-[#18181B] border border-[#27272A] hover:border-blue-500/40 rounded-xl p-4 space-y-3 transition-all group ${
                                  snapshot.isDragging ? 'shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/30' : ''
                                }`}
                              >
                                {/* Candidate Info */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={app.candidateAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                      alt={app.candidateName}
                                      className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                                    />
                                    <div>
                                      <div className="text-xs font-bold text-white group-hover:text-blue-300">
                                        {app.candidateName || 'Unknown'}
                                      </div>
                                      <div className="text-[10px] text-gray-400 truncate max-w-[120px]">
                                        {app.jobTitle}
                                      </div>
                                    </div>
                                  </div>
                                  <MatchMeter score={app.matchScore} size="sm" showLabel={false} />
                                </div>

                                {/* Application Info */}
                                <div className="text-[11px] text-gray-400 space-y-1">
                                  <div className="flex items-center gap-1.5 text-gray-300">
                                    <Calendar className="w-3 h-3 text-blue-400" />
                                    Applied: {app.appliedDate}
                                  </div>
                                  {app.nextStep && (
                                    <div className="text-[10px] text-purple-300 bg-purple-500/10 p-1.5 rounded border border-purple-500/20">
                                      Next: {app.nextStep}
                                    </div>
                                  )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center justify-between pt-2 border-t border-[#27272A] gap-1">
                                  <button
                                    onClick={() => onOpenFollowUp(app)}
                                    className="p-1.5 text-gray-400 hover:text-purple-300 hover:bg-purple-500/20 rounded-lg transition-colors text-[11px] flex items-center gap-1"
                                    title="Generate AI Follow-up Email"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-purple-400" /> AI Mail
                                  </button>
                                  <button
                                    className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors"
                                    title="More actions"
                                  >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};
