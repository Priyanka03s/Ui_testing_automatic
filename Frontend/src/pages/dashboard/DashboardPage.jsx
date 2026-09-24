import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { projectApi, userApi } from '../../api';
import {
  FolderGit2,
  PlayCircle,
  Bug as BugIcon,
  CheckCircle2,
  Plus,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  Camera,
  Bot,
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ projectsCount: 0, testsCount: 0, openBugsCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [projRes, profRes] = await Promise.all([
          projectApi.getProjects(),
          userApi.getProfile(),
        ]);
        if (projRes.success) setProjects(projRes.data.projects || []);
        if (profRes.success && profRes.data?.stats) setStats(profRes.data.stats);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <DashboardLayout
      title="QA Automation Dashboard"
      subtitle="Overview of your visual regression testing projects"
      action={
        <Button variant="primary" size="sm" onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      }
    >
      <div className="space-y-8 text-left">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.projectsCount}</div>
              <div className="text-xs text-gray-400 font-medium">Active Projects</div>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.testsCount}</div>
              <div className="text-xs text-gray-400 font-medium">Total Visual Tests</div>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <BugIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.openBugsCount}</div>
              <div className="text-xs text-gray-400 font-medium">Open Visual Bugs</div>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">94%</div>
              <div className="text-xs text-gray-400 font-medium">Avg Visual Match</div>
            </div>
          </Card>
        </div>

        {/* Product Workflow Story Banner */}
        <div className="glass-panel rounded-2xl p-6 border border-blue-500/20 bg-gradient-to-r from-blue-950/20 to-indigo-950/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  End-to-End Visual Verification
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">
                How DesignCheck AI Eliminates UI Regressions
              </h3>
              <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
                Connect Figma design frames, preview your web build, let Playwright take deterministic screenshots, calculate pixel-level difference clusters, and get actionable AI fix suggestions powered by Gemini.
              </p>
            </div>

            {/* Workflow steps */}
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900/80 border border-gray-800 text-[11px] font-semibold text-gray-300">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Figma</span>
              </div>
              <ArrowRight className="w-3 h-3 text-gray-600" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900/80 border border-gray-800 text-[11px] font-semibold text-gray-300">
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>Playwright</span>
              </div>
              <ArrowRight className="w-3 h-3 text-gray-600" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900/80 border border-gray-800 text-[11px] font-semibold text-gray-300">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span>Gemini AI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight">Your Projects</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              <span>View all projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {projects.length === 0 && !isLoading ? (
            <EmptyState
              icon={FolderGit2}
              title="No projects yet"
              description="Create your first project to connect a Figma design and run automated visual comparison."
              actionText="Create Project"
              onAction={() => navigate('/projects/new')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((proj) => (
                <Card
                  key={proj._id}
                  className="flex flex-col justify-between hover:border-blue-500/40 transition group"
                  onClick={() => navigate(`/projects/${proj._id}`)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition truncate">
                        {proj.name}
                      </h4>
                      <Badge variant={proj.status}>{proj.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {proj.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span>{proj.mappingsCount || 0} Pages</span>
                      <span>•</span>
                      <span className={proj.openBugsCount > 0 ? 'text-red-400 font-semibold' : 'text-gray-400'}>
                        {proj.openBugsCount || 0} Open Bugs
                      </span>
                    </div>

                    {proj.latestTest ? (
                      <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        {proj.latestTest.overallScore}%
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-500">Untested</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
