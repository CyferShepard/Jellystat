import React, { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import { Form, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import InformationLineIcon from "remixicon-react/InformationLineIcon";
import { Tooltip } from "@mui/material";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { Trans } from "react-i18next";
import Loading from "../general/loading";
import ErrorBoundary from "../general/ErrorBoundary";

const token = localStorage.getItem('token');

function WebhookRow(props) {
    const { webhook, onEdit, onTest } = props;

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>{webhook.name}</TableCell>
                <TableCell>{webhook.url}</TableCell>
                <TableCell>{webhook.webhook_type || 'generic'}</TableCell>
                <TableCell>{webhook.trigger_type}</TableCell>
                <TableCell>
          <span className={`badge ${webhook.enabled ? 'bg-success' : 'bg-secondary'}`}>
            {webhook.enabled ? <Trans i18nKey={"ENABLED"} /> : <Trans i18nKey={"DISABLED"} />}
          </span>
                </TableCell>
                <TableCell>
                    <div className="d-flex justify-content-end gap-2">
                        <Button size="sm" variant="outline-primary" onClick={() => onEdit(webhook)}>
                            <Trans i18nKey={"EDIT"} />
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={() => onTest(webhook.id)}>
                            <Trans i18nKey={"SETTINGS_PAGE.TEST_NOW"} />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}

function WebhooksSettings() {
    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [currentWebhook, setCurrentWebhook] = useState({
        name: 'Monthly Report of Most watched movies and series',
        url: '',
        enabled: false,
        trigger_type: 'scheduled',
        schedule: '0 9 1 * *',
        method: 'POST',
        webhook_type: 'discord'
    });

    useEffect(() => {
        const fetchWebhooks = async () => {
            try {
                const response = await axios.get('/webhooks', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (response.data != webhooks) {
                    setWebhooks(response.data);
                  }
          
                  if (loading) {
                    setLoading(false);
                  }
            } catch (err) {
                console.error("Error loading webhooks:", err);
                if (loading) {
                    setLoading(false);
                  }
            }
        };

        fetchWebhooks();

        const intervalId = setInterval(fetchWebhooks, 1000 * 10);
        return () => clearInterval(intervalId);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentWebhook(prev => ({ ...prev, [name]: value }));
    };

    const handleToggleEnabled = () => {
        setCurrentWebhook(prev => ({ ...prev, enabled: !prev.enabled }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            if (!currentWebhook.url) {
                setError("Discord webhook URL is required");
                setSaving(false);
                return;
            }

            let response;

            if (currentWebhook.id) {
                response = await axios.put(`/webhooks/${currentWebhook.id}`, currentWebhook, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    }
                });
            } else {
                response = await axios.post('/webhooks', currentWebhook, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    }
                });
            }

            setCurrentWebhook({
                name: 'New Webhook',
                url: '',
                enabled: false,
                trigger_type: 'scheduled',
                schedule: '0 9 1 * *',
                method: 'POST',
                webhook_type: 'discord'
            });
            setSuccess("Webhook saved successfully!");
            setSaving(false);
        } catch (err) {
            setError("Error during webhook saving: " + (err.response?.data?.error || err.message));
            setSaving(false);
        }
    };

    const handleEdit = (webhook) => {
        setCurrentWebhook(webhook);
    };

    const handleTest = async (webhookId) => {
        if (!webhookId) {
            setError("Impossible to test the webhook: no ID provided");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await axios.post(`/webhooks/${webhookId}/trigger-monthly`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            });

            setSuccess("Webhook test triggered successfully!");
            setLoading(false);
        } catch (err) {
            setError("Error during the test of the webhook: " + (err.response?.data?.message || err.message));
            setLoading(false);
        }
    };

    if (loading && !webhooks.length) {
        return <Loading />;
    }

    return (
        <div className="webhooks-settings">
            <h1 className="my-2">
                <Trans i18nKey={"SETTINGS_PAGE.WEBHOOKS_CONFIGURATION"} />{" "}
                <Tooltip title={<Trans i18nKey={"SETTINGS_PAGE.WEBHOOKS_TOOLTIP"} />}>
                    <span>
                        <InformationLineIcon />
                    </span>
                </Tooltip>
            </h1>

            <ErrorBoundary>
                {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
                {success && <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
                    {typeof success === 'string' ? success : <Trans i18nKey={"SETTINGS_PAGE.WEBHOOK_SAVED"} />}
                </Alert>}

                <Form onSubmit={handleFormSubmit} className="settings-form">
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm={2}>
                            <Trans i18nKey={"SETTINGS_PAGE.WEBHOOK_NAME"} />
                        </Form.Label>
                        <Col sm={10}>
                            <Form.Control
                                type="text"
                                name="name"
                                value={currentWebhook.name}
                                onChange={handleInputChange}
                                required
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm={2}>
                            <Trans i18nKey={"SETTINGS_PAGE.DISCORD_WEBHOOK_URL"} />
                        </Form.Label>
                        <Col sm={10}>
                            <Form.Control
                                type="text"
                                name="url"
                                value={currentWebhook.url}
                                onChange={handleInputChange}
                                placeholder="https://discord.com/api/webhooks/..."
                                required
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm={2}>
                            <Trans i18nKey={"SETTINGS_PAGE.WEBHOOK_TYPE"} />
                        </Form.Label>
                        <Col sm={10}>
                            <Form.Select
                                name="webhook_type"
                                value={currentWebhook.webhook_type}
                                onChange={handleInputChange}
                            >
                                <option value="discord">Discord</option>
                                <option value="generic">Générique</option>
                            </Form.Select>
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} className="mb-3">
                        <Col sm={{ span: 10, offset: 2 }}>
                            <Form.Check
                                type="switch"
                                id="webhook-enabled"
                                label={<Trans i18nKey={"SETTINGS_PAGE.ENABLE_WEBHOOK"} />}
                                checked={currentWebhook.enabled}
                                onChange={handleToggleEnabled}
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row}>
                        <Col sm={{ span: 10, offset: 2 }}>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={saving}
                            >
                                {saving ? <Spinner size="sm" animation="border" /> : currentWebhook.id ? <Trans i18nKey={"UPDATE"} /> : <Trans i18nKey={"SAVE"} />}
                            </Button>
                        </Col>
                    </Form.Group>
                </Form>
                
                    <TableContainer className='rounded-2 mt-4'>
                        <Table aria-label="webhooks table">
                            <TableHead>
                                <TableRow>
                                    <TableCell><Trans i18nKey={"SETTINGS_PAGE.NAME"} /></TableCell>
                                    <TableCell><Trans i18nKey={"SETTINGS_PAGE.URL"} /></TableCell>
                                    <TableCell><Trans i18nKey={"SETTINGS_PAGE.TYPE"} /></TableCell>
                                    <TableCell><Trans i18nKey={"SETTINGS_PAGE.TRIGGER"} /></TableCell>
                                    <TableCell><Trans i18nKey={"SETTINGS_PAGE.STATUS"} /></TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {webhooks.map((webhook) => (
                                    <WebhookRow
                                        key={webhook.id}
                                        webhook={webhook}
                                        onEdit={handleEdit}
                                        onTest={handleTest}
                                    />
                                ))}
                                {webhooks.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} style={{ textAlign: "center", fontStyle: "italic", color: "grey", height: "200px" }}>
                                            <Trans i18nKey={"ERROR_MESSAGES.NO_WEBHOOKS"} />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
               
            </ErrorBoundary>
        </div>
    );
}

export default WebhooksSettings;