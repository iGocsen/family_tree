import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getFeedbacks, updateFeedbackStatus, deleteFeedback,
  getPersonEdits, updateEditStatus, deleteEdit,
  getNewPersons, updateNewPersonStatus, deleteNewPerson,
  saveNewPerson, savePersonEdit,
  getStats,
  type FeedbackRecord, type PersonEdit,
} from '@/lib/store';
import { genealogies, getGenealogy, getPerson, Person } from '@/lib/data';
import {
  ArrowLeft, MessageSquare, Edit3, UserPlus, CheckCircle2, XCircle,
  Trash2, Eye, Clock, Search, Filter, BarChart3, ChevronDown, ChevronRight,
  Save, AlertTriangle, RefreshCw, ArrowUp, ArrowDown,
} from 'lucide-react';

type TabType = 'dashboard' | 'feedbacks' | 'edits' | 'new-persons';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>(getFeedbacks());
  const [edits, setEdits] = useState<PersonEdit[]>(getPersonEdits());
  const [newPersons, setNewPersons] = useState(getNewPersons());
  const [stats, setStats] = useState(getStats());
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackRecord | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [showFeedbackDetail, setShowFeedbackDetail] = useState(false);

  // New person form
  const [newPersonForm, setNewPersonForm] = useState({
    genealogyId: '',
    name: '',
    generation: 1,
    birthYear: '',
    deathYear: '',
    gender: 'male' as 'male' | 'female',
    spouse: '',
    parentId: '',
    biography: '',
    achievements: '',
  });
  const [showNewPersonForm, setShowNewPersonForm] = useState(false);

  // Edit person form
  const [editForm, setEditForm] = useState({
    genealogyId: '',
    personId: '',
    field: 'biography',
    oldValue: '',
    newValue: '',
  });
  const [showEditForm, setShowEditForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const refreshData = () => {
    setFeedbacks(getFeedbacks());
    setEdits(getPersonEdits());
    setNewPersons(getNewPersons());
    setStats(getStats());
  };

  // ===== Feedback Actions =====
  const handleFeedbackAction = (id: string, action: 'resolved' | 'rejected') => {
    updateFeedbackStatus(id, action, adminNote);
    setAdminNote('');
    setShowFeedbackDetail(false);
    setSelectedFeedback(null);
    refreshData();
  };

  const handleDeleteFeedback = (id: string) => {
    deleteFeedback(id);
    refreshData();
  };

  // ===== Edit Actions =====
  const handleEditAction = (id: string, action: 'approved' | 'rejected') => {
    updateEditStatus(id, action);
    refreshData();
  };

  const handleDeleteEdit = (id: string) => {
    deleteEdit(id);
    refreshData();
  };

  // ===== New Person Actions =====
  const handleNewPersonAction = (id: string, action: 'approved' | 'rejected') => {
    updateNewPersonStatus(id, action);
    refreshData();
  };

  const handleDeleteNewPerson = (id: string) => {
    deleteNewPerson(id);
    refreshData();
  };

  const handleSubmitNewPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonForm.genealogyId || !newPersonForm.name) return;

    saveNewPerson({ ...newPersonForm });
    setNewPersonForm({
      genealogyId: '', name: '', generation: 1, birthYear: '',
      deathYear: '', gender: 'male', spouse: '', parentId: '',
      biography: '', achievements: '',
    });
    setShowNewPersonForm(false);
    refreshData();
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.genealogyId || !editForm.personId || !editForm.newValue) return;

    const genealogy = getGenealogy(editForm.genealogyId);
    const person = genealogy?.people[editForm.personId];

    savePersonEdit({
      genealogyId: editForm.genealogyId,
      genealogyName: genealogy?.name || '',
      personId: editForm.personId,
      personName: person?.name || '',
      field: editForm.field,
      oldValue: editForm.oldValue,
      newValue: editForm.newValue,
    });

    setEditForm({ genealogyId: '', personId: '', field: 'biography', oldValue: '', newValue: '' });
    setShowEditForm(false);
    refreshData();
  };

  const handlePersonSelect = (personId: string) => {
    const genealogy = getGenealogy(editForm.genealogyId);
    const person = genealogy?.people[personId];
    if (person) {
      const fieldValues: Record<string, string> = {
        name: person.name,
        birthYear: person.birthYear || '',
        deathYear: person.deathYear || '',
        biography: person.biography,
        spouse: person.spouse || '',
        achievements: person.achievements?.join('\n') || '',
      };
      setEditForm(prev => ({
        ...prev,
        personId,
        oldValue: fieldValues[prev.field] || '',
      }));
    }
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      const matchSearch = !searchTerm ||
        f.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.genealogyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || f.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [feedbacks, searchTerm, statusFilter]);

  const filteredEdits = useMemo(() => {
    return edits.filter(e => {
      const matchSearch = !searchTerm ||
        e.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.genealogyName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [edits, searchTerm, statusFilter]);

  const filteredNewPersons = useMemo(() => {
    return newPersons.filter(p => {
      const matchSearch = !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [newPersons, searchTerm, statusFilter]);

  const feedbackTypeLabels: Record<string, string> = {
    'info-error': '信息有误',
    'missing-info': '信息缺失',
    'duplicate': '重复记录',
    'other': '其他问题',
  };

  const fieldLabels: Record<string, string> = {
    name: '姓名',
    birthYear: '出生年份',
    deathYear: '逝世年份',
    biography: '生平介绍',
    spouse: '配偶',
    achievements: '主要成就',
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'dashboard', label: '概览', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'feedbacks', label: '反馈管理', icon: <MessageSquare className="w-4 h-4" />, count: stats.feedbacks.pending },
    { key: 'edits', label: '修改审核', icon: <Edit3 className="w-4 h-4" />, count: stats.edits.pending },
    { key: 'new-persons', label: '新增人物', icon: <UserPlus className="w-4 h-4" />, count: stats.newPersons.pending },
  ];

  const selectedGenealogy = genealogies.find(g => g.id === newPersonForm.genealogyId);
  const selectedGenealogyForEdit = genealogies.find(g => g.id === editForm.genealogyId);
  const availablePersons = selectedGenealogyForEdit ? Object.values(selectedGenealogyForEdit.people) : [];
  const availableParents = selectedGenealogy ? Object.values(selectedGenealogy.people).filter(p => p.generation < newPersonForm.generation) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
              >
                <ArrowLeft className="w-4 h-4" />
                返回前台
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-bold text-foreground">族谱管理后台</h1>
            </div>
            <button
              onClick={refreshData}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl mb-8 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchTerm(''); setStatusFilter('all'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ===== Dashboard ===== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feedback Stats */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">反馈统计</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">总计</span>
                    <span className="font-medium text-foreground">{stats.feedbacks.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">待处理</span>
                    <span className="font-medium text-amber-600">{stats.feedbacks.pending}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">已解决</span>
                    <span className="font-medium text-green-600">{stats.feedbacks.resolved}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">已驳回</span>
                    <span className="font-medium text-red-600">{stats.feedbacks.rejected}</span>
                  </div>
                </div>
              </div>

              {/* Edit Stats */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground">修改审核</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">总计</span>
                    <span className="font-medium text-foreground">{stats.edits.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">待审核</span>
                    <span className="font-medium text-amber-600">{stats.edits.pending}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">已通过</span>
                    <span className="font-medium text-green-600">{stats.edits.approved}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">已驳回</span>
                    <span className="font-medium text-red-600">{stats.edits.rejected}</span>
                  </div>
                </div>
              </div>

              {/* New Person Stats */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground">新增人物</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">总计</span>
                    <span className="font-medium text-foreground">{stats.newPersons.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">待审核</span>
                    <span className="font-medium text-amber-600">{stats.newPersons.pending}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">已通过</span>
                    <span className="font-medium text-green-600">{stats.newPersons.approved}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">快捷操作</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => { setActiveTab('new-persons'); setShowNewPersonForm(true); }}
                  className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <UserPlus className="w-5 h-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium text-foreground">新增人物</div>
                    <div className="text-xs text-muted-foreground">添加新的族谱人物记录</div>
                  </div>
                </button>
                <button
                  onClick={() => { setActiveTab('edits'); setShowEditForm(true); }}
                  className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <Edit3 className="w-5 h-5 text-accent" />
                  <div>
                    <div className="text-sm font-medium text-foreground">修改人物信息</div>
                    <div className="text-xs text-muted-foreground">更新现有的人物资料</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground">最近反馈</h3>
              </div>
              {feedbacks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">暂无反馈记录</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {feedbacks.slice(0, 5).map(fb => (
                    <div key={fb.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          fb.status === 'pending' ? 'bg-amber-500' :
                          fb.status === 'resolved' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {fb.genealogyName} - {fb.personName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {feedbackTypeLabels[fb.feedbackType]} · {new Date(fb.createdAt).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        fb.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        fb.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {fb.status === 'pending' ? '待处理' : fb.status === 'resolved' ? '已解决' : '已驳回'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Feedbacks Management ===== */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-6 animate-fade-in">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索反馈..."
                  className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待处理</option>
                  <option value="resolved">已解决</option>
                  <option value="rejected">已驳回</option>
                </select>
              </div>
            </div>

            {/* Feedback List */}
            {filteredFeedbacks.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无反馈记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFeedbacks.map(fb => (
                  <div key={fb.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              fb.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              fb.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {fb.status === 'pending' ? '待处理' : fb.status === 'resolved' ? '已解决' : '已驳回'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              {feedbackTypeLabels[fb.feedbackType]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-foreground">{fb.genealogyName}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-sm font-medium text-primary">{fb.personName}</span>
                          </div>
                          <p className="text-sm text-foreground mt-2">{fb.description}</p>
                          {fb.contact && (
                            <p className="text-xs text-muted-foreground mt-1">联系方式：{fb.contact}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(fb.createdAt).toLocaleString('zh-CN')}
                          </p>
                          {fb.adminNote && (
                            <div className="mt-2 p-2 bg-secondary/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">管理员备注：{fb.adminNote}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {fb.status === 'pending' && (
                            <>
                              <button
                                onClick={() => { setSelectedFeedback(fb); setShowFeedbackDetail(true); setAdminNote(''); }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                处理
                              </button>
                              <button
                                onClick={() => handleDeleteFeedback(fb.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs hover:bg-destructive/20 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                删除
                              </button>
                            </>
                          )}
                          {fb.status !== 'pending' && (
                            <button
                              onClick={() => handleDeleteFeedback(fb.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs hover:bg-destructive/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              删除
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== Edits Management ===== */}
        {activeTab === 'edits' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索修改记录..."
                  className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已驳回</option>
                </select>
              </div>
              <button
                onClick={() => setShowEditForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                新增修改
              </button>
            </div>

            {/* Edit Form Modal */}
            {showEditForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-card border border-border rounded-2xl max-w-lg w-full animate-scale-in overflow-hidden">
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">新增人物修改</h3>
                    <button onClick={() => setShowEditForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">选择族谱</label>
                      <select
                        value={editForm.genealogyId}
                        onChange={(e) => setEditForm(prev => ({ ...prev, genealogyId: e.target.value, personId: '', oldValue: '' }))}
                        className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        required
                      >
                        <option value="">请选择族谱</option>
                        {genealogies.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    {editForm.genealogyId && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">选择人物</label>
                          <select
                            value={editForm.personId}
                            onChange={(e) => handlePersonSelect(e.target.value)}
                            className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            required
                          >
                            <option value="">请选择人物</option>
                            {availablePersons.sort((a, b) => a.generation - b.generation).map(p => (
                              <option key={p.id} value={p.id}>第{p.generation}世 - {p.name}</option>
                            ))}
                          </select>
                        </div>
                        {editForm.personId && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">修改字段</label>
                              <select
                                value={editForm.field}
                                onChange={(e) => {
                                  const field = e.target.value;
                                  const genealogy = getGenealogy(editForm.genealogyId);
                                  const person = genealogy?.people[editForm.personId];
                                  const fieldValues: Record<string, string> = {
                                    name: person?.name || '',
                                    birthYear: person?.birthYear || '',
                                    deathYear: person?.deathYear || '',
                                    biography: person?.biography || '',
                                    spouse: person?.spouse || '',
                                    achievements: person?.achievements?.join('\n') || '',
                                  };
                                  setEditForm(prev => ({ ...prev, field, oldValue: fieldValues[field] || '' }));
                                }}
                                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              >
                                {Object.entries(fieldLabels).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">原值</label>
                              <textarea
                                value={editForm.oldValue}
                                readOnly
                                rows={3}
                                className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">
                                新值 <span className="text-destructive">*</span>
                              </label>
                              <textarea
                                value={editForm.newValue}
                                onChange={(e) => setEditForm(prev => ({ ...prev, newValue: e.target.value }))}
                                rows={3}
                                className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                                required
                              />
                            </div>
                          </>
                        )}
                      </>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowEditForm(false)} className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                        取消
                      </button>
                      <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                        <Save className="w-4 h-4" />
                        提交修改
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit List */}
            {filteredEdits.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Edit3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无修改记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEdits.map(edit => (
                  <div key={edit.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              edit.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              edit.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {edit.status === 'pending' ? '待审核' : edit.status === 'approved' ? '已通过' : '已驳回'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              {fieldLabels[edit.field] || edit.field}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-semibold text-foreground">{edit.genealogyName}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-sm font-medium text-primary">{edit.personName}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/30">
                              <div className="text-xs text-red-600 dark:text-red-400 mb-1 font-medium flex items-center gap-1">
                                <ArrowUp className="w-3 h-3" /> 原值
                              </div>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{edit.oldValue || '（空）'}</p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800/30">
                              <div className="text-xs text-green-600 dark:text-green-400 mb-1 font-medium flex items-center gap-1">
                                <ArrowDown className="w-3 h-3" /> 新值
                              </div>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{edit.newValue}</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-3">
                            {new Date(edit.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {edit.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleEditAction(edit.id, 'approved')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                通过
                              </button>
                              <button
                                onClick={() => handleEditAction(edit.id, 'rejected')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs hover:bg-destructive/20 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                驳回
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteEdit(edit.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs hover:bg-destructive/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== New Persons Management ===== */}
        {activeTab === 'new-persons' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索人物..."
                  className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                </select>
              </div>
              <button
                onClick={() => setShowNewPersonForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                新增人物
              </button>
            </div>

            {/* New Person Form Modal */}
            {showNewPersonForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-card border border-border rounded-2xl max-w-lg w-full animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto">
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                    <h3 className="text-lg font-semibold text-foreground">新增人物</h3>
                    <button onClick={() => setShowNewPersonForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmitNewPerson} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">选择族谱 <span className="text-destructive">*</span></label>
                      <select
                        value={newPersonForm.genealogyId}
                        onChange={(e) => setNewPersonForm(prev => ({ ...prev, genealogyId: e.target.value }))}
                        className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        required
                      >
                        <option value="">请选择族谱</option>
                        {genealogies.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    {newPersonForm.genealogyId && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">姓名 <span className="text-destructive">*</span></label>
                            <input
                              type="text"
                              value={newPersonForm.name}
                              onChange={(e) => setNewPersonForm(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">性别</label>
                            <select
                              value={newPersonForm.gender}
                              onChange={(e) => setNewPersonForm(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            >
                              <option value="male">男</option>
                              <option value="female">女</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">世系 <span className="text-destructive">*</span></label>
                            <input
                              type="number"
                              min={1}
                              max={15}
                              value={newPersonForm.generation}
                              onChange={(e) => setNewPersonForm(prev => ({ ...prev, generation: parseInt(e.target.value) || 1 }))}
                              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">出生年份</label>
                            <input
                              type="text"
                              value={newPersonForm.birthYear}
                              onChange={(e) => setNewPersonForm(prev => ({ ...prev, birthYear: e.target.value }))}
                              placeholder="如：1900"
                              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">逝世年份</label>
                            <input
                              type="text"
                              value={newPersonForm.deathYear}
                              onChange={(e) => setNewPersonForm(prev => ({ ...prev, deathYear: e.target.value }))}
                              placeholder="如：1980"
                              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">父亲（选填）</label>
                          <select
                            value={newPersonForm.parentId}
                            onChange={(e) => setNewPersonForm(prev => ({ ...prev, parentId: e.target.value }))}
                            className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          >
                            <option value="">无（新增分支始祖）</option>
                            {availableParents.map(p => (
                              <option key={p.id} value={p.id}>第{p.generation}世 - {p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">配偶</label>
                          <input
                            type="text"
                            value={newPersonForm.spouse}
                            onChange={(e) => setNewPersonForm(prev => ({ ...prev, spouse: e.target.value }))}
                            className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">生平介绍</label>
                          <textarea
                            value={newPersonForm.biography}
                            onChange={(e) => setNewPersonForm(prev => ({ ...prev, biography: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">主要成就（每行一个）</label>
                          <textarea
                            value={newPersonForm.achievements}
                            onChange={(e) => setNewPersonForm(prev => ({ ...prev, achievements: e.target.value }))}
                            rows={2}
                            placeholder="每项成就单独一行"
                            className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                          />
                        </div>
                      </>
                    )}
                    <div className="flex gap-3 pt-2 sticky bottom-0 bg-card pt-4 border-t border-border">
                      <button type="button" onClick={() => setShowNewPersonForm(false)} className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                        取消
                      </button>
                      <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                        <Save className="w-4 h-4" />
                        提交新增
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* New Person List */}
            {filteredNewPersons.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <UserPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">暂无新增人物记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNewPersons.map(person => (
                  <div key={person.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              person.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              person.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {person.status === 'pending' ? '待审核' : person.status === 'approved' ? '已通过' : '已驳回'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              第{person.generation}世
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              person.gender === 'male' ? 'bg-primary/15 text-primary' : 'bg-accent/15 text-accent'
                            }`}>
                              {person.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-foreground">{person.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {person.genealogyName}
                                {person.birthYear && ` · ${person.birthYear}-${person.deathYear || '？'}`}
                              </div>
                            </div>
                          </div>
                          {person.biography && (
                            <p className="text-sm text-foreground mt-2 line-clamp-2">{person.biography}</p>
                          )}
                          {person.parentId && (
                            <p className="text-xs text-muted-foreground mt-1">
                              父亲：{(() => {
                                const g = getGenealogy(person.genealogyId);
                                const parent = g?.people[person.parentId];
                                return parent?.name || person.parentId;
                              })()}
                            </p>
                          )}
                          {person.achievements && (
                            <p className="text-xs text-muted-foreground mt-1">成就：{person.achievements}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(person.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {person.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleNewPersonAction(person.id, 'approved')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                通过
                              </button>
                              <button
                                onClick={() => handleNewPersonAction(person.id, 'rejected')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs hover:bg-destructive/20 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                驳回
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteNewPerson(person.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs hover:bg-destructive/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {showFeedbackDetail && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full animate-scale-in overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-semibold text-foreground">处理反馈</h3>
              </div>
              <button onClick={() => { setShowFeedbackDetail(false); setSelectedFeedback(null); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
                <XCircle className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {feedbackTypeLabels[selectedFeedback.feedbackType]}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-foreground">{selectedFeedback.genealogyName}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-sm font-medium text-primary">{selectedFeedback.personName}</span>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-foreground">{selectedFeedback.description}</p>
                </div>
                {selectedFeedback.contact && (
                  <p className="text-xs text-muted-foreground mt-2">联系方式：{selectedFeedback.contact}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  提交时间：{new Date(selectedFeedback.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">管理员备注</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="输入处理说明..."
                  rows={3}
                  className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleFeedbackAction(selectedFeedback.id, 'resolved')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  标记已解决
                </button>
                <button
                  onClick={() => handleFeedbackAction(selectedFeedback.id, 'rejected')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  驳回
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
