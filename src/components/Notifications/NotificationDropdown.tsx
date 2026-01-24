import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, XIcon, MessageCircle, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useNotifications } from '../../contexts/NotificationContext';
import { AuthContext } from '../../contexts/AuthContext';

interface NotificationDropdownProps {
  onNotificationClick?: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNotificationClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { profile } = useContext(AuthContext) || {};
  const isAdmin = profile?.is_admin || false;
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_approved':
      case 'project_rejected':
        return <FileText className="w-4 h-4" />;
      case 'investment_approved':
      case 'investment_rejected':
      case 'investment_submitted':
      case 'investment_failed':
        return <TrendingUp className="w-4 h-4" />;
      case 'topup_approved':
      case 'topup_rejected':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    if (type.includes('approved') || type.includes('submitted')) return 'text-green-600';
    if (type.includes('rejected') || type.includes('failed')) return 'text-red-600';
    return 'text-blue-600';
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Handle notification click - navigate to related page
  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type, user role, and related data
    if (notification.related_request_id) {
      switch (notification.related_request_type) {
        case 'project':
          if (isAdmin) {
            navigate(`/admin/projects/${notification.related_request_id}`);
          } else {
            navigate(`/owner/projects/${notification.related_request_id}`);
          }
          break;
        case 'investment':
          if (isAdmin) {
            navigate(`/admin/investment-requests`);
          } else {
            // Regular users go to their investments page
            navigate(`/investor/investments`);
          }
          break;
        case 'topup':
          if (isAdmin) {
            navigate(`/admin/topup-requests`);
          } else {
            // Regular users go to their dashboard/home
            navigate(`/investor/discover`);
          }
          break;
        case 'user':
          if (isAdmin) {
            navigate(`/admin/users/${notification.related_request_id}`);
          } else {
            navigate('/owner/dashboard');
          }
          break;
        default:
          // For general notifications, go to appropriate dashboard
          if (isAdmin) {
            navigate('/admin/dashboard');
          } else {
            navigate('/owner/dashboard');
          }
      }
    } else {
      // Default navigation based on notification type
      if (notification.notification_type.includes('project')) {
        if (isAdmin) {
          navigate('/admin/projects');
        } else {
          navigate('/owner/projects');
        }
      } else if (notification.notification_type.includes('investment')) {
        if (isAdmin) {
          navigate('/admin/investment-requests');
        } else {
          navigate('/investor/investments');
        }
      } else if (notification.notification_type.includes('topup')) {
        if (isAdmin) {
          navigate('/admin/topup-requests');
        } else {
          navigate('/investor/discover');
        }
      } else if (notification.notification_type.includes('team')) {
        navigate('/owner/team');
      } else {
        if (isAdmin) {
          navigate('/admin/dashboard');
        } else {
          navigate('/owner/dashboard');
        }
      }
    }

    // Close dropdown
    setIsOpen(false);

    // Call optional callback
    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  // Handle "View all notifications" click
  const handleViewAll = () => {
    // Navigate to appropriate dashboard based on user role
    if (isAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/owner/dashboard');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsOpen(!isOpen);
          if (onNotificationClick) onNotificationClick();
        }}
        className="relative"
      >
        <BellIcon className="w-6 h-6 text-black" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 ${getNotificationColor(notification.notification_type)}`}>
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-[#0C4B20] hover:text-[#8FB200] font-medium"
                onClick={handleViewAll}
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;