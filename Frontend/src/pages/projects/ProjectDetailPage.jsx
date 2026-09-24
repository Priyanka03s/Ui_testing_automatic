import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { DiffViewer } from '../../components/testing/DiffViewer';
import { BugModal } from '../../components/testing/BugModal';
import {
  projectApi,
  figmaApi,
  websiteApi,
  mappingApi,
  testRunApi,
  bugApi,
} from '../../api';
import {
  Layers,
  Globe,
  SlidersHorizontal,
  PlayCircle,
  Bug as BugIcon,
  History,
  Settings,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Upload,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Clock,
  Check,
  Eye,
  ArrowRight,
} from 'lucide-react';

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // overview, figma, website, mapping, test, bugs, history, settings
  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Figma state
  const [figmaToken, setFigmaToken] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [isFigmaConnecting, setIsFigmaConnecting] = useState(false);

  // Website upload & AI state
  const [websiteType, setWebsiteType] = useState('upload'); // 'upload' or 'ai'
  const [uploadFile, setUploadFile] = useState(null);
  const [aiPrompt, setAiPrompt] = useState(
    'Create a modern fashion ecommerce website with hero section, product cards grid, and responsive design.'
  );
  const [isWebsiteSubmitting, setIsWebsiteSubmitting] = useState(false);

  // Mapping state
  const [isAddMappingOpen, setIsAddMappingOpen] = useState(false);
  const [newMapping, setNewMapping] = useState({
    figmaNodeId: '',
    figmaPageName: 'Home',
    frameName: 'Home Frame',
    websiteRoute: '/',
    viewportWidth: 1440,
    viewportHeight: 900,
  });

  // Testing & Results state
  const [selectedViewport, setSelectedViewport] = useState('desktop'); // desktop (1440x900) or mobile (390x844)
  const [isTestStarting, setIsTestStarting] = useState(false);
  const [activeTestRun, setActiveTestRun] = useState(null);
  const [selectedPageResultIndex, setSelectedPageResultIndex] = useState(0);
  const [selectedBug, setSelectedBug] = useState(null);
  const [isUpdatingBug, setIsUpdatingBug] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Bug filters
  const [bugFilterStatus, setBugFilterStatus] = useState('all');
  const [bugFilterSeverity, setBugFilterSeverity] = useState('all');

  const fetchProject = async () => {
    try {
      const res = await projectApi.getProjectById(id);
      if (res.success && res.data) {
        setProjectData(res.data);

        // Pre-select latest test run if available
        if (res.data.testRuns && res.data.testRuns.length > 0 && !activeTestRun) {
          fetchTestRunDetails(res.data.testRuns[0]._id);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTestRunDetails = async (testRunId) => {
    try {
      const res = await testRunApi.getById(testRunId);
      if (res.success && res.data) {
        setActiveTestRun(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch test run details:', err);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  // Polling loop for active test runs
  useEffect(() => {
    let intervalId;
    if (activeTestRun?.testRun?.status === 'queued' || activeTestRun?.testRun?.status === 'running') {
      setIsPolling(true);
      intervalId = setInterval(async () => {
        try {
          const res = await testRunApi.getById(activeTestRun.testRun._id);
          if (res.success && res.data) {
            setActiveTestRun(res.data);
            if (res.data.testRun.status === 'completed' || res.data.testRun.status === 'failed') {
              setIsPolling(false);
              fetchProject(); // refresh project stats
            }
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 2000);
    } else {
      setIsPolling(false);
    }
    return () => clearInterval(intervalId);
  }, [activeTestRun?.testRun?.status]);

  // 1. Connect Figma
  const handleConnectFigma = async (e) => {
    e.preventDefault();
    setIsFigmaConnecting(true);
    setError('');

    try {
      const res = await figmaApi.connect(id, {
        personalAccessToken: figmaToken,
        fileUrl: figmaUrl,
      });
      if (res.success) {
        setFigmaToken('');
        setFigmaUrl('');
        await fetchProject();
        setActiveTab('website'); // move to next step in workflow
      }
    } catch (err) {
      setError(err.message || 'Failed to connect Figma file');
    } finally {
      setIsFigmaConnecting(false);
    }
  };

  // Pre-fill Demo Figma File
  const handleFillDemoFigma = () => {
    setFigmaToken('demo_token_designer_qa_preview');
    setFigmaUrl('https://www.figma.com/design/demo_file/DesignCheck-Demo-Store');
  };

  // 2. Upload Website Build
  const handleUploadWebsite = async (e) => {
    e.preventDefault();
    if (!uploadFile) return setError('Please select a static build ZIP file');

    setIsWebsiteSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const res = await websiteApi.uploadStatic(id, formData);
      if (res.success) {
        setUploadFile(null);
        await fetchProject();
        setActiveTab('mapping');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload static build');
    } finally {
      setIsWebsiteSubmitting(false);
    }
  };

  // 3. Generate AI Website Theme
  const handleGenerateAiWebsite = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return setError('Please enter a website design prompt');

    setIsWebsiteSubmitting(true);
    setError('');

    try {
      const res = await websiteApi.generateAi(id, aiPrompt);
      if (res.success) {
        await fetchProject();
        setActiveTab('mapping');
      }
    } catch (err) {
      setError(err.message || 'AI theme generation failed');
    } finally {
      setIsWebsiteSubmitting(false);
    }
  };

  // 4. Add Page Mapping
  const handleAddMapping = async (e) => {
    e.preventDefault();
    try {
      await mappingApi.create(id, newMapping);
      setIsAddMappingOpen(false);
      setNewMapping({
        figmaNodeId: '',
        figmaPageName: 'Home',
        frameName: 'Home Frame',
        websiteRoute: '/',
        viewportWidth: 1440,
        viewportHeight: 900,
      });
      await fetchProject();
    } catch (err) {
      setError(err.message || 'Failed to add page mapping');
    }
  };

  // Delete Page Mapping
  const handleDeleteMapping = async (mappingId) => {
    if (!confirm('Are you sure you want to remove this mapping?')) return;
    try {
      await mappingApi.delete(mappingId);
      await fetchProject();
    } catch (err) {
      setError(err.message || 'Failed to delete page mapping');
    }
  };

  // 5. Run Visual Test
  const handleRunTest = async () => {
    setIsTestStarting(true);
    setError('');

    try {
      const width = selectedViewport === 'desktop' ? 1440 : 390;
      const height = selectedViewport === 'desktop' ? 900 : 844;

      const res = await testRunApi.create(id, {
        viewportWidth: width,
        viewportHeight: height,
        browser: 'chromium',
      });

      if (res.success && res.data?.testRunId) {
        await fetchTestRunDetails(res.data.testRunId);
        setActiveTab('test');
      }
    } catch (err) {
      setError(err.message || 'Failed to schedule visual test');
    } finally {
      setIsTestStarting(false);
    }
  };

  // Update Bug Status
  const handleUpdateBugStatus = async (bugId, newStatus) => {
    setIsUpdatingBug(true);
    try {
      await bugApi.updateStatus(bugId, newStatus);
      if (activeTestRun?.testRun?._id) {
        await fetchTestRunDetails(activeTestRun.testRun._id);
      }
      await fetchProject();
      if (selectedBug && selectedBug._id === bugId) {
        setSelectedBug((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update bug status:', err);
    } finally {
      setIsUpdatingBug(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Loading Project...">
        <div className="flex items-center justify-center p-20 text-gray-400">
          Loading project data...
        </div>
      </DashboardLayout>
    );
  }

  const { project, figma, website, mappings = [], testRuns = [], bugs = [] } = projectData || {};

  const isReadyToTest = figma && website && mappings.length > 0;

  return (
    <DashboardLayout
      title={project?.name || 'Project'}
      subtitle={project?.description || 'Automated visual validation workspace'}
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            disabled={!isReadyToTest || isPolling}
            isLoading={isTestStarting || isPolling}
            onClick={handleRunTest}
          >
            <PlayCircle className="w-4 h-4" />
            <span>{isPolling ? 'Testing In Progress...' : 'Run Visual QA Test'}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-left">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-300 font-bold ml-4">
              ×
            </button>
          </div>
        )}

        {/* Tab Navigation Header */}
        <div className="border-b border-gray-800 flex items-center gap-1 overflow-x-auto pb-px">
          {[
            { id: 'overview', label: 'Overview', icon: Layers },
            { id: 'figma', label: 'Figma Design', icon: Layers, count: figma?.importedPages?.length },
            { id: 'website', label: 'Website Build', icon: Globe, ready: !!website },
            { id: 'mapping', label: 'Page Mapping', icon: SlidersHorizontal, count: mappings.length },
            { id: 'test', label: 'Test & Results', icon: PlayCircle, highlight: isPolling },
            { id: 'bugs', label: 'Bugs', icon: BugIcon, count: bugs.filter((b) => b.status === 'open').length },
            { id: 'history', label: 'Test History', icon: History, count: testRuns.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.highlight ? 'animate-spin text-blue-400' : ''}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-gray-800 text-gray-300 border border-gray-700">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Readiness Checklist */}
            <Card className="border border-gray-800">
              <h3 className="text-base font-bold text-white mb-4">Project Verification Pipeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    figma ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-gray-900/60 border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">1. Figma Design</span>
                    {figma ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    {figma
                      ? `Connected to "${figma.fileName || 'Figma Design'}" with ${figma.importedPages?.length || 0} page(s)`
                      : 'Connect your Figma PAT and design file URL'}
                  </p>
                  <Button
                    variant={figma ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => setActiveTab('figma')}
                  >
                    {figma ? 'Manage Figma' : 'Connect Figma'}
                  </Button>
                </div>

                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    website ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-gray-900/60 border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">2. Website Build</span>
                    {website ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    {website
                      ? `Active preview (${website.type === 'ai_generated' ? 'AI Theme' : 'Static Upload'})`
                      : 'Upload static ZIP build or generate AI theme'}
                  </p>
                  <Button
                    variant={website ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => setActiveTab('website')}
                  >
                    {website ? 'View Preview' : 'Setup Website'}
                  </Button>
                </div>

                <div
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    mappings.length > 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-gray-900/60 border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">3. Route Mapping</span>
                    {mappings.length > 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    {mappings.length > 0
                      ? `${mappings.length} route mapping(s) configured for testing`
                      : 'Map Figma frames to web routes like / and /products'}
                  </p>
                  <Button
                    variant={mappings.length > 0 ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => setActiveTab('mapping')}
                  >
                    {mappings.length > 0 ? 'View Mappings' : 'Configure Routes'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Latest Visual Test Summary */}
            {testRuns.length > 0 && (
              <Card className="border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">Latest Test Run Summary</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('test')}>
                    <span>Open Detailed Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-900/40 border border-gray-800">
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Visual Similarity</span>
                    <span className="text-2xl font-black text-blue-400">
                      {testRuns[0].overallScore}%
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Pages Verified</span>
                    <span className="text-2xl font-black text-white">
                      {testRuns[0].totalPages}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Detected Bugs</span>
                    <span className="text-2xl font-black text-red-400">
                      {bugs.filter((b) => b.status === 'open').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Status</span>
                    <Badge variant={testRuns[0].status}>{testRuns[0].status}</Badge>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* TAB 2: FIGMA INTEGRATION */}
        {activeTab === 'figma' && (
          <div className="space-y-6">
            <Card className="border border-gray-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">Connect Figma Design</h3>
                  <p className="text-xs text-gray-400">
                    Your Personal Access Token is encrypted securely using AES-256-GCM and never stored raw.
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleFillDemoFigma}>
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Use Demo Figma File</span>
                </Button>
              </div>

              <form onSubmit={handleConnectFigma} className="space-y-4 max-w-2xl">
                <Input
                  label="Figma Personal Access Token (PAT)"
                  type="password"
                  placeholder="figd_..."
                  value={figmaToken}
                  onChange={(e) => setFigmaToken(e.target.value)}
                  helperText="Created in Figma Account Settings > Personal access tokens"
                  required
                />

                <Input
                  label="Figma File URL or Key"
                  placeholder="https://www.figma.com/design/:fileKey/Design-Name"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  required
                />

                <Button type="submit" variant="primary" size="sm" isLoading={isFigmaConnecting}>
                  <Layers className="w-4 h-4" />
                  <span>Connect & Import Frames</span>
                </Button>
              </form>
            </Card>

            {/* Imported Frames Display */}
            {figma && figma.importedPages && figma.importedPages.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">
                    Imported Figma Pages & Frames ({figma.importedPages.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await figmaApi.importFrames(id);
                      await fetchProject();
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Frames</span>
                  </Button>
                </div>

                <div className="space-y-4">
                  {figma.importedPages.map((page) => (
                    <Card key={page.id} className="border border-gray-800">
                      <h4 className="text-sm font-bold text-blue-400 mb-3">{page.name}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {page.frames.map((frame) => (
                          <div
                            key={frame.id}
                            className="bg-gray-900/80 border border-gray-800 p-3 rounded-xl flex flex-col justify-between"
                          >
                            <div className="h-32 bg-gray-950 rounded-lg mb-3 flex items-center justify-center border border-gray-800/80 overflow-hidden">
                              <Layers className="w-8 h-8 text-gray-600" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white truncate">{frame.name}</div>
                              <div className="text-[11px] text-gray-500 font-mono">
                                {frame.width} × {frame.height}px
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WEBSITE INPUT & PREVIEW */}
        {activeTab === 'website' && (
          <div className="space-y-6">
            <Card className="border border-gray-800">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-3">
                <button
                  onClick={() => setWebsiteType('upload')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    websiteType === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Upload Static Build (ZIP)
                </button>
                <button
                  onClick={() => setWebsiteType('ai')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    websiteType === 'ai'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Website Theme Generator</span>
                </button>
              </div>

              {/* OPTION A: ZIP Upload */}
              {websiteType === 'upload' && (
                <form onSubmit={handleUploadWebsite} className="space-y-4 max-w-xl">
                  <div className="border-2 border-dashed border-gray-700/80 hover:border-blue-500/60 rounded-2xl p-8 text-center transition bg-gray-900/40">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-white mb-1">
                      {uploadFile ? uploadFile.name : 'Select or drag your static website ZIP'}
                    </h4>
                    <p className="text-xs text-gray-400 mb-4">
                      Must contain index.html and static assets (e.g. dist.zip)
                    </p>
                    <input
                      type="file"
                      id="zip-upload"
                      accept=".zip"
                      className="hidden"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                    />
                    <label
                      htmlFor="zip-upload"
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-200 border border-gray-700 cursor-pointer"
                    >
                      Browse ZIP File
                    </label>
                  </div>

                  <Button type="submit" variant="primary" size="sm" isLoading={isWebsiteSubmitting}>
                    <span>Upload & Deploy Preview</span>
                  </Button>
                </form>
              )}

              {/* OPTION B: AI Theme Generator */}
              {websiteType === 'ai' && (
                <form onSubmit={handleGenerateAiWebsite} className="space-y-4 max-w-xl">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Website Theme Prompt (Powered by Gemini)
                    </label>
                    <textarea
                      rows={4}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Describe the website layout, color scheme, sections and components..."
                      className="w-full rounded-lg bg-gray-900 border border-gray-700/80 px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">
                      Safety note: Gemini returns a validated JSON schema rendered safely inside a controlled preview component without executing raw code.
                    </p>
                  </div>

                  <Button type="submit" variant="primary" size="sm" isLoading={isWebsiteSubmitting}>
                    <Sparkles className="w-4 h-4 text-purple-300" />
                    <span>Generate Safe Website Preview</span>
                  </Button>
                </form>
              )}
            </Card>

            {/* Live Website Preview Frame */}
            {website && website.previewUrl && (
              <Card className="border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Live Website Preview</h3>
                    <Badge variant="passed">Ready</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={website.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Preview</span>
                    </a>
                  </div>
                </div>

                <div className="border border-gray-800 rounded-xl overflow-hidden bg-white shadow-2xl h-[550px]">
                  <iframe
                    src={website.previewUrl}
                    title="Website Preview"
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </Card>
            )}
          </div>
        )}

        {/* TAB 4: PAGE MAPPINGS */}
        {activeTab === 'mapping' && (
          <div className="space-y-6">
            <Card className="border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">Page & Route Mappings</h3>
                  <p className="text-xs text-gray-400">
                    Associate each Figma frame with the corresponding web application route
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsAddMappingOpen(true)}>
                  <Plus className="w-4 h-4" />
                  <span>Add Mapping</span>
                </Button>
              </div>

              {mappings.length === 0 ? (
                <EmptyState
                  icon={SlidersHorizontal}
                  title="No page mappings yet"
                  description="Map Figma frames to website routes like / or /products so Playwright knows which pages to capture."
                  actionText="Add Mapping"
                  onAction={() => setIsAddMappingOpen(true)}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Figma Page & Frame</th>
                        <th className="py-3 px-4">Website Route</th>
                        <th className="py-3 px-4">Target Viewport</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/80">
                      {mappings.map((m) => (
                        <tr key={m._id} className="hover:bg-gray-900/40 transition">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <div>{m.frameName || m.figmaPageName}</div>
                            <div className="text-[11px] text-gray-500">Page: {m.figmaPageName}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-blue-400 font-medium">
                            {m.websiteRoute}
                          </td>
                          <td className="py-3.5 px-4 text-gray-300 font-mono">
                            {m.viewportWidth} × {m.viewportHeight}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={m.enabled ? 'passed' : 'neutral'}>
                              {m.enabled ? 'Active' : 'Disabled'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteMapping(m._id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition"
                              title="Delete mapping"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 5: TEST RUNNER & VISUAL RESULTS */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            {/* Viewport Config & Run Bar */}
            <Card className="border border-gray-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Target Viewport:
                </span>
                <button
                  onClick={() => setSelectedViewport('desktop')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedViewport === 'desktop'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  Desktop (1440 × 900)
                </button>
                <button
                  onClick={() => setSelectedViewport('mobile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedViewport === 'mobile'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  Mobile (390 × 844)
                </button>
              </div>

              <div className="flex items-center gap-3">
                {isPolling && (
                  <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Playwright Engine Executing...
                  </span>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!isReadyToTest || isPolling}
                  isLoading={isTestStarting || isPolling}
                  onClick={handleRunTest}
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>{isPolling ? 'Running QA Engine...' : 'Run Visual Test'}</span>
                </Button>
              </div>
            </Card>

            {/* Test Run Results View */}
            {activeTestRun && activeTestRun.testRun && (
              <div className="space-y-6">
                {/* Overall Score Banner */}
                <div className="glass-panel p-6 rounded-2xl border border-gray-800 flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      Visual Similarity Match
                    </span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-black text-white">
                        {activeTestRun.testRun.overallScore}%
                      </span>
                      <Badge variant={activeTestRun.testRun.status}>
                        {activeTestRun.testRun.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-gray-400">
                    <div>
                      <span className="text-gray-500 block">Tested Pages</span>
                      <span className="text-sm font-bold text-gray-200">
                        {activeTestRun.testRun.totalPages}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Passed</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {activeTestRun.testRun.passedPages}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Discrepancies</span>
                      <span className="text-sm font-bold text-red-400">
                        {activeTestRun.bugs?.length || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Duration</span>
                      <span className="text-sm font-bold text-gray-200">
                        {((activeTestRun.testRun.durationMs || 0) / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Page Results Tabs */}
                {activeTestRun.pageResults && activeTestRun.pageResults.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {activeTestRun.pageResults.map((pr, index) => (
                        <button
                          key={pr._id}
                          onClick={() => setSelectedPageResultIndex(index)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition ${
                            selectedPageResultIndex === index
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                              : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          <span>{pr.pageName}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              pr.matchPercentage >= 95
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {pr.matchPercentage}%
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* DiffViewer Canvas */}
                    <DiffViewer
                      pageResult={activeTestRun.pageResults[selectedPageResultIndex]}
                      onSelectBug={(region, idx) => {
                        const bug = activeTestRun.bugs?.find(
                          (b) =>
                            b.pageName ===
                              activeTestRun.pageResults[selectedPageResultIndex]?.pageName &&
                            Math.abs(b.x - region.x) < 50 &&
                            Math.abs(b.y - region.y) < 50
                        ) || {
                          title: `Visual Discrepancy (${region.differencePercentage}% area)`,
                          description: `Visual difference detected at (${region.x}, ${region.y}) spanning ${region.width}x${region.height}px.`,
                          suggestedFix: 'Inspect element padding, flex gap, and typography margins.',
                          severity: region.area > 30000 ? 'high' : 'medium',
                          category: 'spacing',
                          status: 'open',
                          confidence: 0.88,
                          x: region.x,
                          y: region.y,
                          width: region.width,
                          height: region.height,
                        };
                        setSelectedBug(bug);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: BUGS MANAGEMENT */}
        {activeTab === 'bugs' && (
          <div className="space-y-6">
            <Card className="border border-gray-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">Visual QA Bug Management</h3>
                  <p className="text-xs text-gray-400">
                    Discrepancies identified by the visual engine and classified by Gemini AI
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={bugFilterSeverity}
                    onChange={(e) => setBugFilterSeverity(e.target.value)}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <select
                    value={bugFilterStatus}
                    onChange={(e) => setBugFilterStatus(e.target.value)}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="resolved">Resolved</option>
                    <option value="ignored">Ignored</option>
                    <option value="regressed">Regressed</option>
                  </select>
                </div>
              </div>

              {bugs.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="No bugs detected!"
                  description="Run a visual test to verify your live site against the Figma reference."
                  actionText="Run Test"
                  onAction={() => setActiveTab('test')}
                />
              ) : (
                <div className="space-y-3">
                  {bugs
                    .filter((b) => bugFilterStatus === 'all' || b.status === bugFilterStatus)
                    .filter((b) => bugFilterSeverity === 'all' || b.severity === bugFilterSeverity)
                    .map((bug) => (
                      <div
                        key={bug._id}
                        className="p-4 rounded-xl bg-gray-900/60 border border-gray-800/80 hover:border-gray-700 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 text-left">
                          <div className="flex items-center gap-2">
                            <Badge variant={bug.severity}>{bug.severity}</Badge>
                            <Badge variant={bug.status}>{bug.status}</Badge>
                            <span className="text-xs text-gray-400 font-semibold">
                              Page: {bug.pageName}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{bug.title}</h4>
                          <p className="text-xs text-gray-400 max-w-2xl">{bug.description}</p>
                          {bug.suggestedFix && (
                            <p className="text-xs text-blue-400/90 font-medium">
                              Fix advice: {bug.suggestedFix}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedBug(bug)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </Button>
                          {bug.status !== 'resolved' ? (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleUpdateBugStatus(bug._id, 'resolved')}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Resolve</span>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateBugStatus(bug._id, 'open')}
                            >
                              <span>Reopen</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 7: TEST HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <Card className="border border-gray-800">
              <h3 className="text-base font-bold text-white mb-4">Visual Regression Test History</h3>
              {testRuns.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No test history yet"
                  description="Your completed visual test runs and scores will be logged here."
                  actionText="Run First Test"
                  onAction={() => setActiveTab('test')}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-500 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Viewport</th>
                        <th className="py-3 px-4">Visual Score</th>
                        <th className="py-3 px-4">Pages Tested</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/80">
                      {testRuns.map((run) => (
                        <tr key={run._id} className="hover:bg-gray-900/40 transition">
                          <td className="py-3.5 px-4 text-gray-300">
                            {new Date(run.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-400">
                            {run.viewportWidth} × {run.viewportHeight}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-blue-400 font-mono text-sm">
                            {run.overallScore}%
                          </td>
                          <td className="py-3.5 px-4 text-gray-300">{run.totalPages} pages</td>
                          <td className="py-3.5 px-4 text-gray-400">
                            {((run.durationMs || 0) / 1000).toFixed(1)}s
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={run.status}>{run.status}</Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                await fetchTestRunDetails(run._id);
                                setActiveTab('test');
                              }}
                            >
                              <span>View Report</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Modal: Add Page Mapping */}
        <Modal
          isOpen={isAddMappingOpen}
          onClose={() => setIsAddMappingOpen(false)}
          title="Add Figma to Website Page Mapping"
        >
          <form onSubmit={handleAddMapping} className="space-y-4">
            <Input
              label="Figma Page / Frame Name"
              placeholder="e.g. Home or Products"
              value={newMapping.figmaPageName}
              onChange={(e) =>
                setNewMapping((prev) => ({
                  ...prev,
                  figmaPageName: e.target.value,
                  frameName: e.target.value,
                }))
              }
              required
            />

            <Input
              label="Website Route"
              placeholder="e.g. / or /products"
              value={newMapping.websiteRoute}
              onChange={(e) =>
                setNewMapping((prev) => ({ ...prev, websiteRoute: e.target.value }))
              }
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Viewport Width (px)"
                type="number"
                value={newMapping.viewportWidth}
                onChange={(e) =>
                  setNewMapping((prev) => ({
                    ...prev,
                    viewportWidth: parseInt(e.target.value, 10),
                  }))
                }
              />
              <Input
                label="Viewport Height (px)"
                type="number"
                value={newMapping.viewportHeight}
                onChange={(e) =>
                  setNewMapping((prev) => ({
                    ...prev,
                    viewportHeight: parseInt(e.target.value, 10),
                  }))
                }
              />
            </div>

            <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsAddMappingOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Add Mapping
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Bug Detail */}
        <BugModal
          bug={selectedBug}
          isOpen={!!selectedBug}
          onClose={() => setSelectedBug(null)}
          onUpdateStatus={handleUpdateBugStatus}
          isUpdating={isUpdatingBug}
        />
      </div>
    </DashboardLayout>
  );
};
