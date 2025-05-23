const cron = require('node-cron');
const WebhookManager = require('./webhook-manager');
const dbInstance = require('../db');

class WebhookScheduler {
    constructor() {
        this.webhookManager = new WebhookManager();
        this.cronJobs = {};
        this.loadScheduledWebhooks();
    }

    async loadScheduledWebhooks() {
        try {
            const webhooks = await this.webhookManager.getScheduledWebhooks();
            if (webhooks) {
            // Clean existing tasks
            Object.values(this.cronJobs).forEach(job => job.stop());
            this.cronJobs = {};

            // Create new tasks
            webhooks.forEach(webhook => {
                if (webhook.schedule && cron.validate(webhook.schedule)) {
                    this.scheduleWebhook(webhook);
                } else {
                    console.error(`[WEBHOOK] Invalid cron schedule for webhook ${webhook.id}: ${webhook.schedule}`);
                }
            });

            console.log(`[WEBHOOK] Scheduled ${Object.keys(this.cronJobs).length} webhooks`);
            } else {
                console.log('[WEBHOOK] No scheduled webhooks found');
            }
        } catch (error) {
            console.error('[WEBHOOK] Failed to load scheduled webhooks:', error);
        }
    }

    async loadEventWebhooks() {
        try {
            const eventWebhooks = await this.webhookManager.getEventWebhooks();
            if (eventWebhooks && eventWebhooks.length > 0) {
                this.eventWebhooks = {};
                
                eventWebhooks.forEach(webhook => {
                    if (!this.eventWebhooks[webhook.eventType]) {
                        this.eventWebhooks[webhook.eventType] = [];
                    }
                    this.eventWebhooks[webhook.eventType].push(webhook);
                });
                
                console.log(`[WEBHOOK] Loaded ${eventWebhooks.length} event-based webhooks`);
            } else {
                console.log('[WEBHOOK] No event-based webhooks found');
                this.eventWebhooks = {};
            }
        } catch (error) {
            console.error('[WEBHOOK] Failed to load event-based webhooks:', error);
        }
    }

    async triggerEvent(eventType, eventData = {}) {
        try {
            const webhooks = this.eventWebhooks[eventType] || [];
            
            if (webhooks.length === 0) {
                console.log(`[WEBHOOK] No webhooks registered for event: ${eventType}`);
                return;
            }
            
            console.log(`[WEBHOOK] Triggering ${webhooks.length} webhooks for event: ${eventType}`);
            
            const promises = webhooks.map(webhook => {
                return this.webhookManager.executeWebhook(webhook, {
                    event: eventType,
                    data: eventData,
                    triggeredAt: new Date().toISOString()
                });
            });
            
            await Promise.all(promises);
        } catch (error) {
            console.error(`[WEBHOOK] Error triggering webhooks for event ${eventType}:`, error);
        }
    }

    scheduleWebhook(webhook) {
        try {
            this.cronJobs[webhook.id] = cron.schedule(webhook.schedule, async () => {
                console.log(`[WEBHOOK] Executing scheduled webhook: ${webhook.name}`);
                await this.webhookManager.executeWebhook(webhook);
            });

            console.log(`[WEBHOOK] Webhook ${webhook.name} scheduled with cron: ${webhook.schedule}`);
        } catch (error) {
            console.error(`[WEBHOOK] Error scheduling webhook ${webhook.id}:`, error);
        }
    }

    async refreshSchedule() {
        await this.loadScheduledWebhooks();
        await this.loadEventWebhooks();
    }
}

module.exports = WebhookScheduler;