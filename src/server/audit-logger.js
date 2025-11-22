// audit-logger.js
// Comprehensive audit logging system for security and compliance

export class AuditLogger {
  constructor(db) {
    this.db = db;
  }

  /**
   * Log an audit event
   * @param {Object} params - Audit log parameters
   * @param {string} params.userId - Firebase UID of the user
   * @param {string} params.userEmail - Email of the user
   * @param {string} params.actionType - Specific action (e.g., 'USER_CREATED', 'PROJECT_APPROVED')
   * @param {string} params.actionCategory - Category (AUTH, USER_MGMT, PROJECT, FINANCIAL, ADMIN, SYSTEM)
   * @param {string} params.resourceType - Type of resource affected (user, project, transaction)
   * @param {string} params.resourceId - ID of the affected resource
   * @param {string} params.description - Human-readable description
   * @param {string} params.ipAddress - IP address of the request
   * @param {string} params.userAgent - User agent string
   * @param {string} params.requestMethod - HTTP method (GET, POST, etc.)
   * @param {string} params.requestUrl - Request URL
   * @param {string} params.status - Status (success, failure, error)
   * @param {Object} params.metadata - Additional metadata as JSON
   */
  async log({
    userId,
    userEmail,
    actionType,
    actionCategory,
    resourceType = null,
    resourceId = null,
    description,
    ipAddress = null,
    userAgent = null,
    requestMethod = null,
    requestUrl = null,
    status = 'success',
    metadata = null
  }) {
    try {
      await this.db.query(
        `INSERT INTO audit_logs 
        (user_id, user_email, action_type, action_category, resource_type, 
         resource_id, description, ip_address, user_agent, request_method, 
         request_url, status, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          userId,
          userEmail,
          actionType,
          actionCategory,
          resourceType,
          resourceId,
          description,
          ipAddress,
          userAgent,
          requestMethod,
          requestUrl,
          status,
          metadata ? JSON.stringify(metadata) : null
        ]
      );
      
      console.log(`📝 Audit log: ${actionType} by ${userEmail || userId}`);
    } catch (error) {
      // Don't throw - logging should never break the main flow
      console.error('❌ Failed to write audit log:', error);
    }
  }

  /**
   * Query audit logs with filters
   */
  async query({
    userId = null,
    actionCategory = null,
    actionType = null,
    resourceType = null,
    resourceId = null,
    status = null,
    startDate = null,
    endDate = null,
    limit = 100,
    offset = 0
  }) {
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (userId) {
      conditions.push(`user_id = $${paramCount++}`);
      params.push(userId);
    }
    if (actionCategory) {
      conditions.push(`action_category = $${paramCount++}`);
      params.push(actionCategory);
    }
    if (actionType) {
      conditions.push(`action_type = $${paramCount++}`);
      params.push(actionType);
    }
    if (resourceType) {
      conditions.push(`resource_type = $${paramCount++}`);
      params.push(resourceType);
    }
    if (resourceId) {
      conditions.push(`resource_id = $${paramCount++}`);
      params.push(resourceId);
    }
    if (status) {
      conditions.push(`status = $${paramCount++}`);
      params.push(status);
    }
    if (startDate) {
      conditions.push(`created_at >= $${paramCount++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`created_at <= $${paramCount++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    params.push(limit, offset);

    const result = await this.db.query(
      `SELECT * FROM audit_logs 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      params
    );

    return result.rows;
  }

  /**
   * Get audit statistics
   */
  async getStats({ startDate = null, endDate = null } = {}) {
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (startDate) {
      conditions.push(`created_at >= $${paramCount++}`);
      params.push(startDate);
    }
    if (endDate) {
      conditions.push(`created_at <= $${paramCount++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.db.query(
      `SELECT 
        action_category,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
        COUNT(CASE WHEN status = 'failure' THEN 1 END) as failure_count,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count
       FROM audit_logs 
       ${whereClause}
       GROUP BY action_category
       ORDER BY count DESC`,
      params
    );

    return result.rows;
  }
}

// Audit action types by category
export const AuditActionTypes = {
  // Authentication
  AUTH: {
    LOGIN: 'AUTH_LOGIN',
    LOGOUT: 'AUTH_LOGOUT',
    REGISTER: 'AUTH_REGISTER',
    PASSWORD_RESET: 'AUTH_PASSWORD_RESET',
    EMAIL_VERIFIED: 'AUTH_EMAIL_VERIFIED',
    FAILED_LOGIN: 'AUTH_FAILED_LOGIN'
  },
  
  // User Management
  USER_MGMT: {
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',
    USER_SUSPENDED: 'USER_SUSPENDED',
    USER_UNSUSPENDED: 'USER_UNSUSPENDED',
    ROLE_CHANGED: 'USER_ROLE_CHANGED',
    PROFILE_UPDATED: 'USER_PROFILE_UPDATED'
  },
  
  // Project Management
  PROJECT: {
    CREATED: 'PROJECT_CREATED',
    UPDATED: 'PROJECT_UPDATED',
    DELETED: 'PROJECT_DELETED',
    APPROVED: 'PROJECT_APPROVED',
    REJECTED: 'PROJECT_REJECTED',
    SUSPENDED: 'PROJECT_SUSPENDED',
    COMPLETED: 'PROJECT_COMPLETED'
  },
  
  // Financial Operations
  FINANCIAL: {
    TOPUP_REQUESTED: 'TOPUP_REQUESTED',
    TOPUP_APPROVED: 'TOPUP_APPROVED',
    TOPUP_REJECTED: 'TOPUP_REJECTED',
    INVESTMENT_CREATED: 'INVESTMENT_CREATED',
    INVESTMENT_APPROVED: 'INVESTMENT_APPROVED',
    INVESTMENT_REJECTED: 'INVESTMENT_REJECTED',
    WITHDRAWAL_REQUESTED: 'WITHDRAWAL_REQUESTED',
    WITHDRAWAL_APPROVED: 'WITHDRAWAL_APPROVED',
    PAYMENT_PROCESSED: 'PAYMENT_PROCESSED'
  },
  
  // Admin Actions
  ADMIN: {
    ADMIN_GRANTED: 'ADMIN_GRANTED',
    ADMIN_REVOKED: 'ADMIN_REVOKED',
    SETTINGS_CHANGED: 'SETTINGS_CHANGED',
    BULK_ACTION: 'ADMIN_BULK_ACTION',
    DATA_EXPORT: 'ADMIN_DATA_EXPORT',
    SECURITY_CHANGE: 'ADMIN_SECURITY_CHANGE'
  },
  
  // System Events
  SYSTEM: {
    MIGRATION_RUN: 'SYSTEM_MIGRATION',
    BACKUP_CREATED: 'SYSTEM_BACKUP',
    ERROR: 'SYSTEM_ERROR',
    MAINTENANCE: 'SYSTEM_MAINTENANCE'
  }
};

// Middleware to automatically log API requests
export function auditMiddleware(auditLogger) {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    
    // Override send to capture response
    res.send = function(data) {
      res.send = originalSend;
      
      // Log if user is authenticated and action is sensitive
      if (req.uid && shouldAudit(req)) {
        const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';
        
        auditLogger.log({
          userId: req.uid,
          userEmail: req.userEmail || null,
          actionType: getActionType(req),
          actionCategory: getActionCategory(req),
          resourceType: getResourceType(req),
          resourceId: getResourceId(req),
          description: getDescription(req),
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          requestMethod: req.method,
          requestUrl: req.originalUrl,
          status: status,
          metadata: getMetadata(req, res)
        }).catch(err => console.error('Audit logging error:', err));
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// Helper functions
function shouldAudit(req) {
  const auditPaths = [
    '/api/admin/',
    '/api/owner/',
    '/api/topup',
    '/api/projects',
    '/api/investments',
    '/api/users'
  ];
  
  return auditPaths.some(path => req.originalUrl.includes(path)) && 
         ['POST', 'PUT', 'DELETE'].includes(req.method);
}

function getActionType(req) {
  const path = req.originalUrl;
  const method = req.method;
  
  if (path.includes('/topup') && method === 'POST') return AuditActionTypes.FINANCIAL.TOPUP_REQUESTED;
  if (path.includes('/approve') && method === 'POST') return 'APPROVAL_ACTION';
  if (path.includes('/projects') && method === 'POST') return AuditActionTypes.PROJECT.CREATED;
  if (path.includes('/users') && method === 'PUT') return AuditActionTypes.USER_MGMT.USER_UPDATED;
  
  return `${method}_${path.split('/')[2] || 'UNKNOWN'}`.toUpperCase();
}

function getActionCategory(req) {
  const path = req.originalUrl;
  
  if (path.includes('/admin') || path.includes('/owner')) return 'ADMIN';
  if (path.includes('/topup') || path.includes('/investment')) return 'FINANCIAL';
  if (path.includes('/project')) return 'PROJECT';
  if (path.includes('/user')) return 'USER_MGMT';
  if (path.includes('/auth')) return 'AUTH';
  
  return 'SYSTEM';
}

function getResourceType(req) {
  const path = req.originalUrl;
  
  if (path.includes('/project')) return 'project';
  if (path.includes('/user')) return 'user';
  if (path.includes('/topup')) return 'topup_request';
  if (path.includes('/investment')) return 'investment';
  
  return null;
}

function getResourceId(req) {
  // Extract ID from URL params or body
  return req.params.id || req.params.userId || req.params.projectId || req.body.id || null;
}

function getDescription(req) {
  const method = req.method;
  const path = req.originalUrl.split('?')[0];
  return `${method} request to ${path}`;
}

function getMetadata(req, res) {
  return {
    statusCode: res.statusCode,
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    query: req.query,
    params: req.params
  };
}
