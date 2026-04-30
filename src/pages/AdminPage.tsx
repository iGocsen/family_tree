import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getFeedbacks, updateFeedbackStatus, deleteFeedback,
  getPersonEdits, updateEditStatus, deleteEdit, modifyEdit,
  getNewPersons, updateNewPersonStatus, deleteNewPerson,
  saveNewPerson, savePersonEdit, modifyNewPerson,
  getStats, login, logout, isAuthenticated, getCurrentUserId,
  getCustomGenealogies, saveCustomGenealogy, deleteCustomGenealogy, updateCustomGenealogy,
  getApprovedPersonsByGenealogy, getGenealogyIntroductions, updateGenealogyIntroductions,
  getAdmins, saveAdmin, deleteAdmin, updateAdminStatus, propagateGenealogyPermission,
  migrateToSupabase, refreshAllData, getPeopleByGenealogy,
  type FeedbackRecord, type PersonEdit,
} from '@/lib/store';
import { getSupabaseGenealogies, getGenealogy, getPerson, getMaxGeneration, Person, getGenealogyIntroductionsFromCache } from '@/lib/data';
import { savePersonToCloud, deletePersonFromCloud } from '@/lib/supabase';
import {
  ArrowLeft, MessageSquare, Edit3, UserPlus, CheckCircle2, XCircle,
  Trash2, Eye, Search, Filter, BarChart3, Save, AlertTriangle, RefreshCw,
  ArrowUp, ArrowDown, LogIn, LogOut, Lock, User, Pencil, Plus,
  FileText, KeyRound, UserCog, Shield, ShieldOff, Cloud,
} from 'lucide-react';

type TabType = 'dashboard' | 'feedbacks' | 'edits' | 'new-persons' | 'all-persons' | 'genealogies' | 'admins';

// ===== Login Page =====
function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoggingIn(true);
    await new Promise(r => setTimeout(r, 500));
    if (await login(username, password)) {
      await refreshAllData();
      // Force full page reload to re-mount AdminPage with authenticated state
      window.location.reload();
    }
    else { setError('账号或密码错误'); }
    setIsLoggingIn(false);
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><Lock className="w-8 h-8 text-primary" /></div>
          <h1 className="text-2xl font-bold text-foreground">族谱管理后台</h1>
          <p className="text-sm text-muted-foreground mt-2">请输入管理员账号密码</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div><label className="block text-sm font-medium text-foreground mb-2">账号</label>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入账号" className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" required />
              </div>
            </div>
            <div><label className="block text-sm font-medium text-foreground mb-2">密码</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" required />
              </div>
            </div>
            {error && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive text-center">{error}</div>}
            <button type="submit" disabled={isLoggingIn} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50">
              {isLoggingIn ? (<><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />登录中...</>) : (<><LogIn className="w-4 h-4" />登录</>)}
            </button>
          </form>
          <div className="mt-6 text-center"><Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" />返回前台</Link></div>
        </div>
      </div>
    </div>
  );
}

// ===== Admin Page =====
function AdminPageInner() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>(getFeedbacks());
  const [edits, setEdits] = useState<PersonEdit[]>(getPersonEdits());
  const [newPersons, setNewPersons] = useState(getNewPersons());
  const [allPersons, setAllPersons] = useState<Record<string, Person[]>>({});
  const [stats, setStats] = useState(getStats());
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackRecord | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [showFeedbackDetail, setShowFeedbackDetail] = useState(false);

  // Get current user info
  const currentUserId = getCurrentUserId();
  const allAdmins = getAdmins();
  const currentUser = allAdmins.find(a => a.id === currentUserId);
  const isSuperAdmin = currentUser?.role === 'super';
  const isManager = currentUser?.role === 'manager';
  const isAdmin = currentUser?.role === 'admin';
  const isEditor = currentUser?.role === 'editor';

  // ===== Permission Inheritance Logic =====
  // 4-tier hierarchy: super → manager → admin → editor
  // - super: all permissions
  // - manager: can create admin/editor, manage their creations and descendants
  // - admin: can manage editors (created by same manager), cannot create genealogies
  // - editor: only assigned genealogies

  const getEffectiveGenealogyIds = (adminId: string): string[] => {
    const admin = allAdmins.find(a => a.id === adminId);
    if (!admin) return [];
    if (admin.role === 'super') return [];
    
    let ids = new Set<string>(admin.editableGenealogies || []);
    
    // Manager and admin: collect genealogies from their descendants
    if (admin.role === 'manager' || admin.role === 'admin') {
      const collectDescendantGenealogies = (parentId: string) => {
        const children = allAdmins.filter(a => a.createdBy === parentId);
        for (const child of children) {
          (child.editableGenealogies || []).forEach(id => ids.add(id));
          collectDescendantGenealogies(child.id);
        }
      };
      collectDescendantGenealogies(adminId);
    }
    
    return Array.from(ids);
  };

  const editableGenealogyIds = isSuperAdmin ? [] : getEffectiveGenealogyIds(currentUserId);
  const hasGenealogyPermission = (genealogyId: string) => isSuperAdmin || editableGenealogyIds.includes(genealogyId);
  const canManageAdmins = isSuperAdmin || isManager;
  
  // Determine if current user can manage a specific admin
  // Hierarchy: super → manager → admin → editor
  // - super: can manage all
  // - manager: can manage direct creations (admin, editor) + editors created by their admins
  // - admin: can ONLY manage editors (族谱修订员)
  //   - editors created by same manager (sibling editors)
  //   - editors created by sibling admins (other admins under same manager)
  //   - editors created by self
  const canManageAdmin = (admin: typeof admins[number]) => {
    if (isSuperAdmin) return true;
    if (isManager) {
      // Manager can manage their direct creations
      if (admin.createdBy === currentUserId) return true;
      // Manager can manage editors created by their admins
      if (admin.role === 'editor') {
        const creator = admins.find(a => a.id === admin.createdBy);
        if (creator && creator.createdBy === currentUserId) return true;
      }
      return false;
    }
    if (isAdmin) {
      // Admin can ONLY manage editors (族谱修订员)
      if (admin.role !== 'editor') return false;
      const myCreator = currentUser?.createdBy;
      // Editors created by the same manager (普通管理员直创的族谱修订员)
      if (admin.createdBy === myCreator) return true;
      // Editors created by sibling admins (同一个普通管理员创建的其他管理员创建的族谱修订员)
      const editorCreator = admins.find(x => x.id === admin.createdBy);
      if (editorCreator && editorCreator.createdBy === myCreator) return true;
      // Editors created by self
      if (admin.createdBy === currentUserId) return true;
      return false;
    }
    return false;
  };

  // Get all visible admins for current user
  const getVisibleAdmins = (): typeof admins => {
    if (isSuperAdmin) return admins;
    if (isManager) {
      // Manager sees: self + all descendants (recursive tree)
      const isInTree = (id: string, rootId: string): boolean => {
        const a = admins.find(x => x.id === id);
        if (!a) return false;
        if (a.createdBy === rootId) return true;
        if (!a.createdBy) return false;
        return isInTree(a.createdBy, rootId);
      };
      return admins.filter(a => a.id === currentUserId || isInTree(a.id, currentUserId));
    }
    if (isAdmin) {
      // Admin sees:
      // - self
      // - sibling admins (same creator = same 普通管理员)
      // - editors created by same manager (普通管理员直创)
      // - editors created by sibling admins (同级管理员创建的族谱修订员)
      // - editors created by self
      const myCreator = currentUser?.createdBy;
      return admins.filter(a => {
        if (a.id === currentUserId) return true;
        // Sibling admins (same 普通管理员)
        if (a.role === 'admin' && a.createdBy === myCreator) return true;
        // Editors
        if (a.role === 'editor') {
          // Created by same 普通管理员
          if (a.createdBy === myCreator) return true;
          // Created by sibling admin
          const creator = admins.find(x => x.id === a.createdBy);
          if (creator && creator.createdBy === myCreator) return true;
          // Created by self
          if (a.createdBy === currentUserId) return true;
        }
        return false;
      });
    }
    return [];
  };

  // Check if current user can process a record based on genealogy permission
  const canProcessRecord = (genealogyId: string) => {
    if (isSuperAdmin) return true;
    return editableGenealogyIds.includes(genealogyId);
  };

  // Load all data from Supabase on mount
  useEffect(() => {
    refreshAllData().then(() => {
      setFeedbacks(getFeedbacks());
      setEdits(getPersonEdits());
      setNewPersons(getNewPersons());
      setStats(getStats());
      setAdmins(getAdmins());
      // Load all genealogies and people
      const genealogies = getSupabaseGenealogies();
      setAllGenealogies(genealogies);
      const personsMap: Record<string, Person[]> = {};
      for (const g of genealogies) {
        personsMap[g.id] = getPeopleByGenealogy(g.id);
      }
      setAllPersons(personsMap);
      setIsLoaded(true);
    }).catch(() => setIsLoaded(true));
  }, []);

  const [newPersonForm, setNewPersonForm] = useState({
    genealogyId: '', name: '', generation: 1, birthYear: '', deathYear: '',
    gender: 'male' as 'male' | 'female', spouse: '', parentId: '',
    biography: '', achievements: '',
  });
  const [showNewPersonForm, setShowNewPersonForm] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [editForm, setEditForm] = useState({
    genealogyId: '', personId: '', field: 'biography', oldValue: '', newValue: '',
  });
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingEditId, setEditingEditId] = useState<string | null>(null);

  // Genealogy management
  const [showGenealogyForm, setShowGenealogyForm] = useState(false);
  const [genealogyForm, setGenealogyForm] = useState({ id: '', name: '', description: '', origin: '', foundingYear: '' });
  const [editingGenealogyId, setEditingGenealogyId] = useState<string | null>(null);

  // Introduction editor
  const [showIntroEditor, setShowIntroEditor] = useState(false);
  const [introEditorId, setIntroEditorId] = useState('');
  const [introPages, setIntroPages] = useState<string[]>([]);

  // Admin management
  const [admins, setAdmins] = useState(getAdmins());
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminForm, setAdminForm] = useState({ id: '', username: '', password: '', displayName: '', bio: '', contact: '', role: 'manager' as 'super' | 'manager' | 'admin' | 'editor', status: 'active' as 'active' | 'disabled', editableGenealogies: [] as string[] });
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [syncGenealogyPermission, setSyncGenealogyPermission] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);
  const [includeBaseData, setIncludeBaseData] = useState(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ title, message, onConfirm });
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrationResult(null);
    try {
      const result = await migrateToSupabase({ includeBaseData });
      setMigrationResult(result.message);
      if (result.success) {
        await refreshAllData();
      }
    } catch (err: any) {
      setMigrationResult(`迁移失败: ${err.message}`);
    }
    setMigrating(false);
  };

  const navigate = useNavigate();
  const refreshData = async () => {
    await refreshAllData();
    setFeedbacks(getFeedbacks());
    setEdits(getPersonEdits());
    setNewPersons(getNewPersons());
    setStats(getStats());
    setAdmins(getAdmins());
    // Refresh all people
    const genealogies = getSupabaseGenealogies();
    const personsMap: Record<string, Person[]> = {};
    for (const g of genealogies) {
      personsMap[g.id] = getPeopleByGenealogy(g.id);
    }
    setAllPersons(personsMap);
    // Also refresh genealogies list
    setAllGenealogies(getSupabaseGenealogies());
  };

  const handleFeedbackAction = async (id: string, action: 'resolved' | 'rejected') => {
    await updateFeedbackStatus(id, action, adminNote);
    setAdminNote(''); setShowFeedbackDetail(false); setSelectedFeedback(null);
    // Update local state immediately
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: action, resolvedAt: new Date().toISOString() } : f));
    await refreshData();
  };
  const handleDeleteFeedback = (id: string) => {
    confirmAction('删除反馈', '确定要删除此反馈记录吗？此操作不可恢复。', async () => {
      // Update local state immediately
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      await deleteFeedback(id); await refreshData();
    });
  };
  const handleEditAction = async (id: string, action: 'approved' | 'rejected') => {
    // If approved, we need to update the actual person data in people table
    if (action === 'approved') {
      const edit = edits.find(e => e.id === id);
      if (edit) {
        const genealogy = getGenealogy(edit.genealogyId);
        if (genealogy) {
          const person = genealogy.people[edit.personId];
          if (person) {
            const updatedPerson = { ...person };
            if (edit.field === 'name') updatedPerson.name = edit.newValue;
            else if (edit.field === 'birthYear') updatedPerson.birthYear = edit.newValue;
            else if (edit.field === 'deathYear') updatedPerson.deathYear = edit.newValue;
            else if (edit.field === 'biography') updatedPerson.biography = edit.newValue;
            else if (edit.field === 'spouse') updatedPerson.spouse = edit.newValue;
            else if (edit.field === 'achievements') updatedPerson.achievements = edit.newValue.split('\n').filter((a: string) => a.trim());

            await savePersonToCloud({
              id: person.id, genealogy_id: edit.genealogyId, name: updatedPerson.name, generation: updatedPerson.generation,
              birth_year: updatedPerson.birthYear || '', death_year: updatedPerson.deathYear || '', gender: updatedPerson.gender,
              spouse: updatedPerson.spouse || '', parent_id: updatedPerson.parentId || '', biography: updatedPerson.biography,
              achievements: updatedPerson.achievements?.join('\n') || '', status: 'approved',
              created_at: new Date().toISOString(),
            });
          }
        }
      }
    }
    await updateEditStatus(id, action);
    // Update local state immediately
    setEdits(prev => prev.map(e => e.id === id ? { ...e, status: action } : e));
    await refreshData();
  };
  const handleDeleteEdit = (id: string) => {
    confirmAction('删除修改记录', '确定要删除此修改记录吗？此操作不可恢复。', async () => {
      // Update local state immediately
      setEdits(prev => prev.filter(e => e.id !== id));
      await deleteEdit(id); await refreshData();
    });
  };
  const handleNewPersonAction = async (id: string, action: string) => {
    await updateNewPersonStatus(id, action);
    // Update local state immediately
    setNewPersons(prev => prev.map(p => p.id === id ? { ...p, status: action } : p));
    await refreshData();
  };
  const handleDeleteNewPerson = (id: string) => {
    confirmAction('删除人物', '确定要删除此人物记录吗？此操作不可恢复。', () => {
      deleteNewPerson(id); refreshData();
    });
  };

  const handleModifyNewPerson = (person: any) => {
    setNewPersonForm({ genealogyId: person.genealogyId, name: person.name, generation: person.generation, birthYear: person.birthYear, deathYear: person.deathYear, gender: person.gender, spouse: person.spouse, parentId: person.parentId, biography: person.biography, achievements: person.achievements });
    setEditingPersonId(person.id); setShowNewPersonForm(true); setFormErrors({});
  };

  const handleSubmitNewPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!newPersonForm.genealogyId) errors.genealogyId = '请选择族谱';
    if (!newPersonForm.name) errors.name = '请输入姓名';
    if (newPersonForm.parentId) {
      const genealogy = getGenealogy(newPersonForm.genealogyId);
      const parent = genealogy?.people[newPersonForm.parentId];
      if (parent) {
        if (newPersonForm.generation !== parent.generation + 1) errors.generation = `父亲为第${parent.generation}世，新增人物必须为第${parent.generation + 1}世`;
        if (newPersonForm.birthYear && parent.birthYear && parseInt(newPersonForm.birthYear) < parseInt(parent.birthYear)) errors.birthYear = `出生年份不能早于父亲的出生年份（${parent.birthYear}年）`;
      }
    }
    const currentYear = new Date().getFullYear();
    if (newPersonForm.birthYear && parseInt(newPersonForm.birthYear) > currentYear) errors.birthYear = '出生年份不能晚于当前年份';
    if (newPersonForm.deathYear && parseInt(newPersonForm.deathYear) > currentYear) errors.deathYear = '逝世年份不能晚于当前年份';
    if (newPersonForm.birthYear && newPersonForm.deathYear) {
      const age = parseInt(newPersonForm.deathYear) - parseInt(newPersonForm.birthYear);
      if (age > 200) errors.deathYear = '寿命不能超过200年';
      if (age < 0) errors.deathYear = '逝世年份不能早于出生年份';
    }
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    if (editingPersonId) {
      await modifyNewPerson(editingPersonId, { ...newPersonForm });
      setEditingPersonId(null);
    } else {
      await saveNewPerson({ ...newPersonForm });
    }
    // Update local state immediately
    const newPerson = {
      ...newPersonForm,
      id: editingPersonId || `new_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    if (editingPersonId) {
      setNewPersons(prev => prev.map(p => p.id === editingPersonId ? { ...p, ...newPersonForm } : p));
    } else {
      setNewPersons(prev => [newPerson, ...prev]);
    }
    setNewPersonForm({ genealogyId: '', name: '', generation: 1, birthYear: '', deathYear: '', gender: 'male', spouse: '', parentId: '', biography: '', achievements: '' });
    setShowNewPersonForm(false); setEditingPersonId(null); setFormErrors({});
    await refreshData();
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.genealogyId || !editForm.personId || !editForm.newValue) return;
    const genealogy = getGenealogy(editForm.genealogyId);
    const person = genealogy?.people[editForm.personId];
    const newEdit = await savePersonEdit({ genealogyId: editForm.genealogyId, genealogyName: genealogy?.name || '', personId: editForm.personId, personName: person?.name || '', field: editForm.field, oldValue: editForm.oldValue, newValue: editForm.newValue });
    // Update local state immediately
    setEdits(prev => [newEdit, ...prev]);
    setEditForm({ genealogyId: '', personId: '', field: 'biography', oldValue: '', newValue: '' });
    setShowEditForm(false); setEditingEditId(null);
    await refreshData();
  };

  const handleModifyEdit = (edit: PersonEdit) => {
    setEditForm({ genealogyId: edit.genealogyId, personId: edit.personId, field: edit.field, oldValue: edit.oldValue, newValue: edit.newValue });
    setEditingEditId(edit.id); setShowEditForm(true);
  };

  const handleSaveEditModification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEditId) return;
    await modifyEdit(editingEditId, { ...editForm });
    // Update local state immediately
    setEdits(prev => prev.map(e => e.id === editingEditId ? { ...e, ...editForm } : e));
    setEditForm({ genealogyId: '', personId: '', field: 'biography', oldValue: '', newValue: '' });
    setShowEditForm(false); setEditingEditId(null);
    await refreshData();
  };

  const handlePersonSelect = (personId: string) => {
    const genealogy = getGenealogy(editForm.genealogyId);
    const person = genealogy?.people[personId];
    if (person) {
      const fv: Record<string, string> = { name: person.name, birthYear: person.birthYear || '', deathYear: person.deathYear || '', biography: person.biography, spouse: person.spouse || '', achievements: person.achievements?.join('\n') || '' };
      setEditForm(prev => ({ ...prev, personId, oldValue: fv[prev.field] || '' }));
    }
  };

  const filteredFeedbacks = useMemo(() => feedbacks.filter(f => {
    const ms = !searchTerm || f.personName.toLowerCase().includes(searchTerm.toLowerCase()) || f.genealogyName.toLowerCase().includes(searchTerm.toLowerCase()) || f.description.toLowerCase().includes(searchTerm.toLowerCase());
    const mst = statusFilter === 'all' || f.status === statusFilter;
    // Filter by genealogy permission for non-super admins
    const hasPerm = isSuperAdmin || editableGenealogyIds.length === 0 || editableGenealogyIds.includes(f.genealogyId);
    return ms && mst && hasPerm;
  }), [feedbacks, searchTerm, statusFilter, isSuperAdmin, editableGenealogyIds]);

  const filteredEdits = useMemo(() => edits.filter(e => {
    const ms = !searchTerm || e.personName.toLowerCase().includes(searchTerm.toLowerCase()) || e.genealogyName.toLowerCase().includes(searchTerm.toLowerCase());
    const mst = statusFilter === 'all' || e.status === statusFilter;
    // Filter by genealogy permission for non-super admins
    const hasPerm = isSuperAdmin || editableGenealogyIds.length === 0 || editableGenealogyIds.includes(e.genealogyId);
    return ms && mst && hasPerm;
  }), [edits, searchTerm, statusFilter, isSuperAdmin, editableGenealogyIds]);

  const filteredNewPersons = useMemo(() => newPersons.filter(p => {
    const ms = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const mst = statusFilter === 'all' || p.status === statusFilter;
    // Filter by genealogy permission for non-super admins
    const hasPerm = isSuperAdmin || editableGenealogyIds.length === 0 || editableGenealogyIds.includes(p.genealogyId);
    return ms && mst && hasPerm;
  }), [newPersons, searchTerm, statusFilter, isSuperAdmin, editableGenealogyIds]);

  const feedbackTypeLabels: Record<string, string> = { 'info-error': '信息有误', 'missing-info': '信息缺失', 'duplicate': '重复记录', 'other': '其他问题' };
  const fieldLabels: Record<string, string> = { name: '姓名', birthYear: '出生年份', deathYear: '逝世年份', biography: '生平介绍', spouse: '配偶', achievements: '主要成就' };

  // All genealogies: from Supabase cache
  const [allGenealogies, setAllGenealogies] = useState(() => getSupabaseGenealogies());

  const tabs: { key: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'dashboard', label: '概览', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'feedbacks', label: '反馈管理', icon: <MessageSquare className="w-4 h-4" />, count: stats.feedbacks.pending },
    { key: 'edits', label: '修改审核', icon: <Edit3 className="w-4 h-4" />, count: stats.edits.pending },
    { key: 'new-persons', label: '新增人物', icon: <UserPlus className="w-4 h-4" />, count: stats.newPersons.pending },
    { key: 'all-persons', label: '人物管理', icon: <User className="w-4 h-4" /> },
    { key: 'genealogies', label: '族谱管理', icon: <Plus className="w-4 h-4" /> },
    ...(canManageAdmins ? [{ key: 'admins' as TabType, label: '管理员', icon: <UserCog className="w-4 h-4" /> }] : []),
  ];

  const selectedGenealogy = allGenealogies.find(g => g.id === newPersonForm.genealogyId);
  const selectedGenealogyForEdit = allGenealogies.find(g => g.id === editForm.genealogyId);
  // Use getPeopleByGenealogy directly to avoid duplication
  const availablePersons = editForm.genealogyId ? getPeopleByGenealogy(editForm.genealogyId) : [];
  const availableParents = useMemo(() => {
    if (!selectedGenealogy || newPersonForm.generation <= 1) return [];
    return getPeopleByGenealogy(newPersonForm.genealogyId).filter(p => p.generation === newPersonForm.generation - 1);
  }, [selectedGenealogy, newPersonForm.generation, newPersonForm.genealogyId]);

  // Approved new persons that can also be selected as parents
  const approvedParents = useMemo(() => {
    if (!newPersonForm.genealogyId) return [];
    return newPersons.filter(p => p.genealogyId === newPersonForm.genealogyId && p.status === 'approved');
  }, [newPersons, newPersonForm.genealogyId]);

  useEffect(() => {
    if (newPersonForm.parentId && selectedGenealogy) {
      const parent = selectedGenealogy.people[newPersonForm.parentId];
      if (parent) setNewPersonForm(prev => ({ ...prev, generation: parent.generation + 1 }));
    }
  }, [newPersonForm.parentId, selectedGenealogy]);

  const handleDeletePerson = (genealogyId: string, personId: string) => {
    confirmAction('删除人物', '确定要删除此人物吗？此操作不可恢复。', async () => {
      // Update local state immediately
      setAllPersons(prev => {
        const updated = { ...prev };
        if (updated[genealogyId]) {
          updated[genealogyId] = updated[genealogyId].filter(p => p.id !== personId);
        }
        return updated;
      });
      await deletePersonFromCloud(personId);
      await refreshData();
    });
  };

  const handleSaveGenealogy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genealogyForm.id || !genealogyForm.name) return;
    if (isEditor) return;
    const allG = getSupabaseGenealogies();
    const existingIdx = allG.findIndex(g => g.id === genealogyForm.id);
    
    const newGenealogy = {
      id: genealogyForm.id,
      name: genealogyForm.name,
      description: genealogyForm.description,
      origin: genealogyForm.origin,
      foundingYear: genealogyForm.foundingYear,
      ancestor: null,
      people: existingIdx >= 0 ? allG[existingIdx].people : {},
    };

    if (existingIdx >= 0) {
      updateCustomGenealogy(genealogyForm.id, genealogyForm);
      setEditingGenealogyId(null);
      setAllGenealogies(prev => prev.map(g => g.id === genealogyForm.id ? { ...g, ...genealogyForm } : g));
    } else {
      await saveCustomGenealogy({ ...genealogyForm, introductions: [] });
      setAllGenealogies(prev => [...prev, newGenealogy]);
      
      // If current user is not super admin and not default, propagate new genealogy to their permission chain
      if (currentUserId && currentUserId !== 'default') {
        const currentAdmin = admins.find(a => a.id === currentUserId);
        if (currentAdmin && !currentAdmin.editableGenealogies.includes(genealogyForm.id)) {
          // Propagate to self and all descendants
          await propagateGenealogyPermission(currentUserId, [], genealogyForm.id);
          // Update local state
          setAdmins(prev => {
            const allAdminsList = getAdmins();
            return allAdminsList;
          });
        }
      }
    }
    setGenealogyForm({ id: '', name: '', description: '', origin: '', foundingYear: '' });
    setShowGenealogyForm(false); setEditingGenealogyId(null);
    
    // Refresh genealogies, people, and stats — NOT admins (to preserve permission updates)
    await refreshAllData();
    setAllGenealogies(getSupabaseGenealogies());
    const genealogies = getSupabaseGenealogies();
    const personsMap: Record<string, Person[]> = {};
    for (const g of genealogies) {
      personsMap[g.id] = getPeopleByGenealogy(g.id);
    }
    setAllPersons(personsMap);
    setStats(getStats());
  };

  const handleEditGenealogy = (g: any) => {
    if (isEditor) return; // Editors cannot modify genealogies
    setGenealogyForm({ id: g.id, name: g.name, description: g.description, origin: g.origin, foundingYear: g.foundingYear });
    setEditingGenealogyId(g.id); setShowGenealogyForm(true);
  };

  const handleDeleteGenealogy = (id: string) => {
    if (isEditor) return;
    confirmAction('删除族谱', '确定要删除此族谱吗？此操作将同时删除该族谱下的人物数据和介绍内容，不可恢复。', async () => {
      setAllGenealogies(prev => prev.filter(g => g.id !== id));
      await deleteCustomGenealogy(id);
      // Remove from current user's permissions and propagate
      if (currentUserId && currentUserId !== 'default') {
        const currentAdmin = admins.find(a => a.id === currentUserId);
        if (currentAdmin) {
          const updatedGenealogies = (currentAdmin.editableGenealogies || []).filter(gId => gId !== id);
          await saveAdmin({ ...currentAdmin, editableGenealogies: updatedGenealogies });
          setAdmins(prev => prev.map(a => a.id === currentUserId ? { ...a, editableGenealogies: updatedGenealogies } : a));
        }
      }
      await refreshAllData();
      setFeedbacks(getFeedbacks());
      setEdits(getPersonEdits());
      setNewPersons(getNewPersons());
      setStats(getStats());
      setAllGenealogies(getSupabaseGenealogies());
      const genealogies = getSupabaseGenealogies();
      const personsMap: Record<string, Person[]> = {};
      for (const g of genealogies) {
        personsMap[g.id] = getPeopleByGenealogy(g.id);
      }
      setAllPersons(personsMap);
    });
  };

  const handleOpenIntroEditor = (genealogyId: string) => {
    setIntroEditorId(genealogyId);
    setIntroPages(getGenealogyIntroductions(genealogyId));
    setShowIntroEditor(true);
  };

  const handleSaveIntros = () => {
    updateGenealogyIntroductions(introEditorId, introPages);
    setShowIntroEditor(false);
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.username || !adminForm.displayName) return;
    const existingAdmin = admins.find(a => a.id === adminForm.id);
    
    // Build the admin data to save
    const adminData: any = {
      ...adminForm,
      id: adminForm.id || undefined,
      createdBy: existingAdmin?.createdBy || (isSuperAdmin || isManager || isAdmin ? currentUserId : undefined),
    };
    
    // If editing and password is empty, don't include it in the save (preserve existing password)
    if (editingAdminId && !adminForm.password) {
      delete adminData.password;
    }
    
    const saved = await saveAdmin(adminData);
    setAdminForm({ id: '', username: '', password: '', displayName: '', bio: '', contact: '', role: 'manager', status: 'active', editableGenealogies: [] });
    setSyncGenealogyPermission(false);
    setShowAdminForm(false); setEditingAdminId(null);
    
    // Update local state immediately
    setAdmins(prev => {
      const idx = prev.findIndex(a => a.id === saved.id);
      const merged = { ...saved };
      if (!merged.createdBy) {
        const existing = prev.find(a => a.id === saved.id);
        if (existing?.createdBy) merged.createdBy = existing.createdBy;
      }
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = merged;
        return updated;
      }
      return [...prev, merged];
    });
    
    // If sync permission is enabled, propagate creator's genealogy permissions to this admin
    if (syncGenealogyPermission && (isManager || isAdmin)) {
      const creatorGenealogies = editableGenealogyIds;
      if (creatorGenealogies.length > 0) {
        const updatedAdmin = { ...saved, editableGenealogies: [...creatorGenealogies] };
        await saveAdmin(updatedAdmin);
        setAdmins(prev => prev.map(a => a.id === saved.id ? { ...a, editableGenealogies: [...creatorGenealogies] } : a));
      }
    }
    
    // Refresh other data but preserve admins state
    await refreshAllData();
    setFeedbacks(getFeedbacks());
    setEdits(getPersonEdits());
    setNewPersons(getNewPersons());
    setStats(getStats());
    const genealogies = getSupabaseGenealogies();
    setAllGenealogies(genealogies);
    const personsMap: Record<string, Person[]> = {};
    for (const g of genealogies) {
      personsMap[g.id] = getPeopleByGenealogy(g.id);
    }
    setAllPersons(personsMap);
  };

  const handleEditAdmin = (a: any) => {
    setAdminForm({ id: a.id, username: a.username, password: '', displayName: a.displayName, bio: a.bio || '', contact: a.contact || '', role: a.role, status: a.status, editableGenealogies: a.editableGenealogies || [] });
    setSyncGenealogyPermission(false);
    setEditingAdminId(a.id); setShowAdminForm(true);
  };

  const handleDeleteAdmin = (id: string) => {
    if (id === 'default') return;
    // Check permission: super/manager/admin can only delete if they have management rights
    if ((isManager || isAdmin) && !canManageAdmin(admins.find(a => a.id === id)!)) return;
    confirmAction('删除管理员', '确定要删除此管理员账户吗？此操作不可恢复。', async () => {
      setAdmins(prev => prev.filter(a => a.id !== id));
      await deleteAdmin(id);
      await refreshAllData();
      setFeedbacks(getFeedbacks());
      setEdits(getPersonEdits());
      setNewPersons(getNewPersons());
      setStats(getStats());
      setAdmins(getAdmins());
      const genealogies = getSupabaseGenealogies();
      setAllGenealogies(genealogies);
      const personsMap: Record<string, Person[]> = {};
      for (const g of genealogies) {
        personsMap[g.id] = getPeopleByGenealogy(g.id);
      }
      setAllPersons(personsMap);
    });
  };

  const handleToggleAdminStatus = (id: string) => {
    const admin = admins.find(a => a.id === id);
    if (!admin || id === 'default') return;
    if ((isManager || isAdmin) && !canManageAdmin(admin)) return;
    const newStatus = admin.status === 'active' ? 'disabled' : 'active';
    setAdmins(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    updateAdminStatus(id, newStatus);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"><ArrowLeft className="w-4 h-4" />返回前台</Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-bold text-foreground">族谱管理后台</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={refreshData} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"><RefreshCw className="w-4 h-4" />刷新</button>
              <button onClick={() => { logout(); window.location.href = '/#/'; }} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors rounded-lg hover:bg-destructive/10"><LogOut className="w-4 h-4" />退出</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl mb-8 w-fit flex-wrap">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchTerm(''); setStatusFilter('all'); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {tab.icon}{tab.label}
              {tab.count !== undefined && tab.count > 0 && <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* ===== Dashboard ===== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-primary" /></div><h3 className="font-semibold text-foreground">反馈统计</h3></div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">总计</span><span className="font-medium text-foreground">{stats.feedbacks.total}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">待处理</span><span className="font-medium text-amber-600">{stats.feedbacks.pending}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">已解决</span><span className="font-medium text-green-600">{stats.feedbacks.resolved}</span></div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><Edit3 className="w-5 h-5 text-accent" /></div><h3 className="font-semibold text-foreground">修改审核</h3></div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">总计</span><span className="font-medium text-foreground">{stats.edits.total}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">待审核</span><span className="font-medium text-amber-600">{stats.edits.pending}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">已通过</span><span className="font-medium text-green-600">{stats.edits.approved}</span></div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><UserPlus className="w-5 h-5 text-secondary-foreground" /></div><h3 className="font-semibold text-foreground">新增人物</h3></div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">总计</span><span className="font-medium text-foreground">{stats.newPersons.total}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">待审核</span><span className="font-medium text-amber-600">{stats.newPersons.pending}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">已通过</span><span className="font-medium text-green-600">{stats.newPersons.approved}</span></div>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4">快捷操作</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => { setActiveTab('new-persons'); setShowNewPersonForm(true); setEditingPersonId(null); setFormErrors({}); setNewPersonForm({ genealogyId: '', name: '', generation: 1, birthYear: '', deathYear: '', gender: 'male', spouse: '', parentId: '', biography: '', achievements: '' }); }} className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-left"><UserPlus className="w-5 h-5 text-primary" /><div><div className="text-sm font-medium text-foreground">新增人物</div><div className="text-xs text-muted-foreground">添加新的族谱人物记录</div></div></button>
                <button onClick={() => { setActiveTab('edits'); setShowEditForm(true); }} className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-left"><Edit3 className="w-5 h-5 text-accent" /><div><div className="text-sm font-medium text-foreground">修改人物信息</div><div className="text-xs text-muted-foreground">更新现有的人物资料</div></div></button>
              </div>
              {migrationResult && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${migrationResult.startsWith('迁移完成') ? 'bg-green-100 text-green-700' : 'bg-destructive/10 text-destructive'}`}>
                  {migrationResult}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-border">
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <input type="checkbox" checked={includeBaseData} onChange={(e) => setIncludeBaseData(e.target.checked)} className="rounded border-border" />
                  <span className="text-sm text-foreground">是否同步默认数据</span>
                </label>
                <button onClick={handleMigrate} disabled={migrating} className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium disabled:opacity-50">
                  <Cloud className="w-4 h-4" />
                  {migrating ? '迁移中...' : '迁移数据到 Supabase'}
                </button>
                <p className="text-xs text-muted-foreground mt-2">将本地缓存的族谱、人物、反馈等数据同步到云端数据库{includeBaseData ? '（含默认族谱和人物数据）' : ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== Feedbacks ===== */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索反馈..." className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" /></div>
              <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-10 pr-8 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"><option value="all">全部状态</option><option value="pending">待处理</option><option value="resolved">已解决</option><option value="rejected">已驳回</option></select></div>
            </div>
            {filteredFeedbacks.length === 0 ? (<div className="bg-card border border-border rounded-xl p-12 text-center"><MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">暂无反馈记录</p></div>) : (
              <div className="space-y-3">
                {filteredFeedbacks.map(fb => (
                  <div key={fb.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${fb.status === 'pending' ? 'bg-amber-100 text-amber-700' : fb.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{fb.status === 'pending' ? '待处理' : fb.status === 'resolved' ? '已解决' : '已驳回'}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{feedbackTypeLabels[fb.feedbackType]}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1"><span className="text-sm font-semibold text-foreground">{fb.genealogyName}</span><span className="text-muted-foreground">→</span><span className="text-sm font-medium text-primary">{fb.personName}</span>
                            {fb.personGeneration > 0 && <span className="text-xs px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded">第{fb.personGeneration}世</span>}
                          </div>
                          {fb.personBiography && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{fb.personBiography}</p>}
                          <p className="text-sm text-foreground mt-2">{fb.description}</p>
                          {fb.contact && <p className="text-xs text-muted-foreground mt-1">联系方式：{fb.contact}</p>}
                          <p className="text-xs text-muted-foreground mt-2">{new Date(fb.createdAt).toLocaleString('zh-CN')}</p>
                          {fb.adminNote && <div className="mt-2 p-2 bg-secondary/50 rounded-lg"><p className="text-xs text-muted-foreground">管理员备注：{fb.adminNote}</p></div>}
                        </div>
                        <div className="flex flex-col gap-2">
                          {fb.status === 'pending' && canProcessRecord(fb.genealogyId) && (<button onClick={() => { setSelectedFeedback(fb); setShowFeedbackDetail(true); setAdminNote(''); }} className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90 transition-colors"><Eye className="w-3.5 h-3.5" />处理</button>)}
                          <button onClick={() => handleDeleteFeedback(fb.id)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs hover:bg-destructive/20 transition-colors"><Trash2 className="w-3.5 h-3.5" />删除</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== Edits ===== */}
        {activeTab === 'edits' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索修改记录..." className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" /></div>
              <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-10 pr-8 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"><option value="all">全部状态</option><option value="pending">待审核</option><option value="approved">已通过</option><option value="rejected">已驳回</option></select></div>
              <button onClick={() => { setShowEditForm(true); setEditingEditId(null); setEditForm({ genealogyId: '', personId: '', field: 'biography', oldValue: '', newValue: '' }); }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"><Edit3 className="w-4 h-4" />新增修改</button>
            </div>

            {showEditForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-card border border-border rounded-2xl max-w-lg w-full animate-scale-in overflow-hidden">
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between"><h3 className="text-lg font-semibold text-foreground">{editingEditId ? '修改审核记录' : '新增人物修改'}</h3><button onClick={() => { setShowEditForm(false); setEditingEditId(null); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"><XCircle className="w-4 h-4 text-muted-foreground" /></button></div>
                  <form onSubmit={editingEditId ? handleSaveEditModification : handleSubmitEdit} className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-foreground mb-1">选择族谱</label><select value={editForm.genealogyId} onChange={(e) => setEditForm(prev => ({ ...prev, genealogyId: e.target.value, personId: '', oldValue: '' }))} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required>
                      <option value="">请选择族谱</option>{allGenealogies.filter(g => hasGenealogyPermission(g.id)).map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                    </select></div>
                    {editForm.genealogyId && (<>
                      <div><label className="block text-sm font-medium text-foreground mb-1">选择人物</label><select value={editForm.personId} onChange={(e) => handlePersonSelect(e.target.value)} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required>
                        <option value="">请选择人物</option>{availablePersons.sort((a: any, b: any) => a.generation - b.generation).map(p => (<option key={p.id} value={p.id}>第{p.generation}世 - {p.name}{p.birthYear ? ` (${p.birthYear})` : ''}</option>))}
                      </select></div>
                      {editForm.personId && (<>
                        <div><label className="block text-sm font-medium text-foreground mb-1">修改字段</label><select value={editForm.field} onChange={(e) => { const field = e.target.value; const genealogy = getGenealogy(editForm.genealogyId); const person = genealogy?.people[editForm.personId]; const fv: Record<string, string> = { name: person?.name || '', birthYear: person?.birthYear || '', deathYear: person?.deathYear || '', biography: person?.biography || '', spouse: person?.spouse || '', achievements: person?.achievements?.join('\n') || '' }; setEditForm(prev => ({ ...prev, field, oldValue: fv[field] || '' })); }} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                          {Object.entries(fieldLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                        </select></div>
                        <div><label className="block text-sm font-medium text-foreground mb-1">原值</label><textarea value={editForm.oldValue} readOnly rows={3} className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground resize-none" /></div>
                        <div><label className="block text-sm font-medium text-foreground mb-1">新值 <span className="text-destructive">*</span></label><textarea value={editForm.newValue} onChange={(e) => setEditForm(prev => ({ ...prev, newValue: e.target.value }))} rows={3} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" required /></div>
                      </>)}
                    </>)}
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => { setShowEditForm(false); setEditingEditId(null); }} className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">取消</button>
                      <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"><Save className="w-4 h-4" />{editingEditId ? '保存修改' : '提交修改'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {filteredEdits.length === 0 ? (<div className="bg-card border border-border rounded-xl p-12 text-center"><Edit3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">暂无修改记录</p></div>) : (
              <div className="space-y-3">
                {filteredEdits.map(edit => (
                  <div key={edit.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${edit.status === 'pending' ? 'bg-amber-100 text-amber-700' : edit.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{edit.status === 'pending' ? '待审核' : edit.status === 'approved' ? '已通过' : '已驳回'}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{fieldLabels[edit.field] || edit.field}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-3"><span className="text-sm font-semibold text-foreground">{edit.genealogyName}</span><span className="text-muted-foreground">→</span><span className="text-sm font-medium text-primary">{edit.personName}</span></div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/30"><div className="text-xs text-red-600 dark:text-red-400 mb-1 font-medium flex items-center gap-1"><ArrowUp className="w-3 h-3" />原值</div><p className="text-sm text-foreground whitespace-pre-wrap">{edit.oldValue || '（空）'}</p></div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800/30"><div className="text-xs text-green-600 dark:text-green-400 mb-1 font-medium flex items-center gap-1"><ArrowDown className="w-3 h-3" />新值</div><p className="text-sm text-foreground whitespace-pre-wrap">{edit.newValue}</p></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-3">{new Date(edit.createdAt).toLocaleString('zh-CN')}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {edit.status === 'pending' && canProcessRecord(edit.genealogyId) && (<>
                            <button onClick={() => handleEditAction(edit.id, 'approved')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"><CheckCircle2 className="w-3.5 h-3.5" />通过</button>
                            <button onClick={() => handleEditAction(edit.id, 'rejected')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs hover:bg-destructive/20 transition-colors"><XCircle className="w-3.5 h-3.5" />驳回</button>
                            <button onClick={() => handleModifyEdit(edit)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs hover:bg-accent/20 transition-colors"><Pencil className="w-3.5 h-3.5" />修改</button>
                          </>)}
                          <button onClick={() => handleDeleteEdit(edit.id)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs hover:bg-destructive/20 transition-colors"><Trash2 className="w-3.5 h-3.5" />删除</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== New Persons ===== */}
        {activeTab === 'new-persons' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索人物..." className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" /></div>
              <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-10 pr-8 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"><option value="all">全部状态</option><option value="pending">待审核</option><option value="approved">已通过</option><option value="rejected">已驳回</option></select></div>
              <button onClick={() => { setShowNewPersonForm(true); setEditingPersonId(null); setFormErrors({}); setNewPersonForm({ genealogyId: '', name: '', generation: 1, birthYear: '', deathYear: '', gender: 'male', spouse: '', parentId: '', biography: '', achievements: '' }); }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"><UserPlus className="w-4 h-4" />新增人物</button>
            </div>

            {showNewPersonForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-card border border-border rounded-2xl max-w-lg w-full animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto">
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10"><h3 className="text-lg font-semibold text-foreground">{editingPersonId ? '修改人物' : '新增人物'}</h3><button onClick={() => { setShowNewPersonForm(false); setEditingPersonId(null); setFormErrors({}); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"><XCircle className="w-4 h-4 text-muted-foreground" /></button></div>
                  <form onSubmit={handleSubmitNewPerson} className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-foreground mb-1">选择族谱 <span className="text-destructive">*</span></label><select value={newPersonForm.genealogyId} onChange={(e) => setNewPersonForm(prev => ({ ...prev, genealogyId: e.target.value }))} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required>
                      <option value="">请选择族谱</option>{allGenealogies.filter(g => hasGenealogyPermission(g.id)).map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                    </select>{formErrors.genealogyId && <p className="text-xs text-destructive mt-1">{formErrors.genealogyId}</p>}</div>
                    {newPersonForm.genealogyId && (<>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-foreground mb-1">姓名 <span className="text-destructive">*</span></label><input type="text" value={newPersonForm.name} onChange={(e) => setNewPersonForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required />{formErrors.name && <p className="text-xs text-destructive mt-1">{formErrors.name}</p>}</div>
                        <div><label className="block text-sm font-medium text-foreground mb-1">性别</label><select value={newPersonForm.gender} onChange={(e) => setNewPersonForm(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"><option value="male">男</option><option value="female">女</option></select></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium text-foreground mb-1">世系 <span className="text-destructive">*</span></label><input type="number" min={1} value={newPersonForm.generation} onChange={(e) => setNewPersonForm(prev => ({ ...prev, generation: parseInt(e.target.value) || 1 }))} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required />{formErrors.generation && <p className="text-xs text-destructive mt-1">{formErrors.generation}</p>}</div>
                        <div><label className="block text-sm font-medium text-foreground mb-1">出生年份</label><input type="text" value={newPersonForm.birthYear} onChange={(e) => setNewPersonForm(prev => ({ ...prev, birthYear: e.target.value }))} placeholder="如：1900" className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />{formErrors.birthYear && <p className="text-xs text-destructive mt-1">{formErrors.birthYear}</p>}</div>
                        <div><label className="block text-sm font-medium text-foreground mb-1">逝世年份</label><input type="text" value={newPersonForm.deathYear} onChange={(e) => setNewPersonForm(prev => ({ ...prev, deathYear: e.target.value }))} placeholder="如：1980" className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />{formErrors.deathYear && <p className="text-xs text-destructive mt-1">{formErrors.deathYear}</p>}</div>
                      </div>
                      <div><label className="block text-sm font-medium text-foreground mb-1">父亲（选填）</label><select value={newPersonForm.parentId} onChange={(e) => setNewPersonForm(prev => ({ ...prev, parentId: e.target.value }))} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                        <option value="">无（新增分支始祖）</option>
                        {availableParents.map(p => (<option key={p.id} value={p.id}>第{p.generation}世 - {p.name}{p.birthYear ? ` (${p.birthYear})` : ''}</option>))}
                        {approvedParents.map(p => (<option key={p.id} value={p.id}>第{p.generation}世 - {p.name}{p.birthYear ? ` (${p.birthYear})` : ''} [新增]</option>))}
                      </select>{newPersonForm.parentId && (<p className="text-xs text-muted-foreground mt-1">提示：世系将自动设为父亲世系 + 1（第{(() => { const baseP = selectedGenealogy?.people[newPersonForm.parentId]; const appP = approvedParents.find(x => x.id === newPersonForm.parentId); const p = baseP || appP; return p?.generation ? p.generation + 1 : '?'; })()}世）</p>)}</div>
                      <div><label className="block text-sm font-medium text-foreground mb-1">配偶</label><input type="text" value={newPersonForm.spouse} onChange={(e) => setNewPersonForm(prev => ({ ...prev, spouse: e.target.value }))} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
                      <div><label className="block text-sm font-medium text-foreground mb-1">生平介绍</label><textarea value={newPersonForm.biography} onChange={(e) => setNewPersonForm(prev => ({ ...prev, biography: e.target.value }))} rows={3} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" /></div>
                      <div><label className="block text-sm font-medium text-foreground mb-1">主要成就（每行一个）</label><textarea value={newPersonForm.achievements} onChange={(e) => setNewPersonForm(prev => ({ ...prev, achievements: e.target.value }))} rows={2} placeholder="每项成就单独一行" className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" /></div>
                    </>)}
                    <div className="flex gap-3 pt-2 sticky bottom-0 bg-card pt-4 border-t border-border"><button type="button" onClick={() => { setShowNewPersonForm(false); setEditingPersonId(null); setFormErrors({}); }} className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">取消</button><button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"><Save className="w-4 h-4" />{editingPersonId ? '保存修改' : '提交新增'}</button></div>
                  </form>
                </div>
              </div>
            )}

            {filteredNewPersons.length === 0 ? (<div className="bg-card border border-border rounded-xl p-12 text-center"><UserPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">暂无新增人物记录</p></div>) : (
              <div className="space-y-3">
                {filteredNewPersons.map(person => (
                  <div key={person.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${person.status === 'pending' ? 'bg-amber-100 text-amber-700' : person.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{person.status === 'pending' ? '待审核' : person.status === 'approved' ? '已通过' : '已驳回'}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">第{person.generation}世</span>
                          </div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${person.gender === 'male' ? 'bg-primary/15 text-primary' : 'bg-accent/15 text-accent'}`}>{person.name.charAt(0)}</div>
                            <div><div className="text-lg font-semibold text-foreground">{person.name}</div><div className="text-xs text-muted-foreground">{person.genealogyId && allGenealogies.find(g => g.id === person.genealogyId)?.name}{person.birthYear && ` · ${person.birthYear}-${person.deathYear || '？'}`}</div></div>
                          </div>
                          {person.biography && <p className="text-sm text-foreground mt-2 line-clamp-2">{person.biography}</p>}
                          {person.parentId && (() => { const g = getGenealogy(person.genealogyId); const parent = g?.people[person.parentId]; const appParent = getApprovedPersonsByGenealogy(person.genealogyId).find(p => p.id === person.parentId); return (parent || appParent) ? <p className="text-xs text-muted-foreground mt-1">父亲：{parent?.name || appParent?.name}</p> : null; })()}
                          {person.achievements && <p className="text-xs text-muted-foreground mt-1">成就：{person.achievements}</p>}
                          <p className="text-xs text-muted-foreground mt-2">{new Date(person.createdAt).toLocaleString('zh-CN')}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {person.status === 'pending' && canProcessRecord(person.genealogyId) && (<>
                            <button onClick={() => handleNewPersonAction(person.id, 'approved')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"><CheckCircle2 className="w-3.5 h-3.5" />通过</button>
                            <button onClick={() => handleNewPersonAction(person.id, 'rejected')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs hover:bg-destructive/20 transition-colors"><XCircle className="w-3.5 h-3.5" />驳回</button>
                            <button onClick={() => handleModifyNewPerson(person)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs hover:bg-accent/20 transition-colors"><Pencil className="w-3.5 h-3.5" />修改</button>
                          </>)}
                          <button onClick={() => handleDeleteNewPerson(person.id)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs hover:bg-destructive/20 transition-colors"><Trash2 className="w-3.5 h-3.5" />删除</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== All Persons Management ===== */}
        {activeTab === 'all-persons' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">人物管理</h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索人物..." className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-10 pr-8 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                    <option value="all">全部状态</option>
                    <option value="approved">已审核</option>
                    <option value="pending">待审核</option>
                  </select>
                </div>
              </div>
            </div>

            {Object.keys(allPersons).length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center"><User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">暂无人物数据</p></div>
            ) : (
              <div className="space-y-6">
                {Object.entries(allPersons).map(([genealogyId, persons]) => {
                  const genealogy = getSupabaseGenealogies().find(g => g.id === genealogyId);
                  const hasPermission = hasGenealogyPermission(genealogyId);
                  const filteredPersons = persons.filter(p => {
                    const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchStatus = statusFilter === 'all' || (p as any).status === statusFilter || (statusFilter === 'approved' && !(p as any).status);
                    return matchSearch && matchStatus;
                  });
                  if (filteredPersons.length === 0) return null;
                  return (
                    <div key={genealogyId} className={`bg-card border border-border rounded-xl overflow-hidden ${!hasPermission ? 'opacity-60' : ''}`}>
                      <div className="px-6 py-4 border-b border-border bg-secondary/30">
                        <h3 className="text-lg font-semibold text-foreground">{genealogy?.name || genealogyId}（{filteredPersons.length} 人）{!hasPermission && <span className="text-xs text-muted-foreground ml-2">无权限</span>}</h3>
                      </div>
                      <div className="divide-y divide-border">
                        {filteredPersons.sort((a, b) => a.generation - b.generation).map(p => (
                          <div key={p.id} className="px-6 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${p.gender === 'male' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>{p.name.charAt(0)}</div>
                              <div>
                                <div className="text-sm font-medium text-foreground">{p.name}</div>
                                <div className="text-xs text-muted-foreground">第{p.generation}世{p.birthYear ? ` · ${p.birthYear}-${p.deathYear || '？'}` : ''}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {(p as any).status === 'pending' && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">待审核</span>}
                              {p.parentId && <span className="text-xs text-muted-foreground">父ID: {p.parentId}</span>}
                              <button onClick={() => hasPermission && handleDeletePerson(genealogyId, p.id)} disabled={!hasPermission} className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive rounded text-xs hover:bg-destructive/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"><Trash2 className="w-3 h-3" />删除</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== Genealogies Management ===== */}
        {activeTab === 'genealogies' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">族谱管理</h3>
              {!isEditor && <button onClick={() => { setShowGenealogyForm(true); setEditingGenealogyId(null); setGenealogyForm({ id: '', name: '', description: '', origin: '', foundingYear: '' }); }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"><Plus className="w-4 h-4" />新增族谱</button>}
            </div>

            {showGenealogyForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-card border border-border rounded-2xl max-w-md w-full animate-scale-in overflow-hidden">
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between"><h3 className="text-lg font-semibold text-foreground">{editingGenealogyId ? '修改族谱信息' : '新增族谱'}</h3><button onClick={() => { setShowGenealogyForm(false); setEditingGenealogyId(null); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"><XCircle className="w-4 h-4 text-muted-foreground" /></button></div>
                  <form onSubmit={handleSaveGenealogy} className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-foreground mb-1">族谱ID <span className="text-destructive">*</span></label><input type="text" value={genealogyForm.id} onChange={(e) => setGenealogyForm(prev => ({ ...prev, id: e.target.value }))} placeholder="如：wang" className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required disabled={!!editingGenealogyId} /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">族谱名称 <span className="text-destructive">*</span></label><input type="text" value={genealogyForm.name} onChange={(e) => setGenealogyForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">简介</label><textarea value={genealogyForm.description} onChange={(e) => setGenealogyForm(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">迁徙路线</label><input type="text" value={genealogyForm.origin} onChange={(e) => setGenealogyForm(prev => ({ ...prev, origin: e.target.value }))} placeholder="如：山西 → 河南" className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">始迁年份</label><input type="text" value={genealogyForm.foundingYear} onChange={(e) => setGenealogyForm(prev => ({ ...prev, foundingYear: e.target.value }))} placeholder="如：1700" className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
                    <div className="flex gap-3 pt-2"><button type="button" onClick={() => { setShowGenealogyForm(false); setEditingGenealogyId(null); }} className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">取消</button><button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"><Save className="w-4 h-4" />保存</button></div>
                  </form>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {allGenealogies.map(g => {
                const hasPermission = hasGenealogyPermission(g.id);
                const allG = getSupabaseGenealogies();
                const mergedG = getGenealogy(g.id);
                const personCount = mergedG ? Object.keys(mergedG.people).length : 0;
                return (
                  <div key={g.id} className={`bg-card border border-border rounded-xl p-5 ${!hasPermission ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-semibold text-foreground">{g.name}</h4>
                          {!hasPermission && <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">无权限</span>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{g.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {g.origin && <span>迁徙：{g.origin}</span>}
                          {g.foundingYear && <span>始迁：{g.foundingYear}年</span>}
                          <span>人数：{personCount}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => hasPermission && handleEditGenealogy(g)} disabled={!hasPermission} className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"><Pencil className="w-3.5 h-3.5" />修改</button>
                        <button onClick={() => hasPermission && handleOpenIntroEditor(g.id)} disabled={!hasPermission} className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"><FileText className="w-3.5 h-3.5" />{getGenealogyIntroductions(g.id).length > 0 ? '修改更多介绍' : '创建更多介绍'}</button>
                        <button onClick={() => hasPermission && handleDeleteGenealogy(g.id)} disabled={!hasPermission} className="inline-flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs hover:bg-destructive/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"><Trash2 className="w-3.5 h-3.5" />删除</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== Admin Management ===== */}
        {activeTab === 'admins' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">管理员管理</h3>
              <button onClick={() => {
                setShowAdminForm(true); setEditingAdminId(null);
                // Determine default role based on current user's role
                let defaultRole: 'super' | 'manager' | 'admin' | 'editor' = 'editor';
                if (isSuperAdmin) defaultRole = 'manager';
                else if (isManager) defaultRole = 'admin';
                else if (isAdmin) defaultRole = 'editor';
                const defaultGenealogies = (isManager || isAdmin) ? editableGenealogyIds : [];
                setAdminForm({ id: '', username: '', password: '', displayName: '', bio: '', contact: '', role: defaultRole, status: 'active', editableGenealogies: defaultGenealogies });
                setSyncGenealogyPermission(false);
              }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"><UserPlus className="w-4 h-4" />新增管理员</button>
            </div>

            {showAdminForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-card border border-border rounded-2xl max-w-md w-full animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto">
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between"><h3 className="text-lg font-semibold text-foreground">{editingAdminId ? '修改管理员' : '新增管理员'}</h3><button onClick={() => { setShowAdminForm(false); setEditingAdminId(null); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"><XCircle className="w-4 h-4 text-muted-foreground" /></button></div>
                  <form onSubmit={handleSaveAdmin} className="p-6 space-y-4">
                    <div><label className="block text-sm font-medium text-foreground mb-1">用户名 <span className="text-destructive">*</span></label><input type="text" value={adminForm.username} onChange={(e) => setAdminForm(prev => ({ ...prev, username: e.target.value }))} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required disabled={!!editingAdminId} /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">密码 {!editingAdminId && <span className="text-destructive">*</span>}</label><input type="password" value={adminForm.password} onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))} placeholder={editingAdminId ? '留空则不修改密码' : '请输入密码'} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required={!editingAdminId} /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">显示名称 <span className="text-destructive">*</span></label><input type="text" value={adminForm.displayName} onChange={(e) => setAdminForm(prev => ({ ...prev, displayName: e.target.value }))} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">备注/介绍</label><textarea value={adminForm.bio} onChange={(e) => setAdminForm(prev => ({ ...prev, bio: e.target.value }))} rows={2} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">联系方式</label><input type="text" value={adminForm.contact} onChange={(e) => setAdminForm(prev => ({ ...prev, contact: e.target.value }))} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">角色</label><select value={adminForm.role} onChange={(e) => setAdminForm(prev => ({ ...prev, role: e.target.value as 'super' | 'manager' | 'admin' | 'editor' }))} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                      {isSuperAdmin && <option value="super">超级管理员</option>}
                      {isSuperAdmin && <option value="manager">普通管理员</option>}
                      {(isSuperAdmin || isManager) && <option value="admin">管理员</option>}
                      {(isSuperAdmin || isManager || isAdmin) && <option value="editor">族谱修订员</option>}
                    </select></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">状态</label><select value={adminForm.status} onChange={(e) => setAdminForm(prev => ({ ...prev, status: e.target.value as 'active' | 'disabled' }))} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"><option value="active">启用</option><option value="disabled">停用</option></select></div>
                    <div><label className="block text-sm font-medium text-foreground mb-1">可编辑族谱（留空=全部）</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {allGenealogies
                          .filter(g => isSuperAdmin || editableGenealogyIds.includes(g.id))
                          .map(g => (
                          <label key={g.id} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={adminForm.editableGenealogies.length === 0 || adminForm.editableGenealogies.includes(g.id)} onChange={(e) => {
                              if (adminForm.editableGenealogies.length === 0) {
                                setAdminForm(prev => ({ ...prev, editableGenealogies: allGenealogies.filter(x => isSuperAdmin || editableGenealogyIds.includes(x.id)).map(x => x.id).filter(id => id !== g.id) }));
                              } else if (e.target.checked) {
                                setAdminForm(prev => ({ ...prev, editableGenealogies: [...prev.editableGenealogies, g.id] }));
                              } else {
                                setAdminForm(prev => ({ ...prev, editableGenealogies: prev.editableGenealogies.filter(id => id !== g.id) }));
                              }
                            }} className="rounded border-border" />
                            {g.name}
                          </label>
                        ))}
                      </div>
                    </div>
                    {!editingAdminId && (isManager || isAdmin) && (
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={syncGenealogyPermission} onChange={(e) => setSyncGenealogyPermission(e.target.checked)} className="rounded border-border" />
                        <span className="text-foreground">自动同步我的族谱编辑权限给此账号</span>
                      </label>
                    )}
                    {editingAdminId && (isManager || isAdmin) && (
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={syncGenealogyPermission} onChange={(e) => setSyncGenealogyPermission(e.target.checked)} className="rounded border-border" />
                        <span className="text-foreground">自动同步我的族谱编辑权限给此账号</span>
                      </label>
                    )}
                    <div className="flex gap-3 pt-2"><button type="button" onClick={() => { setShowAdminForm(false); setEditingAdminId(null); }} className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">取消</button><button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"><Save className="w-4 h-4" />保存</button></div>
                  </form>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {(() => {
                const visibleAdmins = getVisibleAdmins();
                const getAdminLevel = (adminId: string, depth = 0): number => {
                  const admin = admins.find(a => a.id === adminId);
                  if (!admin || !admin.createdBy) return depth;
                  return getAdminLevel(admin.createdBy, depth + 1);
                };

                const sortedAdmins = [...visibleAdmins].sort((a, b) => {
                  if (a.id === currentUserId) return -1;
                  if (b.id === currentUserId) return 1;
                  const levelA = getAdminLevel(a.id);
                  const levelB = getAdminLevel(b.id);
                  return levelA - levelB;
                });

                return sortedAdmins.map(admin => {
                  const isCurrentUser = admin.id === currentUserId;
                  const level = getAdminLevel(admin.id);
                  const baseLevel = isSuperAdmin ? 0 : getAdminLevel(currentUserId);
                  const indent = Math.max(0, level - baseLevel);
                  const canManage = canManageAdmin(admin);

                  return (
                <div key={admin.id} className={`bg-card border border-border rounded-xl p-5 ${isCurrentUser ? 'ring-2 ring-primary/20' : ''}`} style={{ marginLeft: `${indent * 24}px` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{admin.displayName.charAt(0)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-foreground">{admin.displayName}</h4>
                          {admin.role === 'super' && <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">超级管理员</span>}
                          {admin.role === 'manager' && <span className="text-xs px-1.5 py-0.5 bg-accent/10 text-accent rounded">普通管理员</span>}
                          {admin.role === 'admin' && <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">管理员</span>}
                          {admin.role === 'editor' && <span className="text-xs px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded">族谱修订员</span>}
                          {admin.status === 'disabled' && <span className="text-xs px-1.5 py-0.5 bg-destructive/10 text-destructive rounded">已停用</span>}
                          {isCurrentUser && <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">当前账号</span>}
                          {indent > 0 && <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded">下级</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">@{admin.username}</p>
                        {admin.bio && <p className="text-xs text-muted-foreground mt-1">{admin.bio}</p>}
                        {admin.contact && <p className="text-xs text-muted-foreground">联系方式：{admin.contact}</p>}
                        {admin.editableGenealogies && admin.editableGenealogies.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">可编辑：{admin.editableGenealogies.map(id => allGenealogies.find(g => g.id === id)?.name).filter(Boolean).join('、')}</p>
                        )}
                        {admin.createdBy && <p className="text-xs text-muted-foreground mt-1">创建者：{admins.find(a => a.id === admin.createdBy)?.displayName || admin.createdBy}</p>}
                      </div>
                    </div>
                    {admin.id !== 'default' && canManage && (
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleEditAdmin(admin)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs hover:bg-accent/20 transition-colors"><Pencil className="w-3.5 h-3.5" />修改</button>
                        <button onClick={() => handleToggleAdminStatus(admin.id)} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${admin.status === 'active' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {admin.status === 'active' ? <><ShieldOff className="w-3.5 h-3.5" />停用</> : <><Shield className="w-3.5 h-3.5" />启用</>}
                        </button>
                        {isCurrentUser ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary/50 text-muted-foreground rounded-lg text-xs cursor-default"><User className="w-3.5 h-3.5" />当前账号</span>
                        ) : (
                          <button onClick={() => handleDeleteAdmin(admin.id)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs hover:bg-destructive/20 transition-colors"><Trash2 className="w-3.5 h-3.5" />删除</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );});
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {showFeedbackDetail && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full animate-scale-in overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between"><div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-accent" /><h3 className="text-lg font-semibold text-foreground">处理反馈</h3></div><button onClick={() => { setShowFeedbackDetail(false); setSelectedFeedback(null); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"><XCircle className="w-4 h-4 text-muted-foreground" /></button></div>
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2"><span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{feedbackTypeLabels[selectedFeedback.feedbackType]}</span></div>
                <div className="flex items-center gap-2 mb-3"><span className="text-sm font-semibold text-foreground">{selectedFeedback.genealogyName}</span><span className="text-muted-foreground">→</span><span className="text-sm font-medium text-primary">{selectedFeedback.personName}</span>
                  {selectedFeedback.personGeneration > 0 && <span className="text-xs px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded">第{selectedFeedback.personGeneration}世</span>}
                </div>
                {selectedFeedback.personBiography && <p className="text-xs text-muted-foreground mb-2">{selectedFeedback.personBiography}</p>}
                <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-sm text-foreground">{selectedFeedback.description}</p></div>
                {selectedFeedback.contact && <p className="text-xs text-muted-foreground mt-2">联系方式：{selectedFeedback.contact}</p>}
                <p className="text-xs text-muted-foreground mt-1">提交时间：{new Date(selectedFeedback.createdAt).toLocaleString('zh-CN')}</p>
              </div>
              <div><label className="block text-sm font-medium text-foreground mb-1">管理员备注</label><textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="输入处理说明..." rows={3} className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" /></div>
              <div className="flex gap-3">
                <button onClick={() => handleFeedbackAction(selectedFeedback.id, 'resolved')} disabled={!canProcessRecord(selectedFeedback.genealogyId)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"><CheckCircle2 className="w-4 h-4" />标记已解决</button>
                <button onClick={() => handleFeedbackAction(selectedFeedback.id, 'rejected')} disabled={!canProcessRecord(selectedFeedback.genealogyId)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"><XCircle className="w-4 h-4" />驳回</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Introduction Editor Modal */}
      {showIntroEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full animate-scale-in overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">编辑族谱介绍 - {allGenealogies.find(g => g.id === introEditorId)?.name}</h3>
              <button onClick={handleSaveIntros} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"><XCircle className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {introPages.map((page, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">第 {i + 1} 页</label>
                    <button onClick={() => setIntroPages(prev => prev.filter((_, idx) => idx !== i))} className="text-xs text-destructive hover:text-destructive/80">删除此页</button>
                  </div>
                  <textarea value={page} onChange={(e) => setIntroPages(prev => prev.map((p, idx) => idx === i ? e.target.value : p))} rows={6} className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" placeholder="输入介绍内容..." />
                </div>
              ))}
              <button onClick={() => setIntroPages(prev => [...prev, ''])} className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">+ 添加新页面</button>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3">
              <button onClick={() => setShowIntroEditor(false)} className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">取消</button>
              <button onClick={handleSaveIntros} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"><Save className="w-4 h-4" />保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full animate-scale-in overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">{confirmDialog.title}</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground">{confirmDialog.message}</p>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3">
              <button onClick={() => setConfirmDialog(null)} className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">取消</button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} className="flex-1 px-4 py-2.5 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Main Export with Auth Check =====
export default function AdminPage() {
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => { setAuthChecked(true); }, []);
  if (!authChecked) return (<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>);
  if (!isAuthenticated()) return <LoginPage />;
  return <AdminPageInner />;
}
