const express = require('express');
const router = express.Router();
const dbInstance = require('../db');
const WebhookManager = require('../classes/webhook-manager');
const WebhookScheduler = require('../classes/webhook-scheduler');

const webhookScheduler = new WebhookScheduler();
const webhookManager = new WebhookManager();

// Get all webhooks
router.get('/', async (req, res) => {
    try {
        const result = await dbInstance.query('SELECT * FROM webhooks ORDER BY id DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching webhooks:', error);
        res.status(500).json({ error: 'Failed to fetch webhooks' });
    }
});

// Get a specific webhook by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dbInstance.query('SELECT * FROM webhooks WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching webhook:', error);
        res.status(500).json({ error: 'Failed to fetch webhook' });
    }
});

// Create a new webhook
router.post('/', async (req, res) => {
    try {
        const {
            name,
            url,
            headers,
            payload,
            method,
            trigger_type,
            schedule,
            event_type,
            enabled,
            retry_on_failure,
            max_retries
        } = req.body;

        if (!name || !url || !trigger_type) {
            return res.status(400).json({ error: 'Name, URL and trigger type are required' });
        }

        if (trigger_type === 'scheduled' && !schedule) {
            return res.status(400).json({ error: 'Schedule is required for scheduled webhooks' });
        }

        if (trigger_type === 'event' && !event_type) {
            return res.status(400).json({ error: 'Event type is required for event webhooks' });
        }

        const result = await dbInstance.query(
            `INSERT INTO webhooks (name, url, headers, payload, method, trigger_type, schedule, event_type, enabled, retry_on_failure, max_retries)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
            [
                name,
                url,
                JSON.stringify(headers || {}),
                JSON.stringify(payload || {}),
                method || 'POST',
                trigger_type,
                schedule,
                event_type,
                enabled !== undefined ? enabled : true,
                retry_on_failure || false,
                max_retries || 3
            ]
        );

        // Refresh the schedule if the webhook is scheduled
        if (trigger_type === 'scheduled' && enabled) {
            await webhookScheduler.refreshSchedule();
        }

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating webhook:', error);
        res.status(500).json({ error: 'Failed to create webhook' });
    }
});

// Update a webhook
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            url,
            headers,
            payload,
            method,
            trigger_type,
            schedule,
            event_type,
            enabled,
            retry_on_failure,
            max_retries
        } = req.body;

        if (!name || !url || !trigger_type) {
            return res.status(400).json({ error: 'Name, URL and trigger type are required' });
        }

        const result = await dbInstance.query(
            `UPDATE webhooks
       SET name = $1, url = $2, headers = $3, payload = $4, method = $5, 
           trigger_type = $6, schedule = $7, event_type = $8, enabled = $9,
           retry_on_failure = $10, max_retries = $11
       WHERE id = $12
       RETURNING *`,
            [
                name,
                url,
                JSON.stringify(headers || {}),
                JSON.stringify(payload || {}),
                method || 'POST',
                trigger_type,
                schedule,
                event_type,
                enabled !== undefined ? enabled : true,
                retry_on_failure || false,
                max_retries || 3,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        // Refresh the schedule if the webhook is scheduled
        await webhookScheduler.refreshSchedule();

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating webhook:', error);
        res.status(500).json({ error: 'Failed to update webhook' });
    }
});

// Delete a webhook
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dbInstance.query('DELETE FROM webhooks WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        // Refresh the schedule if the webhook was scheduled
        await webhookScheduler.refreshSchedule();

        res.json({ message: 'Webhook deleted successfully', webhook: result.rows[0] });
    } catch (error) {
        console.error('Error deleting webhook:', error);
        res.status(500).json({ error: 'Failed to delete webhook' });
    }
});

// Test a webhook
router.post('/:id/test', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await dbInstance.query('SELECT * FROM webhooks WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Webhook not found' });
        }

        const webhook = result.rows[0];
        let testData = req.body || {};
        let success = false;

        // Traitement spécial pour les webhooks Discord
        if (webhook.url.includes('discord.com/api/webhooks')) {
            console.log('Discord webhook détecté, préparation du payload spécifique');

            // Format spécifique pour Discord
            testData = {
                content: "Test de webhook depuis Jellystat",
                embeds: [{
                    title: "Test de notification Discord",
                    description: "Ceci est un test de notification via webhook Discord",
                    color: 3447003, // Bleu
                    fields: [
                        {
                            name: "Type de webhook",
                            value: webhook.trigger_type || "Non spécifié",
                            inline: true
                        },
                        {
                            name: "ID",
                            value: webhook.id,
                            inline: true
                        }
                    ],
                    timestamp: new Date().toISOString()
                }]
            };

            // Bypass du traitement normal pour Discord
            success = await webhookManager.executeDiscordWebhook(webhook, testData);
        }
        // Comportement existant pour les autres types de webhook
        else if (webhook.trigger_type === 'event' && webhook.event_type) {
            const eventType = webhook.event_type;

            let eventData = {};

            switch (eventType) {
                case 'playback_started':
                    eventData = {
                        sessionInfo: {
                            userId: "test-user-id",
                            deviceId: "test-device-id",
                            deviceName: "Test Device",
                            clientName: "Test Client",
                            isPaused: false,
                            mediaType: "Movie",
                            mediaName: "Test Movie",
                            startTime: new Date().toISOString()
                        },
                        userData: {
                            username: "Test User",
                            userImageTag: "test-image-tag"
                        },
                        mediaInfo: {
                            itemId: "test-item-id",
                            episodeId: null,
                            mediaName: "Test Movie",
                            seasonName: null,
                            seriesName: null
                        }
                    };
                    success = await webhookManager.triggerEventWebhooks(eventType, eventData, [webhook.id]);
                    break;

                case 'playback_ended':
                    eventData = {
                        sessionInfo: {
                            userId: "test-user-id",
                            deviceId: "test-device-id",
                            deviceName: "Test Device",
                            clientName: "Test Client",
                            mediaType: "Movie",
                            mediaName: "Test Movie",
                            startTime: new Date(Date.now() - 3600000).toISOString(),
                            endTime: new Date().toISOString(),
                            playbackDuration: 3600
                        },
                        userData: {
                            username: "Test User",
                            userImageTag: "test-image-tag"
                        },
                        mediaInfo: {
                            itemId: "test-item-id",
                            episodeId: null,
                            mediaName: "Test Movie",
                            seasonName: null,
                            seriesName: null
                        }
                    };
                    success = await webhookManager.triggerEventWebhooks(eventType, eventData, [webhook.id]);
                    break;

                case 'media_recently_added':
                    eventData = {
                        mediaItem: {
                            id: "test-item-id",
                            name: "Test Media",
                            type: "Movie",
                            overview: "This is a test movie for webhook testing",
                            addedDate: new Date().toISOString()
                        }
                    };
                    success = await webhookManager.triggerEventWebhooks(eventType, eventData, [webhook.id]);
                    break;

                default:
                    success = await webhookManager.executeWebhook(webhook, testData);
            }
        } else {
            success = await webhookManager.executeWebhook(webhook, testData);
        }

        if (success) {
            res.json({ message: 'Webhook exécuté avec succès' });
        } else {
            res.status(500).json({ error: 'Échec de l\'exécution du webhook' });
        }
    } catch (error) {
        console.error('Error testing webhook:', error);
        res.status(500).json({ error: 'Failed to test webhook: ' + error.message });
    }
});

router.post('/:id/trigger-monthly', async (req, res) => {
    const webhookManager = new WebhookManager();
    const success = await webhookManager.triggerMonthlySummaryWebhook(req.params.id);

    if (success) {
        res.status(200).json({ message: "Monthly report sent successfully" });
    } else {
        res.status(500).json({ message: "Failed to send monthly report" });
    }
});

// Get status of event webhooks
router.get('/event-status', async (req, res) => {
    try {
        const eventTypes = ['playback_started', 'playback_ended', 'media_recently_added'];
        const result = {};
        
        for (const eventType of eventTypes) {
            const webhooks = await dbInstance.query(
                'SELECT id, name, enabled FROM webhooks WHERE trigger_type = $1 AND event_type = $2',
                ['event', eventType]
            );
            
            result[eventType] = {
                exists: webhooks.rows.length > 0,
                enabled: webhooks.rows.some(webhook => webhook.enabled),
                webhooks: webhooks.rows
            };
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching webhook status:', error);
        res.status(500).json({ error: 'Failed to fetch webhook status' });
    }
});

// Toggle all webhooks of a specific event type
router.post('/toggle-event/:eventType', async (req, res) => {
    try {
        const { eventType } = req.params;
        const { enabled } = req.body;
        
        if (!['playback_started', 'playback_ended', 'media_recently_added'].includes(eventType)) {
            return res.status(400).json({ error: 'Invalid event type' });
        }
        
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ error: 'Enabled parameter must be a boolean' });
        }
        
        // Mettre à jour tous les webhooks de ce type d'événement
        const result = await dbInstance.query(
            'UPDATE webhooks SET enabled = $1 WHERE trigger_type = $2 AND event_type = $3 RETURNING id',
            [enabled, 'event', eventType]
        );
        
        // Si aucun webhook n'existe pour ce type, en créer un de base
        if (result.rows.length === 0 && enabled) {
            const defaultWebhook = {
                name: `Webhook pour ${eventType}`,
                url: req.body.url || '',
                method: 'POST',
                trigger_type: 'event',
                event_type: eventType,
                enabled: true,
                headers: '{}',
                payload: JSON.stringify({
                    event: `{{event}}`,
                    data: `{{data}}`,
                    timestamp: `{{triggeredAt}}`
                })
            };
            
            if (!defaultWebhook.url) {
                return res.status(400).json({ 
                    error: 'URL parameter is required when creating a new webhook',
                    needsUrl: true
                });
            }
            
            await dbInstance.query(
                `INSERT INTO webhooks (name, url, method, trigger_type, event_type, enabled, headers, payload)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    defaultWebhook.name,
                    defaultWebhook.url,
                    defaultWebhook.method,
                    defaultWebhook.trigger_type,
                    defaultWebhook.event_type,
                    defaultWebhook.enabled,
                    defaultWebhook.headers,
                    defaultWebhook.payload
                ]
            );
        }
        
        // Rafraîchir le planificateur de webhooks
        await webhookScheduler.refreshSchedule();
        
        res.json({ 
            success: true, 
            message: `Webhooks for ${eventType} ${enabled ? 'enabled' : 'disabled'}`,
            affectedCount: result.rows.length
        });
    } catch (error) {
        console.error('Error toggling webhooks:', error);
        res.status(500).json({ error: 'Failed to toggle webhooks' });
    }
});

module.exports = router;
