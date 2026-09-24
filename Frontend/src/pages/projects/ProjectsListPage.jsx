import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { EmptyState } from '../../components/common/EmptyState';
import { projectApi } from '../../api';
import { FolderGit2, Plus, Search, Layers, PlayCircle, Bug } from 'lucide-react';

export const ProjectsListPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await projectApi.getProjects();
        if (res.success) {
          setProjects(res.data.projects || []);
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout
      title="Projects"
      subtitle="Manage your visual regression verification suites"
      action={
        <Button variant="primary" size="sm" onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      }
    >
      <div className="space-y-6 text-left">
        {/* Filters Bar */}
        <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700/80 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {['all', 'draft', 'ready', 'testing', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Project Cards Grid */}
        {filteredProjects.length === 0 && !isLoading ? (
          <EmptyState
            icon={FolderGit2}
            title="No matching projects found"
            description="Create a project to connect your Figma designs with your web application."
            actionText="Create Project"
            onAction={() => navigate('/projects/new')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <Card
                key={project._id}
                className="flex flex-col justify-between hover:border-blue-500/40 transition cursor-pointer group"
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition truncate">
                      {project.name}
                    </h3>
                    <Badge variant={project.status}>{project.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-gray-500" />
                      {project.mappingsCount || 0} Pages
                    </span>
                    <span>•</span>
                    <span
                      className={`flex items-center gap-1 ${
                        project.openBugsCount > 0 ? 'text-red-400 font-semibold' : 'text-gray-400'
                      }`}
                    >
                      <Bug className="w-3.5 h-3.5" />
                      {project.openBugsCount || 0} Bugs
                    </span>
                  </div>

                  {project.latestTest ? (
                    <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {project.latestTest.overallScore}%
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
    </DashboardLayout>
  );
};
