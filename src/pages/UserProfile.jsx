import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User, Mail, Shield, Camera, Save, Trash2, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { env } from '../config/env';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getFriendlyUsername = (profile) => {
  if (!profile) return '';

  if (profile.email && (!profile.username || UUID_PATTERN.test(profile.username))) {
    return profile.email;
  }

  return profile.username || profile.email || '';
};

const getSafeProfileFilePrefix = (profile) => {
  const raw = profile?.cognitoUsername || profile?.username || profile?.email || 'user';
  return String(raw).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
};

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const API_URL = env.apiBaseUrl;

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated. Please login again.');
      }

      const res = await fetch(`${API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) throw new Error('Session expired. Please login again.');
      if (!res.ok) throw new Error(`Server Error: ${res.statusText}`);

      const data = await res.json();
      setProfile(data.userInfo);
      setAvatarPreview(data.userInfo?.avatarUrl || null);
    } catch (e) {
      if (e.message.includes('Not authenticated')) {
        navigate('/login');
      }
      setError(e.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 400,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result.split(',')[1];

          console.log('Uploading to:', `${API_URL}/upload`);

          // Upload to S3
          const uploadRes = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              file: base64String,
              fileName: `avatars/${getSafeProfileFilePrefix(profile)}_${Date.now()}.jpg`
            })
          });

          console.log('Upload response status:', uploadRes.status);

          if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            console.error('Upload error response:', errorText);
            throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
          }

          const uploadData = await uploadRes.json();
          console.log('Upload success:', uploadData);

          // Update profile with new avatar URL
          setAvatarPreview(uploadData.url);
          setProfile({ ...profile, avatarUrl: uploadData.url });
          toast.success('Avatar uploaded successfully!');

          // Stop loading spinner
          setUploadingAvatar(false);
        } catch (err) {
          console.error('Upload error:', err);
          toast.error(err.message || 'Failed to upload avatar');
          setUploadingAvatar(false);
        }
      };

      reader.onerror = () => {
        console.error('FileReader error');
        toast.error('Failed to read image file');
        setUploadingAvatar(false);
      };

      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(error.message || 'Failed to upload avatar');
      setUploadingAvatar(false);
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');

      const res = await fetch(`${API_URL}/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          avatarUrl: profile.avatarUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      setProfile(data.userInfo || profile);
      toast.success("Profile updated successfully! 🎉");
    } catch (e) {
      setError(e.message || 'Save failed');
      toast.error(e.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm('⚠️ Delete your profile? This will NOT delete your Cognito account. Continue?')) return;
    try {
      const res = await fetch(`${API_URL}/user`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      toast.success(data.message || 'Account deleted successfully');
      await fetch(`${API_URL}/logout`, { method: 'POST' }).catch(() => { });
      navigate('/');
      window.location.reload();
    } catch (e) {
      setError(e.message || 'Delete failed');
      toast.error(e.message || 'Failed to delete profile');
    }
  };

  if (loading) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin field-icon mx-auto mb-4" />
          <p className="font-medium" style={{ color: 'var(--color-text-muted)' }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="app-page flex items-center justify-center p-4">
        <div className="app-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--color-danger-soft)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--color-danger)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Oops! Something went wrong</h3>
          <p className="mb-6" style={{ color: 'var(--color-danger)' }}>{error}</p>
          <button
            onClick={fetchProfile}
            className="btn-primary px-6 py-3 font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return <div className="p-8">No profile</div>;

  const friendlyUsername = getFriendlyUsername(profile);
  const displayName = profile.name || profile.email || friendlyUsername;

  return (
    <div className="app-page pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="app-container">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: 'var(--color-brand-900)' }}>
            My Profile
          </h1>
          <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>Manage your account information</p>
        </div>

        {/* Main Card */}
        <div className="app-card">
          {/* Header Gradient */}
          <div className="h-32 brand-cover relative">
            <div className="absolute inset-0 bg-black opacity-10"></div>
          </div>

          <div className="px-8 pb-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center -mt-20 mb-8">
              <div className="relative group">
                <div className="profile-avatar w-40 h-40 rounded-full overflow-hidden flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-20 h-20 text-white" />
                  )}
                </div>

                {/* Upload Button Overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="icon-action absolute bottom-2 right-2 p-3 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              <h2 className="mt-4 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{displayName}</h2>
              <p className="flex items-center gap-2 mt-1" style={{ color: 'var(--color-text-muted)' }}>
                <Mail className="w-4 h-4" />
                {profile.email || friendlyUsername}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={onSave} className="space-y-6">
              {/* Sign-in identifier (Read-only) */}
              <div className="group">
                <label className="field-label block text-sm mb-2 flex items-center gap-2">
                  <User className="field-icon w-4 h-4" />
                  Sign-in Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={friendlyUsername}
                    disabled
                    className="field-input pr-24"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="readonly-pill text-xs px-2 py-1">Read-only</span>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="group">
                <label className="field-label block text-sm mb-2 flex items-center gap-2">
                  <User className="field-icon w-4 h-4" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name || ''}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="field-input"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div className="group">
                <label className="field-label block text-sm mb-2 flex items-center gap-2">
                  <Mail className="field-icon w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="field-input"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Role (Read-only) */}
              <div className="group">
                <label className="field-label block text-sm mb-2 flex items-center gap-2">
                  <Shield className="field-icon w-4 h-4" />
                  Account Role
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.role || 'customer'}
                    disabled
                    className="field-input pr-32 capitalize"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="status-pill text-xs px-3 py-1">
                      {profile.role === 'admin' ? '👑 Admin' : '👤 Customer'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 px-6 py-4 font-semibold flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onDelete}
                  className="btn-danger sm:w-auto px-6 py-4 font-semibold flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Account
                </button>
              </div>
            </form>

            {/* Info Note */}
            <div className="info-callout mt-8 p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-info)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Account Information</h4>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Your sign-in email and role cannot be changed here. Contact support if you need assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
