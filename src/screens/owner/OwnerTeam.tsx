// src/screens/owner/OwnerTeam.tsx
import React, { useEffect, useState } from 'react';
import { OwnerLayout } from '../../layouts/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { authFetch } from '../../lib/api';
import { API_BASE_URL } from '../../config/environment';
import { 
  Users2Icon,
  MailIcon,
  ShieldCheckIcon,
  ShieldIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SearchIcon,
  UserPlusIcon,
  SettingsIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TeamMember {
  id: number;
  email: string;
  memberUid?: string;
  fullName?: string;
  profilePicture?: string;
  role: 'admin' | 'editor' | 'viewer' | 'member';
  status: 'pending' | 'active' | 'inactive' | 'suspended';
  invitedAt: string;
  joinedAt?: string;
  lastActive?: string;
  permissions: Permission[];
}

interface Permission {
  key: string;
  label: string;
  description: string;
  canAccess: boolean;
}

const AVAILABLE_PERMISSIONS = [
  {
    key: 'projects.view',
    label: 'View Projects',
    description: 'Can view all projects on the platform'
  },
  {
    key: 'projects.edit',
    label: 'Edit Projects',
    description: 'Can edit project details and status'
  },
  {
    key: 'projects.approve',
    label: 'Approve Projects',
    description: 'Can approve or reject project submissions'
  },
  {
    key: 'projects.delete',
    label: 'Delete Projects',
    description: 'Can delete projects from the platform'
  },
  {
    key: 'users.view',
    label: 'View Users',
    description: 'Can view all user profiles and details'
  },
  {
    key: 'users.edit',
    label: 'Edit Users',
    description: 'Can edit user profiles and settings'
  },
  {
    key: 'users.suspend',
    label: 'Suspend Users',
    description: 'Can suspend or ban user accounts'
  },
  {
    key: 'topup.view',
    label: 'View Top-up Requests',
    description: 'Can view wallet top-up requests'
  },
  {
    key: 'topup.approve',
    label: 'Approve Top-ups',
    description: 'Can approve or reject top-up requests'
  },
  {
    key: 'investments.view',
    label: 'View Investments',
    description: 'Can view all investment requests'
  },
  {
    key: 'investments.manage',
    label: 'Manage Investments',
    description: 'Can approve or reject investment requests'
  },
  {
    key: 'settings.view',
    label: 'View Settings',
    description: 'Can view platform settings'
  },
  {
    key: 'settings.edit',
    label: 'Edit Settings',
    description: 'Can modify platform settings'
  },
  {
    key: 'team.view',
    label: 'View Team',
    description: 'Can view team members and their permissions'
  },
  {
    key: 'team.manage',
    label: 'Manage Team',
    description: 'Can add, edit, or remove team members'
  }
];

const ROLE_PRESETS: Record<string, string[]> = {
  admin: [
    'projects.view', 'projects.edit', 'projects.approve', 'projects.delete',
    'users.view', 'users.edit', 'users.suspend',
    'topup.view', 'topup.approve',
    'investments.view', 'investments.manage',
    'settings.view', 'settings.edit',
    'team.view', 'team.manage'
  ],
  editor: [
    'projects.view', 'projects.edit',
    'users.view',
    'topup.view',
    'investments.view',
    'team.view'
  ],
  viewer: [
    'projects.view',
    'users.view',
    'topup.view',
    'investments.view'
  ],
  member: [
    'projects.view',
    'users.view'
  ]
};

export const OwnerTeam: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer' | 'member'>('member');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const data = await authFetch(`${API_BASE_URL}/owner/team`);
      setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setInviting(true);
      const permissions = ROLE_PRESETS[inviteRole];
      
      // authFetch already returns parsed JSON, not a Response object
      const data = await authFetch(`${API_BASE_URL}/owner/team/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          permissions
        })
      });

      // If invitation link is provided (email service not configured), show it
      if (data.invitationLink) {
        // Copy link to clipboard
        navigator.clipboard.writeText(data.invitationLink);
        setInvitationLink(data.invitationLink);
        setShowInviteModal(false);
        setShowInviteLinkModal(true);
        toast.success('Invitation created! Link copied to clipboard', {
          duration: 4000
        });
      } else {
        toast.success('Invitation sent successfully!');
        setShowInviteModal(false);
      }

      setInviteEmail('');
      setInviteRole('member');
      fetchTeamMembers();
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdatePermissions = async (memberId: number, permissions: string[]) => {
    try {
      await authFetch(`${API_BASE_URL}/owner/team/${memberId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      });

      toast.success('Permissions updated successfully!');
      fetchTeamMembers();
      setShowPermissionsModal(false);
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions');
    }
  };

  const handleUpdateRole = async (memberId: number, newRole: string) => {
    try {
      const permissions = ROLE_PRESETS[newRole];
      
      await authFetch(`${API_BASE_URL}/owner/team/${memberId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, permissions })
      });

      toast.success('Role updated successfully!');
      fetchTeamMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      await authFetch(`${API_BASE_URL}/owner/team/${memberId}`, {
        method: 'DELETE'
      });

      toast.success('Team member removed successfully!');
      fetchTeamMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove team member');
    }
  };

  const handleResendInvite = async (memberId: number, email: string) => {
    try {
      await authFetch(`${API_BASE_URL}/owner/team/${memberId}/resend-invite`, {
        method: 'POST'
      });

      toast.success(`Invitation resent to ${email}`);
    } catch (error) {
      console.error('Error resending invite:', error);
      toast.error('Failed to resend invitation');
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      editor: 'bg-blue-100 text-blue-800',
      viewer: 'bg-green-100 text-green-800',
      member: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors.member;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode }> = {
      active: { color: 'bg-green-100 text-green-800', icon: <CheckCircleIcon className="w-3 h-3" /> },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <ClockIcon className="w-3 h-3" /> },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: <XCircleIcon className="w-3 h-3" /> },
      suspended: { color: 'bg-red-100 text-red-800', icon: <XCircleIcon className="w-3 h-3" /> }
    };
    const badge = badges[status] || badges.inactive;
    
    return (
      <Badge className={`${badge.color} border-0 flex items-center gap-1`}>
        {badge.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <OwnerLayout activePage="team">
        <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C4B20] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading team members...</p>
          </div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout activePage="team">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users2Icon className="w-8 h-8 text-[#0C4B20]" />
              My Team
            </h1>
            <p className="text-gray-600 mt-1">Manage team members and their permissions</p>
          </div>
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-[#0C4B20] hover:bg-[#0A3D1A] text-white"
          >
            <UserPlusIcon className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
                </div>
                <Users2Icon className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {teamMembers.filter(m => m.status === 'active').length}
                  </p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {teamMembers.filter(m => m.status === 'pending').length}
                  </p>
                </div>
                <ClockIcon className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-red-600">
                    {teamMembers.filter(m => m.role === 'admin').length}
                  </p>
                </div>
                <ShieldCheckIcon className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-2xl border-gray-300 focus:border-[#0C4B20] focus:ring-[#0C4B20]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Team Members List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredMembers.length === 0 ? (
            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-12 text-center">
                <Users2Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium mb-2">No team members found</p>
                <p className="text-gray-400 mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'Start by inviting your first team member'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-[#0C4B20] hover:bg-[#0A3D1A] text-white"
                  >
                    <UserPlusIcon className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredMembers.map((member) => (
              <Card key={member.id} className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={member.profilePicture} alt={member.fullName || member.email} />
                      <AvatarFallback className="bg-gradient-to-br from-[#0C4B20] to-[#8FB200] text-white">
                        {(member.fullName || member.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {member.fullName || member.email}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">{member.email}</p>
                          
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge className={`${getRoleBadgeColor(member.role)} border-0`}>
                              {member.role === 'admin' && <ShieldCheckIcon className="w-3 h-3 mr-1" />}
                              {member.role === 'editor' && <EditIcon className="w-3 h-3 mr-1" />}
                              {member.role === 'viewer' && <EyeIcon className="w-3 h-3 mr-1" />}
                              {member.role === 'member' && <ShieldIcon className="w-3 h-3 mr-1" />}
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </Badge>
                            {getStatusBadge(member.status)}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MailIcon className="w-4 h-4" />
                              Invited {new Date(member.invitedAt).toLocaleDateString()}
                            </span>
                            {member.joinedAt && (
                              <span className="flex items-center gap-1">
                                <CheckCircleIcon className="w-4 h-4" />
                                Joined {new Date(member.joinedAt).toLocaleDateString()}
                              </span>
                            )}
                            {member.lastActive && (
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                Last active {new Date(member.lastActive).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* Permissions Summary */}
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1">
                              {member.permissions.filter(p => p.canAccess).length} permissions granted
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {member.permissions
                                .filter(p => p.canAccess)
                                .slice(0, 3)
                                .map(permission => (
                                  <Badge key={permission.key} variant="secondary" className="text-xs">
                                    {permission.label}
                                  </Badge>
                                ))}
                              {member.permissions.filter(p => p.canAccess).length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{member.permissions.filter(p => p.canAccess).length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowPermissionsModal(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="whitespace-nowrap"
                          >
                            <SettingsIcon className="w-4 h-4 mr-1" />
                            Manage
                          </Button>
                          
                          {member.status === 'pending' && (
                            <Button
                              onClick={() => handleResendInvite(member.id, member.email)}
                              variant="outline"
                              size="sm"
                              className="whitespace-nowrap"
                            >
                              <MailIcon className="w-4 h-4 mr-1" />
                              Resend
                            </Button>
                          )}

                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:border-[#0C4B20] focus:ring-[#0C4B20]"
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                            <option value="member">Member</option>
                          </select>

                          <Button
                            onClick={() => handleRemoveMember(member.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 border-red-200"
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlusIcon className="w-5 h-5 text-[#0C4B20]" />
                  Invite Team Member
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-[#0C4B20] focus:ring-[#0C4B20]"
                  >
                    <option value="member">Member - Basic viewing permissions</option>
                    <option value="viewer">Viewer - Can view all content</option>
                    <option value="editor">Editor - Can view and edit content</option>
                    <option value="admin">Admin - Full access and permissions</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    You can customize permissions after sending the invite
                  </p>
                </div>

                {/* Role Description */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {inviteRole.charAt(0).toUpperCase() + inviteRole.slice(1)} Permissions:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {ROLE_PRESETS[inviteRole].slice(0, 5).map(permission => (
                      <li key={permission} className="flex items-center gap-1">
                        <CheckCircleIcon className="w-3 h-3 text-green-600" />
                        {AVAILABLE_PERMISSIONS.find(p => p.key === permission)?.label}
                      </li>
                    ))}
                    {ROLE_PRESETS[inviteRole].length > 5 && (
                      <li className="text-gray-500">
                        +{ROLE_PRESETS[inviteRole].length - 5} more permissions
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleInviteMember}
                    disabled={inviting || !inviteEmail}
                    className="flex-1 bg-[#0C4B20] hover:bg-[#0A3D1A] text-white"
                  >
                    {inviting ? 'Sending...' : 'Send Invitation'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteEmail('');
                      setInviteRole('member');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Invitation Link Modal */}
        {showInviteLinkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg bg-white">
              <CardHeader>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <MailIcon className="w-6 h-6 text-[#0C4B20]" />
                  Invitation Link Created
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  Share this link with the invited team member. They can click it to accept the invitation.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-xs text-gray-500 mb-2">Invitation Link (expires in 7 days)</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={invitationLink}
                      readOnly
                      className="flex-1 text-sm bg-white px-3 py-2 rounded border border-gray-300 font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(invitationLink);
                        toast.success('Link copied!');
                      }}
                      className="px-4 py-2 bg-[#0C4B20] text-white rounded hover:bg-[#0A3D1A] transition-colors whitespace-nowrap"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    How to share:
                  </h3>
                  <ul className="text-sm text-blue-900 space-y-1 ml-7">
                    <li>• Send via WhatsApp, Slack, or Email</li>
                    <li>• The invited person must log in with their invited email</li>
                    <li>• Link expires after 7 days</li>
                    <li>• You can resend if needed from the team page</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => setShowInviteLinkModal(false)}
                    className="flex-1 bg-[#0C4B20] hover:bg-[#0A3D1A] text-white"
                  >
                    Got it!
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Permissions Modal */}
        {showPermissionsModal && selectedMember && (
          <PermissionsModal
            member={selectedMember}
            availablePermissions={AVAILABLE_PERMISSIONS}
            onSave={(permissions) => handleUpdatePermissions(selectedMember.id, permissions)}
            onClose={() => {
              setShowPermissionsModal(false);
              setSelectedMember(null);
            }}
          />
        )}
      </div>
    </OwnerLayout>
  );
};

// Permissions Modal Component
interface PermissionsModalProps {
  member: TeamMember;
  availablePermissions: typeof AVAILABLE_PERMISSIONS;
  onSave: (permissions: string[]) => void;
  onClose: () => void;
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({
  member,
  availablePermissions,
  onSave,
  onClose
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(member.permissions.filter(p => p.canAccess).map(p => p.key))
  );

  const togglePermission = (key: string) => {
    const newPermissions = new Set(selectedPermissions);
    if (newPermissions.has(key)) {
      newPermissions.delete(key);
    } else {
      newPermissions.add(key);
    }
    setSelectedPermissions(newPermissions);
  };

  const handleSave = () => {
    onSave(Array.from(selectedPermissions));
  };

  // Group permissions by category
  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    const category = permission.key.split('.')[0];
    if (!acc[category]) acc[category] = [];
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, typeof availablePermissions>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#0C4B20]" />
            Manage Permissions - {member.fullName || member.email}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedPermissions).map(([category, permissions]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 capitalize">
                {category} Permissions
              </h3>
              <div className="space-y-2">
                {permissions.map((permission) => (
                  <label
                    key={permission.key}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.has(permission.key)}
                      onChange={() => togglePermission(permission.key)}
                      className="mt-1 w-4 h-4 text-[#0C4B20] border-gray-300 rounded focus:ring-[#0C4B20]"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{permission.label}</p>
                      <p className="text-xs text-gray-500">{permission.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              className="flex-1 bg-[#0C4B20] hover:bg-[#0A3D1A] text-white"
            >
              Save Permissions
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
