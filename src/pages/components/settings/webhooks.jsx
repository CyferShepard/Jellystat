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

    // État pour suivre les webhooks événementiels
    const [eventWebhooks, setEventWebhooks] = useState({
        playback_started: { exists: false, enabled: false },
        playback_ended: { exists: false, enabled: false },
        media_recently_added: { exists: false, enabled: false }
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

                if (response.data !== webhooks) {
                    setWebhooks(response.data);
                    // Charger l'état des webhooks événementiels une fois les webhooks chargés
                    await loadEventWebhooks();
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
    }, [webhooks.length]);

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
                setError("L'URL du webhook est requise");
                setSaving(false);
                return;
            }

            // Si c'est un webhook de type événement, s'assurer que les propriétés nécessaires sont présentes
            if (currentWebhook.trigger_type === 'event' && !currentWebhook.event_type) {
                setError("Le type d'événement est requis pour un webhook événementiel");
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

            // Rafraîchir la liste des webhooks
            const webhooksResponse = await axios.get('/webhooks', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            
            setWebhooks(webhooksResponse.data);
            
            // Mettre à jour l'état des webhooks événementiels
            await loadEventWebhooks();

            // Réinitialiser le formulaire
            setCurrentWebhook({
                name: 'New Webhook',
                url: '',
                enabled: false,
                trigger_type: 'scheduled',
                schedule: '0 9 1 * *',
                method: 'POST',
                webhook_type: 'discord'
            });
            
            setSuccess("Webhook enregistré avec succès!");
            setSaving(false);
        } catch (err) {
            setError("Erreur lors de l'enregistrement du webhook: " + (err.response?.data?.error || err.message));
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

    // Fonction pour obtenir le statut d'un webhook événementiel
    const getEventWebhookStatus = (eventType) => {
        return eventWebhooks[eventType]?.enabled || false;
    };

    // Fonction pour charger le statut des webhooks événementiels
    const loadEventWebhooks = async () => {
        try {
            const eventTypes = ['playback_started', 'playback_ended', 'media_recently_added'];
            const status = {};
            
            // Vérifier chaque type d'événement dans les webhooks actuels
            eventTypes.forEach(eventType => {
                const matchingWebhooks = webhooks.filter(
                    webhook => webhook.trigger_type === 'event' && webhook.event_type === eventType
                );
                
                status[eventType] = {
                    exists: matchingWebhooks.length > 0,
                    enabled: matchingWebhooks.some(webhook => webhook.enabled)
                };
            });
            
            setEventWebhooks(status);
        } catch (error) {
            console.error('Error loading event webhook status:', error);
        }
    };

    // Fonction pour basculer un webhook événementiel
    const toggleEventWebhook = async (eventType) => {
        try {
            setLoading(true);
            setError(null);
            
            const isCurrentlyEnabled = getEventWebhookStatus(eventType);
            const matchingWebhooks = webhooks.filter(
                webhook => webhook.trigger_type === 'event' && webhook.event_type === eventType
            );
            
            // Si aucun webhook n'existe pour cet événement et qu'on veut l'activer
            if (matchingWebhooks.length === 0 && !isCurrentlyEnabled) {
                // Créer un nouveau webhook pour cet événement
                const newWebhook = {
                    name: `Notification - ${getEventDisplayName(eventType)}`,
                    url: '', // Demander à l'utilisateur de saisir l'URL
                    enabled: true,
                    trigger_type: 'event',
                    event_type: eventType,
                    method: 'POST',
                    webhook_type: 'discord'
                };
                
                // Mettre à jour le webhook actuel pour que l'utilisateur puisse le configurer
                setCurrentWebhook(newWebhook);
                setLoading(false);
                return;
            }
            
            // Sinon, activer/désactiver tous les webhooks existants pour cet événement
            for (const webhook of matchingWebhooks) {
                await axios.put(`/webhooks/${webhook.id}`, 
                    { ...webhook, enabled: !isCurrentlyEnabled }, 
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        }
                    }
                );
            }
            
            // Mettre à jour l'état local
            setEventWebhooks(prev => ({
                ...prev,
                [eventType]: {
                    ...prev[eventType],
                    enabled: !isCurrentlyEnabled
                }
            }));
            
            // Actualiser la liste des webhooks
            const response = await axios.get('/webhooks', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            
            setWebhooks(response.data);
            setLoading(false);
            setSuccess(`Webhook pour ${getEventDisplayName(eventType)} ${!isCurrentlyEnabled ? 'activé' : 'désactivé'} avec succès!`);
        } catch (error) {
            setError("Erreur lors de la modification du webhook: " + (error.response?.data?.error || error.message));
            setLoading(false);
        }
    };

    // Fonction utilitaire pour obtenir le nom d'affichage d'un type d'événement
    const getEventDisplayName = (eventType) => {
        switch(eventType) {
            case 'playback_started':
                return 'Lecture démarrée';
            case 'playback_ended':
                return 'Lecture terminée';
            case 'media_recently_added':
                return 'Nouveaux médias ajoutés';
            default:
                return eventType;
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

                {/* Ajout de la section pour les webhooks événementiels */}
                <div className="event-webhooks mt-4 mb-4">
                    <h3 className="my-3">
                        <Trans i18nKey={"SETTINGS_PAGE.EVENT_WEBHOOKS"} />
                        <Tooltip title={<Trans i18nKey={"SETTINGS_PAGE.EVENT_WEBHOOKS_TOOLTIP"} />}>
                            <span className="ms-2">
                                <InformationLineIcon />
                            </span>
                        </Tooltip>
                    </h3>
                    
                    <Row className="g-4">
                        <Col md={4}>
                            <div className="border rounded p-3 h-100">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h5>Lecture démarrée</h5>
                                    <Form.Check
                                        type="switch"
                                        id="playback-started-enabled"
                                        checked={getEventWebhookStatus('playback_started')}
                                        onChange={() => toggleEventWebhook('playback_started')}
                                    />
                                </div>
                                <p className="text-muted small">
                                    Notification lorsqu'un utilisateur commence à regarder un média
                                </p>
                            </div>
                        </Col>
                        
                        <Col md={4}>
                            <div className="border rounded p-3 h-100">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h5>Lecture terminée</h5>
                                    <Form.Check
                                        type="switch"
                                        id="playback-ended-enabled"
                                        checked={getEventWebhookStatus('playback_ended')}
                                        onChange={() => toggleEventWebhook('playback_ended')}
                                    />
                                </div>
                                <p className="text-muted small">
                                    Notification lorsqu'un utilisateur termine de regarder un média
                                </p>
                            </div>
                        </Col>
                        
                        <Col md={4}>
                            <div className="border rounded p-3 h-100">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h5>Nouveaux médias</h5>
                                    <Form.Check
                                        type="switch"
                                        id="media-recently-added-enabled"
                                        checked={getEventWebhookStatus('media_recently_added')}
                                        onChange={() => toggleEventWebhook('media_recently_added')}
                                    />
                                </div>
                                <p className="text-muted small">
                                    Notification lorsque de nouveaux médias sont ajoutés à la bibliothèque
                                </p>
                            </div>
                        </Col>
                    </Row>
                </div>
                
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