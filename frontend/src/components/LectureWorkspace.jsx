import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Download,
  MoreVertical,
  PlayCircle,
  FileText,
  HelpCircle,
  Layers,
  Calendar,
  Briefcase,
  ScrollText,
  Play,
  ArrowRight,
  LayoutDashboard,
  CheckCircle2
} from 'lucide-react';
import Button from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from './ui/Card';
import Badge from './ui/Badge';
import { LoadingPanel } from './ui/Spinner';
import NotesWorkspace from '@/features/studypack/NotesWorkspace';
import TopicsView from './TopicsView';
import QuizWorkspace from '@/features/quiz/QuizWorkspace';
import FlashcardsWorkspace from '@/features/flashcards/FlashcardsWorkspace';
import RevisionWorkspace from '@/features/revision/RevisionWorkspace';
import InterviewWorkspace from '@/features/interview/InterviewWorkspace';
import TranscriptView from './TranscriptView';
import { parseNotes, slugify } from '@/features/studypack/lib/notes';

export default function LectureWorkspace({ studyPack, taskId, onBack, activeTabOverride = null, backLabel = 'Back to Dashboard' }) {
  const [internalActiveTab, setInternalActiveTab] = useState('overview');
  const [seekTime, setSeekTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const activeTab = activeTabOverride || internalActiveTab;
  const setActiveTab = setInternalActiveTab;

  // Real slugs of the rendered Notes sections — used to make revision-plan
  // topics clickable only when they genuinely map to a section. Kept above the
  // early return so the Hook order is stable.
  const noteSectionSlugs = useMemo(
    () => new Set(parseNotes(studyPack?.notes_markdown || '').sections.map((s) => s.slug)),
    [studyPack],
  );

  if (!studyPack) {
    return <LoadingPanel label="Loading your study pack…" minHeight="60vh" />;
  }

  const { video_id, title, overview, topics, quiz, flashcards, revision_plan, interview_questions } = studyPack;

  const resolveTopicToNotes = (topicText) => {
    const s = slugify(topicText || '');
    return s && noteSectionSlugs.has(s) ? s : null;
  };
  const openNotesAnchor = (slug) => {
    setActiveTab('notes');
    // Jump (not smooth) — this is a cross-tab navigation, and it runs after the
    // Notes tab has had a frame to mount. A second pass covers slower layout.
    const scrollToSection = () =>
      document.getElementById(slug)?.scrollIntoView({ block: 'start' });
    window.setTimeout(scrollToSection, 120);
    window.setTimeout(scrollToSection, 380);
  };
  const downloadUrl = `http://127.0.0.1:8000/download/${taskId}`;

  // Calculated resource counts
  const totalQuiz = quiz?.length || 0;
  const totalFlashcards = flashcards?.length || 0;
  const totalTopics = topics?.length || 0;
  const totalRevision = revision_plan?.length || 0;
  const totalInterview = (interview_questions?.basic?.length || 0) + (interview_questions?.intermediate?.length || 0) + (interview_questions?.advanced?.length || 0);

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, count: null },
    { id: 'notes', label: 'Notes', icon: FileText, count: null },
    { id: 'topics', label: 'Topics', icon: Layers, count: totalTopics },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle, count: totalQuiz },
    { id: 'flashcards', label: 'Flashcards', icon: Layers, count: totalFlashcards },
    { id: 'revision', label: 'Revision', icon: Calendar, count: totalRevision },
    { id: 'interview', label: 'Interview', icon: Briefcase, count: totalInterview },
    { id: 'transcript', label: 'Transcript', icon: ScrollText, count: null }
  ];

  // Video Seek Handler
  const handleSeek = (seconds) => {
    setSeekTime(seconds);
    setIsPlaying(true);
    setActiveTab('overview');
  };

  const iframeSrc = video_id
    ? `https://www.youtube.com/embed/${video_id}?autoplay=${isPlaying ? 1 : 0}&start=${seekTime}`
    : null;

  // Extract all AI-generated timestamp/topic segments across the complete lecture based on actual video duration
  const getLectureTimestamps = () => {
    const videoDuration = studyPack?.video_duration || 0;

    // 1. Prefer backend-validated grounded timestamps directly
    if (studyPack?.timestamps && Array.isArray(studyPack.timestamps) && studyPack.timestamps.length > 0) {
      return studyPack.timestamps
        .filter(t => videoDuration <= 0 || (t.sec >= 0 && t.sec < videoDuration))
        .sort((a, b) => a.sec - b.sec);
    }

    // 2. Derive topic timestamps across the video duration for all topics
    if (topics && topics.length > 0) {
      const list = [
        { time: '00:00', sec: 0, label: 'Lecture Introduction & Overview' }
      ];

      const totalDur = videoDuration > 0 ? videoDuration : 3600;
      const step = totalDur / (topics.length + 1);

      topics.forEach((t, i) => {
        let timeStr = t.timestamp || t.time;
        let seconds = t.seconds !== undefined ? t.seconds : (t.sec !== undefined ? t.sec : null);

        // Check if topic title or content contains an explicit timestamp
        if (!timeStr && (t.title || t.content)) {
          const match = (t.title + ' ' + (t.content || '')).match(/\[?⏱?\s*(\d{1,2}):(\d{2})\]?/);
          if (match) {
            timeStr = `${match[1].padStart(2, '0')}:${match[2]}`;
            seconds = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
          }
        }

        // If no explicit timestamp is attached, distribute chronologically across video duration
        if (seconds === null || seconds === undefined) {
          seconds = Math.round((i + 1) * step);
          const mStr = String(Math.floor(seconds / 60)).padStart(2, '0');
          const sStr = String(seconds % 60).padStart(2, '0');
          timeStr = `${mStr}:${sStr}`;
        }

        // Clean any leading emojis or decorative icons from title
        const cleanTitle = t.title
          ? t.title.replace(/^[\s⚙️🔄💻📐🏗️📊📘📌🔍🌳⭐🌲🔢🎯🎮🧩🎲]+/g, '').trim()
          : `Topic ${i + 1}`;

        if (seconds > 0 && (videoDuration <= 0 || seconds < videoDuration)) {
          list.push({
            time: timeStr || `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`,
            sec: seconds,
            label: cleanTitle || `Topic ${i + 1}`
          });
        }
      });

      // Sort chronologically (earliest timestamp first)
      list.sort((a, b) => a.sec - b.sec);
      return list;
    }

    return [
      { time: '00:00', sec: 0, label: 'Lecture Introduction & Overview' }
    ];
  };

  const timestamps = getLectureTimestamps();

  // Polished Study Resources Launcher definitions
  const studyResourceLaunchers = [
    {
      id: 'notes',
      title: 'Study Notes',
      desc: 'Structured lecture notes, diagrams & key definitions',
      badge: 'Grounded Notes',
      icon: FileText,
      color: 'var(--accent-primary)',
      onClick: () => setActiveTab('notes')
    },
    {
      id: 'quiz',
      title: 'Interactive Quiz',
      desc: `${totalQuiz} conceptual MCQs with instant explanations`,
      badge: `${totalQuiz} Questions`,
      icon: HelpCircle,
      color: '#10b981',
      onClick: () => setActiveTab('quiz')
    },
    {
      id: 'flashcards',
      title: 'Active Recall Flashcards',
      desc: `${totalFlashcards} interactive 3D review cards`,
      badge: `${totalFlashcards} Cards`,
      icon: Layers,
      color: '#f59e0b',
      onClick: () => setActiveTab('flashcards')
    },
    {
      id: 'interview',
      title: 'Interview Preparation',
      desc: `${totalInterview} questions grouped by difficulty (Easy, Med, Hard)`,
      badge: `${totalInterview} Qs`,
      icon: Briefcase,
      color: '#8b5cf6',
      onClick: () => setActiveTab('interview')
    },
    {
      id: 'revision',
      title: 'Spaced Revision Plan',
      desc: `${totalRevision} timed review stages (24h, 3d, 7d, 14d, 30d)`,
      badge: `${totalRevision} Stages`,
      icon: Calendar,
      color: '#06b6d4',
      onClick: () => setActiveTab('revision')
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* 1. Refined Compact Lecture Workspace Header */}
      <header style={{
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.875rem 2rem 0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Back link & Lecture Title with clean overflow handling */}
          <div style={{ minWidth: 0, flex: '1 1 500px' }}>
            <button
              onClick={onBack}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginBottom: '0.25rem',
                padding: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <ArrowLeft size={14} /> {backLabel}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
              <h1
                title={title || 'Lecture Study Workspace'}
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  color: 'var(--text-main)',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.3',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '680px'
                }}
              >
                {title || 'Lecture Study Workspace'}
              </h1>
              <Badge variant="indigo" style={{ flexShrink: 0 }}>YouTube Lecture</Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', position: 'relative', flexShrink: 0 }}>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Button variant="outline" size="sm" icon={Download}>
                Download PDF
              </Button>
            </a>

            <Button
              variant="ghost"
              size="sm"
              icon={MoreVertical}
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              aria-label="More actions"
            />

            {showActionsMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                padding: '0.375rem',
                width: '190px',
                zIndex: 50
              }}>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <button style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '0.825rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <Download size={14} /> Download Study PDF
                  </button>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 2. Refined Resource Navigation Tabs with Clean Subtle Borders */}
        <div style={{
          maxWidth: '1280px',
          margin: '0.75rem auto 0 auto',
          display: 'flex',
          gap: '0.25rem',
          overflowX: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.35rem',
          scrollbarWidth: 'none'
        }}>
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? 'var(--accent-primary)' : 'transparent'}`,
                  padding: '0.5rem 0.875rem',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  fontSize: '0.825rem',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-main)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <Icon size={14} style={{ color: isActive ? 'var(--accent-primary)' : 'inherit' }} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* 3. Main Workspace Area */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {/* Overview Tab (Polished AI Study Desk Layout) */}
        {activeTab === 'overview' && (
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 2rem 4rem 2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'flex-start' }}>
              
              {/* LEFT COLUMN: Primary Lecture Video + Timestamp-Linked Learning */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', minWidth: 0 }}>
                
                {/* 1. Video Card (Primary Visual Surface) */}
                <Card style={{ overflow: 'hidden' }}>
                  <CardHeader style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PlayCircle size={16} style={{ color: 'var(--accent-primary)' }} />
                        <CardTitle style={{ fontSize: '1rem' }}>Lecture Recording</CardTitle>
                      </div>
                      <Badge variant="slate">Video Stream</Badge>
                    </div>
                  </CardHeader>
                  <CardBody style={{ padding: 0 }}>
                    {video_id ? (
                      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', backgroundColor: '#0f172a' }}>
                        <iframe
                          src={iframeSrc}
                          title="YouTube Lecture Player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        />
                      </div>
                    ) : (
                      <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <PlayCircle size={44} style={{ marginBottom: '0.5rem', color: 'var(--border-color)' }} />
                        <p style={{ fontSize: '0.9rem', margin: 0 }}>No video link available for playback.</p>
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* 2. Timestamp-Linked Learning Card (Scrollable Panel for Complete Lecture) */}
                <Card>
                  <CardHeader style={{ padding: '1.25rem 1.25rem 0.75rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <CardTitle style={{ fontSize: '1.05rem' }}>Timestamp-Linked Learning</CardTitle>
                        <CardDescription style={{ fontSize: '0.825rem' }}>
                          Jump directly to important moments in the lecture
                        </CardDescription>
                      </div>
                      <Badge variant="indigo">{timestamps.length} Key Moments</Badge>
                    </div>
                  </CardHeader>
                  <CardBody style={{ padding: '0.5rem 1.25rem 1.25rem 1.25rem' }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      maxHeight: '440px',
                      overflowY: 'auto',
                      paddingRight: '0.35rem',
                      scrollbarWidth: 'thin'
                    }}>
                      {timestamps.map((ts, idx) => {
                        const isActive = isPlaying && seekTime === ts.sec;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSeek(ts.sec)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                              padding: '0.625rem 0.875rem',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: isActive ? 'var(--accent-light)' : 'var(--bg-main)',
                              border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease-in-out'
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                              }
                            }}
                          >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              backgroundColor: 'var(--accent-primary)',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              padding: '2px 7px',
                              borderRadius: 'var(--radius-sm)',
                              flexShrink: 0
                            }}>
                              <Play size={10} fill="#ffffff" />
                              <span>{ts.time}</span>
                            </div>

                            <span style={{
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              color: 'var(--text-main)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {ts.label}
                            </span>
                          </div>

                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-primary)', flexShrink: 0 }}>
                            Play ▶
                          </span>
                        </div>
                      );
                      })}
                    </div>
                  </CardBody>
                </Card>

              </div>

              {/* RIGHT COLUMN: Lecture Overview + Study Materials Launcher */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', minWidth: 0 }}>
                
                {/* 1. Lecture Overview Card */}
                <Card>
                  <CardHeader style={{ padding: '1.25rem 1.25rem 0.75rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <CardTitle style={{ fontSize: '1.05rem' }}>Lecture Overview</CardTitle>
                      <Badge variant="slate">Core Summary</Badge>
                    </div>
                    <CardDescription style={{ fontSize: '0.825rem' }}>
                      AI-extracted technical overview from lecture transcript
                    </CardDescription>
                  </CardHeader>
                  <CardBody style={{ padding: '0.5rem 1.25rem 1.25rem 1.25rem' }}>
                    <p style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-main)',
                      lineHeight: '1.65',
                      margin: 0,
                      backgroundColor: 'var(--bg-main)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}>
                      {overview || "Comprehensive technical study notes generated from the lecture recording."}
                    </p>

                    {/* Quick Metadata Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-main)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <Layers size={12} /> {totalTopics} Topics
                      </span>

                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-main)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <HelpCircle size={12} /> {totalQuiz} Quiz Questions
                      </span>

                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-main)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <CheckCircle2 size={12} /> Grounded Notes
                      </span>
                    </div>
                  </CardBody>
                </Card>

                {/* 2. Refined Study Materials Launcher */}
                <Card>
                  <CardHeader style={{ padding: '1.25rem 1.25rem 0.75rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <CardTitle style={{ fontSize: '1.05rem' }}>Study Materials</CardTitle>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                        All Resources Ready
                      </span>
                    </div>
                    <CardDescription style={{ fontSize: '0.825rem' }}>
                      AI-generated resources for this lecture
                    </CardDescription>
                  </CardHeader>

                  <CardBody style={{ padding: '0.5rem 1.25rem 1.25rem 1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {studyResourceLaunchers.map((res) => {
                        const Icon = res.icon;
                        return (
                          <div
                            key={res.id}
                            onClick={res.onClick}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.875rem 1rem',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--bg-main)',
                              border: '1px solid var(--border-color)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease-in-out'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--accent-primary)';
                              e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                              e.currentTarget.style.backgroundColor = 'var(--bg-main)';
                              e.currentTarget.style.transform = 'none';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: res.color,
                                flexShrink: 0
                              }}>
                                <Icon size={18} />
                              </div>

                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                    {res.title}
                                  </h4>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    padding: '1px 6px',
                                    borderRadius: 'var(--radius-full)',
                                    backgroundColor: 'var(--border-subtle)',
                                    color: 'var(--text-muted)'
                                  }}>
                                    {res.badge}
                                  </span>
                                </div>
                                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {res.desc}
                                </p>
                              </div>
                            </div>

                            <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>

              </div>
            </div>
          </div>
        )}

        {/* Resource Tabs Renderers */}
        {activeTab === 'notes' && (
          <NotesWorkspace studyPack={studyPack} taskId={taskId} onSeek={handleSeek} />
        )}
        {activeTab === 'topics' && (
          <TopicsView topics={topics} onSelectTopic={() => setActiveTab('notes')} />
        )}
        {activeTab === 'quiz' && (
          <QuizWorkspace quiz={quiz} taskId={taskId} onBack={() => setActiveTab('overview')} />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardsWorkspace flashcards={flashcards} onBack={() => setActiveTab('overview')} />
        )}
        {activeTab === 'revision' && (
          <RevisionWorkspace
            revision={revision_plan}
            onBack={() => setActiveTab('overview')}
            onResolveTopic={resolveTopicToNotes}
            onOpenNotesAnchor={openNotesAnchor}
          />
        )}
        {activeTab === 'interview' && (
          <InterviewWorkspace interview={interview_questions} onBack={() => setActiveTab('overview')} />
        )}
        {activeTab === 'transcript' && (
          <TranscriptView
            videoId={video_id}
            timestamps={studyPack.timestamps}
            duration={studyPack.video_duration}
            onSeekVideo={handleSeek}
          />
        )}
      </main>
    </div>
  );
}
