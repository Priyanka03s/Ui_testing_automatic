import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { projectApi } from '../../api';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const NewProjectPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Project name is required');

    setIsLoading(true);
    setError('');

    try {
      const res = await projectApi.createProject({
        name: name.trim(),
        description: description.trim(),
      });
      if (res.success && res.data?.project) {
        navigate(`/projects/${res.data.project._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Create New Project"
      subtitle="Initialize an automated visual verification suite"
      action={
        <Button variant="secondary" size="sm" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Button>
      }
    >
      <div className="max-w-2xl mx-auto text-left">
        <Card className="border border-gray-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            <Input
              label="Project Name"
              placeholder="e.g. Modern Fashion E-commerce Store"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Brief description of the application or features being tested..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg bg-gray-900 border border-gray-700/80 px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
                <Sparkles className="w-4 h-4" />
                <span>Create & Configure</span>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};
