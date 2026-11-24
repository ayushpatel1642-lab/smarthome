import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  clearSecurityEvents,
  createAutomation,
  createDevice,
  createRoom,
  createSecurityEvent,
  deleteAutomation,
  deleteDevice,
  deleteRoom,
  getFullHomeState,
  insertRecommendation,
  updateAutomation,
  updateDevice,
  updateRecommendationStatus,
  updateUserProfile,
} from './src/db/repository.ts';
import { generateAwareAssistSuggestion } from './src/services/ai/serverAwareAssist.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'aware-home-os' });
  });

  // Bootstrap complete home state for authenticated Firebase user
  app.get('/api/state', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || 'resident@oakridge.home';
      const name = typeof req.user!.name === 'string' ? req.user!.name : undefined;
      const state = await getFullHomeState(uid, email, name);
      res.json(state);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load state';
      res.status(500).json({ error: msg });
    }
  });

  // Update user profile, residence, house mode, security mode, theme, tariffs, notifications
  app.patch('/api/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const allowed: Record<string, unknown> = {};
      const keys = [
        'displayName',
        'residenceName',
        'houseMode',
        'securityMode',
        'securityAlertActive',
        'theme',
        'tempUnit',
        'tariffBase',
        'tariffPeak',
        'notifySecurity',
        'notifyEnergy',
        'notifyOffline',
        'localProcessing',
      ] as const;

      for (const k of keys) {
        if (req.body[k] !== undefined) {
          allowed[k] = req.body[k];
        }
      }

      const updated = await updateUserProfile(uid, allowed);
      res.json(updated);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update profile';
      res.status(500).json({ error: msg });
    }
  });

  // Rooms CRUD
  app.post('/api/rooms', requireAuth, async (req: AuthRequest, res) => {
    try {
      const name = String(req.body.name || '').trim();
      if (!name || name.length > 60) {
        return res.status(400).json({ error: 'Room name must be between 1 and 60 characters.' });
      }
      const icon = String(req.body.icon || 'sensor_door');
      const zone = String(req.body.zone || 'Custom Zone');
      const room = await createRoom(req.user!.uid, name, icon, zone);
      res.status(201).json(room);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to create room';
      res.status(500).json({ error: msg });
    }
  });

  app.delete('/api/rooms/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const roomId = Number(req.params.id);
      if (!Number.isInteger(roomId)) return res.status(400).json({ error: 'Invalid room ID' });
      const result = await deleteRoom(req.user!.uid, roomId);
      res.json(result);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to delete room';
      res.status(500).json({ error: msg });
    }
  });

  // Devices CRUD
  app.post('/api/devices', requireAuth, async (req: AuthRequest, res) => {
    try {
      const name = String(req.body.name || '').trim();
      const roomName = String(req.body.roomName || '').trim();
      if (!name || !roomName) {
        return res.status(400).json({ error: 'Device name and room are required.' });
      }
      const created = await createDevice(req.user!.uid, {
        name,
        subtitle: String(req.body.subtitle || ''),
        roomId: req.body.roomId ? Number(req.body.roomId) : null,
        roomName,
        category: String(req.body.category || 'lighting'),
        deviceType: String(req.body.deviceType || 'light'),
        icon: String(req.body.icon || 'devices'),
        protocol: String(req.body.protocol || 'Simulated MQTT'),
      });
      res.status(201).json(created);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to create device';
      res.status(500).json({ error: msg });
    }
  });

  app.patch('/api/devices/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const deviceId = Number(req.params.id);
      if (!Number.isInteger(deviceId)) return res.status(400).json({ error: 'Invalid device ID' });

      const allowed: Record<string, unknown> = {};
      const keys = [
        'name',
        'roomName',
        'isOn',
        'online',
        'brightness',
        'targetTemp',
        'acMode',
        'fanSpeed',
        'isLocked',
        'sensorStatus',
        'powerWatts',
        'lastSeen',
      ] as const;

      for (const k of keys) {
        if (req.body[k] !== undefined) allowed[k] = req.body[k];
      }

      const updated = await updateDevice(req.user!.uid, deviceId, allowed);
      if (!updated) return res.status(404).json({ error: 'Device not found' });
      res.json(updated);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update device';
      res.status(500).json({ error: msg });
    }
  });

  app.delete('/api/devices/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const deviceId = Number(req.params.id);
      if (!Number.isInteger(deviceId)) return res.status(400).json({ error: 'Invalid device ID' });
      const result = await deleteDevice(req.user!.uid, deviceId);
      res.json(result);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to delete device';
      res.status(500).json({ error: msg });
    }
  });

  // Automations CRUD
  app.post('/api/automations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const name = String(req.body.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Rule name is required.' });
      const created = await createAutomation(req.user!.uid, {
        name,
        description: String(req.body.description || 'Custom automation rule'),
        source: req.body.source === 'ai' ? 'ai' : 'manual',
        enabled: req.body.enabled !== false,
        triggerType: String(req.body.triggerType || 'presence'),
        triggerLabel: String(req.body.triggerLabel || 'Presence'),
        triggerIcon: String(req.body.triggerIcon || 'bolt'),
        conditions: Array.isArray(req.body.conditions) ? req.body.conditions : [],
        actions: Array.isArray(req.body.actions) ? req.body.actions : [],
        days: Array.isArray(req.body.days) ? req.body.days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        startTime: String(req.body.startTime || '08:00'),
        endTime: String(req.body.endTime || '18:00'),
        priority: String(req.body.priority || 'Normal'),
        zoneLabel: String(req.body.zoneLabel || 'Whole Home'),
      });
      res.status(201).json(created);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to create automation';
      res.status(500).json({ error: msg });
    }
  });

  app.patch('/api/automations/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid automation ID' });
      const updated = await updateAutomation(req.user!.uid, id, req.body);
      if (!updated) return res.status(404).json({ error: 'Automation not found' });
      res.json(updated);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update automation';
      res.status(500).json({ error: msg });
    }
  });

  app.delete('/api/automations/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid automation ID' });
      const result = await deleteAutomation(req.user!.uid, id);
      res.json(result);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to delete automation';
      res.status(500).json({ error: msg });
    }
  });

  // Security Events
  app.post('/api/security-events', requireAuth, async (req: AuthRequest, res) => {
    try {
      const severity =
        req.body.severity === 'critical' || req.body.severity === 'warning'
          ? req.body.severity
          : 'info';
      const created = await createSecurityEvent(req.user!.uid, {
        title: String(req.body.title || 'Security Event'),
        detail: String(req.body.detail || ''),
        severity,
        zone: String(req.body.zone || 'Perimeter'),
        icon: String(req.body.icon || 'verified_user'),
        timeLabel: String(req.body.timeLabel || 'Just now'),
      });
      res.status(201).json(created);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to log security event';
      res.status(500).json({ error: msg });
    }
  });

  app.delete('/api/security-events', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await clearSecurityEvents(req.user!.uid);
      res.json(result);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to clear security events';
      res.status(500).json({ error: msg });
    }
  });

  // AI Recommendations status updates
  app.patch('/api/recommendations/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid recommendation ID' });
      const status =
        req.body.status === 'applied' || req.body.status === 'dismissed'
          ? req.body.status
          : 'active';
      const updated = await updateRecommendationStatus(req.user!.uid, id, status);
      res.json(updated);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update recommendation';
      res.status(500).json({ error: msg });
    }
  });

  // Aware Assist Gemini-powered contextual recommendation generator (server-side only)
  app.post('/api/ai/recommend', async (req: AuthRequest, res) => {
    try {
      const snapshot = req.body?.snapshot;
      if (!snapshot || typeof snapshot !== 'object') {
        return res.status(400).json({ error: 'Telemetry snapshot is required.' });
      }
      const generated = await generateAwareAssistSuggestion(snapshot);

      // If authenticated, also persist the generated recommendation to Cloud SQL
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const { adminAuth } = await import('./src/lib/firebase-admin.ts');
          const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
          const saved = await insertRecommendation(decoded.uid, {
            title: generated.title,
            description: generated.description,
            savingsLabel: generated.savingsLabel,
            confidence: generated.confidence,
            category: generated.category,
            actionPayload: generated.actionPayload,
          });
          return res.status(201).json({ ...saved, source: 'gemini' });
        } catch {
          // If token verification fails, still return the generated suggestion cleanly
        }
      }

      return res.json({
        id: Date.now(),
        ...generated,
        status: 'active',
      });
    } catch (error: unknown) {
      console.error('Aware Assist Gemini error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to generate AI recommendation';
      return res.status(502).json({ error: msg });
    }
  });

  // Vite middleware in dev, static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aware Home OS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
