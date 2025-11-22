// intrusion-detection.js - Real-time intrusion detection system
import { createHash } from 'crypto';

// Threat severity levels
export const ThreatLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Event types for security monitoring
export const SecurityEventType = {
  // Authentication threats
  FAILED_LOGIN: 'failed_login',
  BRUTE_FORCE: 'brute_force_attempt',
  ACCOUNT_LOCKOUT: 'account_lockout',
  CREDENTIAL_STUFFING: 'credential_stuffing',
  
  // Injection attacks
  SQL_INJECTION: 'sql_injection_attempt',
  XSS_ATTEMPT: 'xss_attempt',
  COMMAND_INJECTION: 'command_injection',
  
  // Request anomalies
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  UNUSUAL_REQUEST_PATTERN: 'unusual_request_pattern',
  SUSPICIOUS_USER_AGENT: 'suspicious_user_agent',
  BOT_DETECTED: 'bot_detected',
  
  // Data exfiltration
  MASS_DATA_ACCESS: 'mass_data_access',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  PRIVILEGE_ESCALATION: 'privilege_escalation',
  
  // System threats
  PATH_TRAVERSAL: 'path_traversal',
  FILE_UPLOAD_THREAT: 'file_upload_threat',
  SUSPICIOUS_PAYLOAD: 'suspicious_payload',
  
  // Network threats
  IP_BLACKLISTED: 'ip_blacklisted',
  GEO_ANOMALY: 'geo_anomaly',
  TOR_EXIT_NODE: 'tor_exit_node'
};

/**
 * Intrusion Detection System
 */
export class IntrusionDetectionSystem {
  constructor(db) {
    this.db = db;
    
    // In-memory tracking for pattern detection
    this.failedLogins = new Map(); // IP -> [timestamps]
    this.requestCounts = new Map(); // IP -> count
    this.suspiciousIPs = new Set();
    this.blockedIPs = new Set();
    
    // Thresholds
    this.thresholds = {
      failedLoginWindow: 15 * 60 * 1000, // 15 minutes
      failedLoginLimit: 5,
      bruteForceLimit: 10,
      requestsPerMinute: 60,
      massDataAccessLimit: 100
    };
    
    // SQL injection patterns
    this.sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|DECLARE)\b)/i,
      /(--|\#|\/\*|\*\/)/,
      /(\bOR\b.*=.*)/i,
      /('|"|;|\band\b|\bor\b).*(\d+\s*=\s*\d+)/i,
      /(0x[0-9a-f]+)/i
    ];
    
    // XSS patterns
    this.xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/i,
      /<iframe[\s\S]*?>/i,
      /javascript:/i,
      /on\w+\s*=\s*["']?[^"'>]*/i, // Event handlers
      /<img[\s\S]*?onerror[\s\S]*?>/i,
      /eval\s*\(/i,
      /expression\s*\(/i
    ];
    
    // Path traversal patterns
    this.pathTraversalPatterns = [
      /\.\.[\/\\]/,
      /%2e%2e[\/\\]/i,
      /\.\.[%]2f/i
    ];
    
    // Command injection patterns
    this.commandPatterns = [
      /[;&|`$()]/,
      /\b(cat|ls|pwd|wget|curl|nc|bash|sh)\b/i
    ];
    
    // Suspicious user agents (bots, scrapers)
    this.suspiciousUserAgents = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
      /nikto/i,
      /sqlmap/i,
      /nmap/i
    ];
    
    // Clean up old entries every 30 minutes
    setInterval(() => this.cleanup(), 30 * 60 * 1000);
  }
  
  /**
   * Analyze request for security threats
   */
  async analyzeRequest(req) {
    const threats = [];
    const ip = this.getClientIP(req);
    const userAgent = req.get('user-agent') || '';
    
    // Check if IP is blocked
    if (this.blockedIPs.has(ip)) {
      threats.push({
        type: SecurityEventType.IP_BLACKLISTED,
        severity: ThreatLevel.CRITICAL,
        description: 'Request from blocked IP address',
        blocked: true
      });
      return threats;
    }
    
    // Check suspicious IP
    if (this.suspiciousIPs.has(ip)) {
      threats.push({
        type: SecurityEventType.UNUSUAL_REQUEST_PATTERN,
        severity: ThreatLevel.MEDIUM,
        description: 'Request from flagged IP address'
      });
    }
    
    // Check suspicious user agent
    if (this.isSuspiciousUserAgent(userAgent)) {
      threats.push({
        type: SecurityEventType.SUSPICIOUS_USER_AGENT,
        severity: ThreatLevel.LOW,
        description: `Suspicious user agent: ${userAgent.substring(0, 100)}`
      });
    }
    
    // Check for SQL injection in query params and body
    const sqlThreats = this.checkSQLInjection(req);
    if (sqlThreats.length > 0) {
      threats.push(...sqlThreats);
    }
    
    // Check for XSS attempts
    const xssThreats = this.checkXSS(req);
    if (xssThreats.length > 0) {
      threats.push(...xssThreats);
    }
    
    // Check for path traversal
    const pathThreats = this.checkPathTraversal(req);
    if (pathThreats.length > 0) {
      threats.push(...pathThreats);
    }
    
    // Check for command injection
    const commandThreats = this.checkCommandInjection(req);
    if (commandThreats.length > 0) {
      threats.push(...commandThreats);
    }
    
    // Check request rate
    const rateThreats = this.checkRequestRate(ip);
    if (rateThreats) {
      threats.push(rateThreats);
    }
    
    return threats;
  }
  
  /**
   * Track failed login attempt
   */
  trackFailedLogin(ip, username) {
    if (!this.failedLogins.has(ip)) {
      this.failedLogins.set(ip, []);
    }
    
    const attempts = this.failedLogins.get(ip);
    const now = Date.now();
    
    // Add current attempt
    attempts.push({ timestamp: now, username });
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(
      a => now - a.timestamp < this.thresholds.failedLoginWindow
    );
    this.failedLogins.set(ip, recentAttempts);
    
    // Check for brute force
    if (recentAttempts.length >= this.thresholds.bruteForceLimit) {
      this.blockIP(ip);
      return {
        type: SecurityEventType.BRUTE_FORCE,
        severity: ThreatLevel.CRITICAL,
        description: `Brute force detected: ${recentAttempts.length} failed attempts`,
        blocked: true
      };
    } else if (recentAttempts.length >= this.thresholds.failedLoginLimit) {
      this.suspiciousIPs.add(ip);
      return {
        type: SecurityEventType.FAILED_LOGIN,
        severity: ThreatLevel.HIGH,
        description: `Multiple failed login attempts: ${recentAttempts.length}`,
        metadata: { attempts: recentAttempts.length, usernames: recentAttempts.map(a => a.username) }
      };
    }
    
    return {
      type: SecurityEventType.FAILED_LOGIN,
      severity: ThreatLevel.LOW,
      description: 'Failed login attempt'
    };
  }
  
  /**
   * Check for SQL injection attempts
   */
  checkSQLInjection(req) {
    const threats = [];
    const inputs = this.extractInputs(req);
    
    for (const [field, value] of Object.entries(inputs)) {
      if (typeof value !== 'string') continue;
      
      for (const pattern of this.sqlPatterns) {
        if (pattern.test(value)) {
          threats.push({
            type: SecurityEventType.SQL_INJECTION,
            severity: ThreatLevel.CRITICAL,
            description: `SQL injection attempt detected in field: ${field}`,
            metadata: { field, pattern: pattern.toString(), value: value.substring(0, 100) }
          });
          break;
        }
      }
    }
    
    return threats;
  }
  
  /**
   * Check for XSS attempts
   */
  checkXSS(req) {
    const threats = [];
    const inputs = this.extractInputs(req);
    
    for (const [field, value] of Object.entries(inputs)) {
      if (typeof value !== 'string') continue;
      
      for (const pattern of this.xssPatterns) {
        if (pattern.test(value)) {
          threats.push({
            type: SecurityEventType.XSS_ATTEMPT,
            severity: ThreatLevel.HIGH,
            description: `XSS attempt detected in field: ${field}`,
            metadata: { field, pattern: pattern.toString(), value: value.substring(0, 100) }
          });
          break;
        }
      }
    }
    
    return threats;
  }
  
  /**
   * Check for path traversal attempts
   */
  checkPathTraversal(req) {
    const threats = [];
    const inputs = this.extractInputs(req);
    
    // Also check URL path
    inputs.path = req.path;
    
    for (const [field, value] of Object.entries(inputs)) {
      if (typeof value !== 'string') continue;
      
      for (const pattern of this.pathTraversalPatterns) {
        if (pattern.test(value)) {
          threats.push({
            type: SecurityEventType.PATH_TRAVERSAL,
            severity: ThreatLevel.HIGH,
            description: `Path traversal attempt detected in field: ${field}`,
            metadata: { field, value: value.substring(0, 100) }
          });
          break;
        }
      }
    }
    
    return threats;
  }
  
  /**
   * Check for command injection attempts
   */
  checkCommandInjection(req) {
    const threats = [];
    const inputs = this.extractInputs(req);
    
    for (const [field, value] of Object.entries(inputs)) {
      if (typeof value !== 'string') continue;
      
      for (const pattern of this.commandPatterns) {
        if (pattern.test(value)) {
          threats.push({
            type: SecurityEventType.COMMAND_INJECTION,
            severity: ThreatLevel.CRITICAL,
            description: `Command injection attempt detected in field: ${field}`,
            metadata: { field, value: value.substring(0, 100) }
          });
          break;
        }
      }
    }
    
    return threats;
  }
  
  /**
   * Check request rate for potential DoS
   */
  checkRequestRate(ip) {
    const now = Date.now();
    const key = `${ip}:${Math.floor(now / 60000)}`; // Per minute
    
    const count = (this.requestCounts.get(key) || 0) + 1;
    this.requestCounts.set(key, count);
    
    if (count > this.thresholds.requestsPerMinute) {
      this.suspiciousIPs.add(ip);
      return {
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity: ThreatLevel.MEDIUM,
        description: `Excessive requests: ${count} requests per minute`,
        metadata: { count }
      };
    }
    
    return null;
  }
  
  /**
   * Check for suspicious user agent
   */
  isSuspiciousUserAgent(userAgent) {
    if (!userAgent || userAgent.length < 10) return true;
    
    for (const pattern of this.suspiciousUserAgents) {
      if (pattern.test(userAgent)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Log security event to database
   */
  async logSecurityEvent(ip, userId, eventType, severity, description, metadata = {}, req = null) {
    try {
      const userAgent = req?.get('user-agent') || null;
      const requestUrl = req?.originalUrl || req?.url || null;
      const requestMethod = req?.method || null;
      
      await this.db.query(`
        INSERT INTO security_events 
        (ip_address, user_id, event_type, severity, description, user_agent, 
         request_method, request_url, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `, [
        ip,
        userId || null,
        eventType,
        severity,
        description,
        userAgent,
        requestMethod,
        requestUrl,
        JSON.stringify(metadata)
      ]);
      
      // Alert on critical events
      if (severity === ThreatLevel.CRITICAL) {
        await this.sendAlert(eventType, description, ip, metadata);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
  
  /**
   * Send alert for critical events
   */
  async sendAlert(eventType, description, ip, metadata) {
    // Log to console for now (can integrate with email/Slack/etc later)
    console.error('🚨 CRITICAL SECURITY EVENT 🚨');
    console.error(`Type: ${eventType}`);
    console.error(`Description: ${description}`);
    console.error(`IP: ${ip}`);
    console.error(`Metadata:`, metadata);
    console.error(`Timestamp: ${new Date().toISOString()}`);
    
    // TODO: Send email to admins
    // TODO: Send Slack notification
    // TODO: Trigger incident response workflow
  }
  
  /**
   * Block IP address
   */
  blockIP(ip) {
    this.blockedIPs.add(ip);
    this.suspiciousIPs.add(ip);
    console.warn(`🔒 IP blocked: ${ip}`);
  }
  
  /**
   * Unblock IP address (admin action)
   */
  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);
    console.log(`🔓 IP unblocked: ${ip}`);
  }
  
  /**
   * Check if IP is blocked
   */
  isBlocked(ip) {
    return this.blockedIPs.has(ip);
  }
  
  /**
   * Get client IP address
   */
  getClientIP(req) {
    return req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           'unknown';
  }
  
  /**
   * Extract all inputs from request
   */
  extractInputs(req) {
    const inputs = {};
    
    // Query parameters
    if (req.query) {
      Object.assign(inputs, req.query);
    }
    
    // Body parameters
    if (req.body && typeof req.body === 'object') {
      Object.assign(inputs, this.flattenObject(req.body));
    }
    
    // Headers (check for injection in custom headers)
    const customHeaders = Object.keys(req.headers)
      .filter(h => h.startsWith('x-'))
      .reduce((obj, key) => {
        obj[`header_${key}`] = req.headers[key];
        return obj;
      }, {});
    Object.assign(inputs, customHeaders);
    
    return inputs;
  }
  
  /**
   * Flatten nested object for analysis
   */
  flattenObject(obj, prefix = '') {
    const flattened = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            Object.assign(flattened, this.flattenObject(item, `${newKey}[${index}]`));
          } else {
            flattened[`${newKey}[${index}]`] = item;
          }
        });
      } else {
        flattened[newKey] = value;
      }
    }
    
    return flattened;
  }
  
  /**
   * Clean up old tracking data
   */
  cleanup() {
    const now = Date.now();
    
    // Clean failed login attempts
    for (const [ip, attempts] of this.failedLogins.entries()) {
      const recent = attempts.filter(a => now - a.timestamp < this.thresholds.failedLoginWindow);
      if (recent.length === 0) {
        this.failedLogins.delete(ip);
      } else {
        this.failedLogins.set(ip, recent);
      }
    }
    
    // Clean request counts (keep last 5 minutes)
    const cutoffMinute = Math.floor((now - 5 * 60 * 1000) / 60000);
    for (const key of this.requestCounts.keys()) {
      const minute = parseInt(key.split(':')[1]);
      if (minute < cutoffMinute) {
        this.requestCounts.delete(key);
      }
    }
    
    console.log('🧹 IDS: Cleaned up old tracking data');
  }
  
  /**
   * Get IDS statistics
   */
  getStats() {
    return {
      blockedIPs: Array.from(this.blockedIPs),
      suspiciousIPs: Array.from(this.suspiciousIPs),
      failedLoginAttempts: this.failedLogins.size,
      activeTracking: this.requestCounts.size
    };
  }
}

/**
 * Intrusion detection middleware
 */
export function intrusionDetectionMiddleware(ids) {
  return async (req, res, next) => {
    try {
      const ip = ids.getClientIP(req);
      
      // Check if IP is blocked
      if (ids.isBlocked(ip)) {
        await ids.logSecurityEvent(
          ip,
          req.uid,
          SecurityEventType.IP_BLACKLISTED,
          ThreatLevel.CRITICAL,
          'Request from blocked IP address',
          {},
          req
        );
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Analyze request for threats
      const threats = await ids.analyzeRequest(req);
      
      // Log all threats
      for (const threat of threats) {
        await ids.logSecurityEvent(
          ip,
          req.uid,
          threat.type,
          threat.severity,
          threat.description,
          threat.metadata || {},
          req
        );
        
        // Block request if threat is blocking
        if (threat.blocked) {
          return res.status(403).json({ error: 'Request blocked due to security threat' });
        }
      }
      
      // Continue if no blocking threats
      next();
    } catch (error) {
      console.error('IDS middleware error:', error);
      // Don't block request on IDS error
      next();
    }
  };
}

export default IntrusionDetectionSystem;
