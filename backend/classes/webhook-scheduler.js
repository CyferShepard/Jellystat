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
    }
}

module.exports = WebhookScheduler;