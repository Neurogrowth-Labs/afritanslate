
import React, { useState } from 'react';
import type { User } from '../types';
import { supabase } from '../../supabaseClient';
import { CheckIcon, UserIcon, EmailIcon, BusinessIcon, GlobeIcon, BoltIcon, LockIcon, CloseIcon, UsersIcon, TrashIcon } from './Icons';

// --- Local Copy Icon for Share Link --- //
const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75H18.5a1.125 1.125 0 011.125 1.125v9.75M9.75 3.75v13.5H3.375" />
    </svg>
);

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

    // Team States
    const [teamEmails, setTeamEmails] = useState<string[]>(user.team_members || []);
    const [inviteEmail, setInviteEmail] = useState('');
    const [teamError, setTeamError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    const [isLinkCopied, setIsLinkCopied] = useState(false);

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

    const handleAddTeamMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setTeamError(null);
        setInviteSuccess(null);

        if (teamEmails.length >= 10) {
            setTeamError("Maximum team size of 10 reached.");
            return;
        }
        if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
            setTeamError("Invalid email address.");
            return;
        }
        if (teamEmails.includes(inviteEmail.trim())) {
            setTeamError("User already in team.");
            return;
        }

        const newTeam = [...teamEmails, inviteEmail.trim()];

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ team_members: newTeam })
                .eq('id', user.id);

            if (error) throw error;

            setTeamEmails(newTeam);
            onUpdateUser({ ...user, team_members: newTeam });
            setInviteSuccess(`Invitation sent to ${inviteEmail.trim()}`);
            setInviteEmail('');
            setTimeout(() => setInviteSuccess(null), 3000);
        } catch (err: any) {
            setTeamError(err.message || "Failed to add member.");
        }
    };

    const handleRemoveTeamMember = async (email: string) => {
        const newTeam = teamEmails.filter(e => e !== email);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ team_members: newTeam })
                .eq('id', user.id);

            if (error) throw error;

            setTeamEmails(newTeam);
            onUpdateUser({ ...user, team_members: newTeam });
        } catch (err: any) {
            console.error("Failed to remove member:", err);
        }
    };

    const handleCopyLink = () => {
        const link = `https://afritranslate.ai/join/team/${user.id}`;
        navigator.clipboard.writeText(link);
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in py-2">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Left Profile Summary */}
                <div className="w-full md:w-[240px] space-y-3">
                    <div className="bg-bg-surface p-4 rounded-lg border border-border-default text-center">
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-tr from-accent to-brand-primary flex items-center justify-center font-bold text-bg-main text-xl shadow-lg mx-auto mb-2 border-2 border-bg-main">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <h2 className="text-sm font-bold text-white leading-tight">{user.name || 'User'}</h2>
                        <p className="text-text-secondary text-[10px] mb-2 truncate">{user.email}</p>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-accent/10 text-accent text-[9px] font-bold rounded-full uppercase tracking-widest border border-accent/20">
                            {user.plan} Plan
                        </div>
                    </div>

                    <div className="bg-bg-surface p-4 rounded-lg border border-border-default space-y-2">
                        <h3 className="text-[9px] font-bold text-text-secondary uppercase tracking-widest border-b border-border-default pb-1">Statistics</h3>
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="text-text-secondary">Translations</span>
                            <span className="text-white font-medium">1,248</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="text-text-secondary">Active Assets</span>
                            <span className="text-white font-medium">14</span>
                        </div>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="flex-1 space-y-3">
                    <div className="bg-bg-surface p-4 rounded-lg border border-border-default shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">Profile Settings</h2>
                            <div className="flex items-center gap-2">
                                {saveStatus === 'success' && <span className="text-[10px] text-green-400 font-bold animate-fade-in">Saved!</span>}
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-3 py-1.5 bg-accent text-bg-main text-[10px] font-bold rounded hover:bg-accent/90 transition-all flex items-center gap-1.5 disabled:opacity-50 uppercase tracking-wide"
                                >
                                    {isSaving ? <div className="w-3 h-3 border-2 border-bg-main border-t-transparent rounded-full animate-spin"></div> : <CheckIcon className="w-3 h-3"/>}
                                    Save
                                </button>
                            </div>
                        </div>

                        {errorMessage && <div className="mb-3 p-1.5 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[10px]">{errorMessage}</div>}

                        <form className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Display Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-8 p-1.5 bg-bg-main border border-border-default rounded text-[12px] text-white focus:ring-1 focus:ring-accent outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Profession</label>
                                    <div className="relative">
                                        <BusinessIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                                        <input type="text" value={profession} onChange={e => setProfession(e.target.value)} placeholder="e.g. Scriptwriter" className="w-full pl-8 p-1.5 bg-bg-main border border-border-default rounded text-[12px] text-white focus:ring-1 focus:ring-accent outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Professional Bio</label>
                                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} className="w-full p-2 bg-bg-main border border-border-default rounded text-[12px] text-white focus:ring-1 focus:ring-accent outline-none resize-none" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Areas of Interest</label>
                                    <textarea value={interests} onChange={e => setInterests(e.target.value)} rows={2} className="w-full p-2 bg-bg-main border border-border-default rounded text-[12px] text-white focus:ring-1 focus:ring-accent outline-none resize-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Platform Goals</label>
                                    <textarea value={goals} onChange={e => setGoals(e.target.value)} rows={2} className="w-full p-2 bg-bg-main border border-border-default rounded text-[12px] text-white focus:ring-1 focus:ring-accent outline-none resize-none" />
                                </div>
                            </div>
                        </form>
                    </div>

                    {user.plan === 'Training' && (
                        <div className="bg-bg-surface p-4 rounded-lg border border-border-default shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <UsersIcon className="w-5 h-5 text-accent" />
                                        Team Management
                                    </h2>
                                    <p className="text-[10px] text-text-secondary mt-0.5">Manage your training team ({teamEmails.length}/10 users)</p>
                                </div>
                                
                                <form onSubmit={handleAddTeamMember} className="flex gap-2 w-full sm:w-auto">
                                    <input 
                                        type="email" 
                                        value={inviteEmail} 
                                        onChange={e => setInviteEmail(e.target.value)} 
                                        placeholder="Add member email" 
                                        className="flex-1 sm:w-48 p-1.5 px-3 bg-bg-main border border-border-default rounded text-[11px] text-white focus:ring-1 focus:ring-accent outline-none placeholder:text-text-secondary/50"
                                        disabled={teamEmails.length >= 10}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={teamEmails.length >= 10 || !inviteEmail.trim()}
                                        className="px-3 py-1.5 bg-accent text-bg-main text-[10px] font-bold rounded hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap uppercase tracking-wide"
                                    >
                                        Invite
                                    </button>
                                </form>
                            </div>

                            {/* Share Link Section */}
                            <div className="mb-4 p-3 bg-bg-main/50 border border-border-default rounded-lg">
                                <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                                    <div className="flex-1 w-full">
                                        <label className="text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1 block">Share Invite Link</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                readOnly 
                                                value={`https://afritranslate.ai/join/team/${user.id}`}
                                                className="w-full p-1.5 bg-bg-surface border border-border-default rounded text-[11px] text-text-secondary select-all focus:outline-none"
                                            />
                                            <button 
                                                onClick={handleCopyLink}
                                                className="p-1.5 px-3 bg-bg-surface border border-border-default text-text-secondary hover:text-white rounded hover:bg-border-default transition-colors"
                                                title="Copy Link"
                                            >
                                                {isLinkCopied ? <CheckIcon className="w-3.5 h-3.5 text-green-400" /> : <CopyIcon />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            {teamError && <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[10px] text-center">{teamError}</div>}
                            {inviteSuccess && <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-[10px] text-center">{inviteSuccess}</div>}

                            <div className="space-y-2">
                                {teamEmails.length > 0 ? (
                                    teamEmails.map((email, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-bg-main border border-border-default rounded hover:border-border-default/80 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                                                    {email.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-[12px] text-text-primary">{email}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Active</span>
                                                <button 
                                                    onClick={() => handleRemoveTeamMember(email)}
                                                    className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                    title="Remove User"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-text-secondary text-[11px] border border-dashed border-border-default rounded flex flex-col items-center gap-2">
                                        <UsersIcon className="w-6 h-6 opacity-20" />
                                        <p>No team members added yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bg-bg-surface p-4 rounded-lg border border-border-default flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-bold text-white flex items-center gap-1.5">
                                    <LockIcon className="w-3.5 h-3.5 text-accent"/> Security
                                </p>
                                <p className="text-[10px] text-text-secondary">Password management</p>
                            </div>
                            <button 
                                onClick={() => setIsUpdatingSecurity(!isUpdatingSecurity)}
                                className={`px-3 py-1 border border-border-default text-[10px] font-bold rounded transition-all ${isUpdatingSecurity ? 'bg-bg-main text-white' : 'bg-bg-main hover:text-white'}`}
                            >
                                {isUpdatingSecurity ? 'Cancel' : 'Update'}
                            </button>
                        </div>

                        {isUpdatingSecurity && (
                            <form onSubmit={handleSecurityUpdate} className="space-y-3 pt-3 border-t border-border-default animate-fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">New Password</label>
                                        <input 
                                            type="password" 
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="Min 6 characters"
                                            className="w-full p-1.5 bg-bg-main border border-border-default rounded text-[12px] text-white focus:ring-1 focus:ring-accent outline-none" 
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Confirm Password</label>
                                        <input 
                                            type="password" 
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat password"
                                            className="w-full p-1.5 bg-bg-main border border-border-default rounded text-[12px] text-white focus:ring-1 focus:ring-accent outline-none" 
                                            required
                                        />
                                    </div>
                                </div>
                                {securityError && <p className="text-red-400 text-[10px] font-medium">{securityError}</p>}
                                {securitySuccess && <p className="text-green-400 text-[10px] font-medium">Password updated successfully!</p>}
                                <button 
                                    type="submit"
                                    disabled={securityLoading}
                                    className="px-3 py-1.5 bg-accent text-bg-main text-[10px] font-bold rounded hover:bg-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wide w-full sm:w-auto"
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
