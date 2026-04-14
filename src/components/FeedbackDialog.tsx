import { useState } from 'react';
import { X, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';

interface FeedbackDialogProps {
  genealogyId: string;
  genealogyName: string;
  personId: string;
  personName: string;
  onClose: () => void;
}

type FeedbackType = 'info-error' | 'missing-info' | 'duplicate' | 'other';

export default function FeedbackDialog({
  genealogyId,
  genealogyName,
  personId,
  personName,
  onClose,
}: FeedbackDialogProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('info-error');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const feedbackTypes: { value: FeedbackType; label: string; description: string }[] = [
    { value: 'info-error', label: '信息有误', description: '人物生平、年代等信息存在错误' },
    { value: 'missing-info', label: '信息缺失', description: '缺少重要的人物信息或关系记录' },
    { value: 'duplicate', label: '重复记录', description: '存在重复的人物条目' },
    { value: 'other', label: '其他问题', description: '其他需要反馈的问题' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, this would be:
    // await fetch('/api/feedback', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     genealogyId,
    //     personId,
    //     feedbackType,
    //     description,
    //     contact,
    //   }),
    // });

    console.log('Feedback submitted:', {
      genealogyId,
      genealogyName,
      personId,
      personName,
      feedbackType,
      description,
      contact,
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full animate-scale-in text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">反馈已提交</h3>
          <p className="text-sm text-muted-foreground mb-6">
            感谢您的反馈，我们会尽快核实并修正相关信息。
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">提交反馈</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Context */}
        <div className="px-6 py-3 bg-secondary/50 border-b border-border">
          <p className="text-sm text-muted-foreground">
            反馈对象：<span className="text-foreground font-medium">{genealogyName}</span> - <span className="text-foreground font-medium">{personName}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              反馈类型
            </label>
            <div className="grid grid-cols-2 gap-2">
              {feedbackTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFeedbackType(type.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    feedbackType === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className={`text-sm font-medium ${
                    feedbackType === type.value ? 'text-primary' : 'text-foreground'
                  }`}>
                    {type.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              问题描述 <span className="text-destructive">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请详细描述您发现的问题..."
              rows={4}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              required
            />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              联系方式（选填）
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="邮箱或手机号，方便我们回复您"
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  提交反馈
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
