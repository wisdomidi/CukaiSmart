import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Star,
  X,
  Send,
  CheckCircle2,
  Sparkles,
  Bug,
  Lightbulb,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { useTax } from '../../context/TaxContext';
import { saveUserFeedbackToCloud } from '../../services/firebase';

interface UserFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserFeedbackModal: React.FC<UserFeedbackModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, persona } = useTax();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackType, setFeedbackType] = useState<'bug_report' | 'feature_request' | 'tax_question' | 'general'>('feature_request');
  const [category, setCategory] = useState<'scanner' | 'copilot' | 'vault' | 'calculator' | 'other'>('scanner');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMessage('Please enter your feedback message before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await saveUserFeedbackToCloud({
        userId: currentUser?.uid || 'guest-user',
        userEmail: currentUser?.email || 'guest@cukaismart.local',
        persona,
        rating,
        type: feedbackType,
        category,
        message: message.trim(),
      });

      setSubmittedSuccessfully(true);
      setTimeout(() => {
        setSubmittedSuccessfully(false);
        setMessage('');
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMessage(`Failed to save feedback: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 sm:p-7 shadow-2xl relative text-white space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/50">
            <MessageSquarePlus className="w-6 h-6" />
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Taxpayer Voice & Ideas
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">Share Your App Feedback</h3>
          </div>
        </div>

        {submittedSuccessfully ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 animate-bounce" />
            <h4 className="text-base font-bold text-white">Thank You for Improving CukaiSmart!</h4>
            <p className="text-xs text-slate-300">
              Your feedback has been logged to Firestore. Our development team and AI engine review every submission to refine tax accuracy and user experience.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Star Rating */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Rate your experience (1–5 Stars):</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-amber-400 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        (hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-mono font-bold text-amber-400 ml-2">{rating}/5 Stars</span>
              </div>
            </div>

            {/* 2. Feedback Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Feedback Type:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'feature_request', label: 'Feature Idea', icon: Lightbulb },
                  { id: 'bug_report', label: 'Report Bug', icon: Bug },
                  { id: 'tax_question', label: 'Tax Rule Question', icon: HelpCircle },
                  { id: 'general', label: 'General Feedback', icon: FileText },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = feedbackType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFeedbackType(item.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Feature Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Related Feature / Component:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="scanner">Receipt AI Scanner & OCR</option>
                <option value="copilot">Tax Copilot & LHDN AI Advisor</option>
                <option value="vault">Claimable Document Vault & MyInvois</option>
                <option value="calculator">Tax Relief Calculator & Payday Optimizer</option>
                <option value="other">Other / UI & Navigation</option>
              </select>
            </div>

            {/* 4. Message Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Detailed Comments / Suggestion:</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what you liked, any issues encountered, or what new tax features you'd like to see..."
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Feedback...' : 'Submit Feedback to Firestore'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
