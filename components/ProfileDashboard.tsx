import React, { useState } from 'react';
import type { User } from '../types';
import { supabase } from '../supabaseClient';
import { CheckIcon, UserIcon, EmailIcon, BusinessIcon, GlobeIcon, BoltIcon, LockIcon, CloseIcon } from './Icons';

interface ProfileDashboardProps {
    user: User;
    onUpdateUser: (updatedUser: User) => void;
}

const ProfileDashboard: React.FC<ProfileDashboardProps> = ({ user, onUpdateUser }) => {
    const [name, setName] = useState(user.name);
    const [profession, setProfession] = useState(user.profession || '');
    const [bio, setBio] = useState(user.bio || '');
    const [interests, setInterests] = useState(user.interests || '');
    const [goals, setGoals] = useState(user.goals || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Security States
    const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityLoading, setSecurityLoading] = useState(false);
    const [securityError, setSecurityError] = useState<string | null>(null);
    const [securitySuccess, setSecuritySuccess] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveStatus('idle');
        setErrorMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    name, 
                    profession, 
                    bio, 
                    interests, 
                    goals 
                })
                .eq('id', user.id);

            if (error) {
                setSaveStatus('error');
                setErrorMessage(error.message);
            } else {
                onUpdateUser({ ...user, name, profession, bio, interests, goals });
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        } catch (err: any) {
            setSaveStatus('error');
            setErrorMessage(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSecurityUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSecurityError(null);
        setSecuritySuccess(false);

        if (newPassword !== confirmPassword) {
            setSecurityError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            setSecurityError("Password must be at least 6 characters.");
            return;
        }

        setSecurityLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                setSecurityError(error.message);
            } else {
                setSecuritySuccess(true);
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => {
                    setIsUpdatingSecurity(false);
                    setSecuritySuccess(false);
                }, 3000);
            }
        } catch (err: any) {
            setSecurityError(err.message || "An unexpected error occurred.");
        } finally {
            setSecurityLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-4 px-3 sm:px-6 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-5">
                {/* Left Profile Summary */}
                <div className="w-full md:w-[260px] space-y-4">
                    <div className="bg-bg-surface p-5 rounded-xl border border-border-default text-center">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-accent to-brand-primary flex items-center justify-center font-bold text-bg-main text-2xl shadow-lg mx-auto mb-3 border-2 border-bg-main">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <h2 className="text-base font-bold text-white leading-tight">{user.name || 'User'}</h2>
                        <p className="text-text-secondary text-[11px] mb-3 truncate">{user.email}</p>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-accent/10 text-accent text-[10px] font-bold rounded-full uppercase tracking-widest border border-accent/20">
                            {user.plan} Plan
                        </div>
                    </div>

                    <div className="bg-bg-surface p-4 rounded-xl border border-border-default space-y-3">
                        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest border-b border-border-default pb-1.5">Statistics</h3>
                        <div className="flex justify-between items-center text-[12px]">
                            <span className="text-text-secondary">Translations</span>
                            <span className="text-white font-medium">1,248</span>
                        </div>
                        <div className="flex justify-between items-center text-[12px]">
                            <span className="text-text-secondary">Active Assets</span>
                            <span className="text-white font-medium">14</span>
                        </div>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="flex-1 space-y-4">
                    <div className="bg-bg-surface p-5 sm:p-6 rounded-xl border border-border-default shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Profile Settings</h2>
                            <div className="flex items-center gap-3">
                                {saveStatus === 'success' && <span className="text-[11px] text-green-400 font-bold animate-fade-in">Saved!</span>}
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-1.5 bg-accent text-bg-main text-xs font-bold rounded-lg hover:bg-accent/90 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <div className="w-3 h-3 border-2 border-bg-main border-t-transparent rounded-full animate-spin"></div> : <CheckIcon className="w-3.5 h-3.5"/>}
                                    Save
                                </button>
                            </div>
                        </div>

                        {errorMessage && <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[11px]">{errorMessage}</div>}

                        <form className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Display Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-9 p-2 bg-bg-main border border-border-default rounded-lg focus:ring-1 focus:ring-accent outline-none text-[13px] text-white" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Profession</label>
                                    <div className="relative">
                                        <BusinessIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                                        <input type="text" value={profession} onChange={e => setProfession(e.target.value)} placeholder="e.g. Scriptwriter" className="w-full pl-9 p-2 bg-bg-main border border-border-default rounded-lg focus:ring-1 focus:ring-accent outline-none text-[13px] text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Professional Bio</label>
                                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full p-2 bg-bg-main border border-border-default rounded-lg focus:ring-1 focus:ring-accent outline-none text-[13px] text-white resize-none" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Areas of Interest</label>
                                    <textarea value={interests} onChange={e => setInterests(e.target.value)} rows={2} className="w-full p-2 bg-bg-main border border-border-default rounded-lg focus:ring-1 focus:ring-accent outline-none text-[13px] text-white resize-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Platform Goals</label>
                                    <textarea value={goals} onChange={e => setGoals(e.target.value)} rows={2} className="w-full p-2 bg-bg-main border border-border-default rounded-lg focus:ring-1 focus:ring-accent outline-none text-[13px] text-white resize-none" />
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="bg-bg-surface p-5 rounded-xl border border-border-default flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-[12px] font-bold text-white flex items-center gap-1.5">
                                    <LockIcon className="w-3.5 h-3.5 text-accent"/> Security
                                </p>
                                <p className="text-[11px] text-text-secondary">Password management & 2FA</p>
                            </div>
                            <button 
                                onClick={() => setIsUpdatingSecurity(!isUpdatingSecurity)}
                                className={`px-3 py-1.5 border border-border-default text-[11px] font-bold rounded-lg transition-all ${isUpdatingSecurity ? 'bg-bg-main text-white' : 'bg-bg-main hover:text-white'}`}
                            >
                                {isUpdatingSecurity ? 'Cancel' : 'Update'}
                            </button>
                        </div>

                        {isUpdatingSecurity && (
                            <form onSubmit={handleSecurityUpdate} className="space-y-3 pt-3 border-t border-border-default animate-fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">New Password</label>
                                        <input 
                                            type="password" 
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="Min 6 characters"
                                            className="w-full p-2 bg-bg-main border border-border-default rounded-lg focus:ring-1 focus:ring-accent outline-none text-[13px] text-white" 
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Confirm Password</label>
                                        <input 
                                            type="password" 
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat password"
                                            className="w-full p-2 bg-bg-main border border-border-default rounded-lg focus:ring-1 focus:ring-accent outline-none text-[13px] text-white" 
                                            required
                                        />
                                    </div>
                                </div>
                                {securityError && <p className="text-red-400 text-[10px] font-medium">{securityError}</p>}
                                {securitySuccess && <p className="text-green-400 text-[10px] font-medium">Password updated successfully!</p>}
                                <button 
                                    type="submit"
                                    disabled={securityLoading}
                                    className="px-4 py-2 bg-accent text-bg-main text-xs font-bold rounded-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {securityLoading ? <div className="w-3 h-3 border-2 border-bg-main border-t-transparent rounded-full animate-spin"></div> : 'Update Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileDashboard;